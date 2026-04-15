import type { Post } from '../domain/post';
import type { Tag } from '../domain/tag';
import type { BooruSearchOptions } from '../types/booru';

/**@description Defines una interface to interact with one of various imageboards.*/
export interface Booru<
	TName extends string = string,
	TCredentials = unknown,
	TSearchOptions extends BooruSearchOptions = BooruSearchOptions,
> {
	/**@description */
	get name(): TName;

	/**
	 *
	 * @param tags
	 * @param options
	 * @param credentials
	 */
	search(
		tags: string,
		searchOptions: Required<TSearchOptions>,
		credentials: TCredentials,
	): Promise<Post[]>;

	/**
	 *
	 * @param postId
	 * @param credentials
	 */
	fetchPostById(postId: string, credentials: TCredentials): Promise<Post | undefined>;

	/**
	 *
	 * @param postUrl
	 * @param credentials
	 */
	fetchPostByUrl(postUrl: URL, credentials: TCredentials): Promise<Post | undefined>;

	/**
	 *
	 * @param names
	 * @param credentials
	 */
	fetchTagsByNames(names: Iterable<string>, credentials: TCredentials): Promise<Tag[]>;

	/**
	 *
	 * @param credentials
	 */
	validateCredentials(credentials: TCredentials): asserts credentials is TCredentials;
}
