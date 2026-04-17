import type { Booru } from '../adapters/booru';
import type { Post } from '../domain/post';
import type { Tag } from '../domain/tag';
import { InvalidOperationError } from '../errors/misc';
import { MemoryTagStore } from '../stores/memory-tag-store';
import type { TagStore } from '../stores/tag-store';
import type {
	BooruClientTagOptions,
	BooruSearchOptions,
	CredentialsOf,
	TagFetchApproach,
} from '../types/booru';
import { decodeEntities } from '../utils/encoding';
import { TagCoordinator } from './tag-coordinator';
import { TagResolver } from './tag-resolver';

/**Represents an interface for interacting with a Booru API.*/
export class BooruClient<TBooru extends Booru = Booru> {
	/**The {@link Booru} adapter used to perform API operations.*/
	readonly #booru: TBooru;

	/**Credentials used for authenticating API requests.*/
	#credentials: CredentialsOf<TBooru> | undefined;

	readonly #tagResolver: TagResolver;

	readonly #tagCoordinator: TagCoordinator;

	/**
	 * Ordered chain of {@link TagStore}s used as cache layers.
	 * Stores at the beginning of the array are queried first.
	 */
	#tagStoreChain: TagStore[];

	/**
	 * Whether tag cleanup must be triggered manually.
	 * When `true`, automatic cleanup is disabled.
	 */
	readonly #manualTagCleanup: boolean;

	/**Minimum interval (in milliseconds) between automatic cleanup executions.*/
	readonly #tagCleanupIntervalMs: number;

	/**Timestamp (in milliseconds) of the last performed tag cleanup.*/
	#lastTagCleanup: number;

	/**
	 * Creates a {@link BooruClient} with the specified `credentials`.
	 * @param booru The {@link Booru} API this client will consume.
	 * @param credentials Credentials for API authorization.
	 */
	constructor(booru: TBooru, credentials: CredentialsOf<TBooru>);

	/**
	 * Creates a {@link BooruClient} with the specified `credentials` and various other `options`.
	 * @param booru The {@link Booru} API this client will consume.
	 * @param options Options to define this client's behaviour.
	 */
	constructor(
		booru: TBooru,
		options: {
			credentials: CredentialsOf<TBooru>;
			tags?: BooruClientTagOptions;
		},
	);

	constructor(
		booru: TBooru,
		arg:
			| CredentialsOf<TBooru>
			| {
					credentials: CredentialsOf<TBooru>;
					tags?: BooruClientTagOptions;
			  },
	) {
		const options = 'credentials' in arg ? arg : { credentials: arg };
		const { credentials, tags = {} } = options;
		const {
			storeChain: tagStoreChain = [new MemoryTagStore()],
			cleanOnStartup: cleanTagsOnStartup = false,
			manualCleanup: manualTagCleanup = false,
			cleanupIntervalMs: tagCleanupIntervalMs = 5 * 60e3,
		} = tags;

		this.#booru = booru;
		this.setCredentials(credentials);

		this.#tagStoreChain = tagStoreChain;
		this.#manualTagCleanup = manualTagCleanup;
		this.#tagCleanupIntervalMs = tagCleanupIntervalMs;

		if (cleanTagsOnStartup) {
			this.#performCleanup();
			this.#lastTagCleanup = Date.now();
		} else this.#lastTagCleanup = 0;

		const tagStoreGetter = () => this.#tagStoreChain;
		const tagFetchApproach: TagFetchApproach = (names) =>
			this.#booru.fetchTagsByNames(names, this.#getCredentials());
		this.#tagResolver = new TagResolver(tagStoreGetter, tagFetchApproach, tags);
		this.#tagCoordinator = new TagCoordinator(this.#tagResolver);
	}

	addTagStoreFirst(tagStore: TagStore): this {
		this.#tagStoreChain.unshift(tagStore);
		return this;
	}

	addTagStoreLast(tagStore: TagStore): this {
		this.#tagStoreChain.push(tagStore);
		return this;
	}

	addTagStoreAt(index: number, tagStore: TagStore): this {
		this.#tagStoreChain.splice(index, 0, tagStore);
		return this;
	}

	/**
	 * Searches a {@link Booru} to retrieve {@linkcode Post}s, results can be transformed based on the `searchOptions` provided.
	 * @param tags Tags to search
	 * @param searchOptions Search options
	 * @returns An array containing the posts found during the search.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownPostError} It the booru adapter is unable to resolve the API response.
	 */
	async search(tags: string | string[], searchOptions: BooruSearchOptions = {}): Promise<Post[]> {
		if (Array.isArray(tags)) tags = tags.join(' ');

		const { limit = 1, random = false } = searchOptions;
		const finalSearchOptions = { limit, random };

		return this.#booru.search(tags, finalSearchOptions, this.#getCredentials());
	}

	/**
	 * Obtains a {@link Post} from a {@link Booru}, based on the supplied ID.
	 * @returns The obtained post, or `undefined` if no post was found with that ID.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied ID or credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownPostError} It the booru adapter is unable to resolve the API response.
	 */
	async fetchPostById(postId: string): Promise<Post | undefined> {
		if (typeof postId !== 'string') throw new TypeError('Post ID must be a string');

		return this.#booru.fetchPostById(postId, this.#getCredentials());
	}

	/**
	 * Obtains a {@link Post} from a {@link Booru}'s URL.
	 * @returns The obtained post, or `undefined` if no post exists on that URL.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied URL or credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownPostError} It the booru adapter is unable to resolve the API response.
	 */
	async fetchPostByUrl(postUrl: URL | string): Promise<Post | undefined> {
		if (typeof postUrl !== 'string' && !(postUrl instanceof URL))
			throw new TypeError('Invalid Post URL');

		const finalUrl = typeof postUrl === 'string' ? new URL(postUrl) : postUrl;

		return this.#booru.fetchPostByUrl(finalUrl, this.#getCredentials());
	}

	/**
	 * Retrieves the {@linkcode Tag}s associated with the given {@linkcode Post}.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied tags or credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownPostError} It the booru adapter is unable to resolve the API response.
	 */
	async fetchPostTags(post: Post): Promise<Tag[]> {
		if (!Array.isArray(post?.tags)) throw new ReferenceError('Invalid Post');

		return this.fetchTagsByNames({ names: post.tags });
	}

	/**
	 * Retrieves the {@linkcode Tag}s of a {@link Post} identified by its URL.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied tags or credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownPostError} It the booru adapter is unable to resolve the API response.
	 */
	async fetchPostTagsByUrl(postUrl: string): Promise<Tag[] | undefined> {
		const post = await this.fetchPostByUrl(postUrl);
		return post ? this.fetchTagsByNames({ names: post.tags }) : undefined;
	}

	/**
	 * Retrieves the {@linkcode Tag}s of a {@link Post} identified by its ID.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied tags or credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownPostError} It the booru adapter is unable to resolve the API response while finding a post.
	 * @throws {BooruUnknownTagError} It the booru adapter is unable to resolve the API response while retrieving the post tags.
	 */
	async fetchPostTagsById(postId: string): Promise<Tag[] | undefined> {
		const post = await this.fetchPostById(postId);
		return post ? this.fetchTagsByNames({ names: post.tags }) : undefined;
	}

	/**
	 * Obtains {@link Tag}s by their names. Uses the configured {@link TagStore} chain as sequential cache layers before actually making an API call.
	 *
	 * Missing tags are fetched from the configured {@link Booru}'s API and stored back into the cache.
	 * @returns An array containing every obtained tag.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied tags or credentials are invalid.
	 * @throws {BooruFetchError} If the request to the API fails.
	 * @throws {BooruUnknownTagError} It the booru adapter is unable to resolve the API response.
	 */
	async fetchTagsByNames(options: {
		/**The tag names to fetch.*/
		names: string[];
		/**Set to `true` if you want to skip all cache layers and fetch directly from the API (not recommended unless you have a reason to). `false` by default.*/
		forceFetch?: boolean;
	}): Promise<Tag[]> {
		const { names: tagNames, forceFetch = false } = options;

		this.#performAutoCleanup();

		if (tagNames.some((t) => typeof t !== 'string')) throw new TypeError('Invalid tags');

		const normalizedTagNames = tagNames.map(decodeEntities);

		if (forceFetch) {
			const fetchedTags = await this.#booru.fetchTagsByNames(
				normalizedTagNames,
				this.#getCredentials(),
			);

			if (fetchedTags.length)
				await Promise.all(this.#tagStoreChain.map((s) => s.setMany(fetchedTags)));

			return fetchedTags;
		}

		return this.#tagCoordinator.getMany(normalizedTagNames);
	}

	/**
	 * Sets the credentials used for all {@link Booru} API calls.
	 * @param credentials Credentials for API authorization.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied credentials are invalid.
	 */
	setCredentials(credentials: CredentialsOf<TBooru>): this {
		this.#expectCredentials(credentials);
		this.#credentials = credentials;
		return this;
	}

	/**
	 * Performs a cleanup of all managed {@link TagStore}s so that invalid or stale tags can be re-fetched from the API or a store deeper in the chain.
	 *
	 * Only call manually if this {@link BooruClient} was created using `manualTagCleanup: true`.
	 * @param stores The stores to clean up.
	 * @throws {InvalidOperationError}
	 */
	async performCleanup(...stores: TagStore[]): Promise<void> {
		if (!this.#manualTagCleanup)
			throw new InvalidOperationError(
				`Manual cleanup cannot be called on a ${BooruClient.name} that has manualTagCleanup set to false`,
			);

		await this.#performCleanup(...stores);
	}

	/**
	 * Asserts that valid credentials are available for API requests and returns them.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied credentials are invalid.
	 */
	#getCredentials(): CredentialsOf<TBooru> {
		this.#expectCredentials(this.#credentials);
		return this.#credentials;
	}

	/**
	 * Validates credentials structure and ensures they are usable for API requests.
	 * @param credentials Credentials to validate.
	 * @throws {ReferenceError} If no credentials were defined.
	 * @throws {TypeError} If the supplied credentials are invalid.
	 */
	#expectCredentials(
		credentials: CredentialsOf<TBooru> | undefined,
	): asserts credentials is CredentialsOf<TBooru> {
		if (credentials == null) throw new ReferenceError('No credentials were defined');
		return this.#booru.validateCredentials(credentials);
	}

	/**
	 * Calls `cleanup()` on all the provided {@link TagStore}s, or the whole chain if no stores were specified.
	 *
	 * Managed by this {@link BooruClient} and throttled based on configuration during initialization.
	 * @param stores The stores to clean up.
	 */
	async #performAutoCleanup(...stores: TagStore[]) {
		if (this.#manualTagCleanup) return;

		const now = Date.now();
		if (now - this.#lastTagCleanup < this.#tagCleanupIntervalMs) return;

		this.#lastTagCleanup = now;
		await this.#performCleanup(...stores);
	}

	/**
	 * Calls `cleanup()` on all the provided {@link TagStore}s, or the whole chain if no stores were specified.
	 * @param stores The stores to clean up.
	 */
	async #performCleanup(...stores: TagStore[]) {
		const targetStores = stores.length ? stores : this.#tagStoreChain;
		const toCleanUp = targetStores.map((tagStore) => tagStore.cleanup?.());
		await Promise.all(toCleanUp);
	}
}
