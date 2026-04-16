import { describe, expect, it } from 'bun:test';
import { Gelbooru } from '../../src/adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../src/adapters/gelbooru/dto';
import { BooruClient } from '../../src/services/booru-client';
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
