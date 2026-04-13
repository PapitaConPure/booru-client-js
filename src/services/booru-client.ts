import type Booru from '../adapters/booru';
import { BooruFetchError, BooruUnknownPostError, BooruUnknownTagError } from '../errors/booru';
import { InvalidOperationError } from '../errors/misc';
import { Post } from '../models/post';
import { Tag } from '../models/tag';
import { MemoryTagStore } from '../stores/memory-tag-store';
import type TagStore from '../stores/tag-store';
import type {
	APIPostData,
	APITagData,
	BooruSearchOptions,
	Credentials,
	PostResolvable,
	TagResolvable,
} from '../types/gelbooru';
import { decodeEntities } from '../utils/encoding';
import { type FetchResult, fetchExt } from '../utils/fetchExt';
import { shuffleArray } from '../utils/misc';

/**@description Representa una conexión a un sitio Booru.*/
export class BooruClient {
	static readonly API_URI = 'https://gelbooru.com/index.php';

	static readonly POSTS_API = BooruClient.#createBooruEndpoint({
		//timeout: 10000,
		page: 'dapi',
		s: 'post',
		q: 'index',
		json: '1',
	});

	static readonly TAGS_API = BooruClient.#createBooruEndpoint({
		//timeout: 10000,
		page: 'dapi',
		s: 'tag',
		q: 'index',
		json: '1',
	});

	#booru: Booru;
	#credentials: Credentials | undefined;

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
		booru: Booru,
		credentials: Credentials,
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

	static #createBooruEndpoint(defaultParams: Record<string, string>) {
		const endpointURL = new URL(BooruClient.API_URI);

		for (const [name, value] of Object.entries(defaultParams))
			endpointURL.searchParams.set(name, value);

		return {
			async request<TSchema>(params: Record<string, unknown>) {
				const searchURL = new URL(endpointURL);

				for (const [name, value] of Object.entries(params))
					searchURL.searchParams.set(name, `${value}`);

				return fetchExt<TSchema>(searchURL, {
					type: 'json',
					init: {
						referrer: 'https://papitaconpure.github.io',
						signal: AbortSignal.timeout(10_000),
					},
				});
			},
		};
	}

	/**
	 * @description Asserts that the status code of a response is 200 and that the Post data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	static #expectPosts(
		fetchResult: FetchResult<{ post: APIPostData[] }>,
		options: {
			dontThrowOnEmptyFetch?: boolean;
		} = {},
	): PostResolvable[] {
		const { dontThrowOnEmptyFetch = false } = options;

		if (fetchResult.success === false)
			throw new BooruFetchError(
				`Booru API Posts fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult.error },
			);

		if (!Array.isArray(fetchResult.data?.post)) {
			if (dontThrowOnEmptyFetch) return [];
			else throw new BooruUnknownPostError(`Couldn't fetch any Posts from the Booru API`);
		}

		return fetchResult.data.post;
	}

	/**
	 * @description Asserts that the status code of a response is 200 and that the Tag data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownTagError}
	 */
	static #expectTags(
		fetchResult: FetchResult<{ tag: APITagData[] }>,
		options: {
			dontThrowOnEmptyFetch?: boolean;
			tags?: string;
		} = {},
	): TagResolvable[] {
		const { dontThrowOnEmptyFetch = false, tags = null } = options;

		if (fetchResult.success === false)
			throw new BooruFetchError(
				`Booru API Tags fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult.error },
			);

		if (!Array.isArray(fetchResult.data?.tag)) {
			if (dontThrowOnEmptyFetch) return [];
			else
				throw new BooruUnknownTagError(
					`Couldn't fetch any Tags from the Booru API${tags ? `. Tried to fetch: ${tags}` : ''}`,
				);
		}

		return fetchResult.data.tag;
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
		const { limit = 1, random = false } = searchOptions;

		const { apiKey, userId } = this.#getCredentials();
		if (Array.isArray(tags)) tags = tags.join(' ');

		const fetchResult = await BooruClient.POSTS_API.request<{ post: APIPostData[] }>({
			api_key: apiKey,
			user_id: userId,
			limit: limit,
			tags: tags,
		});

		const posts = BooruClient.#expectPosts(fetchResult, { dontThrowOnEmptyFetch: true });

		if (random) shuffleArray(posts);

		return posts.map((p) => new Post(p));
	}

	/**
	 * @description Obtains a {@link Post} from a {@link Booru}, based on the supplied ID.
	 * @returns The obtained post, or `undefined` if no post was found with that ID.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	async fetchPostById(postId: string | number): Promise<Post | undefined> {
		const { apiKey, userId } = this.#getCredentials();
		if (!['string', 'number'].includes(typeof postId)) throw TypeError('Invalid Post ID');

		const response = await BooruClient.POSTS_API.request<{ post: APIPostData[] }>({
			api_key: apiKey,
			user_id: userId,
			id: postId,
		});
		const [post] = BooruClient.#expectPosts(response) as [Post];
		return new Post(post);
	}

	/**
	 * @description Obtains a {@link Post} from a {@link Booru}'s URL.
	 * @returns The obtained post, or `undefined` if no post exists on that URL.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostByUrl(postUrl: URL | string): Promise<Post | undefined> {
		const { apiKey, userId } = this.#getCredentials();

		if (typeof postUrl !== 'string') throw TypeError('Invalid Post URL');

		const url = new URL(postUrl);
		url.searchParams.set('page', 'dapi');
		url.searchParams.set('s', 'post');
		url.searchParams.set('q', 'index');
		url.searchParams.set('json', '1');
		url.searchParams.delete('tags');
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('user_id', userId);

		const response = await fetchExt<{ post: APIPostData[] }>(url.toString());
		const [post] = BooruClient.#expectPosts(response) as [Post];
		return new Post(post);
	}

	/**
	 * @description Retrieves the {@linkcode Tag}s associated with the given {@linkcode Post}.
	 * @returns An array containing the tags that were retrieved from the post.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 * @throws {BooruFetchError}
	 */
	async fetchPostTags(post: Post): Promise<Tag[]> {
		if (!Array.isArray(post?.tags)) throw ReferenceError('Invalid Post');

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
	async fetchPostTagsById(postId: string | number): Promise<Tag[] | undefined> {
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

		const { apiKey, userId } = this.#getCredentials();

		if (tagNames.some((t) => typeof t !== 'string')) throw TypeError('Invalid tags');

		const normalizedTagNames = tagNames.map(decodeEntities);

		const { storedTags, missingTagNames } = forceFetch
			? { storedTags: [], missingTagNames: normalizedTagNames }
			: normalizedTagNames.length < this.#tagFetchThreshold
				? await this.#fetchTagsByNameFromStoreByName(normalizedTagNames)
				: await this.#fetchTagsByNameFromStoreByStore(normalizedTagNames);

		if (!missingTagNames.length) return storedTags;

		const fetchedTags: Tag[] = [];

		//The batch size should be extracted from a future specific Booru class (in this case Gelbooru)
		for (let i = 0; i < missingTagNames.length; i += 100) {
			const namesBatch = missingTagNames.slice(i, i + 100).join(' ');

			//This should be generalized later
			const response = await BooruClient.TAGS_API.request<{ tag: APITagData[] }>({
				api_key: apiKey,
				user_id: userId,
				names: namesBatch,
			});

			const tags = BooruClient.#expectTags(response, { tags: namesBatch });
			const freshTags = tags.map((t) => new Tag(t));
			fetchedTags.push(...freshTags);
		}

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
	setCredentials(credentials: Credentials): this {
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
	#getCredentials(): Credentials {
		this.#expectCredentials(this.#credentials);
		return this.#credentials;
	}

	/**
	 * @description Validates credentials structure and ensures they are usable for API requests.
	 * @param credentials Credentials to validate.
	 * @throws {ReferenceError}
	 * @throws {TypeError}
	 */
	#expectCredentials(credentials: Credentials | undefined): asserts credentials is Credentials {
		if (!credentials) throw ReferenceError('No credentials were defined');
		if (!credentials.apiKey || typeof credentials.apiKey !== 'string')
			throw TypeError('API Key is invalid');
		if (!credentials.userId || !['string', 'number'].includes(typeof credentials.userId))
			throw TypeError('User ID is invalid');
	}

	/**
	 * @description Obtains tags by tag names, using {@link TagStore} layers on a name by name basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `storedTags`: Tags that could be obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNameFromStoreByName(
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
	async #fetchTagsByNameFromStoreByStore(
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
