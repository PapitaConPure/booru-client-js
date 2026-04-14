import type { ValuesOf } from '../../types/util';

export interface DanbooruPostDto {
	id: number;
	tag_string: string;
	created_at: string;
	large_file_url: string;
	image_width: number;
	image_height: number;
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
