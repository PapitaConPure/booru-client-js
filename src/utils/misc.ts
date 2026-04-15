import { InvalidDateError, InvalidUrlError } from '../errors/misc';

/**@see {@link https://stackoverflow.com/a/2450976}*/
export function shuffleArray<T>(array: T[]): void {
	let currentIndex = array.length;

	while (currentIndex !== 0) {
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex] as T,
			array[currentIndex] as T,
		];
	}
}

export function stringify(value: string) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return `${value}`;
	}
}

export function getSourceUrl(source: string) {
	if (!source) return null;

	const sourceMatch = source.match(
		/(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-])+\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_/.0-9#:?=&;,]*)?)?/,
	);
	if (sourceMatch?.index == null) return null;

	return source.slice(sourceMatch.index, sourceMatch.index + sourceMatch[0].length);
}

/**
 * Parses an URL from the specified `value` intended for the named `field`.
 * @returns The parsed URL.
 * @throws {InvalidUrlError} If the URL is not valid.
 */
export function parseUrlForField(field: string, value: string): URL {
	try {
		return new URL(value);
	} catch {
		throw new InvalidUrlError(field, value);
	}
}

/**
 * Parses a Date from the specified `value` intended for the named `field`.
 * @returns The parsed Date.
 * @throws {InvalidDateError} If the Date is not valid.
 */
export function parseValidDate(field: string, value: Date | string | number): Date {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) throw new InvalidDateError(field, value);

	return date;
}
