/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: WAIT */

import type { Post } from '../../domain/post';
import type { Tag } from '../../domain/tag';
import { BooruUnknownPostError, BooruUnknownTagError } from '../../errors/booru';
import type { BooruSearchOptions, BooruSpec } from '../../types/booru';
import { createArrayExpecter } from '../../utils/booru';
import { defineEndpoint, type Endpoint } from '../../utils/endpoint';
import { type Booru, booruSpec } from '../booru';
import type {
	DanbooruPostDto,
	DanbooruPostsResponseDto,
	DanbooruTagDto,
	DanbooruTagsResponseDto,
} from '../danbooru/dto';
import type { DanbooruCredentials } from '../danbooru/types';
import type { KonachanSearchOptions } from './types';

const booruName = 'konachan' as const;

interface KonachanSpec extends BooruSpec<Konachan> {
	name: typeof booruName;
	credentials: DanbooruCredentials;
	searchOptions: KonachanSearchOptions;
	postExtra: unknown;
}

export class Konachan
	implements
		Booru<{
			self: Konachan;
			name: typeof booruName;
			credentials: DanbooruCredentials;
			searchOptions: KonachanSearchOptions;
			postExtra: unknown;
		}>
{
	static readonly API_BASE_URL = '';

	readonly #postsEndpoint: Endpoint;
	readonly #tagsEndpoint: Endpoint;

	constructor() {
		this.#postsEndpoint = defineEndpoint('get', '');
		this.#tagsEndpoint = defineEndpoint('get', '');
	}

	get name(): 'konachan' {
		throw new Error('Method not implemented.');
	}

	async search(
		tags: string,
		searchOptions: Required<BooruSearchOptions> & KonachanSearchOptions,
		credentials: DanbooruCredentials,
	): Promise<Post<Konachan>[]> {
		const { limit, random } = searchOptions;
		const { apiKey, login } = credentials;

		const result = await this.#postsEndpoint.request<DanbooruPostsResponseDto>({
			api_key: apiKey,
			login,
			tags,
			limit,
			random: random ? 1 : 0,
		});

		const postDtos = Konachan.#expectPosts(result);
		const posts = postDtos as unknown as Post<Konachan>[]; //TODO: Konachan Mapper

		return posts;
	}

	fetchPostById(
		postId: string,
		credentials: DanbooruCredentials,
	): Promise<Post<Konachan> | undefined> {
		throw new Error('Method not implemented.');
	}

	fetchPostByUrl(
		postUrl: URL,
		credentials: DanbooruCredentials,
	): Promise<Post<Konachan> | undefined> {
		throw new Error('Method not implemented.');
	}

	fetchTagsByNames(names: Iterable<string>, credentials: DanbooruCredentials): Promise<Tag[]> {
		throw new Error('Method not implemented.');
	}

	validateCredentials(
		credentials: DanbooruCredentials,
	): asserts credentials is DanbooruCredentials {
		throw new Error('Method not implemented.');
	}

	static #expectPosts = createArrayExpecter<DanbooruPostsResponseDto, DanbooruPostDto>({
		booruName,
		entity: 'posts',
		extract: (data) => data,
		createUnknownError: () => new BooruUnknownPostError(''),
	});

	static #expectTags = createArrayExpecter<DanbooruTagsResponseDto, DanbooruTagDto>({
		booruName,
		entity: 'tags',
		extract: (data) => data,
		createUnknownError: () => new BooruUnknownTagError({ booruName }),
	});

	[booruSpec]!: KonachanSpec;
}
