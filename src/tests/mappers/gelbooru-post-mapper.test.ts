import { describe, expect, it } from 'bun:test';
import type { GelbooruPostDto } from '../../adapters/gelbooru/dto';
import { GelbooruPostMapper } from '../../mappers/post-mapper/gelbooru-post-mapper';

describe('GelbooruPostMapper', () => {
	it('maps dto to Post correctly', () => {
		const mapper = new GelbooruPostMapper();

		const dto = {
			id: 1,
			tags: 'a b',
			source: 'https://example.com',
			score: 5,
			rating: 'general',
			created_at: '2026-01-01',
			creator_id: 10,
			file_url: 'file.jpg',
			width: 100,
			height: 200,
		} as unknown as GelbooruPostDto;

		const post = mapper.fromDto(dto);

		expect(post.tags).toEqual(['a', 'b']);
		expect(post.size).toEqual([100, 200]);
	});
});
