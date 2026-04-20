import type { PostMapper } from '../../mappers/post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import type { ValuesOf } from '../../types/util';
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
	/**Whether to make API calls to the test domain (`true`) or to the actual main site domain (`false`, default).*/
	useTestDomain?: boolean;
}

export interface DanbooruCredentials {
	apiKey: string;
	login: string;
}

export interface DanbooruSearchOptions {
	random?: boolean;
	page?: number;
	md5?: string;
	raw?: boolean;
}

export interface DanbooruPostExtra {
	parentId: number | null;
	md5?: string;
	approverId?: number | null;
	fileExt: string;
	fileSize: number;
	upScore: number;
	downScore: number;
	favCount: number;
	isPending: boolean;
	isFlagged: boolean;
	isDeleted: boolean;
	tagCount: number;
	tagCountGeneral: number;
	tagCountArtist: number;
	tagCountCopyright: number;
	tagCountCharacter: number;
	tagCountMeta: number;
	lastCommentedAt?: Date;
	lastCommentBumpedAt?: Date;
	lastNotedAt: string | null;
	hasChildren: boolean;
	hasActiveChildren: boolean;
	pixivId: number | null;
	bitFlags: bigint;
	updatedAt?: Date;
	hasLarge: boolean;
}

export const DanbooruPostRatings = {
	GENERAL: 'g',
	SENSITIVE: 's',
	QUESTIONABLE: 'q',
	EXPLICIT: 'e',
} as const;
export type DanbooruPostRating = ValuesOf<typeof DanbooruPostRatings>;

export const DanbooruTagCategories = {
	GENERAL: 0,
	ARTIST: 1,
	COPYRIGHT: 3,
	CHARACTER: 4,
	METADATA: 5,
} as const satisfies Record<string, number>;
export type DanbooruTagCategory = ValuesOf<typeof DanbooruTagCategories>;
