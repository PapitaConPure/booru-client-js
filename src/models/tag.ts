import { type TagResolvable, type TagType, TagTypes, ValidTagTypes } from '../types/gelbooru';
import { decodeEntities } from '../utils/encoding';

const TagTypeNames: Record<TagType, string> = {
	[TagTypes.GENERAL]: 'General',
	[TagTypes.ARTIST]: 'Artist',
	[TagTypes.COPYRIGHT]: 'Copyright',
	[TagTypes.CHARACTER]: 'Character',
	[TagTypes.METADATA]: 'Metadata',
	[TagTypes.DEPRECATED]: 'Deprecated',
	[TagTypes.UNKNOWN]: 'Unknown',
};

/**@description Representa una tag de {@linkcode Post} de un {@linkcode Booru}.*/
export class Tag {
	id: number;
	name: string;
	count: number;
	type: TagType;
	ambiguous: boolean;
	fetchTimestamp: Date;

	constructor(data: TagResolvable) {
		const tagType = data.type != null ? data.type : TagTypes.UNKNOWN;

		if (!ValidTagTypes.has(tagType as TagType)) throw RangeError('Invalid tag type');

		this.id = data.id;
		this.name = decodeEntities(data.name);
		this.count = data.count ?? 1;
		this.type = tagType as TagType;
		this.ambiguous = !!data.ambiguous;
		this.fetchTimestamp =
			'fetchTimestamp' in data && data.fetchTimestamp != null
				? new Date(data.fetchTimestamp)
				: new Date(Date.now());

		Object.freeze(this);
	}

	get typeName() {
		return TagTypeNames[this.type] ?? TagTypeNames[TagTypes.UNKNOWN];
	}

	[Symbol.toPrimitive](hint: string) {
		if (hint === 'string' || hint === 'default') return this.toString();
		return this.id;
	}

	toString() {
		return `[Tag ${this.id}] (${this.typeName}) ${this.name} x${this.count}`;
	}
}
