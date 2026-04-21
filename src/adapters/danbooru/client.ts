import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import type { PostMapper } from '../../mappers/post-mapper';
import { DanbooruPostMapper } from '../../mappers/post-mapper/danbooru-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { DanbooruTagMapper } from '../../mappers/tag-mapper/danbooru-tag-mapper';
import type { BooruSearchOptions, BooruSpec, PostUrlBuilder } from '../../types/booru';
import { createBooruExpecters } from '../../utils/booru';
import { defineEndpoint, type Endpoint } from '../../utils/endpoint';
import { fetchExt } from '../../utils/fetchExt';
import { type Booru, booruSpec } from '../booru';
import type {
	DanbooruPostDto,
	DanbooruPostsResponseDto,
	DanbooruTagDto,
	DanbooruTagsResponseDto,
} from './dto';
import type {
	DanbooruCredentials,
	DanbooruOptions,
	DanbooruPostExtra,
	DanbooruSearchOptions,
} from './types';

const booruName = 'danbooru' as const;

interface DanbooruSpec extends BooruSpec<Danbooru> {
	name: typeof booruName;
	credentials: DanbooruCredentials;
	searchOptions: DanbooruSearchOptions;
	postExtra: DanbooruPostExtra;
}

/**
 * Implementation of the {@link Booru} interface for the Danbooru API.
 *
 * @see https://danbooru.donmai.us/wiki_pages/help:api
 */
export class Danbooru implements Booru<DanbooruSpec> {
	/**Base URL for Danbooru's main API.*/
	static readonly API_BASE_MAIN_DOMAIN = 'https://danbooru.donmai.us';

	/**Base URL for Danbooru's test API.*/
	static readonly API_BASE_TEST_DOMAIN = 'https://testbooru.donmai.us';

	/**Base URL for the Danbooru API that this instance connects to.*/
	readonly apiBaseUrl: string;

	/**Builds a canonical post URL from a post ID.*/
	static readonly POST_URL_BUILDER: PostUrlBuilder = (postId) =>
		`https://danbooru.donmai.us/posts/${postId}`;

	static readonly #expect = createBooruExpecters(
		booruName,
		(data?: DanbooruPostDto) => data,
		(data?: DanbooruPostsResponseDto) => data,
		(data?: DanbooruTagDto) => data,
		(data?: DanbooruTagsResponseDto) => data,
	);

	readonly #postMapper: PostMapper<DanbooruPostDto, Danbooru>;
	readonly #tagMapper: TagMapper<DanbooruTagDto>;
	readonly #apiPostsEndpoint: Endpoint<DanbooruPostsResponseDto>;
	readonly #apiTagsEndpoint: Endpoint<DanbooruTagsResponseDto>;

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
			useTestDomain = false,
		} = options;

		this.apiBaseUrl = useTestDomain
			? Danbooru.API_BASE_TEST_DOMAIN
			: Danbooru.API_BASE_MAIN_DOMAIN;

		this.#postMapper = postMapper;
		this.#tagMapper = tagMapper;

		this.#apiPostsEndpoint = defineEndpoint(
			'get',
			`${this.apiBaseUrl}/posts.json`,
			{},
			{ fetchFn },
		);

		this.#apiTagsEndpoint = defineEndpoint(
			'get',
			`${this.apiBaseUrl}/tags.json`,
			{},
			{ fetchFn },
		);
	}

	get name() {
		return booruName;
	}

	async search(
		tags: string,
		searchOptions: Required<BooruSearchOptions> & DanbooruSearchOptions,
		credentials: DanbooruCredentials,
	): Promise<Post<Danbooru>[]> {
		const { apiKey, login } = credentials;

		const fetchResult = await this.#apiPostsEndpoint.request<DanbooruPostsResponseDto>({
			api_key: apiKey,
			login: login,
			tags: tags,
			...searchOptions,
		});

		const postDtos = Danbooru.#expect.post.array(fetchResult, { dontThrowOnEmptyFetch: true });
		const posts = postDtos.map((dto) => this.#postMapper.fromDto(dto));

		return posts;
	}

	async fetchPostById(
		postId: string,
		credentials: DanbooruCredentials,
	): Promise<Post<Danbooru> | undefined> {
		const { apiKey, login } = credentials;

		const url = new URL(`posts/${postId}.json`, this.apiBaseUrl);
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('login', login);

		const response = await fetchExt<DanbooruPostDto | undefined>(url, {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		const postDto = Danbooru.#expect.post.one(response, { dontThrowOnEmptyFetch: true });

		if (postDto == null) return undefined;

		return this.#postMapper.fromDto(postDto);
	}

	async fetchPostByUrl(
		postUrl: URL,
		credentials: DanbooruCredentials,
	): Promise<Post<Danbooru> | undefined> {
		const { apiKey, login } = credentials;

		const match = postUrl.pathname.match(/\/posts\/(\d+)/);
		if (!match) throw new TypeError('Invalid Danbooru post URL');

		const postId = match[1];

		const url = new URL(`posts/${postId}.json`, this.apiBaseUrl);
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('login', login);

		const response = await fetchExt<DanbooruPostDto | undefined>(url, {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		const postDto = Danbooru.#expect.post.one(response, { dontThrowOnEmptyFetch: true });

		if (postDto == null) return undefined;

		return this.#postMapper.fromDto(postDto);
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

			const response = await this.#apiTagsEndpoint.request({
				api_key: apiKey,
				login: login,
				'search[name_space]': namesBatch,
			});

			const tagDtos = Danbooru.#expect.tag.array(response, { context: namesBatch });
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

	[booruSpec]!: DanbooruSpec;
}
