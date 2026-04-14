import type { Post } from '../domain/post';

export interface PostMapper<TDto = unknown> {
	fromDto(dto: TDto): Post;
}
