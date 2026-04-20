import { describe, expect, it } from 'bun:test';
import { Konachan } from '@papitaconpure/booru-client';
import type { KonachanPostsResponseDto } from '../../src/adapters/konachan/dto';
import type { FetchFn } from '../../src/utils/endpoint';
import { toUnix } from '../../src/utils/misc';

describe('Konachan Adapter', () => {
	it('search returns mapped posts', async () => {
		const fakeFetch = async () => ({
			success: true,
			response: new Response(),
			data: [
				{
					id: 1,
					tags: 'a b',
					source: '',
					score: 1,
					rating: 's',
					created_at: +new Date('2026-01-01T00:00:00Z'),
					creator_id: 1,
					width: 10,
					height: 20,
					file_url: 'http://nowhere.test/file.png',
					preview_url: 'http://nowhere.test/preview.png',
					actual_preview_width: 5,
					actual_preview_height: 10,
					author: '',
					change: toUnix(new Date()),
					file_size: 25,
					frames: [],
					frames_pending: [],
					frames_pending_string: '',
					frames_string: '',
					has_children: false,
					is_held: false,
					is_shown_in_index: true,
					jpeg_file_size: 12,
					jpeg_height: 10,
					jpeg_width: 20,
					jpeg_url: 'http://nowhere.test/file.jpg',
					md5: 'wagsdfhdfgghsdh',
					parent_id: null,
					preview_width: 10,
					preview_height: 5,
					sample_file_size: 9,
					sample_width: 1,
					sample_height: 2,
					sample_url: 'http://nowhere.test/sample.webp',
					status: 'active',
				},
			] as KonachanPostsResponseDto,
		});

		const client = new Konachan({ fetchFn: fakeFetch as FetchFn });

		const posts = await client.search('test', { limit: 1 });

		expect(posts.length).toBe(1);
		expect(posts[0]?.id).toBe('1');
	});
});
