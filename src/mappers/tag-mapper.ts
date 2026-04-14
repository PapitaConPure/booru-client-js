import type { Tag } from '../models/tag';

export interface TagMapper<TDto = unknown> {
	fromDto(dto: TDto): Tag;
}
