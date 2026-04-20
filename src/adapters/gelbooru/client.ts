import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import { BooruUnknownPostError, BooruUnknownTagError } from '../../errors/booru';
import type { PostMapper } from '../../mappers/post-mapper';
import { GelbooruPostMapper } from '../../mappers/post-mapper/gelbooru-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { GelbooruTagMapper } from '../../mappers/tag-mapper/gelbooru-tag-mapper';
import type { BooruSearchOptions, BooruSpec, PostUrlBuilder } from '../../types/booru';
import { createArrayExpecter } from '../../utils/booru';
import { defineEndpoint, type Endpoint } from '../../utils/endpoint';
import { fetchExt } from '../../utils/fetchExt';
import { type Booru, booruSpec } from '../booru';
import type {
	GelbooruPostDto,
	GelbooruPostsResponseDto,
	GelbooruTagDto,
	GelbooruTagsResponseDto,
} from './dto';
import type {
	GelbooruCredentials,
	GelbooruOptions,
	GelbooruPostExtra,
	GelbooruSearchOptions,
} from './types';

const booruName = 'gelbooru' as const;

interface GelbooruSpec extends BooruSpec<Gelbooru> {
	name: typeof booruName;
	credentials: GelbooruCredentials;
	searchOptions: GelbooruSearchOptions;
	postExtra: GelbooruPostExtra;
}

/**
 * Implementation of the {@link Booru} interface for the Gelbooru API.
 *
 * @see https://gelbooru.com/index.php?page=wiki&s=view&id=18780
 */
export class Gelbooru implements Booru<GelbooruSpec> {
	/**Base URL for Gelbooru's API endpoints.*/
	static readonly API_BASE_URL = 'https://gelbooru.com/index.php';

	/**Builds a canonical post URL from a post ID.*/
	static readonly POST_URL_BUILDER: PostUrlBuilder = (postId) =>
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
		searchOptions: Required<BooruSearchOptions> & GelbooruSearchOptions,
		credentials: GelbooruCredentials,
	): Promise<Post<Gelbooru>[]> {
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
	): Promise<Post<Gelbooru> | undefined> {
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
	): Promise<Post<Gelbooru> | undefined> {
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

			const tagDtos = Gelbooru.#expectTags(response, { context: namesBatch });
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
	static #expectPosts = createArrayExpecter<GelbooruPostsResponseDto, GelbooruPostDto>({
		booruName: this.name,
		entity: 'posts',
		extract: (data) => data?.post,
		createUnknownError: ({ fetchResult }) =>
			new BooruUnknownPostError(
				`Couldn't fetch posts from Gelbooru API.\nReceived: ${JSON.stringify(fetchResult)}`,
				{ cause: fetchResult },
			),
	});

	/**
	 * Asserts that the status code of a response is 200 and that the {@link Tag} data is valid before returning it.
	 * @throws {BooruFetchError}
	 * @throws {BooruUnknownTagError}
	 */
	static #expectTags = createArrayExpecter<GelbooruTagsResponseDto, GelbooruTagDto>({
		booruName: this.name,
		entity: 'tags',
		extract: (data) => data?.tag,
		createUnknownError: ({ booruName, fetchResult, context }) =>
			new BooruUnknownTagError({ booruName, fetchResult, tags: context }),
	});

	readonly [booruSpec]!: GelbooruSpec;
}
