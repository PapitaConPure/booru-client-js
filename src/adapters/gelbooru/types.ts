import type { PostMapper } from '../../mappers/post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import type { ValuesOf } from '../../types/util';
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
	/**The page number.*/
	pid?: number;
	/**Change ID of the post. This is in Unix time so there are likely others with the same value if updated at the same time.*/
	cid?: number | Date;
}

export interface GelbooruPostExtra {
	md5?: string;
	directory?: string;
	imageName: string;
	parentId?: number;
	change: Date;
	ownerName?: string;
	status: GelbooruPostStatus;
	postLocked: boolean;
}

export const GelbooruPostStatuses = {
	ACTIVE: 'active',
	PENDING: 'pending',
	DELETED: 'deleted',
	FLAGGED: 'flagged',
} as const;
export type GelbooruPostStatus = ValuesOf<typeof GelbooruPostStatuses>;

export const GelbooruPostRatings = {
	GENERAL: 'general',
	SENSITIVE: 'sensitive',
	QUESTIONABLE: 'questionable',
	EXPLICIT: 'explicit',
} as const;
export type GelbooruPostRating = ValuesOf<typeof GelbooruPostRatings>;

export const GelbooruTagTypes = {
	GENERAL: 0,
	ARTIST: 1,
	UNKNOWN: 2,
	COPYRIGHT: 3,
	CHARACTER: 4,
	METADATA: 5,
	DEPRECATED: 6,
} as const satisfies Record<string, number>;
export type GelbooruTagType = ValuesOf<typeof GelbooruTagTypes>;
