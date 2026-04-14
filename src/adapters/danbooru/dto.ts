export interface DanbooruPostDto {
	id: number;
	tag_string: string;
}

export type DanbooruPostsResponseDto = DanbooruPostDto[];

export interface DanbooruTagDto {
	id: number;
	name: string;
	post_count: number;
}

export type DanbooruTagsResponseDto = DanbooruTagDto[];
