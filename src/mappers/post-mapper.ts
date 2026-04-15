import type { Booru } from '../adapters/booru';
import type { Post } from '../domain/post';

export interface PostMapper<TDto, TBooru extends Booru> {
	fromDto(dto: TDto): Post<TBooru>;
}
