import type { Tag } from '../domain/tag';

/**Defines an interface for mapping DTOs to {@link Tag}s.*/
export interface TagMapper<TDto> {
	fromDto(dto: TDto): Tag;
}
