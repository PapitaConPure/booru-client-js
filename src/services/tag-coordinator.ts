import type { Tag } from '../domain/tag';
import type { TagCoordinationOptions } from '../types/booru';
import type { TagResolver } from './tag-resolver';

type MaybeTag = Tag | undefined;

interface TagTask {
	resolve(tag: MaybeTag): void;
	reject(err: unknown): void;
}

/**
 * Coordinates {@link Tag} resolution across concurrent requests in order to reduce redundant store lookups and API calls within a certain time frame.
 *
 * Responsible for:
 * * Deduplicating in-flight requests for the same tag
 * * Batching multiple tag requests within the same microtask
 * * Delegating resolution to {@link TagResolver}
 *
 * Separate requests for the same tag name merge into a single Promise.
 * Multiple tag requests issued within the same synchronous execution frame are batched into a single {@link TagResolver.resolveMany} call.
 *
 * @see https://compositecode.blog/2025/07/03/go-concurrency-patternssingleflight-pattern/
 * @see https://oneuptime.com/blog/post/2026-01-25-prevent-duplicate-api-requests-deduplication-go/view
 * @see https://medium.com/@mr.sourav.raj/request-hedging-vs-request-coalescing-a-software-engineers-guide-to-optimizing-distributed-fdcc6590ba9d
 */
export class TagCoordinator {
	/**Underlying {@link TagResolver} responsible for ultimately fetching tags from stores/API.*/
	readonly #resolver: TagResolver;

	/**Tracks ongoing {@link Tag} requests by name so that their results can be reused in duplicate requests.*/
	readonly #ongoingTagRequests: Map<string, Promise<MaybeTag>>;

	/**Set of {@link Tag} names queued for the next batch resolution.*/
	#pendingNames: Set<string>;

	/**
	 * Maps {@link Tag} names to corresponding functions that will resolve or reject them eventually.
	 *
	 * Multiple tasks may exist for a single name due to other concurrent callers.
	 * @see https://dev.to/nk_sk_6f24fdd730188b284bf/understanding-fan-out-in-system-design-p3c
	 */
	#pendingTagTasks: Map<string, TagTask[]>;

	/**
	 * Indicates whether a batch flush has already been scheduled (`true`) or not (`false`).
	 *
	 * Prevents multiple flushes from being scheduled at the same time.
	 */
	#flushScheduled: boolean;

	/**
	 * Indicates whether a batch flush is happening NOW (`true`) or not (`false`).
	 *
	 * Prevents multiple flushes from happening at the same time.
	 */
	#isFlushing: boolean;

	/**Handle for he scheduled flush (if any).*/
	#flushTimer: NodeJS.Timeout | null;

	/**Time window (in milliseconds) during which incoming {@link Tag} requests are batched before being resolved.*/
	#baseGraceWindowMs: number;

	/**Maximum amount of time the dynamic batching grace window is allowed to reach, in milliseconds.*/
	#maxGraceWindowMs: number;

	constructor(resolver: TagResolver, options: TagCoordinationOptions = {}) {
		const { baseBatchingGraceWindowMs = 0, maxBatchingGraceWindowMs = 5 } = options;

		this.#resolver = resolver;

		this.#ongoingTagRequests = new Map();
		this.#pendingNames = new Set();
		this.#pendingTagTasks = new Map();
		this.#flushScheduled = false;
		this.#isFlushing = false;
		this.#flushTimer = null;

		this.#maxGraceWindowMs = Math.max(0, maxBatchingGraceWindowMs);
		this.#baseGraceWindowMs = Math.min(
			Math.max(0, baseBatchingGraceWindowMs),
			this.#maxGraceWindowMs,
		);
	}

	async getMany(names: string[]): Promise<Tag[]> {
		const promises = names.map((name) => this.getOne(name));
		const results = await Promise.all(promises);

		return results.filter((t) => t != null);
	}

	async getOne(name: string): Promise<MaybeTag> {
		const ongoingTagRequest = this.#ongoingTagRequests.get(name);
		if (ongoingTagRequest) return ongoingTagRequest;

		const newResolver: TagTask = { resolve: () => undefined, reject: () => undefined };

		const newTagRequest = new Promise<MaybeTag>((resolve, reject) => {
			newResolver.resolve = resolve;
			newResolver.reject = reject;
		});

		this.#ongoingTagRequests.set(name, newTagRequest);

		const pendingResolvers = this.#pendingTagTasks.get(name);

		if (pendingResolvers) pendingResolvers.push(newResolver);
		else this.#pendingTagTasks.set(name, [newResolver]);

		this.#pendingNames.add(name);

		this.#scheduleTagFlush();

		newTagRequest.finally(() => {
			this.#ongoingTagRequests.delete(name);
		});

		return newTagRequest;
	}

	flushNow() {
		if (this.#flushTimer) {
			clearTimeout(this.#flushTimer);
			this.#flushTimer = null;
		}

		this.#flushTags();
	}

	#scheduleTagFlush() {
		if (this.#flushScheduled) return;
		this.#flushScheduled = true;

		const delay = this.#calcAdaptiveDelay();

		this.#flushTimer = setTimeout(() => {
			this.#flushTimer = null;
			this.#flushTags();
		}, delay);
	}

	async #flushTags() {
		if (this.#isFlushing) return;
		this.#isFlushing = true;

		try {
			this.#flushScheduled = false;

			const pendingNames = this.#pendingNames;
			if (!pendingNames.size) return;

			const resolversMap = this.#pendingTagTasks;

			this.#pendingNames = new Set();
			this.#pendingTagTasks = new Map();

			let resultingTags: Tag[] = [];
			try {
				resultingTags = await this.#resolver.resolveMany(pendingNames);
			} catch (err) {
				for (const [, resolvers] of resolversMap)
					for (const resolver of resolvers) resolver.reject(err);

				for (const name of pendingNames) this.#ongoingTagRequests.delete(name);

				throw err;
			}

			const resultsMap = new Map<string, Tag>();
			for (const resultingTag of resultingTags)
				resultsMap.set(resultingTag.name, resultingTag);

			//Resolve pending requests
			for (const pendingName of pendingNames) {
				const maybeTag = resultsMap.get(pendingName);
				const resolvers = resolversMap.get(pendingName);

				if (!resolvers) continue;

				for (const resolver of resolvers) resolver.resolve(maybeTag);
			}
		} finally {
			this.#isFlushing = false;
			if (this.#pendingNames.size) this.#scheduleTagFlush();
		}
	}

	#calcAdaptiveDelay(): number {
		const size = this.#pendingNames.size;

		if (size <= 5) return this.#baseGraceWindowMs;
		if (size <= 20) return Math.max(1, this.#baseGraceWindowMs);
		if (size <= 50) return Math.max(3, this.#baseGraceWindowMs);

		return this.#maxGraceWindowMs;
	}
}
