import { describe, expect, it } from 'bun:test';
import { Gelbooru } from '../../src/adapters/gelbooru/client';
import type { GelbooruPostsResponseDto } from '../../src/adapters/gelbooru/dto';
import type { FetchSuccessResult } from '../../src/utils/fetchExt';

describe('Gelbooru Adapter', () => {
	it('search returns mapped posts', async () => {
		const fakeFetch = async (): Promise<FetchSuccessResult<GelbooruPostsResponseDto>> => ({
			success: true,
			response: new Response(),
			data: {
				post: [
					{
						id: 1,
						title: '',
						tags: 'a b',
						source: '',
						score: 1,
						rating: 'general',
						created_at: '2026-01-01',
						creator_id: 1,
						file_url: 'http://nowhere.test/file.jpg',
						width: 10,
						height: 20,
					},
				],
			},
		});

		const client = new Gelbooru({ fetchFn: fakeFetch });

		const posts = await client.search(
			'test',
			{ limit: 1 },
			{
				apiKey: 'x',
				userId: 'y',
			},
		);

		expect(posts.length).toBe(1);
	});
});
