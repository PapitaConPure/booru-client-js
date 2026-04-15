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

/**
 * @description
 * Represents a domain entity for a tag associated with a {@linkcode Post} on a {@linkcode Booru}.
 *
 * Encapsulates canonical data associated with a booru tag, independent of the underlying API representation.
 *
 * This object is immutable and should be treated as a read-only value.
 */
export class Tag {
	/**@description Unique identifier of the {@link Tag} within the booru.*/
	readonly id: number;

	/**@description Canonical name of the {@link Tag}.*/
	readonly name: string;

	/**@description Number of posts associated with this {@link Tag}.*/
	readonly count: number;

	/**@description Normalized classification of the {@link Tag}, as in: the category the tag belongs to.*/
	readonly type: TagType;

	/**@description Timestamp indicating when this {@link Tag} was fetched or last updated.*/
	readonly fetchTimestamp: Date;

	/**
	 * @description Constructs a {@link Tag} domain entity from normalized initialization data.
	 *
	 * The provided data is assumed to be validated and normalized by an adapter layer.
	 * The resulting instance is immutable.
	 *
	 * @param data Normalized data used to initialize this {@link Tag}.
	 */

	constructor(data: TagInit) {
		this.id = data.id;
		this.name = data.name;
		this.count = data.count;
		this.type = data.type;
		this.fetchTimestamp = new Date(data.fetchTimestamp);

		Object.freeze(this);
	}

	/**@description The computed, normalized category name this {@link Tag} belongs to.*/
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

	/**
	 * @description Creates a mock {@link Post} instance for testing.
	 * @param initOverrides Overrides for the default initialization parameters.
	 */
	static mock(initOverrides: Partial<TagInit> = {}) {
		const defualtMock: TagInit = {
			id: 1,
			name: 'name',
			count: 1,
			type: 0,
			fetchTimestamp: new Date(),
		};

		return new Tag({ ...defualtMock, ...initOverrides });
	}
}
