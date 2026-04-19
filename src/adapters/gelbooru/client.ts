import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import { BooruFetchError, BooruUnknownPostError, BooruUnknownTagError } from '../../errors/booru';
import type { PostMapper } from '../../mappers/post-mapper';
import { GelbooruPostMapper } from '../../mappers/post-mapper/gelbooru-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { GelbooruTagMapper } from '../../mappers/tag-mapper/gelbooru-tag-mapper';
import type { BooruSearchOptions, PostUrlBuilder } from '../../types/booru';
import { defineEndpoint, type Endpoint, type FetchFn } from '../../utils/endpoint';
import { type FetchResult, fetchExt } from '../../utils/fetchExt';
import type { Booru } from '../booru';
import type { GelbooruCredentials } from './credentials';
import type {
	GelbooruPostDto,
	GelbooruPostsResponseDto,
	GelbooruTagDto,
	GelbooruTagsResponseDto,
} from './dto';

interface GelbooruOptions {
	/**Mapper used to transform Gelbooru post DTOs into {@link Post} domain entities.*/
	postMapper?: PostMapper<GelbooruPostDto, Gelbooru>;
	/**Mapper used to transform Gelbooru tag DTOs into {@link Tag} domain entities.*/
	tagMapper?: TagMapper<GelbooruTagDto>;
	/**Fetch implementation used for API requests.*/
	fetchFn?: FetchFn;
}

const booruName = 'gelbooru' as const;

/**
 * Implementation of the {@link Booru} interface for the Gelbooru API.
 *
 * @see https://gelbooru.com/index.php?page=wiki&s=view&id=18780
 */
export class Gelbooru implements Booru<typeof booruName, GelbooruCredentials, BooruSearchOptions> {
	/**Base URL for Gelbooru's API endpoints.*/
	static readonly API_BASE_URL = 'https://gelbooru.com/index.php';

	/**Builds a canonical post URL from a post ID.*/
	static postUrlBuilder: PostUrlBuilder = (postId) =>
		`https://gelbooru.com/index.php?page=post&s=view&id=${postId}`;

	readonly #postMapper: PostMapper<GelbooruPostDto, Gelbooru>;
	readonly #tagMapper: TagMapper<GelbooruTagDto>;
	readonly #apiPostsEndpoint: Endpoint;
	readonly #apiTagsEndpoint: Endpoint;

	/**
	 * Creates a new {@link Gelbooru} adapter.
	 *
	 * @param options Defines various configurations for this Gelbooru adapter.
	 */
	constructor(options: GelbooruOptions = {}) {
		const {
			postMapper = new GelbooruPostMapper(),
			tagMapper = new GelbooruTagMapper(),
			fetchFn = fetchExt,
		} = options;

		this.#postMapper = postMapper;
		this.#tagMapper = tagMapper;

		this.#apiPostsEndpoint = defineEndpoint(
			'get',
			Gelbooru.API_BASE_URL,
			{
				page: 'dapi',
				s: 'post',
				q: 'index',
				json: '1',
			},
			{ fetchFn },
		);

		this.#apiTagsEndpoint = defineEndpoint(
			'get',
			Gelbooru.API_BASE_URL,
			{
				page: 'dapi',
				s: 'tag',
				q: 'index',
				json: '1',
			},
			{ fetchFn },
		);
	}

	get name() {
		return booruName;
	}

	async search(
		tags: string,
		credentials: GelbooruCredentials,
		searchOptions: Required<BooruSearchOptions>,
	): Promise<Post[]> {
		const { limit, random } = searchOptions;
		const { apiKey, userId } = credentials;

		const sortRegex = /\bsort:[^\s]+/gi;

		const fetchResult = await this.#apiPostsEndpoint.request<GelbooruPostsResponseDto>({
			api_key: apiKey,
			user_id: userId,
			limit: limit,
			tags: random
				? `${tags
						.split(/\s+/)
						.filter((t) => t.length && !sortRegex.test(t))
						.join(' ')} sort:random`
				: tags,
		});

		const postDtos = Gelbooru.#expectPosts(fetchResult, { dontThrowOnEmptyFetch: true });
		const posts = postDtos.map((dto) => this.#postMapper.fromDto(dto));

		return posts;
	}

	async fetchPostById(
		postId: string,
		credentials: GelbooruCredentials,
	): Promise<Post | undefined> {
		const { apiKey, userId } = credentials;

		const response = await this.#apiPostsEndpoint.request<GelbooruPostsResponseDto | undefined>(
			{
				api_key: apiKey,
				user_id: userId,
				id: postId,
			},
		);

		const [postDto] = Gelbooru.#expectPosts(response) as [GelbooruPostDto];
		const post = this.#postMapper.fromDto(postDto);

		return post;
	}

	async fetchPostByUrl(
		postUrl: URL,
		credentials: GelbooruCredentials,
	): Promise<Post | undefined> {
		const { apiKey, userId } = credentials;

		postUrl.searchParams.set('page', 'dapi');
		postUrl.searchParams.set('s', 'post');
		postUrl.searchParams.set('q', 'index');
		postUrl.searchParams.set('json', '1');
		postUrl.searchParams.delete('tags');
		postUrl.searchParams.set('api_key', apiKey);
		postUrl.searchParams.set('user_id', userId);

		const response = await fetchExt<GelbooruPostsResponseDto | undefined>(postUrl.toString(), {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		const [postDto] = Gelbooru.#expectPosts(response) as [GelbooruPostDto];
		const post = this.#postMapper.fromDto(postDto);

		return post;
	}

	async fetchTagsByNames(
		names: Iterable<string>,
		credentials: GelbooruCredentials,
	): Promise<Tag[]> {
		const { apiKey, userId } = credentials;
		const namesArr: string[] = Array.isArray(names) ? names : [...names];

		const fetchedTags: Tag[] = [];

		for (let i = 0; i < namesArr.length; i += 100) {
			const namesBatch = namesArr.slice(i, i + 100).join(' ');

			const response = await this.#apiTagsEndpoint.request<
				GelbooruTagsResponseDto | undefined
			>({
				api_key: apiKey,
				user_id: userId,
				names: namesBatch,
			});

			const tagDtos = Gelbooru.#expectTags(response, { tags: namesBatch });
			const tags = tagDtos.map((dto) => this.#tagMapper.fromDto(dto));
			fetchedTags.push(...tags);
		}

		return fetchedTags;
	}

	validateCredentials(
		credentials: GelbooruCredentials,
	): asserts credentials is GelbooruCredentials {
		if (!credentials.apiKey || typeof credentials.apiKey !== 'string')
			throw new TypeError('API Key is invalid');
		if (!credentials.userId || typeof credentials.userId !== 'string')
			throw new TypeError('User ID is invalid');
	}

	/**
	 * Asserts that the status code of a response is 200 and that the {@link Post} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	static #expectPosts(
		fetchResult: FetchResult<GelbooruPostsResponseDto | undefined>,
		options: {
			dontThrowOnEmptyFetch?: boolean;
		} = {},
	): GelbooruPostDto[] {
		const { dontThrowOnEmptyFetch = false } = options;

		if (!fetchResult.success)
			throw new BooruFetchError(
				`Gelbooru posts fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult.error },
			);

		if (!Array.isArray(fetchResult.data?.post)) {
			if (dontThrowOnEmptyFetch) return [];
			throw new BooruUnknownPostError(`Couldn't fetch posts from Gelbooru`);
		}

		return fetchResult.data.post;
	}

	/**
	 * Asserts that the status code of a response is 200 and that the {@link Tag} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownTagError}
	 */
	static #expectTags(
		fetchResult: FetchResult<GelbooruTagsResponseDto | undefined>,
		options: {
			dontThrowOnEmptyFetch?: boolean;
			tags?: string;
		} = {},
	): GelbooruTagDto[] {
		const { dontThrowOnEmptyFetch = false, tags = null } = options;

		if (!fetchResult.success)
			throw new BooruFetchError(
				`Gelbooru tags fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult.error },
			);

		if (!Array.isArray(fetchResult.data?.tag)) {
			if (dontThrowOnEmptyFetch) return [];
			throw new BooruUnknownTagError({ booruName: 'Gelbooru', fetchResult, tags });
		}

		return fetchResult.data.tag;
	}
}
