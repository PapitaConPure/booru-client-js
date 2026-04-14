import type Booru from '../adapters/booru';
import type { Post } from '../domain/post';
import type { PostRating } from '../domain/post-rating';
import type { Tag } from '../domain/tag';
import type { ValuesOf } from './util';

export interface APIPostData {
	id: number;
	title: string;
	tags: string[] | string;
	source: string | string[];
	score: number;
	rating: PostRating;
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
}

export interface PostInit {
	id: number;
	title: string;
	tags: string[];
	sources?: string[];
	score: number;
	rating: PostRating;
	createdAt: Date;
	creatorId: number;
	fileUrl: string;
	size: [number, number];
	previewUrl?: string;
	previewSize?: [number, number];
	sampleUrl?: string;
	sampleSize?: [number, number];
}

export type PostResolvable = Post | APIPostData | PostInit;

export const TagTypes = {
	GENERAL: 0,
	ARTIST: 1,
	UNKNOWN: 2,
	COPYRIGHT: 3,
	CHARACTER: 4,
	METADATA: 5,
	DEPRECATED: 6,
} as const satisfies Record<string, number>;
export type TagType = ValuesOf<typeof TagTypes>;
export const ValidTagTypes = new Set<TagType>(Object.values(TagTypes));

export interface APITagData {
	id: number;
	name: string;
	count?: number;
	type: TagType | number;
	ambiguous?: boolean;
}

export interface TagData {
	id: number;
	name: string;
	count?: number;
	type?: TagType | number;
	ambiguous?: boolean;
	fetchTimestamp: Date | number;
}

export interface TagInit {
	id: number;
	name: string;
	count: number;
	type: TagType;
	fetchTimestamp: Date | number;
}

export type TagResolvable = Tag | APITagData | TagInit;

export type CredentialsOf<TBooru extends Booru> =
	TBooru extends Booru<infer TCredentials> ? TCredentials : never;

export interface BooruSearchOptions {
	limit?: number;
	random?: boolean;
}
