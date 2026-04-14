import type { Post } from '../models/post';
import type { Tag } from '../models/tag';
import type { BooruSearchOptions } from '../types/gelbooru';

/**@description Defines una interface to interact with one of various imageboards.*/
export default interface Booru<TCredentials = unknown> {
	/**
	 *
	 * @param tags
	 * @param options
	 * @param credentials
	 */
	search(tags: string, searchOptions: Required<BooruSearchOptions>, credentials: TCredentials): Promise<Post[]>;

	/**
	 *
	 * @param postId
	 * @param credentials
	 */
	fetchPostById(postId: string, credentials: TCredentials): Promise<Post>;

	/**
	 *
	 * @param postUrl
	 * @param credentials
	 */
	fetchPostByUrl(postUrl: URL | string, credentials: TCredentials): Promise<Post>;

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
