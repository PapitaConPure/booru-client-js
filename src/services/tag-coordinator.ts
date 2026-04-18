import type { Tag } from '../domain/tag';
import type { TagResolver } from './tag-resolver';

type MaybeTag = Tag | undefined;

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
	 * Maps {@link Tag} names to corresponding functions that will resolve them eventually.
	 *
	 * Multiple resolvers may exist for a single name due to other concurrent callers.
	 */
	#pendingResolvers: Map<string, ((tag: MaybeTag) => void)[]>;
	#flushScheduled: boolean;

	constructor(resolver: TagResolver) {
		this.#resolver = resolver;
		this.#ongoingTagRequests = new Map();
		this.#pendingNames = new Set();
		this.#pendingResolvers = new Map();
		this.#flushScheduled = false;
	}

	async getMany(names: string[]): Promise<Tag[]> {
		const promises = names.map((name) => this.getOne(name));
		const results = await Promise.all(promises);

		return results.filter((t) => t != null);
	}

	async getOne(name: string): Promise<MaybeTag> {
		const ongoingTagRequest = this.#ongoingTagRequests.get(name);
		if (ongoingTagRequest) return ongoingTagRequest;

		let resolveFn!: (tag: MaybeTag) => void;

		const newTagRequest = new Promise<MaybeTag>((resolve) => {
			resolveFn = resolve;
		});

		this.#ongoingTagRequests.set(name, newTagRequest);

		const pendingResolvers = this.#pendingResolvers.get(name);

		if (pendingResolvers) pendingResolvers.push(resolveFn);
		else this.#pendingResolvers.set(name, [resolveFn]);

		this.#pendingNames.add(name);

		this.#scheduleTagFlush();

		newTagRequest.finally(() => {
			this.#ongoingTagRequests.delete(name);
		});

		return newTagRequest;
	}

	#scheduleTagFlush() {
		if (this.#flushScheduled) return;
		this.#flushScheduled = true;

		//Flush after sync exec
		queueMicrotask(() => this.#flushTags());
	}

	async #flushTags() {
		this.#flushScheduled = false;

		const pendingNames = this.#pendingNames;
		if (!pendingNames.size) return;

		const resolversMap = this.#pendingResolvers;

		this.#pendingNames = new Set();
		this.#pendingResolvers = new Map();

		let resultingTags: Tag[] = [];
		try {
			resultingTags = await this.#resolver.resolveMany(pendingNames);
		} catch (err) {
			for (const [, resolvers] of resolversMap)
				for (const resolve of resolvers) resolve(undefined);
			throw err;
		}

		const resultsMap = new Map<string, Tag>();
		for (const resultingTag of resultingTags) resultsMap.set(resultingTag.name, resultingTag);

		//Resolve pending requests
		for (const pendingName of pendingNames) {
			const maybeTag = resultsMap.get(pendingName);
			const resolvers = resolversMap.get(pendingName);

			if (!resolvers) continue;

			for (const resolveFn of resolvers) resolveFn(maybeTag);
		}
	}
}
