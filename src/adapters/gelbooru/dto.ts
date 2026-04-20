import type { BooleanString } from '../../types/util';
import type { GelbooruPostRating, GelbooruPostStatus, GelbooruTagType } from './types';

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
