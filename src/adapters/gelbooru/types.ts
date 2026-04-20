import type { PostMapper } from '../../mappers/post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import type { FetchFn } from '../../utils/endpoint';
import type { Gelbooru } from './client';
import type { GelbooruPostDto, GelbooruTagDto } from './dto';

export interface GelbooruOptions {
	/**Mapper used to transform Gelbooru post DTOs into {@link Post} domain entities.*/
	postMapper?: PostMapper<GelbooruPostDto, Gelbooru>;
	/**Mapper used to transform Gelbooru tag DTOs into {@link Tag} domain entities.*/
	tagMapper?: TagMapper<GelbooruTagDto>;
	/**Fetch implementation used for API requests.*/
	fetchFn?: FetchFn;
}

export interface GelbooruCredentials {
	apiKey: string;
	userId: string;
}

export interface GelbooruSearchOptions {
	random?: boolean;
	pid?: number;
	sort?: string;
	order?: GelbooruQueryPostOrder;
	params?: Record<string, unknown>;
}

export interface GelbooruPostExtra {
	favCount?: number;
	fileExt?: string;
	fileSize?: number;
	md5?: string;
	parentId?: string;
	change?: number;
	owner?: string;
	sourceRaw?: string;
}

export type GelbooruQueryPostOrder = 'asc' | 'desc';

export type GelbooruPostRating = 'general' | 'sensitive' | 'questionable' | 'explicit';
