import type { Tag } from '../models/tag';
import type TagStore from './tag-store';

export class MemoryTagStore implements TagStore {
	static readonly TAGS_CACHE_LIFETIME: number = 4 * 60 * 60e3;

	#cache: Map<string, Tag>;

	constructor() {
		this.#cache = new Map<string, Tag>();
	}

	async getMany(names: Iterable<string>): Promise<Tag[]> {
		this.#cleanExpiredCacheFor(names);
		return [...names].map((n) => this.#cache.get(n)).filter((t) => t != null);
	}

	async getOne(name: string): Promise<Tag | null | undefined> {
		this.#cleanAllExpiredCache();
		return this.#cache.get(name);
	}

	async setMany(tags: Iterable<Tag>): Promise<void> {
		for (const tag of tags) {
			this.#cache.set(tag.name, tag);
		}
	}

	async setOne(tag: Tag): Promise<void> {
		this.#cache.set(tag.name, tag);
	}

	/**
	 * @description
	 * Libera memoria de Tags guardadas en caché que no se han refrescado en mucho tiempo.
	 */
	#cleanAllExpiredCache() {
		const now = Date.now();

		for (const [key, tag] of this.#cache.entries())
			if (now - +tag.fetchTimestamp > MemoryTagStore.TAGS_CACHE_LIFETIME)
				this.#cache.delete(key);
	}

	/**
	 * @description
	 * Libera memoria de Tags guardadas en caché que no se han refrescado en mucho tiempo.
	 */
	#cleanExpiredCacheFor(names: Iterable<string>) {
		const now = Date.now();

		for (const name of names) {
			const tag = this.#cache.get(name);
			if (tag && now - +tag.fetchTimestamp > MemoryTagStore.TAGS_CACHE_LIFETIME)
				this.#cache.delete(name);
		}
	}
}
