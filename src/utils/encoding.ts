const HTTP_ENTITIES = {
	nbsp: ' ',
	amp: '&',
	quot: '"',
	lt: '<',
	gt: '>',
	tilde: '~',
	apos: "'",
	'#039': "'",
	cent: '¢',
	pound: '£',
	euro: '€',
	yen: '¥',
	copy: '©',
	reg: '®',
	iexcl: '¡',
	brvbar: '¦',
	sect: '§',
	uml: '¨',
	not: '¬',
	deg: 'º',
	acute: '`',
	micro: 'µ',
	para: '¶',
	ordm: 'º',
	laquo: '«',
	raquo: '»',
	circ: '^',
} as const;

const HTTP_ENTITIES_REGEX = (() => {
	const keys = Object.keys(HTTP_ENTITIES).join('|');
	return new RegExp(`&(${keys});`, 'g');
})();

/**@see https://stackoverflow.com/questions/44195322/a-plain-javascript-way-to-decode-html-entities-works-on-both-browsers-and-node*/
export function decodeEntities(encodedString: string) {
	return encodedString
		.replace(
			HTTP_ENTITIES_REGEX,
			(match, entity: keyof typeof HTTP_ENTITIES) => HTTP_ENTITIES[entity] ?? match,
		)
		.replace(/&#(\d+);/gi, (_, numStr) => {
			const num = parseInt(numStr, 10);
			return String.fromCharCode(num);
		});
}

const INVALID_PERCENT_REGEX = /%(?![0-9A-Fa-f]{2})/g;

export function decodePercent(encodedString: string) {
	const sanitized = encodedString.replace(INVALID_PERCENT_REGEX, '%25');
	return decodeURIComponent(sanitized);
}

export function decodePercentsAndEntities(endodedString: string) {
	return decodePercent(decodeEntities(endodedString));
}
