import type { Booru } from '../adapters/booru';
import type { Post } from '../domain/post';

/**Defines an interface for mapping DTOs to {@link Post}s which are associated to a {@link Booru}.*/
export interface PostMapper<TDto, TBooru extends Booru> {
	fromDto(dto: TDto): Post<TBooru>;
}
