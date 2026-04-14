import { describe, expect, it } from 'bun:test';
import type { Booru } from '../../adapters/booru';
import { Post } from '../../domain/post';
import { PostRatings } from '../../domain/post-rating';
import { BooruClient } from '../../services/booru-client';
import type { BooruSearchOptions } from '../../types/booru';

describe('BooruClient', () => {
	it('delegates search to adapter and returns domain posts', async () => {
		const fakePost = new Post({
			id: 1,
			title: '',
			tags: ['a'],
			score: 1,
			rating: PostRatings.General,
			createdAt: new Date(),
			creatorId: 1,
			fileUrl: 'file.jpg',
			size: [1, 1],
		});

		const fakeAdapter: Booru<unknown, BooruSearchOptions> = {
			search: async () => [fakePost],
			fetchPostById: async () => fakePost,
			fetchPostByUrl: async () => fakePost,
			fetchTagsByNames: async () => [],
			validateCredentials: () => {},
		};

		const client = new BooruClient(fakeAdapter, {});

		const result = await client.search('test', { limit: 1, random: false });

		expect(result).toHaveLength(1);
		expect(result[0]).toBeInstanceOf(Post);
		expect(result[0]?.id).toBe(1);
	});
});
