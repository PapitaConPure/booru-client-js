import type { ValuesOf } from '../../types/util';
import type { GelbooruPostRating } from './types';

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

export interface GelbooruTagDto {
	id: number;
	name: string;
	count: number;
	type: GelbooruTagType;
	ambiguous: number;
}

export interface GelbooruTagsResponseDto {
	tag: GelbooruTagDto[];
}
