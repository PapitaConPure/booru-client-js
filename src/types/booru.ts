import type { Booru } from '../adapters/booru';
import type { PostRating } from '../domain/post-rating';
import type { Tag } from '../domain/tag';
import type { TagStore } from '../stores/tag-store';
import type { ValuesOf } from './util';

export interface BooruClientTagOptions {
	/**Allows to define a custom {@link TagStore} chain from which to fetch {@link Tag}s. By default: `[`{@linkcode MemoryTagStore}`]` (cache only).*/
	storeChain?: TagStore[];
	/**When fetching multiple {@link Tag}s: what amount of these should switch the fetch strategy from "tag by tag" to "store by store". Defaults to 50.*/
	fetchThreshold?: number;
	/**
	 * Defines whether a {@link Tag} invalidation process of the defined {@link TagStore}s should be automatically performed now, during this client's creation (`true`)
	 * or not (`false`, default).
	 *
	 * This process doesn't take into account the `manualCleanup` configuration, which is useful for stores that persist their tag information through executions.
	 */
	cleanOnStartup?: boolean;
	/**
	 * Defines whether the {@link Tag} invalidation process of {@link TagStore}s should be managed manually and externally (`true`)
	 * or it should instead be this {@link BooruClient}'s concern (`false`, default).
	 */
	manualCleanup?: boolean;
	/**Defines the throttle amount (in milliseconds) for automatic {@link Tag} invalidation if this {@link BooruClient} is auto-managed (`manualTagCleanup`=`false`).*/
	cleanupIntervalMs?: number;
}

export interface BooruSearchOptions {
	limit?: number;
	random?: boolean;
}

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
	fetchTimestamp?: Date;
}

export type CredentialsOf<TBooru extends Booru> =
	TBooru extends Booru<string, infer TCredentials extends {}> ? TCredentials : never;

export type NameOf<TBooru extends Booru> = TBooru extends Booru<infer TName> ? TName : never;

export type TagFetchApproach = (names: string[]) => Promise<Tag[]>;
