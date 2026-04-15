import { describe, expect, it } from 'bun:test';
import type { Booru } from '../../adapters/booru';
import { Post } from '../../domain/post';
import { BooruClient } from '../../services/booru-client';
import type { BooruSearchOptions } from '../../types/booru';

describe('BooruClient', () => {
	it('delegates search to adapter and returns domain posts', async () => {
		const fakePost = Post.mock({
			id: 1,
		});

		const fakeAdapter: Booru<'fake', unknown, BooruSearchOptions> = {
			name: 'fake' as const,
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
