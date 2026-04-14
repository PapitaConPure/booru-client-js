import type { Tag } from '../domain/tag';

export interface TagMapper<TDto = unknown> {
	fromDto(dto: TDto): Tag;
}
