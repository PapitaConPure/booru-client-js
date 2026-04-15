export class InvalidOperationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = InvalidOperationError.name;
	}
}

export class InvalidUrlError extends Error {
	constructor(field: string, value: unknown) {
		super(`Invalid URL for field "${field}": ${value}`);
		this.name = InvalidUrlError.name;
	}
}

export class InvalidDateError extends Error {
	constructor(field: string, value: unknown) {
		super(`Invalid Date for field "${field}": ${value}`);
		this.name = InvalidDateError.name;
	}
}
