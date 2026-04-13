import { type TagResolvable, type TagType, TagTypes } from './types/gelbooru';
import { decodeEntities } from './utils/encoding';

/**@class Representa una tag de {@linkcode Post} de un {@linkcode Booru}.*/
export class Tag {
	id: number;
	name: string;
	count: number;
	type: TagType;
	ambiguous: boolean;
	fetchTimestamp: Date;

	constructor(data: TagResolvable) {
		if (!Object.values(TagTypes).some((t) => t === data.type))
			throw RangeError('Tipo de tag inválido. Solo se aceptan números: 0, 1, 2, 3, 4, 5, 6');

		this.id = data.id;
		this.name = decodeEntities(data.name);
		this.count = data.count;
		this.type = data.type as TagType;
		this.ambiguous = !!data.ambiguous;
		this.fetchTimestamp = 'fetchTimestamp' in data ? data.fetchTimestamp : new Date(Date.now());
	}

	get typeName() {
		switch (this.type) {
			case TagTypes.GENERAL:
				return 'General';
			case TagTypes.ARTIST:
				return 'Artist';
			case TagTypes.COPYRIGHT:
				return 'Copyright';
			case TagTypes.CHARACTER:
				return 'Character';
			case TagTypes.METADATA:
				return 'Metadata';
			case TagTypes.DEPRECATED:
				return 'Deprecated';
			default:
				return 'Unknown';
		}
	}

	toString() {
		return `{${this.id} / ${this.typeName}} ${this.count} ${this.name}`;
	}
}
