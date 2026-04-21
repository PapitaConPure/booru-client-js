import { describe, expect, it } from 'bun:test';
import { booruSpec } from '@papitaconpure/booru-client';
import { Gelbooru } from '../../src/adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../src/adapters/gelbooru/dto';
import { Tag } from '../../src/domain/tag';
import { BooruClient } from '../../src/services/booru-client';
import { MemoryTagStore } from '../../src/stores/memory-tag-store';
import type { AnyBooru } from '../../src/types/booru';
import type { FetchSuccessResult } from '../../src/utils/fetchExt';

describe('BooruClient - cleanup', () => {
	it('auto cleanup triggers based on interval', async () => {
		let cleaned = false;

		const store = {
			async getOne() {
				return undefined;
			},
			async getMany() {
				return [];
			},
			async setOne() {},
			async setMany() {},
			async cleanup() {
				cleaned = true;
			},
		};

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
					storeChain: [store],
					cleanOnStartup: true,
				},
			},
		);

		await client.fetchTagsByNames({ names: ['test'] });

		expect(cleaned).toBe(true);
	});
});

function createMockBooru() {
	let calls = 0;

	const booru: AnyBooru = {
		get name() {
			return 'mock';
		},

		async search() {
			return [];
		},

		async fetchPostById() {
			return undefined;
		},

		async fetchPostByUrl() {
			return undefined;
		},

		async fetchTagsByNames(names) {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		},

		validateCredentials() {
			return;
		},

		[booruSpec]: {},
	};

	return {
		booru,
		getCalls: () => calls,
	};
}

describe('BooruClient - cleanup behavior', () => {
	it('auto cleanup does not break batching', async () => {
		const mock = createMockBooru();
		const store = new MemoryTagStore();

		const client = new BooruClient(mock.booru, {
			credentials: { apiKey: 'x', userId: '1' },
			tags: {
				storeChain: [store],
				baseBatchingGraceWindowMs: 0,
				maxBatchingGraceWindowMs: 5,
			},
		});

		const p1 = client.fetchTagsByNames({ names: ['a'] });
		const p2 = client.fetchTagsByNames({ names: ['b'] });

		await Promise.all([p1, p2]);

		expect(mock.getCalls()).toBe(1);
	});

	it('after cleanup tags are re-fetched correctly', async () => {
		const mock = createMockBooru();
		const store = new MemoryTagStore({ ttl: 10 });

		const client = new BooruClient(mock.booru, {
			credentials: { apiKey: 'x', userId: '1' },
			tags: {
				storeChain: [store],
			},
		});

		await client.fetchTagsByNames({ names: ['a'] });

		await new Promise((r) => setTimeout(r, store.ttl + 10));

		await store.cleanup();

		await client.fetchTagsByNames({ names: ['a'] });

		expect(mock.getCalls()).toBe(2);
	});
});
