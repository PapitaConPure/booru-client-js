export type RequireAtLeastOne<T> = {
	[K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export type ValuesOf<T> = T[keyof T];

export type Flatten<T> = {
	[K in keyof T]: T[K];
} & {};

export type Exact<T, TShape> = T extends TShape
	? Exclude<keyof T, keyof TShape> extends never
		? T
		: never
	: never;

export type BooleanString = 'true' | 'false' | 'True' | 'False';
