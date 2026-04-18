import type { Tag } from '../domain/tag';
import type { TagResolver } from './tag-resolver';

type MaybeTag = Tag | undefined;

export class TagCoordinator {
	readonly #resolver: TagResolver;

	readonly #ongoingTagRequests: Map<string, Promise<MaybeTag>>;

	#pendingNames: Set<string>;
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
			resultingTags = await this.#resolver.resolveMany([...pendingNames]);
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
