import type { Post } from '../models/post';
import type { Tag } from '../models/tag';
import type { BooruSearchOptions, Credentials } from '../types/gelbooru';

/**@description Defines una interface to interact with one of various imageboards.*/
export default interface Booru {
	/**
	 *
	 * @param tags
	 * @param options
	 * @param credentials
	 */
	search(tags: string, searchOptions: Required<BooruSearchOptions>, credentials: Credentials): Promise<Post[]>;

	/**
	 *
	 * @param postId
	 * @param credentials
	 */
	fetchPostById(postId: string, credentials: Credentials): Promise<Post>;

	/**
	 *
	 * @param postUrl
	 * @param credentials
	 */
	fetchPostByUrl(postUrl: URL | string, credentials: Credentials): Promise<Post>;

	/**
	 *
	 * @param names
	 * @param credentials
	 */
	fetchTagsByNames(names: Iterable<string>, credentials: Credentials): Promise<Tag[]>;
}
