import type { Post } from '../domain/post';
import type { Tag } from '../domain/tag';
import type { BooruSearchOptions } from '../types/booru';

/**
 * Defines a contract for interacting with a booru (imageboard) service.
 *
 * Implementations are responsible for adapting external API responses into the respective known, normalized domain entities:
 * * {@link Post}
 * * {@link Tag}
 */
export interface Booru<
	TName extends string = string,
	TCredentials = unknown,
	TSearchOptions extends BooruSearchOptions = BooruSearchOptions,
	_TPostExtra = unknown,
> {
	/**Unique identifier of this booru implementation.*/
	get name(): TName;

	/**
	 * Searches {@link Post}s matching the provided tag query.
	 *
	 * @param tags Space-separated tag query string.
	 * @param searchOptions Normalized search options.
	 * @param credentials Credentials used to authorize the request.
	 * @returns A list of matching {@link Post}s.
	 * @remarks The returned Promise may reject with:
	 * * {@link BooruFetchError} If the request to the API fails.
	 * * {@link BooruUnknownPostError} If the booru adapter is unable to resolve the API response.
	 */
	search(
		tags: string,
		searchOptions: Required<BooruSearchOptions> & TSearchOptions,
		credentials: TCredentials,
	): Promise<Post[]>;

	/**
	 * Fetches a {@link Post} by its unique identifier.
	 *
	 * @param postId Identifier of the post.
	 * @param credentials Credentials used to authorize the request.
	 * @returns The matching {@link Post}, or `undefined` if not found.
	 * @remarks The returned Promise may reject with:
	 * * {@link BooruFetchError} If the request to the API fails.
	 * * {@link BooruUnknownPostError} If the booru adapter is unable to resolve the API response.
	 */
	fetchPostById(postId: string, credentials: TCredentials): Promise<Post | undefined>;

	/**
	 * Fetches a {@link Post} from its canonical URL.
	 *
	 * @param postUrl URL of the post.
	 * @param credentials Credentials used to authorize the request.
	 * @returns The matching {@link Post}, or `undefined` if not found.
	 * @remarks The returned Promise may reject with:
	 * * {@link BooruFetchError} If the request to the API fails.
	 * * {@link BooruUnknownPostError} If the booru adapter is unable to resolve the API response.
	 */
	fetchPostByUrl(postUrl: URL, credentials: TCredentials): Promise<Post | undefined>;

	/**
	 * Fetches {@link Tag}s by their names.
	 *
	 * @param names Collection of tag names to retrieve.
	 * @param credentials Credentials used to authorize the request.
	 * @returns A list of matching {@link Tag}s.
	 * @remarks The returned Promise may reject with:
	 * * {@link BooruFetchError} If the request to the API fails.
	 * * {@link BooruUnknownTagError} If the booru adapter is unable to resolve the API response.
	 */
	fetchTagsByNames(names: Iterable<string>, credentials: TCredentials): Promise<Tag[]>;

	/**
	 * Validates that the provided credentials are usable for API requests.
	 *
	 * @param credentials Credentials to validate.
	 * @throws {TypeError} If credentials are malformed.
	 */
	validateCredentials(credentials: TCredentials): asserts credentials is TCredentials;
}
