/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: WAIT */

import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import type { PostMapper } from '../../mappers/post-mapper';
import { KonachanPostMapper } from '../../mappers/post-mapper/konachan-post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import { KonachanTagMapper } from '../../mappers/tag-mapper/konachan-tag-mapper';
import type { BooruSearchOptions, BooruSpec, PostUrlBuilder } from '../../types/booru';
import { createBooruExpecters } from '../../utils/booru';
import { defineEndpoint, type Endpoint } from '../../utils/endpoint';
import { fetchExt } from '../../utils/fetchExt';
import { wait } from '../../utils/misc';
import { type Booru, booruSpec } from '../booru';
import type {
	KonachanPostDto,
	KonachanPostsResponseDto,
	KonachanTagDto,
	KonachanTagsResponseDto,
} from './dto';
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
		`https://konachan.com/post/show/${postId}`;

	static readonly #expect = createBooruExpecters(
		booruName,
		(data?: KonachanPostDto) => data,
		(data?: KonachanPostsResponseDto) => data,
		(data?: KonachanTagDto) => data,
		(data?: KonachanTagsResponseDto) => data,
	);

	readonly #postMapper: PostMapper<KonachanPostDto, Konachan>;
	readonly #tagMapper: TagMapper<KonachanTagDto>;
	readonly #apiPostsEndpoint: Endpoint<KonachanPostsResponseDto>;
	readonly #apiTagsEndpoint: Endpoint<KonachanTagsResponseDto>;

	constructor(options: KonachanOptions = {}) {
		const {
			postMapper = new KonachanPostMapper(),
			tagMapper = new KonachanTagMapper(),
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
		const result = await this.#apiPostsEndpoint.request({
			tags,
			...searchOptions,
		});

		const postDtos = Konachan.#expect.post.array(result);
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

		const postDto = Konachan.#expect.post.one(response, { dontThrowOnEmptyFetch: true });

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

		const postDto = Konachan.#expect.post.one(response, { dontThrowOnEmptyFetch: true });

		if (postDto == null) return undefined;

		return this.#postMapper.fromDto(postDto);
	}

	async fetchTagsByNames(names: Iterable<string>): Promise<Tag[]> {
		const namesArr: string[] = Array.isArray(names) ? names : [...names];

		const fetchedTags: Tag[] = [];

		//Yes, tags must be fetched one by one. What the fuck
		for (let i = 0; i < namesArr.length; i += 2) {
			const namesBatch = namesArr.slice(i, i + 2);

			const requestPromises = namesBatch.map(async (name) => {
				const result = await this.#apiTagsEndpoint.request({
					name: name,
				});

				const tagDtos = Konachan.#expect.tag.array(result, { dontThrowOnEmptyFetch: true });

				//Moebooru's 'name' param is not for exact matches
				const tagDto = tagDtos.find((dto) => dto.name === name);

				if (tagDto == null) return;

				return tagDto.name === name ? this.#tagMapper.fromDto(tagDto) : null;
			});

			const results = await Promise.all(requestPromises);
			const validResults = results.filter((tag) => tag != null);

			fetchedTags.push(...validResults);
			wait(1_500); //Never below a second, please.
		}

		return fetchedTags;
	}

	validateCredentials(
		_credentials: KonachanCredentials,
	): asserts _credentials is KonachanCredentials {}

	[booruSpec]!: KonachanSpec;
}
