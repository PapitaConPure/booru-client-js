import { describe, expect, it } from 'bun:test';
import Gelbooru from '../../adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../adapters/gelbooru/dto';
import type { Tag } from '../../domain/tag';
import { BooruClient } from '../../services/booru-client';
import type TagStore from '../../stores/tag-store';
import type { FetchSuccessResult } from '../../utils/fetchExt';

describe('BooruClient - forceFetch', () => {
	it('bypasses cache layers when forceFetch is true', async () => {
		const storeHit = false;

		const store = new FakeTagStore();

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
