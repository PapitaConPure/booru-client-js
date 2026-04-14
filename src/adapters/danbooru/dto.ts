export type DanbooruPostsResponseDto = {
	id: number;
	tag_string: string;
}[];

export type DanbooruTagsResponseDto = {
	id: number;
	name: string;
	post_count: number;
}[];
