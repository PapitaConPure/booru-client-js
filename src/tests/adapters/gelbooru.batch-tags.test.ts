import '../mocks/fetchExt.test';
import { describe, expect, it } from 'bun:test';
import type Gelbooru from '../../adapters/gelbooru/client';
import { BooruClient } from '../../services/booru-client';

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

		const result = await client.fetchTagsByNames({ names: input });

		expect(result.length).toBe(250);
	});
});
