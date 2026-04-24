import {
	type KonachanTagDto,
	type KonachanTagType,
	KonachanTagTypes,
} from '../../adapters/konachan/dto';
import { Tag } from '../../domain/tag';
import { type TagType, TagTypes } from '../../domain/tag-type';
import { decodePercentsAndEntities } from '../../utils/encoding';
import type { TagMapper } from '../tag-mapper';

const gelbooruTagTypesMap = {
	[KonachanTagTypes.GENERAL]: TagTypes.GENERAL,
	[KonachanTagTypes.ARTIST]: TagTypes.ARTIST,
	[KonachanTagTypes.COPYRIGHT]: TagTypes.COPYRIGHT,
	[KonachanTagTypes.CHARACTER]: TagTypes.CHARACTER,
	[KonachanTagTypes.METADATA]: TagTypes.METADATA,
} as const satisfies Record<KonachanTagType, TagType>;

export class KonachanTagMapper implements TagMapper<KonachanTagDto> {
	fromDto(dto: KonachanTagDto): Tag {
		return new Tag({
			id: `${dto.id}`,
			name: decodePercentsAndEntities(dto.name),
			type: gelbooruTagTypesMap[dto.type],
			count: dto.count,
		});
	}
}
