import type { GelbooruTagDto } from '../../adapters/gelbooru/dto';
import { type GelbooruTagType, GelbooruTagTypes } from '../../adapters/gelbooru/types';
import { Tag } from '../../domain/tag';
import { type TagType, TagTypes } from '../../domain/tag-type';
import type { TagMapper } from '../tag-mapper';

const gelbooruTagTypesMap = {
	[GelbooruTagTypes.GENERAL]: TagTypes.GENERAL,
	[GelbooruTagTypes.ARTIST]: TagTypes.ARTIST,
	[GelbooruTagTypes.UNKNOWN]: TagTypes.UNKNOWN,
	[GelbooruTagTypes.COPYRIGHT]: TagTypes.COPYRIGHT,
	[GelbooruTagTypes.CHARACTER]: TagTypes.CHARACTER,
	[GelbooruTagTypes.METADATA]: TagTypes.METADATA,
	[GelbooruTagTypes.DEPRECATED]: TagTypes.DEPRECATED,
} as const satisfies Record<GelbooruTagType, TagType>;

export class GelbooruTagMapper implements TagMapper<GelbooruTagDto> {
	fromDto(dto: GelbooruTagDto): Tag {
		return new Tag({
			id: `${dto.id}`,
			name: dto.name,
			type: gelbooruTagTypesMap[dto.type],
			count: dto.count,
		});
	}
}
