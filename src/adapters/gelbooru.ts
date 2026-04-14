import { BooruFetchError, BooruUnknownPostError, BooruUnknownTagError } from '../errors/booru';
import { Post } from '../models/post';
import { Tag } from '../models/tag';
import type {
	APIPostData,
	APITagData,
	Credentials,
	PostResolvable,
	TagResolvable,
} from '../types/gelbooru';
import { type FetchResult, fetchExt } from '../utils/fetchExt';
import { shuffleArray } from '../utils/misc';
import type Booru from './booru';

export default class Gelbooru implements Booru {
	static readonly API_URI = 'https://gelbooru.com/index.php';
	static readonly API_POSTS_URL = 'https://gelbooru.com/index.php';
	static readonly API_TAGS_URL = 'https://gelbooru.com/index.php?page=dapi&s=tag&q=index';

	static readonly POSTS_API = Gelbooru.#createBooruEndpoint({
		//timeout: 10000,
		page: 'dapi',
		s: 'post',
		q: 'index',
		json: '1',
	});

	static readonly TAGS_API = Gelbooru.#createBooruEndpoint({
		//timeout: 10000,
		page: 'dapi',
		s: 'tag',
		q: 'index',
		json: '1',
	});

	async search(
		tags: string,
		searchOptions: { limit: number; random: boolean },
		credentials: Credentials,
	): Promise<Post[]> {
		const { limit, random } = searchOptions;
		const { apiKey, userId } = credentials;

		if (Array.isArray(tags)) tags = tags.join(' ');

		const fetchResult = await Gelbooru.POSTS_API.request<{ post: APIPostData[] }>({
			api_key: apiKey,
			user_id: userId,
			limit: limit,
			tags: tags,
		});

		const posts = Gelbooru.#expectPosts(fetchResult, { dontThrowOnEmptyFetch: true });

		if (random) shuffleArray(posts);

		return posts.map((p) => new Post(p));
	}

	async fetchPostById(postId: string, credentials: Credentials): Promise<Post> {
		const { apiKey, userId } = credentials;
		if (typeof postId !== 'string') throw new TypeError('Invalid Post ID');

		const response = await Gelbooru.POSTS_API.request<{ post: APIPostData[] }>({
			api_key: apiKey,
			user_id: userId,
			id: postId,
		});
		const [post] = Gelbooru.#expectPosts(response) as [Post];
		return new Post(post);
	}

	async fetchPostByUrl(postUrl: URL | string, credentials: Credentials): Promise<Post> {
		const { apiKey, userId } = credentials;

		if (typeof postUrl !== 'string') throw new TypeError('Invalid Post URL');

		const url = new URL(postUrl);
		url.searchParams.set('page', 'dapi');
		url.searchParams.set('s', 'post');
		url.searchParams.set('q', 'index');
		url.searchParams.set('json', '1');
		url.searchParams.delete('tags');
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('user_id', userId);

		const response = await fetchExt<{ post: APIPostData[] }>(url.toString());
		const [post] = Gelbooru.#expectPosts(response) as [Post];
		return new Post(post);
	}

	async fetchTagsByNames(names: Iterable<string>, credentials: Credentials): Promise<Tag[]> {
		const { apiKey, userId } = credentials;
		const namesArr: string[] = Array.isArray(names) ? names : [...names];

		const fetchedTags: Tag[] = [];

		for (let i = 0; i < namesArr.length; i += 100) {
			const namesBatch = namesArr.slice(i, i + 100).join(' ');

			const response = await Gelbooru.TAGS_API.request<{ tag: APITagData[] }>({
				api_key: apiKey,
				user_id: userId,
				names: namesBatch,
			});

			const rawTags = Gelbooru.#expectTags(response, { tags: namesBatch });
			const tags = rawTags.map((t) => new Tag(t));
			fetchedTags.push(...tags);
		}

		return fetchedTags;
	}

	static #createBooruEndpoint(defaultParams: Record<string, string>) {
		const endpointURL = new URL(Gelbooru.API_URI);

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
}
