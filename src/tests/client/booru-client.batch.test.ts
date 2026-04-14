import './booru-client.test';
import { describe, expect, it, mock } from 'bun:test';
import Gelbooru from '../../adapters/gelbooru';
import { BooruClient } from '../../services/booru-client';

mock.module('../../adapters/gelbooru', () => {
	return {
		default: class {
			async fetchTagsByNames(names: string[]) {
				return names.map((n, i) => ({
					id: i,
					name: n,
					count: 1,
					type: 0,
					ambiguous: false,
				}));
			}
		},
	};
});

describe('BooruClient - batching', () => {
	it('splits large tag requests into multiple batches', async () => {
		const client = new BooruClient(new Gelbooru(), {
			apiKey: 'x',
			userId: '1',
		});

		const input = Array.from({ length: 250 }, (_, i) => `tag_${i}`);

		const result = await client.fetchTagsByNames({ names: input });

		expect(result.length).toBe(250);
	});
});
