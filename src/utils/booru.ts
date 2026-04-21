import { BooruFetchError, BooruUnknownPostError, BooruUnknownTagError } from '../errors/booru';
import type { FetchResult, FetchSuccessResult } from './fetchExt';

/**Options controlling how a fetch result should be interpreted.*/
interface ExpectOptions {
	/**If `true`, prevents throwing when the extracted value is missing or invalid, returning a fallback value instead.*/
	dontThrowOnEmptyFetch?: boolean;
	/**Optional, contextual data passed to error constructors for debugging.*/
	context?: unknown;
}

/**
 * Creates a reusable fetch validator and extractor for API fetch results.
 *
 * @template TInput The raw response data type (the Response DTO).
 * @template TOutput The expected extracted data type (the Entity DTO).
 *
 * @param options Configuration for extraction, validation, and error handling.
 * @returns A function that validates and extracts data from a {@link FetchResult}.
 */
function createExpecter<TInput, TOutput>(options: {
	booruName: string;
	entity: string;
	extract: (input: TInput | undefined) => TOutput | undefined;
	validate: (value: TOutput | undefined) => value is TOutput;
	emptyValue: TOutput;
	createUnknownError: (context: {
		booruName: string;
		fetchResult: FetchSuccessResult<unknown>;
		context?: unknown;
	}) => Error;
}) {
	const { booruName, entity, extract, validate, emptyValue, createUnknownError } = options;

	/**
	 * Validates and extracts a value from a {@link FetchResult}.
	 *
	 * @param fetchResult The result returned from a fetch operation.
	 * @param opts Additional validation options.
	 * @returns The validated extracted value, or a fallback if allowed.
	 * @throws {BooruFetchError} If the request failed.
	 * @throws {Error} If validation fails and `dontThrowOnEmptyFetch` is `false`.
	 */
	function expect(
		fetchResult: FetchResult<TInput | undefined>,
		opts: ExpectOptions = {},
	): TOutput {
		const { dontThrowOnEmptyFetch = false, context } = opts;

		if (!fetchResult.success) {
			throw new BooruFetchError(
				`${booruName} ${entity} fetch failed: ${fetchResult.error.name} ${fetchResult.error.message || ''}`,
				{ cause: fetchResult },
			);
		}

		const extracted = extract(fetchResult.data);

		if (!validate(extracted)) {
			if (dontThrowOnEmptyFetch) return emptyValue;

			throw createUnknownError({
				booruName,
				fetchResult,
				context,
			});
		}

		return extracted;
	}

	return expect;
}

/**
 * Creates a validator for single-entity responses.
 *
 * The resulting function resolves a single entity or `undefined`, depending on the validation outcome and options.
 *
 * @template TEntity The expected entity type.
 *
 * @param options Configuration for extraction, validation, and error handling.
 * @returns A function that validates and extracts an entity from a {@link FetchResult}.
 */
export function createEntityExpecter<TEntity>(options: {
	booruName: string;
	entity: 'post' | 'tag';
	extract: (input: TEntity | undefined) => TEntity | undefined;
	createUnknownError: (context: {
		booruName: string;
		fetchResult: FetchSuccessResult<unknown>;
		context?: unknown;
	}) => Error;
}) {
	return createExpecter<TEntity, TEntity | undefined>({
		...options,
		validate: (v): v is TEntity => v != null,
		emptyValue: undefined,
	});
}

/**
 * Creates a validator for array-based responses.
 *
 * The resulting function resolves an array of entities, or an empty array when validation fails and throwing is disabled.
 *
 * @template TInput The raw response data type.
 * @template TOutput The expected entity type.
 *
 * @param options Configuration for extraction, validation, and error handling.
 * @returns A function that validates and extracts an array of entities from a {@link FetchResult}.
 */
export function createArrayExpecter<TInput, TOutput>(options: {
	booruName: string;
	entity: 'posts' | 'tags';
	extract: (input: TInput | undefined) => TOutput[] | undefined;
	createUnknownError: (context: {
		booruName: string;
		fetchResult: FetchSuccessResult<unknown>;
		context?: unknown;
	}) => Error;
}) {
	return createExpecter<TInput, TOutput[]>({
		...options,
		validate: (v): v is TOutput[] => Array.isArray(v),
		emptyValue: [],
	});
}

export function getSourcesArray(sourceString: string | null | undefined): string[] | undefined {
	const sources = sourceString
		?.split(/\s+/)
		.map((s) => s.trim())
		.filter((s) => s != null && s.length > 0);

	if (!sources?.length) return undefined;

	return sources;
}

export function createBooruExpecters<TPostsResponseDto, TPostDto, TTagsResponseDto, TTagDto>(
	booruName: string,
	extractPost: (data: TPostDto | undefined) => TPostDto | undefined,
	extractPosts: (data: TPostsResponseDto | undefined) => TPostDto[] | undefined,
	extractTag: (data: TTagDto | undefined) => TTagDto | undefined,
	extractTags: (data: TTagsResponseDto | undefined) => TTagDto[] | undefined,
) {
	return {
		post: {
			one: createEntityExpecter({
				booruName,
				entity: 'post',
				extract: extractPost,
				createUnknownError: ({ fetchResult, context }) =>
					new BooruUnknownPostError({ booruName, fetchResult, posts: context }),
			}),

			array: createArrayExpecter({
				booruName,
				entity: 'posts',
				extract: extractPosts,
				createUnknownError: ({ fetchResult, context }) =>
					new BooruUnknownPostError({ booruName, fetchResult, posts: context }),
			}),
		},

		tag: {
			one: createEntityExpecter<TTagDto>({
				booruName,
				entity: 'tag',
				extract: extractTag,
				createUnknownError: ({ fetchResult, context }) =>
					new BooruUnknownTagError({ booruName, fetchResult, tags: context }),
			}),

			array: createArrayExpecter<TTagsResponseDto, TTagDto>({
				booruName,
				entity: 'tags',
				extract: extractTags,
				createUnknownError: ({ fetchResult, context }) =>
					new BooruUnknownTagError({ booruName, fetchResult, tags: context }),
			}),
		},
	};
}
