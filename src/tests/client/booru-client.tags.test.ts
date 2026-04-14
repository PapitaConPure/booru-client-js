import { beforeEach, describe, expect, it } from 'bun:test';
import Gelbooru from '../../adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../adapters/gelbooru/dto';
import { BooruClient } from '../../services/booru-client';
import type { FetchSuccessResult } from '../../utils/fetchExt';

const credentials = {
	apiKey: 'test',
	userId: '123',
};

let booru: Gelbooru;

describe('BooruClient - tag fetching', () => {
	beforeEach(() => {
		booru = new Gelbooru({
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
		});
	});

	it('fetches tags from API when not cached', async () => {
		const client = new BooruClient(booru, credentials);

		const tags = await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(tags.length).toBeGreaterThan(0);
		expect(tags[0]?.name).toBe('kishin_sagume');
	});

	it('caches tags between calls', async () => {
		const client = new BooruClient(booru, credentials);

		await client.fetchTagsByNames({ names: ['kishin_sagume'] });
		const second = await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(second.length).toBe(1);
	});
});
