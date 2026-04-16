import { describe, expect, it } from 'bun:test';
import { Danbooru } from '../../src/adapters/danbooru/client';
import type { FetchFn } from '../../src/utils/endpoint';

describe('Danbooru Adapter', () => {
	it('search returns mapped posts', async () => {
		const fakeFetch = async () => ({
			success: true,
			response: new Response(),
			data: [
				{
					id: 1,
					tag_string: 'a b',
					source: '',
					score: 1,
					rating: 'g',
					created_at: '2026-01-01T00:00:00Z',
					uploader_id: 1,
					image_width: 10,
					image_height: 20,
					file_url: 'http://nowhere.test/file.jpg',
					preview_file_url: 'http://nowhere.test/preview.jpg',
					has_large: false,
					large_file_url: null,
				},
			],
		});

		const client = new Danbooru({ fetchFn: fakeFetch as FetchFn });

		const posts = await client.search(
			'test',
			{ limit: 1, random: false },
			{
				apiKey: 'x',
				login: 'y',
			},
		);

		expect(posts.length).toBe(1);
		expect(posts[0]?.id).toBe(1);
	});
});
