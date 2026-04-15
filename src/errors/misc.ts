/**Thrown when an operation is not allowed in the current context.*/
export class InvalidOperationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = InvalidOperationError.name;
	}
}

/**Thrown when a `value` cannot be parsed into a valid URL for a specific `field`.*/
export class InvalidUrlError extends Error {
	constructor(field: string, value: unknown) {
		super(`Invalid URL for field "${field}": ${value}`);
		this.name = InvalidUrlError.name;
	}
}

/**Thrown when a `value` cannot be parsed into a valid Date for a specific `field`.*/
export class InvalidDateError extends Error {
	constructor(field: string, value: unknown) {
		super(`Invalid Date for field "${field}": ${value}`);
		this.name = InvalidDateError.name;
	}
}
