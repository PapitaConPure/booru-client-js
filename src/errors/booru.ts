import type { FetchSuccessResult } from '../utils/fetchExt';
import { stringify } from '../utils/misc';

/**Base error type for all booru-related failures.*/
export class BooruError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruError.name;
	}
}

/**Thrown when a booru API request fails.*/
export class BooruFetchError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruFetchError.name;
	}
}

/**Thrown when a requested {@link Post} cannot be found or resolved.*/
export class BooruUnknownPostError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruUnknownPostError.name;
	}
}

/**Thrown when a requested {@link Tag} cannot be found or resolved.*/
export class BooruUnknownTagError extends BooruError {
	tags?: unknown;
	data?: unknown;

	constructor(
		options: {
			booruName?: string;
			fetchResult?: FetchSuccessResult<unknown>;
			tags?: unknown;
		} = {},
	) {
		const { booruName = 'a booru adapter', fetchResult, tags } = options;

		super(
			[
				`Couldn't fetch tags from ${booruName}.`,
				tags && `Tried to fetch: ${tags}`,
				'Received:',
				stringify(fetchResult?.data),
			]
				.filter((t) => t)
				.join('\n'),
		);
		this.name = BooruUnknownTagError.name;
		this.tags = tags;
		this.data = fetchResult?.data;
	}
}
