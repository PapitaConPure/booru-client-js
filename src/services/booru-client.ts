import type Booru from '../adapters/booru';
import { InvalidOperationError } from '../errors/misc';
import type { Post } from '../models/post';
import type { Tag } from '../models/tag';
import { MemoryTagStore } from '../stores/memory-tag-store';
import type TagStore from '../stores/tag-store';
import type { BooruSearchOptions, CredentialsOf } from '../types/gelbooru';
import { decodeEntities } from '../utils/encoding';

/**@description Representa una conexión a un sitio Booru.*/
export class BooruClient<TBooru extends Booru> {
	#booru: TBooru;
	#credentials: CredentialsOf<TBooru> | undefined;

	#tagStoreChain: TagStore[];
	#tagFetchThreshold: number;
	#manualTagCleanup: boolean;
	#cleanupIntervalMs: number;
	#lastCleanup: number;

	/**
	 * @description Creates a {@link BooruClient} with the specified `credentials` and various other `options`.
	 * @param credentials Credentials for API authorization.
	 * @param booru The {@link Booru} API this client will consume.
	 * @param options Options to define this client's behaviour.
	 */
	constructor(
		booru: TBooru,
		credentials: CredentialsOf<TBooru>,
		options: {
			/**Allows to define a custom {@link TagStore} chain from which to fetch {@link Tag}s. By default: [{@link MemoryTagStore}] (cache only).*/
			tagStoreChain?: TagStore[];
			/**When fetching multiple {@link Tag}s: what amount of these should switch the fetch strategy from "tag by tag" to "store by store". Defaults to 50.*/
			tagFetchThreshold?: number;
			/**
			 * Defines whether the {@link Tag} invalidation process of {@link TagStore}s should be managed manually and externally (``true``)
			 * or it should instead be this {@link BooruClient}'s concern (false, default).
			 */
			manualTagCleanup?: boolean;
			/**Defines the throttle amount (in milliseconds) for automatic {@link Tag} invalidation if this {@link BooruClient} is auto-managed (`manualTagCleanup`=`false`).*/
			cleanupIntervalMs?: number;
		} = {},
	) {
		this.#booru = booru;
		this.setCredentials(credentials);

		const {
			tagStoreChain = [new MemoryTagStore()],
			tagFetchThreshold = 50,
			manualTagCleanup = false,
			cleanupIntervalMs = 5 * 60e3,
		} = options;

		this.#tagStoreChain = tagStoreChain;
		this.#tagFetchThreshold = tagFetchThreshold;
		this.#manualTagCleanup = manualTagCleanup;
		this.#cleanupIntervalMs = cleanupIntervalMs;

		this.#lastCleanup = 0;
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
	 * @description Searches a {@link Booru} to retrieve {@linkcode Post}s, results can be transformed based on the `searchOptions` provided.
	 * @param tags Tags to search
	 * @param searchOptions Search options
	 * @returns An array containing the posts found during the search.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async search(tags: string | string[], searchOptions: BooruSearchOptions = {}): Promise<Post[]> {
		if (Array.isArray(tags)) tags = tags.join(' ');

		const { limit = 1, random = false } = searchOptions;
		const finalSearchOptions = { limit, random };

		return this.#booru.search(tags, finalSearchOptions, this.#getCredentials());
	}

	/**
	 * @description Obtains a {@link Post} from a {@link Booru}, based on the supplied ID.
	 * @returns The obtained post, or `undefined` if no post was found with that ID.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	async fetchPostById(postId: string): Promise<Post | undefined> {
		if (typeof postId !== 'string') throw new TypeError('Post ID must be a string');

		return this.#booru.fetchPostById(postId, this.#getCredentials());
	}

	/**
	 * @description Obtains a {@link Post} from a {@link Booru}'s URL.
	 * @returns The obtained post, or `undefined` if no post exists on that URL.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostByUrl(postUrl: URL | string): Promise<Post | undefined> {
		if (typeof postUrl !== 'string') throw new TypeError('Invalid Post URL');

		return this.#booru.fetchPostByUrl(postUrl, this.#getCredentials());
	}

	/**
	 * @description Retrieves the {@linkcode Tag}s associated with the given {@linkcode Post}.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTags(post: Post): Promise<Tag[]> {
		if (!Array.isArray(post?.tags)) throw new ReferenceError('Invalid Post');

		return this.fetchTagsByNames({ names: post.tags });
	}

	/**
	 * @description Retrieves the {@linkcode Tag}s of a {@link Post} identified by its URL.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTagsByUrl(postUrl: string): Promise<Tag[] | undefined> {
		const post = await this.fetchPostByUrl(postUrl);
		return post ? this.fetchTagsByNames({ names: post.tags }) : undefined;
	}

	/**
	 * @description Retrieves the {@linkcode Tag}s of a {@link Post} identified by its ID.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTagsById(postId: string): Promise<Tag[] | undefined> {
		const post = await this.fetchPostById(postId);
		return post ? this.fetchTagsByNames({ names: post.tags }) : undefined;
	}

	/**
	 * @description Obtains {@link Tag}s by their names. Uses the configured {@link TagStore} chain as sequential cache layers before actually making an API call.
	 *
	 * Missing tags are fetched from the configured {@link Booru}'s API and stored back into the cache.
	 * @returns An array containing every obtained tag.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
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

		const { storedTags, missingTagNames } = forceFetch
			? { storedTags: [], missingTagNames: normalizedTagNames }
			: normalizedTagNames.length < this.#tagFetchThreshold
				? await this.#fetchTagsByNamePerTag(normalizedTagNames)
				: await this.#fetchTagsByNamePerStore(normalizedTagNames);

		if (!missingTagNames.length) return storedTags;

		const fetchedTags = await this.#booru.fetchTagsByNames(
			missingTagNames,
			this.#getCredentials(),
		);

		if (fetchedTags.length)
			await Promise.all(this.#tagStoreChain.map((tagStore) => tagStore.setMany(fetchedTags)));

		return [...storedTags, ...fetchedTags];
	}

	/**
	 * @description Sets the credentials used for all {@link Booru} API calls.
	 * @param credentials Credentials for API authorization.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	setCredentials(credentials: CredentialsOf<TBooru>): this {
		this.#expectCredentials(credentials);
		this.#credentials = credentials;
		return this;
	}

	/**
	 * @description Performs a cleanup of all managed {@link TagStore}s so that invalid or stale tags can be re-fetched from the API or a store deeper in the chain.
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
	 * @description Asserts that valid credentials are available for API requests and returns them.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	#getCredentials(): CredentialsOf<TBooru> {
		this.#expectCredentials(this.#credentials);
		return this.#credentials;
	}

	/**
	 * @description Validates credentials structure and ensures they are usable for API requests.
	 * @param credentials Credentials to validate.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	#expectCredentials(
		credentials: CredentialsOf<TBooru> | undefined,
	): asserts credentials is CredentialsOf<TBooru> {
		if (credentials == null) throw new ReferenceError('No credentials were defined');
		return this.#booru.validateCredentials(credentials);
	}

	/**
	 * @description Obtains tags by tag names, using {@link TagStore} layers on a name by name basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `storedTags`: Tags that could be obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNamePerTag(
		normalizedTagNames: string[],
	): Promise<{ storedTags: Tag[]; missingTagNames: string[] }> {
		const results = await Promise.all(
			normalizedTagNames.map(async (tagName) => {
				for (const tagStore of this.#tagStoreChain) {
					const storedTag = await tagStore.getOne(tagName);
					if (storedTag) return storedTag;
				}
				return null;
			}),
		);

		const storedTagsMap = new Map<string, Tag>();
		const missingTagNames: string[] = [];

		for (const [i, name] of normalizedTagNames.entries()) {
			const tag = results[i];

			if (tag) storedTagsMap.set(tag.name, tag);
			else missingTagNames.push(name);
		}

		return {
			storedTags: [...storedTagsMap.values()],
			missingTagNames,
		};
	}

	/**
	 * @description Obtains tags by tag names, using {@link TagStore} layers on a store by store basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `storedTags`: Tags that could be obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNamePerStore(
		normalizedTagNames: string[],
	): Promise<{ storedTags: Tag[]; missingTagNames: string[] }> {
		const normalizedTagNamesToGet = new Set(normalizedTagNames);
		const storedTagsMap = new Map<string, Tag>();

		for (const tagStore of this.#tagStoreChain) {
			if (!normalizedTagNamesToGet.size) break;

			const storedTags = await tagStore.getMany(normalizedTagNamesToGet);

			for (const storedTag of storedTags) {
				if (storedTagsMap.has(storedTag.name)) continue;

				storedTagsMap.set(storedTag.name, storedTag);
				normalizedTagNamesToGet.delete(storedTag.name);
			}
		}

		return {
			storedTags: [...storedTagsMap.values()],
			missingTagNames: [...normalizedTagNamesToGet],
		};
	}

	/**
	 * @description Calls `cleanup()` on all the provided {@link TagStore}s, or the whole chain if no stores were specified.
	 *
	 * Managed by this {@link BooruClient} and throttled based on configuration during initialization.
	 * @param stores The stores to clean up.
	 */
	async #performAutoCleanup(...stores: TagStore[]) {
		if (this.#manualTagCleanup) return;

		const now = Date.now();
		if (now - this.#lastCleanup < this.#cleanupIntervalMs) return;

		this.#lastCleanup = now;
		await this.#performCleanup(...stores);
	}

	/**
	 * @description Calls `cleanup()` on all the provided {@link TagStore}s, or the whole chain if no stores were specified.
	 * @param stores The stores to clean up.
	 */
	async #performCleanup(...stores: TagStore[]) {
		const targetStores = stores.length ? stores : this.#tagStoreChain;
		const toCleanUp = targetStores.map((tagStore) => tagStore.cleanup?.());
		await Promise.all(toCleanUp);
	}
}
