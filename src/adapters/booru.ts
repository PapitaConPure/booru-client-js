import type { Post } from '../domain/post';
import type { Tag } from '../domain/tag';
import type { BooruSearchOptions, BooruSpec, DefineBooruSpec } from '../types/booru';

/**
 * Unique symbol used to statically associate a {@link Booru} implementation with its {@link BooruSpec}.
 *
 * It allows utilities like `NameOf<TBooru>`, `CredentialsOf<TBooru>`, and `SearchOptionsOf<TBooru>` to extract
 * the correct types from a given {@link Booru} instance.
 *
 * @remarks
 * When implementing {@link Booru}, this property is automatically required and will
 * typically be added via your editor's "implement interface" feature.
 * The assigned type must match the implemented {@link Booru} interface's type parameter.
 *
 * Use the definite assignment (`!`) operator to avoid worrying about this Symbol's value:
 *
 * @example
 * type CustombooruSpec = DefineBooruSpec<{...}>;
 *
 * class Custombooru<CustombooruSpec> implements Booru<CustombooruSpec> {
 *     readonly [booruSpec]!: CustombooruSpec;
 * }
 */
export const booruSpec: unique symbol = Symbol('booruSpec');

/**
 * Defines a contract for interacting with a booru (imageboard) service.
 *
 * Implementations are responsible for adapting external API responses into the respective known, normalized domain entities:
 * * {@link Post} and {@link PostRating}
 * * {@link Tag} and {@link TagType}
 *
 * @remarks
 * For ease of use, you should define a {@link BooruSpec} via the {@link DefineBooruSpec} utility type
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

	/**
	 * Defines a {@link Tag} name normalization step that correlates to the implementing {@link Booru}'s criteria for tags.
	 *
	 * This hook takes place **after** HTTP entities and URI encoding normalization, but **before** {@link Tag}s coordination takes place,
	 * and it's applied for each tag in the pipeline.
	 *
	 * It allows each adapter to canonicalize {@link Tag} names according to its criteria and discard certain inputs as invalid.
	 *
	 * @param name The decoded tag name to normalize.
	 * @returns The normalized {@link Tag} name, or `null`/`undefined` to discard the input.
	 *
	 * @example
	 * normalizeTagName('Junko_(touhou)') //→ 'junko_(touhou)'
	 * normalizeTagName('large_breasts') //→ 'breasts'
	 * normalizeTagName('') //→ null or undefined
	 */
	normalizeTagName?(name: string): string | null | undefined;

	readonly [booruSpec]: TSpec;
}
