import { describe, expect, it } from 'bun:test';
import type { DanbooruPostDto } from '../../adapters/danbooru/dto';
import { DanbooruPostMapper } from '../../mappers/post-mapper/danbooru-post-mapper';

describe('DanbooruPostMapper', () => {
	it('maps dto to Post correctly', () => {
		const mapper = new DanbooruPostMapper();

		const dto = {
			id: 1,
			tag_string: 'a b',
			source: 'https://example.com',
			score: 5,
			rating: 's',
			created_at: '2026-01-01T00:00:00Z',
			uploader_id: 10,
			image_width: 100,
			image_height: 200,
			file_url: 'file.jpg',
			preview_file_url: 'preview.jpg',
			has_large: false,
			large_file_url: null,
		} as unknown as DanbooruPostDto;

		const post = mapper.fromDto(dto);

		expect(post.id).toBe(1);
		expect(post.tags).toEqual(['a', 'b']);
		expect(post.rating).toBeDefined();
		expect(post.size).toEqual([100, 200]);
	});
});
