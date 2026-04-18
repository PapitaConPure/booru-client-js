import type { Tag } from '../domain/tag';
import type { TagResolver } from './tag-resolver';

type MaybeTag = Tag | undefined;

export class TagCoordinator {
	readonly #resolver: TagResolver;
	readonly #inFlight: Map<string, Promise<MaybeTag>>;

	constructor(resolver: TagResolver) {
		this.#resolver = resolver;
		this.#inFlight = new Map();
	}

	async getMany(names: string[]): Promise<Tag[]> {
		const promises = names.map((name) => this.getOne(name));
		const results = await Promise.all(promises);

		return results.filter((t) => t != null);
	}

	async getOne(name: string): Promise<MaybeTag> {
		const existing = this.#inFlight.get(name);
		if (existing) return existing;

		const promise = this.#resolveOne(name);
		this.#inFlight.set(name, promise);

		promise.finally(() => {
			this.#inFlight.delete(name);
		});

		return promise;
	}

	async #resolveOne(name: string): Promise<MaybeTag> {
		const results = await this.#resolver.resolveMany([name]);
		return results[0];
	}
}
