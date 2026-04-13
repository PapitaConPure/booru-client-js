export class BooruError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruError.name;
	}
}

export class BooruFetchError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruFetchError.name;
	}
}

export class BooruUnknownPostError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruUnknownPostError.name;
	}
}

export class BooruUnknownTagError extends BooruError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = BooruUnknownTagError.name;
	}
}
