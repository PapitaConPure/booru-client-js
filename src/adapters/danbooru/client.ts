import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import { BooruFetchError, BooruUnknownPostError, BooruUnknownTagError } from '../../errors/booru';
import type { PostMapper } from '../../mappers/post-mapper';
import { DanbooruPostMapper } from '../../mappers/post-mapper/danbooru-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { DanbooruTagMapper } from '../../mappers/tag-mapper/danbooru-tag-mapper';
import type { BooruSearchOptions, PostUrlBuilder } from '../../types/booru';
import { defineEndpoint, type Endpoint, type FetchFn } from '../../utils/endpoint';
import { type FetchResult, fetchExt } from '../../utils/fetchExt';
import { shuffleArray } from '../../utils/misc';
import type { Booru } from '../booru';
import type { DanbooruCredentials } from './credentials';
import type {
	DanbooruPostDto,
	DanbooruPostsResponseDto,
	DanbooruTagDto,
	DanbooruTagsResponseDto,
} from './dto';

interface DanbooruOptions {
	/**Mapper used to transform Danbooru post DTOs into {@link Post} domain entities.*/
	postMapper?: PostMapper<DanbooruPostDto, Danbooru>;
	/**Mapper used to transform Danbooru tag DTOs into {@link Tag} domain entities.*/
	tagMapper?: TagMapper<DanbooruTagDto>;
	/**Fetch implementation used for API requests.*/
	fetchFn?: FetchFn;
}

interface DanbooruSearch extends Required<BooruSearchOptions> {
	rating?: string;
}

const booruName = 'danbooru' as const;

/**
 * Implementation of the {@link Booru} interface for the Danbooru API.
 *
 * @see https://danbooru.donmai.us/wiki_pages/help:api
 */
export class Danbooru implements Booru<typeof booruName, DanbooruCredentials, BooruSearchOptions> {
	/**Base URL for Danbooru's API.*/
	static readonly API_BASE_URL = 'https://danbooru.donmai.us';

	/**Builds a canonical post URL from a post ID.*/
	static postUrlBuilder: PostUrlBuilder = (postId) =>
		`https://danbooru.donmai.us/posts/${postId}`;

	readonly #postMapper: PostMapper<DanbooruPostDto, Danbooru>;
	readonly #tagMapper: TagMapper<DanbooruTagDto>;
	readonly #apiPostsEndpoint: Endpoint;
	readonly #apiRandomPostsEndpoint: Endpoint;
	readonly #apiTagsEndpoint: Endpoint;

	/**
	 * Creates a new {@link Danbooru} adapter.
	 *
	 * @param options Defines various configurations for this Danbooru adapter.
	 */
	constructor(options: DanbooruOptions = {}) {
		const {
			postMapper = new DanbooruPostMapper(),
			tagMapper = new DanbooruTagMapper(),
			fetchFn = fetchExt,
		} = options;

		this.#postMapper = postMapper;
		this.#tagMapper = tagMapper;

		this.#apiPostsEndpoint = defineEndpoint(
			'get',
			`${Danbooru.API_BASE_URL}/posts.json`,
			{},
			{ fetchFn },
		);

		this.#apiRandomPostsEndpoint = defineEndpoint(
			'get',
			`${Danbooru.API_BASE_URL}/posts/random.json`,
			{},
			{ fetchFn },
		);

		this.#apiTagsEndpoint = defineEndpoint(
			'get',
			`${Danbooru.API_BASE_URL}/tags.json`,
			{},
			{ fetchFn },
		);
	}

	get name() {
		return booruName;
	}

	async search(
		tags: string,
		searchOptions: DanbooruSearch,
		credentials: DanbooruCredentials,
	): Promise<Post<Danbooru>[]> {
		const { limit, random } = searchOptions;
		const { apiKey, login } = credentials;

		const endpoint = random ? this.#apiRandomPostsEndpoint : this.#apiPostsEndpoint;

		const fetchResult = await endpoint.request<DanbooruPostsResponseDto>({
			api_key: apiKey,
			login: login,
			limit: limit,
			tags: tags,
		});

		const postDtos = Danbooru.#expectPosts(fetchResult, { dontThrowOnEmptyFetch: true });
		const posts = postDtos.map((dto) => this.#postMapper.fromDto(dto));

		if (random) shuffleArray(posts);

		return posts;
	}

	async fetchPostById(
		postId: string,
		credentials: DanbooruCredentials,
	): Promise<Post | undefined> {
		const { apiKey, login } = credentials;

		const url = new URL(`${Danbooru.API_BASE_URL}/posts/${postId}.json`);
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('login', login);

		const response = await fetchExt<DanbooruPostDto | undefined>(url, {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		if (!response.success)
			throw new BooruFetchError(
				`Danbooru post fetch via ID failed: ${response.error.name} ${response.error.message || ''}`,
				{ cause: response.error },
			);

		if (!response.data) return undefined;

		return this.#postMapper.fromDto(response.data);
	}

	async fetchPostByUrl(
		postUrl: URL,
		credentials: DanbooruCredentials,
	): Promise<Post | undefined> {
		const { apiKey, login } = credentials;

		const match = postUrl.pathname.match(/\/posts\/(\d+)/);
		if (!match) throw new TypeError('Invalid Danbooru post URL');

		const postId = match[1];

		const url = new URL(`https://danbooru.donmai.us/posts/${postId}.json`);
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('login', login);

		const response = await fetchExt<DanbooruPostDto | undefined>(url, {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		if (!response.success)
			throw new BooruFetchError(
				`Danbooru post fetch via URL failed: ${response.error.name} ${response.error.message || ''}`,
				{ cause: response.error },
			);

		if (!response.data) return undefined;

		return this.#postMapper.fromDto(response.data);
	}

	async fetchTagsByNames(
		names: Iterable<string>,
		credentials: DanbooruCredentials,
	): Promise<Tag[]> {
		const { apiKey, login } = credentials;
		const namesArr: string[] = Array.isArray(names) ? names : [...names];

		const fetchedTags: Tag[] = [];

		for (let i = 0; i < namesArr.length; i += 100) {
			const namesBatch = namesArr.slice(i, i + 100).join(' ');

			const response = await this.#apiTagsEndpoint.request<
				DanbooruTagsResponseDto | undefined
			>({
				api_key: apiKey,
				login: login,
				'search[name_space]': namesBatch,
			});

			const tagDtos = Danbooru.#expectTags(response, { tags: namesBatch });
			const tags = tagDtos.map((dto) => this.#tagMapper.fromDto(dto));
			fetchedTags.push(...tags);
		}

		return fetchedTags;
	}

	validateCredentials(
		credentials: DanbooruCredentials,
	): asserts credentials is DanbooruCredentials {
		if (!credentials.apiKey || typeof credentials.apiKey !== 'string')
			throw new TypeError('API Key is invalid');
		if (!credentials.login || typeof credentials.login !== 'string')
			throw new TypeError('User ID is invalid');
	}

	/**
	 * Asserts that the status code of a response is 200 and that the {@link Post} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	static #expectPosts(
		fetchResult: FetchResult<DanbooruPostsResponseDto | undefined>,
		options: {
			dontThrowOnEmptyFetch?: boolean;
		} = {},
	): DanbooruPostDto[] {
		const { dontThrowOnEmptyFetch = false } = options;

		if (!fetchResult.success)
			throw new BooruFetchError(
				`Danbooru posts fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult.error },
			);

		if (!Array.isArray(fetchResult.data)) {
			if (dontThrowOnEmptyFetch) return [];
			throw new BooruUnknownPostError(
				`Couldn't fetch posts from Danbooru API.\nReceived: ${JSON.stringify(fetchResult)}`,
				{ cause: fetchResult.data },
			);
		}

		return fetchResult.data;
	}

	/**
	 * Asserts that the status code of a response is 200 and that the {@link Tag} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownTagError}
	 */
	static #expectTags(
		fetchResult: FetchResult<DanbooruTagsResponseDto | undefined>,
		options: {
			dontThrowOnEmptyFetch?: boolean;
			tags?: string;
		} = {},
	): DanbooruTagDto[] {
		const { dontThrowOnEmptyFetch = false, tags = null } = options;

		if (!fetchResult.success)
			throw new BooruFetchError(
				`Danbooru tags fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult.error },
			);

		if (!Array.isArray(fetchResult.data)) {
			if (dontThrowOnEmptyFetch) return [];
			throw new BooruUnknownTagError({ booruName: 'Danbooru', fetchResult, tags });
		}

		return fetchResult.data;
	}
}
