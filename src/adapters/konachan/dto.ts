import type { ValuesOf } from '../../types/util';
import type { KonachanPostRating } from './types';

export const KonachanPostStatuses = {
	ACTIVE: 'active',
	PENDING: 'pending',
	DELETED: 'deleted',
	FLAGGED: 'flagged',
} as const;
export type KonachanPostStatus = ValuesOf<typeof KonachanPostStatuses>;

export interface KonachanPostDto {
	id: number;
	tags: string;
	created_at: number;
	creator_id: number;
	author: string;
	change: number;
	source: string;
	score: number;
	md5: string;
	file_size: number;
	file_url: string;
	is_shown_in_index: boolean;
	preview_url: string;
	preview_width: number;
	preview_height: number;
	actual_preview_width: number;
	actual_preview_height: number;
	sample_url: string;
	sample_width: number;
	sample_height: number;
	sample_file_size: number;
	jpeg_url: string;
	jpeg_width: number;
	jpeg_height: number;
	jpeg_file_size: number;
	rating: KonachanPostRating;
	has_children: boolean;
	parent_id: string | null;
	status: KonachanPostStatus;
	width: number;
	height: number;
	is_held: boolean;
	frames_pending_string: string;
	frames_pending: string[];
	frames_string: string;
	frames: string[];
}

export type KonachanPostsResponseDto = KonachanPostDto[];

export const KonachanTagTypes = {
	GENERAL: 0,
	ARTIST: 1,
	COPYRIGHT: 3,
	CHARACTER: 4,
	METADATA: 5,
} as const satisfies Record<string, number>;
export type KonachanTagType = ValuesOf<typeof KonachanTagTypes>;

export interface KonachanTagDto {
	id: number;
	name: string;
	count: number;
	type: KonachanTagType;
	ambiguous: boolean;
}

export type KonachanTagsResponseDto = KonachanTagDto[];
