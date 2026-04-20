import type { DanbooruTagDto } from '../../adapters/danbooru/dto';
import { DanbooruTagCategories, type DanbooruTagCategory } from '../../adapters/danbooru/types';
import { Tag } from '../../domain/tag';
import { type TagType, TagTypes } from '../../domain/tag-type';
import type { TagMapper } from '../tag-mapper';

const danbooruTagTypesMap = {
	[DanbooruTagCategories.GENERAL]: TagTypes.GENERAL,
	[DanbooruTagCategories.ARTIST]: TagTypes.ARTIST,
	[DanbooruTagCategories.COPYRIGHT]: TagTypes.COPYRIGHT,
	[DanbooruTagCategories.CHARACTER]: TagTypes.CHARACTER,
	[DanbooruTagCategories.METADATA]: TagTypes.METADATA,
} as const satisfies Record<DanbooruTagCategory, TagType>;

export class DanbooruTagMapper implements TagMapper<DanbooruTagDto> {
	fromDto(dto: DanbooruTagDto): Tag {
		return new Tag({
			id: `${dto.id}`,
			name: dto.name,
			type: dto.is_deprecated ? TagTypes.DEPRECATED : danbooruTagTypesMap[dto.category],
			count: dto.post_count,
		});
	}
}
