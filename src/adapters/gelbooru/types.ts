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
	pid?: number;
	sort?: string;
	order?: GelbooruQueryPostOrder;
	params?: Record<string, unknown>;
}

export interface GelbooruPostExtra {
	favCount?: number;
	md5?: string;
	directory?: string;
	imageName: string;
	parentId?: string;
	change?: number;
	owner?: string;
	postLocked: boolean;
}

export type GelbooruQueryPostOrder = 'asc' | 'desc';

export type GelbooruPostRating = 'general' | 'sensitive' | 'questionable' | 'explicit';
