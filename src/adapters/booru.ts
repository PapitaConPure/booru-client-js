import type { Post } from '../domain/post';
import type { Tag } from '../domain/tag';
import type { BooruSearchOptions, BooruSpec } from '../types/booru';

export const booruSpec: unique symbol = Symbol('booruSpec');

/**
 * Defines a contract for interacting with a booru (imageboard) service.
 *
 * Implementations are responsible for adapting external API responses into the respective known, normalized domain entities:
 * * {@link Post}
 * * {@link Tag}
 */
export interface Booru<TSpec extends BooruSpec> {
	/**Unique identifier of this booru implementation.*/
	get name(): TSpec['name'];

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
		searchOptions: Required<BooruSearchOptions> & TSpec['searchOptions'],
		credentials: TSpec['credentials'],
	): Promise<Post<TSpec['self']>[]>;

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
	fetchPostById(
		postId: string,
		credentials: TSpec['credentials'],
	): Promise<Post<TSpec['self']> | undefined>;

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
	fetchPostByUrl(
		postUrl: URL,
		credentials: TSpec['credentials'],
	): Promise<Post<TSpec['self']> | undefined>;

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
	fetchTagsByNames(names: Iterable<string>, credentials: TSpec['credentials']): Promise<Tag[]>;

	/**
	 * Validates that the provided credentials are usable for API requests.
	 *
	 * @param credentials Credentials to validate.
	 * @throws {TypeError} If credentials are malformed.
	 */
	validateCredentials(
		credentials: TSpec['credentials'],
	): asserts credentials is TSpec['credentials'];

	readonly [booruSpec]?: TSpec;
}
