import type { Post } from '../models/post';

export interface PostMapper<TDto = unknown> {
	fromDto(dto: TDto): Post;
}
