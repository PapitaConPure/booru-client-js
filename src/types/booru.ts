import type { Booru, booruSpec } from '../adapters/booru';
import type { PostRating } from '../domain/post-rating';
import type { Tag } from '../domain/tag';
import type { TagStore } from '../stores/tag-store';
import type { ValuesOf } from './util';

export interface TagResolutionOptions {
	/**Allows to define a custom {@link TagStore} chain from which to fetch {@link Tag}s. By default: `[`{@linkcode MemoryTagStore}`]` (cache only).*/
	storeChain?: TagStore[];
	/**Defines the number of {@link Tag} names at which the fetch strategy switches from "tag by tag" to "store by store". Defaults to 50.*/
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
	/**Defines the minimum interval (in milliseconds) between automatic {@link Tag} invalidation if this {@link BooruClient} is auto-managed (`manualTagCleanup`=`false`).*/
	cleanupIntervalMs?: number;
}

export interface TagCoordinationOptions {
	/**
	 * Defines the delay (in milliseconds) before flushing a batch of pending {@link Tag} requests. During this window, additional requests accumulate into the same batch.
	 * Defaults to 0 and is bound by `maxBatchingGraceWindowMs`
	 *
	 * A higher value increases {@link Tag} batching efficiency at the cost of added latency. A lower value reduces latency at the cost of more {@link Tag} request,
	 * which may potentially call to the API.
	 */
	baseBatchingGraceWindowMs?: number;
	/**Defines the maximum amount of time the dynamic batching grace window is allowed to reach, in milliseconds. Defaults to 5.*/
	maxBatchingGraceWindowMs?: number;
	/**Defines the maximum amount of concurrent request allowed in a single batch operation.*/
	maxConcurrentTags?: number;
	/**Defines the maximum time (in milliseconds) to wait before rejecting the resolution of a {@link Tag} request. Defaults to 20k (20 seconds).*/
	resolutionTimeoutMs?: number;
}

export interface BooruClientTagOptions extends TagResolutionOptions, TagCoordinationOptions {}

export interface BooruSearchOptions {
	limit?: number;
	random?: boolean;
}

export type PostUrlBuilder = (postId: string) => string;

export interface PostInit<TBooru extends AnyBooru = AnyBooru> {
	booru: NameOf<TBooru>;
	urlBuilder: PostUrlBuilder;
	id: string;
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
	extra?: PostExtraOf<TBooru>;
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
	id: string;
	name: string;
	count: number;
	type: TagType;
	fetchTimestamp?: Date;
}

export interface BooruSpec<TSelf extends AnyBooru = AnyBooru> {
	self: TSelf;
	name: string;
	credentials: unknown;
	searchOptions: unknown;
	postExtra: unknown;
}

export type NameOf<TBooru extends AnyBooru> = TBooru extends { [booruSpec]?: infer TSpec }
	? // biome-ignore lint/suspicious/noExplicitAny: TSelf is irrelevant here; we only extract from TSpec
		TSpec extends BooruSpec<any>
		? TSpec['name']
		: never
	: never;

export type CredentialsOf<TBooru extends AnyBooru> = TBooru extends { [booruSpec]?: infer TSpec }
	? // biome-ignore lint/suspicious/noExplicitAny: TSelf is irrelevant here; we only extract from TSpec
		TSpec extends BooruSpec<any>
		? TSpec['credentials']
		: never
	: never;

export type SearchOptionsOf<TBooru extends AnyBooru> = TBooru extends { [booruSpec]?: infer TSpec }
	? // biome-ignore lint/suspicious/noExplicitAny: TSelf is irrelevant here; we only extract from TSpec
		TSpec extends BooruSpec<any>
		? TSpec['searchOptions']
		: never
	: never;

export type PostExtraOf<TBooru extends AnyBooru> = TBooru extends { [booruSpec]?: infer TSpec }
	? // biome-ignore lint/suspicious/noExplicitAny: TSelf is irrelevant here; we only extract from TSpec
		TSpec extends BooruSpec<any>
		? TSpec['postExtra']
		: never
	: never;

export type TagFetchApproach = (names: string[]) => Promise<Tag[]>;

// biome-ignore lint/suspicious/noExplicitAny: Required for AnyBooru type
export type AnyBooru = Booru<any, any>;
