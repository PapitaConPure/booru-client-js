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
	order?: DanbooruQueryPostOrder;
	rating?: DanbooruPostRating;
	params?: Record<string, unknown>;
}

export interface DanbooruPostExtra {
	favCount: number;
	fileExt: string;
	fileSize: number;
	md5: string;
	parentId?: string;
	hasChildren: boolean;
	isDeleted: boolean;
	isPending: boolean;
	isFlagged: boolean;
	uploaderId: number;
	tagStringGeneral: string;
	tagStringCharacter: string;
	tagStringCopyright: string;
	tagStringArtist: string;
}

export type DanbooruQueryPostOrder = 'id' | 'score' | 'favcount' | 'random';

export type DanbooruPostRating = 'g' | 's' | 'q' | 'e';
