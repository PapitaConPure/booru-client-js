/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: WAIT */

import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import { BooruUnknownPostError, BooruUnknownTagError } from '../../errors/booru';
import type { PostMapper } from '../../mappers/post-mapper';
import { KonachanPostMapper } from '../../mappers/post-mapper/konachan-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { DanbooruTagMapper } from '../../mappers/tag-mapper/danbooru-tag-mapper';
import type { BooruSearchOptions, BooruSpec, PostUrlBuilder } from '../../types/booru';
import { createArrayExpecter, createEntityExpecter } from '../../utils/booru';
import { defineEndpoint, type Endpoint } from '../../utils/endpoint';
import { fetchExt } from '../../utils/fetchExt';
import { type Booru, booruSpec } from '../booru';
import type {
	DanbooruTagDto,
	DanbooruTagsResponseDto,
} from '../danbooru/dto';
import type { KonachanPostDto, KonachanPostsResponseDto } from './dto';
import type {
	KonachanCredentials,
	KonachanOptions,
	KonachanPostExtra,
	KonachanSearchOptions,
} from './types';

const booruName = 'konachan' as const;

interface KonachanSpec extends BooruSpec<Konachan> {
	name: typeof booruName;
	credentials: KonachanCredentials;
	searchOptions: KonachanSearchOptions;
	postExtra: KonachanPostExtra;
}

//TODO: Consider a DanbooruLike/MoebooruBased abstraction for Konachan, Yande.re, etc. because it's getting silly

export class Konachan implements Booru<KonachanSpec> {
	static readonly API_BASE_URL = 'https://konachan.com/';

	/**Builds a canonical post URL from a post ID.*/
	static readonly postUrlBuilder: PostUrlBuilder = (postId) =>
		`https://konachan.com.us/post/${postId}`;

	readonly #postMapper: PostMapper<KonachanPostDto, Konachan>;
	readonly #tagMapper: TagMapper<DanbooruTagDto>;
	readonly #apiPostsEndpoint: Endpoint;
	readonly #apiTagsEndpoint: Endpoint;

	constructor(options: KonachanOptions = {}) {
		const {
			postMapper = new KonachanPostMapper(),
			tagMapper = new DanbooruTagMapper(),
			fetchFn = fetchExt,
		} = options;

		this.#postMapper = postMapper;
		this.#tagMapper = tagMapper;

		this.#apiPostsEndpoint = defineEndpoint(
			'get',
			new URL('post.json', Konachan.API_BASE_URL),
			{},
			{ fetchFn },
		);

		this.#apiTagsEndpoint = defineEndpoint(
			'get',
			new URL('tag.json', Konachan.API_BASE_URL),
			{},
			{ fetchFn },
		);
	}

	get name(): 'konachan' {
		return booruName;
	}

	async search(
		tags: string,
		searchOptions: Required<BooruSearchOptions> & KonachanSearchOptions,
	): Promise<Post<Konachan>[]> {
		const { limit, random } = searchOptions;

		const result = await this.#apiPostsEndpoint.request<KonachanPostsResponseDto>({
			tags,
			limit,
			random: random ? 1 : 0,
		});

		console.log(result);

		const postDtos = Konachan.#expectPosts(result);
		const posts = postDtos.map((dto) => this.#postMapper.fromDto(dto));

		return posts;
	}

	async fetchPostById(postId: string): Promise<Post<Konachan> | undefined> {
		const url = new URL(`posts/${postId}.json`, Konachan.API_BASE_URL);

		const response = await fetchExt<KonachanPostDto | undefined>(url, {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		const postDto = Konachan.#expectPost(response, { dontThrowOnEmptyFetch: true });

		if (postDto == null) return undefined;

		return this.#postMapper.fromDto(postDto);
	}

	async fetchPostByUrl(postUrl: URL): Promise<Post<Konachan> | undefined> {
		const match = postUrl.pathname.match(/\/posts\/(\d+)/);
		if (!match) throw new TypeError('Invalid Danbooru post URL');

		const postId = match[1];

		const url = new URL(`posts/${postId}.json`, Konachan.API_BASE_URL);

		const response = await fetchExt<KonachanPostDto | undefined>(url, {
			type: 'json',
			init: {
				signal: AbortSignal.timeout(10_000),
			},
		});

		const postDto = Konachan.#expectPost(response, { dontThrowOnEmptyFetch: true });

		if (postDto == null) return undefined;

		return this.#postMapper.fromDto(postDto);
	}

	async fetchTagsByNames(names: Iterable<string>): Promise<Tag[]> {
		const namesArr: string[] = Array.isArray(names) ? names : [...names];

		const fetchedTags: Tag[] = [];

		for (let i = 0; i < namesArr.length; i += 100) {
			const namesBatch = namesArr.slice(i, i + 100).join(' ');

			const response = await this.#apiTagsEndpoint.request<
				DanbooruTagsResponseDto | undefined
			>({
				'search[name_space]': namesBatch,
			});

			const tagDtos = Konachan.#expectTags(response, { context: namesBatch });
			const tags = tagDtos.map((dto) => this.#tagMapper.fromDto(dto));
			fetchedTags.push(...tags);
		}

		return fetchedTags;
	}

	validateCredentials(
		_credentials: KonachanCredentials,
	): asserts _credentials is KonachanCredentials {}

	static #expectPost = createEntityExpecter<KonachanPostDto>({
		booruName,
		entity: 'post',
		extract: (data) => data,
		createUnknownError: () => new BooruUnknownPostError(''),
	});

	static #expectPosts = createArrayExpecter<KonachanPostsResponseDto, KonachanPostDto>({
		booruName,
		entity: 'posts',
		extract: (data) => data,
		createUnknownError: () => new BooruUnknownPostError(''),
	});

	static #expectTags = createArrayExpecter<DanbooruTagsResponseDto, DanbooruTagDto>({
		booruName,
		entity: 'tags',
		extract: (data) => data,
		createUnknownError: ({ fetchResult, context }) =>
			new BooruUnknownTagError({ booruName, fetchResult, tags: context }),
	});

	[booruSpec]!: KonachanSpec;
}
