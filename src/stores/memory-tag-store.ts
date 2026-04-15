import type { Tag } from '../domain/tag';
import type { TagStore } from './tag-store';

export class MemoryTagStore implements TagStore {
	#ttl: number;
	#cache: Map<string, Tag>;

	constructor(
		options: {
			/**Interval of time in which cached {@link Tag}s will expire, in milliseconds. Defaults to 4 minutes.*/
			ttl?: number;
		} = {},
	) {
		const { ttl = 4 * 60 * 60e3 } = options;

		this.#cache = new Map<string, Tag>();
		this.#ttl = ttl;
	}

	async getMany(names: Iterable<string>): Promise<Tag[]> {
		const result: Tag[] = [];

		for (const name of names) {
			this.#cleanIfExpired(name);
			const tag = this.#cache.get(name);
			if (tag) result.push(tag);
		}

		return result;
	}

	async getOne(name: string): Promise<Tag | undefined> {
		this.#cleanIfExpired(name);
		return this.#cache.get(name);
	}

	async setMany(tags: Iterable<Tag>): Promise<void> {
		for (const tag of tags) this.#cache.set(tag.name, tag);
	}

	async setOne(tag: Tag): Promise<void> {
		this.#cache.set(tag.name, tag);
	}

	async cleanup(): Promise<void> {
		const now = Date.now();

		for (const [key, tag] of this.#cache.entries())
			if (now - +tag.fetchTimestamp > this.#ttl) this.#cache.delete(key);
	}

	/**Interval of time in which cached {@link Tag}s will expire, in milliseconds.*/
	get ttl() {
		return this.#ttl;
	}

	/**Cleans up a stored {@link Tag} if it hasn't been cached in a while.*/
	#cleanIfExpired(name: string) {
		const now = Date.now();
		const tag = this.#cache.get(name);

		if (tag && now - +tag.fetchTimestamp > this.#ttl) this.#cache.delete(name);
	}
}
