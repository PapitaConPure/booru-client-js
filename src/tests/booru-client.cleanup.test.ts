import './booru-client.test';
import { expect, it } from 'bun:test';
import { BooruClient } from '../services/booru';

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
		{ apiKey: 'x', userId: '1' },
		{
			tagStoreChain: [store],
			cleanupIntervalMs: 0, // force trigger
		},
	);

	await client.fetchTagsByNames('test');

	expect(cleaned).toBe(true);
});
