import type { Tag } from '../domain/tag';

export interface TagMapper<TDto> {
	fromDto(dto: TDto): Tag;
}
