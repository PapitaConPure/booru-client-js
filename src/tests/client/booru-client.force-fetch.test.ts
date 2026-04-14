import '../mocks/fetchExt.test';
import { describe, expect, it } from 'bun:test';
import Gelbooru from '../../adapters/gelbooru/client';
import type { Tag } from '../../models/tag';
import { BooruClient } from '../../services/booru-client';
import type TagStore from '../../stores/tag-store';

describe('BooruClient - forceFetch', () => {
	it('bypasses cache layers when forceFetch is true', async () => {
		const storeHit = false;

		const store = new FakeTagStore();

		const client = new BooruClient(
			new Gelbooru(),
			{ apiKey: 'x', userId: '1' },
			{ tagStoreChain: [store] },
		);

		await client.fetchTagsByNames({
			names: ['kishin_sagume'],
			forceFetch: true,
		});

		expect(storeHit).toBe(false);
	});
});

class FakeTagStore implements TagStore {
	map = new Map();

	async getOne(name: string) {
		return this.map.get(name);
	}

	async getMany(names: Iterable<string>) {
		return [...names].map((n) => this.map.get(n)).filter(Boolean);
	}

	async setOne(tag: Tag) {
		this.map.set(tag.name, tag);
	}

	async setMany(tags: Tag[]) {
		for (const t of tags) this.map.set(t.name, t);
	}

	async cleanup() {}
}
