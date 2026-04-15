export class InvalidOperationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = InvalidOperationError.name;
	}
}

export class InvalidUrlError extends Error {
	constructor(field: string, value: string) {
		super(`Invalid URL for field "${field}": ${value}`);
		this.name = InvalidUrlError.name;
	}
}
