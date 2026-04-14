import type Booru from '../adapters/booru';
import type { Post } from '../models/post';
import type { Tag } from '../models/tag';
import type { ValuesOf } from './util';

export const PostRatings = {
	General: 'general',
	Sensitive: 'sensitive',
	Questionable: 'questionable',
	Explicit: 'explicit',
} as const;
export type PostRating = ValuesOf<typeof PostRatings>;

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

export type PostResolvable = Post | APIPostData;

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

export type TagResolvable = Tag | TagData | APITagData;

export type CredentialsOf<TBooru extends Booru> =
	TBooru extends Booru<infer TCredentials> ? TCredentials : never;

export interface BooruSearchOptions {
	limit?: number;
	random?: boolean;
}
