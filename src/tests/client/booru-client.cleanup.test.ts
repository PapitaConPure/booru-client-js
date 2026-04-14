import { describe, expect, it } from 'bun:test';
import { Gelbooru } from '../../adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../adapters/gelbooru/dto';
import { BooruClient } from '../../services/booru-client';
import type { FetchSuccessResult } from '../../utils/fetchExt';

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
			{ apiKey: 'x', userId: '1' },
			{
				tagStoreChain: [store],
				cleanupIntervalMs: 0, // force trigger
			},
		);

		await client.fetchTagsByNames({ names: ['test'] });

		expect(cleaned).toBe(true);
	});
});
