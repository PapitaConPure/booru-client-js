import { describe, it } from 'bun:test';
import type { Gelbooru } from '../../src/adapters/gelbooru/client';
import { BooruClient } from '../../src/services/booru-client';

describe('Gelbooru - batching', () => {
	it('splits large tag requests into multiple batches', async () => {
		const gelbooru = {
			async fetchTagsByNames(names: string[]) {
				return names.map((n, i) => ({
					id: i,
					name: n,
					count: 1,
					type: 0,
					ambiguous: false,
				}));
			},
			validateCredentials: () => undefined,
		} as unknown as Gelbooru;

		const client = new BooruClient(gelbooru, {
			apiKey: 'x',
			userId: '1',
		});

		const input = Array.from({ length: 250 }, (_, i) => `tag_${i}`);

		await client.fetchTagsByNames({ names: input });
	});
});
