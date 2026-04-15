import { describe, expect, it } from 'bun:test';
import { Gelbooru } from '../../adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../adapters/gelbooru/dto';
import { Tag } from '../../domain/tag';
import { BooruClient } from '../../services/booru-client';
import { MemoryTagStore } from '../../stores/memory-tag-store';
import type { TagStore } from '../../stores/tag-store';
import type { FetchSuccessResult } from '../../utils/fetchExt';

describe('BooruClient - store chain', () => {
	it('falls back to deeper stores', async () => {
		const persistent = new FakeTagStore();
		await persistent.setOne(
			new Tag({
				id: 1,
				name: 'cached',
				type: 0,
				count: 1,
				fetchTimestamp: new Date(Date.now()),
			}),
		);

		const client = new BooruClient(new Gelbooru(), {
			credentials: { apiKey: 'x', userId: '1' },
			tags: {
				storeChain: [new MemoryTagStore(), persistent],
			},
		});

		const tags = await client.fetchTagsByNames({ names: ['cached'] });

		expect(tags.length).toBe(1);
		expect(tags[0]?.name).toBe('cached');
	});

	it('writes fetched tags to all stores', async () => {
		const store1 = new FakeTagStore();
		const store2 = new FakeTagStore();

		const client = new BooruClient(
			new Gelbooru({
				fetchFn: async (): Promise<FetchSuccessResult<GelbooruTagsResponseDto>> => ({
					success: true,
					response: new Response(),
					data: {
						tag: [
							{ id: 1, name: 'kishin_sagume', count: 1, type: 0, ambiguous: 1 },
							{ id: 2, name: 'junko_(touhou)', count: 1, type: 0, ambiguous: 1 },
						],
					},
				}),
			}),
			{
				credentials: { apiKey: 'x', userId: '1' },
				tags: {
					storeChain: [store1, store2],
				},
			},
		);

		await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(store1.map.size).toBeGreaterThan(0);
		expect(store2.map.size).toBeGreaterThan(0);
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
