import { describe, expect, it } from 'bun:test';
import { type Booru, booruSpec } from '../../src/adapters/booru';
import { Post } from '../../src/domain/post';
import { BooruClient } from '../../src/services/booru-client';
import type { AnyBooru, BooruSearchOptions, DefineBooruSpec } from '../../src/types/booru';

describe('BooruClient', () => {
	it('delegates search to adapter and returns domain posts', async () => {
		const fakePost = Post.mock({
			id: '1',
		});

		type FakeBooruSpec = DefineBooruSpec<{
			self: AnyBooru;
			name: 'fake';
			credentials: object;
			searchOptions: BooruSearchOptions;
			postExtra: object;
		}>;

		const fakeAdapter: Booru<FakeBooruSpec> = {
			name: 'fake' as const,
			search: async () => [fakePost],
			fetchPostById: async () => fakePost,
			fetchPostByUrl: async () => fakePost,
			fetchTagsByNames: async () => [],
			validateCredentials: () => {},
			[booruSpec]: {} as FakeBooruSpec,
		};

		const client = new BooruClient(fakeAdapter, {});

		const result = await client.search('test', { limit: 1 });

		expect(result).toHaveLength(1);
		expect(result[0]).toBeInstanceOf(Post);
		expect(result[0]?.id).toBe('1');
	});
});
