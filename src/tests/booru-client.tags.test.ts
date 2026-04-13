import './booru-client.test';
import { describe, expect, it } from 'bun:test';
import { BooruClient } from '../services/booru';

const credentials = {
	apiKey: 'test',
	userId: '123',
};

describe('BooruClient - tag fetching', () => {
	it('fetches tags from API when not cached', async () => {
		const client = new BooruClient(credentials);

		const tags = await client.fetchTagsByNames('reimu');

		expect(tags.length).toBeGreaterThan(0);
		expect(tags[0]?.name).toBe('reimu');
	});

	it('caches tags between calls', async () => {
		const client = new BooruClient(credentials);

		await client.fetchTagsByNames('reimu');
		const second = await client.fetchTagsByNames('reimu');

		expect(second.length).toBe(1);
	});
});
