import type { BooleanString, ValuesOf } from '../../types/util';
import type { GelbooruPostRating } from './types';

export const GelbooruPostStatuses = {
	ACTIVE: 'active',
	PENDING: 'pending',
	DELETED: 'deleted',
	FLAGGED: 'flagged',
} as const;
export type GelbooruPostStatus = ValuesOf<typeof GelbooruPostStatuses>;

export interface GelbooruPostDto {
	id: number;
	title: string;
	tags: string;
	source: string;
	score: number;
	rating: GelbooruPostRating;
	created_at: string;
	creator_id: number;
	owner?: string;
	parent_id?: number;
	md5?: string;
	directory?: string;
	change: number;
	image: string;
	file_url: string;
	width: number;
	height: number;
	has_notes?: BooleanString;
	has_comments?: BooleanString;
	has_children?: BooleanString;
	status: GelbooruPostStatus;
	post_locked: number;
	preview_url?: string;
	preview_width?: number;
	preview_height?: number;
	sample: number;
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
