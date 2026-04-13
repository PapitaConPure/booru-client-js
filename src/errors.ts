export class BooruError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruError';
	}
}

export class BooruFetchError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruFetchError';
	}
}

export class BooruUnknownPostError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruUnknownPostError';
	}
}

export class BooruUnknownTagError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'BooruUnknownTagError';
	}
}
