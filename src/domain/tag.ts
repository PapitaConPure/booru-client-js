import { type TagInit, type TagType, TagTypes } from '../types/booru';

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
	readonly id: number;
	readonly name: string;
	readonly count: number;
	readonly type: TagType;
	readonly fetchTimestamp: Date;

	constructor(data: TagInit) {
		this.id = data.id;
		this.name = data.name;
		this.count = data.count;
		this.type = data.type;
		this.fetchTimestamp = new Date(data.fetchTimestamp);

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

	static mock() {
		return new Tag({
			id: 1,
			name: 'name',
			count: 1,
			type: 0,
			fetchTimestamp: new Date(),
		});
	}
}
