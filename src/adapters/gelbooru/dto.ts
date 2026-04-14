export type GelbooruPostRating = 'general' | 'sensitive' | 'questionable' | 'explicit';

export interface GelbooruPostDto {
	id: number;
	title: string;
	tags: string;
	source: string;
	score: number;
	rating: GelbooruPostRating;
	created_at: string;
	creator_id: number;
	file_url: string;
	width: number;
	height: number;
	preview_url?: string;
	preview_width?: number;
	preview_height?: number;
	sample_url?: string;
	sample_width?: number;
	sample_height?: number;
}

export interface GelbooruPostsResponseDto {
	post: GelbooruPostDto[];
}

export interface GelbooruTagDto {
	id: number;
	name: string;
	count: number;
	type: number;
	ambiguous: number;
}

export interface GelbooruTagsResponseDto {
	tag: GelbooruTagDto[];
}
