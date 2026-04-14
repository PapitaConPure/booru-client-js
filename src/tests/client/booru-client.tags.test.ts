import './booru-client.test';
import { describe, expect, it } from 'bun:test';
import Gelbooru from '../../adapters/gelbooru';
import { BooruClient } from '../../services/booru-client';

const credentials = {
	apiKey: 'test',
	userId: '123',
};

describe('BooruClient - tag fetching', () => {
	it('fetches tags from API when not cached', async () => {
		const client = new BooruClient(new Gelbooru(), credentials);

		const tags = await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(tags.length).toBeGreaterThan(0);
		expect(tags[0]?.name).toBe('kishin_sagume');
	});

	it('caches tags between calls', async () => {
		const client = new BooruClient(new Gelbooru(), credentials);

		await client.fetchTagsByNames({ names: ['kishin_sagume'] });
		const second = await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(second.length).toBe(1);
	});
});
