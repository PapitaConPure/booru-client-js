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

export function getSourceUrl(source: string) {
	if (!source) return null;

	const sourceMatch = source.match(
		/(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-])+\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_/.0-9#:?=&;,]*)?)?/,
	);
	if (sourceMatch?.index == null) return null;

	return source.slice(sourceMatch.index, sourceMatch.index + sourceMatch[0].length);
}
