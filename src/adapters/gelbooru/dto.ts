export interface GelbooruPostsResponseDto {
	post: {
		id: number;
		title: string;
		tags: string[] | string;
		source: string | string[];
		score: number;
		rating: string;
		created_at: Date | string | number;
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
	}[];
}

export interface GelbooruTagsResponseDto {
	tag: {
		id: number;
		name: string;
		count?: number;
		type?: number;
		ambiguous?: boolean;
	}[];
}
