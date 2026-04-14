import type { ValuesOf } from '../../types/util';

export type DanbooruPostRating = 'g' | 's' | 'q' | 'e';

export interface DanbooruPostDto {
	id: number;
	rating: DanbooruPostRating;
	parent_id: number | null;
	source: string;
	md5?: string;
	uploader_id: number;
	approver_id?: number | null;
	file_ext: string;
	file_size: number;
	image_width: number;
	image_height: number;
	score: number;
	up_score: number;
	down_score: number;
	fav_count: number;
	is_pending: boolean;
	is_flagged: boolean;
	is_deleted: boolean;
	tag_string: string;
	tag_count: number;
	tag_count_general: number;
	tag_count_artist: number;
	tag_count_copyright: number;
	tag_count_character: number;
	tag_count_meta: number;
	last_commented_at: number | null;
	last_comment_bumped_at: number | null;
	last_noted_at: number | null;
	has_children: boolean;
	has_active_children: boolean;
	pixiv_id: number | null;
	bit_flags: bigint;
	created_at: number;
	updated_at: number;
	has_large: boolean;
	file_url?: string;
	large_file_url?: string;
	preview_file_url?: string;
}

export type DanbooruPostsResponseDto = DanbooruPostDto[];

export const DanbooruTagCategories = {
	GENERAL: 0,
	ARTIST: 1,
	COPYRIGHT: 3,
	CHARACTER: 4,
	METADATA: 5,
} as const satisfies Record<string, number>;
export type DanbooruTagCategory = ValuesOf<typeof DanbooruTagCategories>;

export interface DanbooruTagDto {
	id: number;
	name: string;
	category: DanbooruTagCategory;
	post_count: number;
	is_deprecated: boolean;
	created_at: number;
	updated_at: number;
}

export type DanbooruTagsResponseDto = DanbooruTagDto[];
