import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import { BooruFetchError, BooruUnknownPostError, BooruUnknownTagError } from '../../errors/booru';
import type { PostMapper } from '../../mappers/post-mapper';
import { GelbooruPostMapper } from '../../mappers/post-mapper/gelbooru-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { GelbooruTagMapper } from '../../mappers/tag-mapper/gelbooru-tag-mapper';
import type { BooruSearchOptions } from '../../types/booru';
import { type FetchResult, fetchExt } from '../../utils/fetchExt';
import { shuffleArray } from '../../utils/misc';
import type Booru from '../booru';
import type { GelbooruCredentials } from './credentials';
import type {
	GelbooruPostDto,
	GelbooruPostsResponseDto,
	GelbooruTagDto,
	GelbooruTagsResponseDto,
} from './dto';

export default class Gelbooru implements Booru<GelbooruCredentials, BooruSearchOptions> {
	static readonly API_BASE_URL = 'https://gelbooru.com/index.php';
	static readonly API_POSTS_URL = 'https://gelbooru.com/index.php';
	static readonly API_TAGS_URL = 'https://gelbooru.com/index.php?page=dapi&s=tag&q=index';

	static readonly API_POSTS_ENDPOINT = Gelbooru.#createEndpoint({
		page: 'dapi',
		s: 'post',
		q: 'index',
		json: '1',
	});

	static readonly API_TAGS_ENDPOINT = Gelbooru.#createEndpoint({
		page: 'dapi',
		s: 'tag',
		q: 'index',
		json: '1',
	});

	#postMapper: PostMapper<GelbooruPostDto>;
	#tagMapper: TagMapper<GelbooruTagDto>;

	constructor(
		options: {
			postMapper?: PostMapper<GelbooruPostDto>;
			tagMapper?: TagMapper<GelbooruTagDto>;
		} = {},
	) {
		const { postMapper = new GelbooruPostMapper(), tagMapper = new GelbooruTagMapper() } =
			options;

		this.#postMapper = postMapper;
		this.#tagMapper = tagMapper;
	}

	async search(
		tags: string,
		searchOptions: Required<BooruSearchOptions>,
		credentials: GelbooruCredentials,
	): Promise<Post[]> {
		const { limit, random } = searchOptions;
		const { apiKey, userId } = credentials;

		if (Array.isArray(tags)) tags = tags.join(' ');

		const fetchResult = await Gelbooru.API_POSTS_ENDPOINT.request<GelbooruPostsResponseDto>({
			api_key: apiKey,
			user_id: userId,
			limit: limit,
			tags: tags,
		});

		const postDtos = Gelbooru.#expectPosts(fetchResult, { dontThrowOnEmptyFetch: true });
		const posts = postDtos.map((dto) => this.#postMapper.fromDto(dto));

		if (random) shuffleArray(posts);

		return posts;
	}

	async fetchPostById(postId: string, credentials: GelbooruCredentials): Promise<Post> {
		const { apiKey, userId } = credentials;

		if (typeof postId !== 'string') throw new TypeError('Invalid GelbooruPost ID');

		const response = await Gelbooru.API_POSTS_ENDPOINT.request<GelbooruPostsResponseDto>({
			api_key: apiKey,
			user_id: userId,
			id: postId,
		});

		const [postDto] = Gelbooru.#expectPosts(response) as [GelbooruPostDto];
		const post = this.#postMapper.fromDto(postDto);

		return post;
	}

	async fetchPostByUrl(postUrl: URL | string, credentials: GelbooruCredentials): Promise<Post> {
		const { apiKey, userId } = credentials;

		if (typeof postUrl !== 'string') throw new TypeError('Invalid GelbooruPost URL');

		const url = new URL(postUrl);
		url.searchParams.set('page', 'dapi');
		url.searchParams.set('s', 'post');
		url.searchParams.set('q', 'index');
		url.searchParams.set('json', '1');
		url.searchParams.delete('tags');
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('user_id', userId);

		const response = await fetchExt<GelbooruPostsResponseDto>(url.toString(), {
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

			const response = await Gelbooru.API_TAGS_ENDPOINT.request<GelbooruTagsResponseDto>({
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

	static #createEndpoint(defaultParams: Record<string, string>) {
		const endpointURL = new URL(Gelbooru.API_BASE_URL);

		for (const [name, value] of Object.entries(defaultParams))
			endpointURL.searchParams.set(name, value);

		return {
			async request<TSchema>(params: Record<string, unknown>) {
				const searchUrl = new URL(endpointURL);

				for (const [name, value] of Object.entries(params))
					searchUrl.searchParams.set(name, `${value}`);

				return fetchExt<TSchema>(searchUrl, {
					type: 'json',
					init: {
						signal: AbortSignal.timeout(10_000),
					},
				});
			},
		};
	}

	/**
	 * @description Asserts that the status code of a response is 200 and that the {@link Post} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownPostError}
	 */
	static #expectPosts(
		fetchResult: FetchResult<GelbooruPostsResponseDto>,
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
	 * @description Asserts that the status code of a response is 200 and that the {@link Tag} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownTagError}
	 */
	static #expectTags(
		fetchResult: FetchResult<GelbooruTagsResponseDto>,
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
			throw new BooruUnknownTagError(
				`Couldn't fetch tags from Gelbooru${tags ? `. Tried to fetch: ${tags}` : ''}`,
			);
		}

		return fetchResult.data.tag;
	}
}
