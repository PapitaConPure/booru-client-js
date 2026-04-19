import type { PostMapper } from '../../mappers/post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import type { FetchFn } from '../../utils/endpoint';
import type { Danbooru } from './client';
import type { DanbooruPostDto, DanbooruTagDto } from './dto';

export interface DanbooruOptions {
	/**Mapper used to transform Danbooru post DTOs into {@link Post} domain entities.*/
	postMapper?: PostMapper<DanbooruPostDto, Danbooru>;
	/**Mapper used to transform Danbooru tag DTOs into {@link Tag} domain entities.*/
	tagMapper?: TagMapper<DanbooruTagDto>;
	/**Fetch implementation used for API requests.*/
	fetchFn?: FetchFn;
}

export interface DanbooruCredentials {
	apiKey: string;
	login: string;
}
