import type { Booru } from '../adapters/booru';
import type { PostRating } from '../domain/post-rating';
import type { ValuesOf } from './util';

export type PostUrlBuilder = (postId: number) => string;

export interface PostInit<TBooru extends Booru = Booru> {
	booru: NameOf<TBooru>;
	urlBuilder: PostUrlBuilder;
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

export interface TagInit {
	id: number;
	name: string;
	count: number;
	type: TagType;
	fetchTimestamp: Date;
}

export type CredentialsOf<TBooru extends Booru> =
	TBooru extends Booru<string, infer TCredentials> ? TCredentials : never;

export type NameOf<TBooru extends Booru> = TBooru extends Booru<infer TName> ? TName : never;

export interface BooruSearchOptions {
	limit?: number;
	random?: boolean;
}
