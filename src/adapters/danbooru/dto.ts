export interface DanbooruPostDto {
	id: number;
	tag_string: string;
	created_at: string;
	large_file_url: string;
	image_width: number;
	image_height: number;
}

export type DanbooruPostsResponseDto = DanbooruPostDto[];

export interface DanbooruTagDto {
	id: number;
	name: string;
	post_count: number;
}

export type DanbooruTagsResponseDto = DanbooruTagDto[];
