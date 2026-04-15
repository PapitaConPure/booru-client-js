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
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruUnknownTagError.name;
	}
}
