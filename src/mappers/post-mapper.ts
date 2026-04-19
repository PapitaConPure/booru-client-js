import type { Booru } from '../adapters/booru';
import type { Post } from '../domain/post';
import type { AnyBooru } from '../types/booru';

/**Defines an interface for mapping DTOs to {@link Post}s which are associated to a {@link Booru}.*/
export interface PostMapper<TDto, TBooru extends AnyBooru> {
	fromDto(dto: TDto): Post<TBooru>;
}
