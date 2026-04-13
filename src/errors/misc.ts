export class InvalidOperationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = InvalidOperationError.name;
	}
}
