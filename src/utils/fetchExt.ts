/**
 * Map of response types to their corresponding data structures.
 * @template TSchema The expected structure of a JSON response.
 */
interface FetchDataMap<TSchema> {
	/**Standard JavaScript object parsed from JSON.*/
	json: TSchema;
	/**Plain text string.*/
	text: string;
	/**Raw binary data as a generic fixed-length container.*/
	arrayBuffer: ArrayBuffer;
	/**Raw binary data as a typed array.*/
	buffer: Uint8Array;
	/**Standard Web API ReadableStream.*/
	stream: ReadableStream<Uint8Array>;
}

/**Available methods for parsing a {@link Response} body.*/
type FetchType = keyof FetchDataMap<unknown> & {};

/**Extracts the specific data type from FetchDataMap based on the chosen FetchType.*/
type AssertedFetchData<TFetch extends FetchType, TSchema = unknown> = FetchDataMap<TSchema>[TFetch];

/**A function that evaluates a {@link Response} object.*/
type ResponsePredicate = (s: Response) => boolean;

/**A function that evaluates an HTTP status code.*/
type StatusPredicate = (s: number) => boolean;

/**Shapes the behavior of the {@link fetchExt} function.*/
interface FetchExtOptions<TFetch extends FetchType> {
	/**The format in which the {@link Response} body should be parsed. Defaults to `'json'`.*/
	type?: TFetch;
	/**Identical to the {@linkcode fetch} function's `init` parameter.*/
	init?: RequestInit;
	/**A predicate that validates the HTTP status code obtained from the {@link Response}. Should return `true` if valid.*/
	validateStatus?: StatusPredicate;
	/**A predicate that validates the obtained {@link Response} object. Should return `true` if valid.*/
	validateResponse?: ResponsePredicate;
}

/**Defines what any {@link fetchExt} result body will contain.*/
interface BaseFetchResult<TSuccess extends true | false> {
	success: TSuccess;
}

/**Defines the shape of a successful {@link fetchExt} result.*/
export interface FetchSuccessResult<TData> extends BaseFetchResult<true> {
	data: TData;
	response: Response;
}

/**Defines the shape of an erroneous {@link fetchExt} result.*/
export interface FetchErrorResult extends BaseFetchResult<false> {
	error: Error;
	response?: Response;
}

/**Represents all posible results of the {@link fetchExt} function.*/
export type FetchResult<TData = unknown> = FetchSuccessResult<TData> | FetchErrorResult;

/**
 * Performs a request and retrieves data using the native `fetch()` API, providing extra utilities for validation and automatic body parsing to the requested format.
 * @template TFetch Defines the expected response type.
 * @param url The URL or {@link Request} object for the query.
 * @param options Configuration for the request and its manipulation before returning.
 * @returns An object containing the success status, and the {@link Response}.
 * If the request was successful, the object also contains the extracted data. Otherwise, contains an {@link Error} describing the issue.
 */
export async function fetchExt<TFetch extends Exclude<FetchType, 'json'>>(
	url: string | URL | Request,
	options: FetchExtOptions<TFetch>,
): Promise<FetchResult<AssertedFetchData<TFetch>>>;

/**
 * Performs a request and retrieves data using the native `fetch()` API, providing extra utilities for validation and automatic body parsing to JSON.
 * @template TSchema Defines the expected *structure* of the JSON.
 * @template TFetch The expected response type is `'json'`.
 * @param url The URL or {@link Request} object for the query.
 * @param options Configuration for the request and its manipulation before returning.
 * @returns An object containing the success status, and the {@link Response}.
 * If the request was successful, the object also contains the extracted JSON data, typed as specified. Otherwise, contains an {@link Error} describing the issue.
 */
export async function fetchExt<TSchema = unknown>(
	url: string | URL | Request,
	options?: FetchExtOptions<'json'>,
): Promise<FetchResult<TSchema>>;

/**
 * Performs a request and retrieves data using the native `fetch()` API, providing extra utilities for validation and automatic body parsing.
 * @template TSchema If the expected response dialect is `'json'`, defines the expected *structure* of the JSON.
 * @template TFetch Defines the expected response type (default: `'json'`).
 * @param url The URL or {@link Request} object for the query.
 * @param options Configuration for the request and its manipulation before returning.
 * @returns An object containing the success status, and the {@link Response}.
 * If the request was successful, the object also contains the extracted data. Otherwise, contains an {@link Error} describing the issue.
 */
export async function fetchExt<TSchema = unknown, TFetch extends FetchType = 'json'>(
	url: string | URL | Request,
	options: FetchExtOptions<TFetch> = {},
): Promise<FetchResult<AssertedFetchData<TFetch, TSchema>>> {
	const { type = 'json', init, validateStatus, validateResponse } = options;

	let response: Response;

	try {
		response = await fetch(url, init);
	} catch (err) {
		return {
			success: false as const,
			error: err instanceof Error ? err : new FetchError(`${err}`),
		};
	}

	if (validateStatus && !validateStatus(response.status)) {
		return {
			success: false as const,
			error: new HTTPError(response.status, response.statusText),
			response,
		};
	}

	if (validateResponse && !validateResponse(response)) {
		return {
			success: false as const,
			error: new ResponseError('Response state was not valid.', response),
			response,
		};
	}

	try {
		let data: AssertedFetchData<TFetch, TSchema>;

		switch (type) {
			case 'json':
				data = (await response.json()) as TSchema as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'text':
				data = (await response.text()) as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'arrayBuffer':
				data = (await response.arrayBuffer()) as AssertedFetchData<TFetch, TSchema>;
				break;

			case 'buffer': {
				const arrayBuffer = await response.arrayBuffer();
				const hasBufferClass = typeof globalThis.Buffer !== 'undefined';
				const finalBuffer = hasBufferClass
					? globalThis.Buffer.from(arrayBuffer)
					: new Uint8Array(arrayBuffer);
				data = finalBuffer as AssertedFetchData<TFetch, TSchema>;

				break;
			}

			case 'stream': {
				if (!response.body)
					throw new ResponseError(
						'Response body unavailable for stream extraction.',
						response,
					);

				data = response.body as AssertedFetchData<TFetch, TSchema>;
				break;
			}

			default:
				throw new RangeError(`Invalid or unsupported type: ${type}`);
		}

		return {
			success: true as const,
			data,
			response,
		};
	} catch (err) {
		return {
			success: false as const,
			error: err instanceof Error ? err : new Error(`${err}`),
			response,
		};
	}
}

/**Error thrown when an HTTP status code fails validation.*/
export class HTTPError extends Error {
	constructor(status: number, statusText: string);
	constructor(status: number, statusText: string, options?: ErrorOptions);
	constructor(status: number, statusText: string, options?: ErrorOptions) {
		super(`${status} ${statusText}`, options);
		this.name = 'HTTPError';
	}
}

/**Error thrown when a fetch operation fails (e.g., network error).*/
export class FetchError extends Error {
	constructor();
	constructor(message?: string);
	constructor(message?: string, options?: ErrorOptions);
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'FetchError';
	}
}

/**Error thrown when the response content is deemed invalid or the body cannot be read.*/
export class ResponseError extends Error {
	#response: Response | undefined;

	constructor();
	constructor(message?: string);
	constructor(message?: string, response?: Response);
	constructor(message?: string, response?: Response, options?: ErrorOptions);
	constructor(message?: string, response?: Response, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ResponseError';
		this.#response = response;
	}

	get response() {
		return this.#response;
	}
}
