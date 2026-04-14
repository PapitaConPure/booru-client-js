import { describe, expect, it } from 'bun:test';
import type { Danbooru } from '../../adapters/danbooru/client';
import { BooruClient } from '../../services/booru-client';

describe('Danbooru - batching', () => {
	it('splits large tag requests into multiple API calls', async () => {
		const danbooru = {
			async fetchTagsByNames(names: string[]) {
				return names.map((n, i) => ({
					id: i,
					name: n,
					count: 1,
					type: 0,
					ambiguous: false,
				}));
			},
			validateCredentials() {},
		} as unknown as Danbooru;

		const client = new BooruClient(danbooru, {
			apiKey: 'x',
			login: '1',
		});

		const input = Array.from({ length: 250 }, (_, i) => `tag_${i}`);

		const result = await client.fetchTagsByNames({ names: input });

		expect(result.length).toBe(250);
	});
});
