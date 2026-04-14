import { describe, expect, it } from 'bun:test';
import { Post } from '../../domain/post';
import { PostRatings } from '../../domain/post-rating';

describe('Post', () => {
	it('constructs correctly', () => {
		const post = new Post({
			id: 1,
			title: 'test',
			tags: ['a', 'b'],
			sources: ['https://example.com'],
			score: 10,
			rating: PostRatings.General,
			createdAt: new Date(),
			creatorId: 123,
			fileUrl: 'file.jpg',
			size: [100, 200],
		});

		expect(post.id).toBe(1);
		expect(post.tags).toEqual(['a', 'b']);
		expect(post.size).toEqual([100, 200]);
	});

	it('is immutable', () => {
		const post = new Post({
			id: 1,
			title: '',
			tags: [],
			score: 0,
			rating: PostRatings.Safe,
			createdAt: new Date(),
			creatorId: 0,
			fileUrl: '',
			size: [0, 0],
		});

		// biome-ignore lint/suspicious/noExplicitAny: Test throw
		expect(() => ((post as any).id = 2)).toThrow();
	});

	it('findUrlSources works', () => {
		const post = new Post({
			id: 1,
			title: '',
			tags: [],
			sources: ['https://x.com/test', 'not-a-url'],
			score: 0,
			rating: PostRatings.Safe,
			createdAt: new Date(),
			creatorId: 0,
			fileUrl: '',
			size: [0, 0],
		});

		const sources = post.findUrlSources();
		expect(sources?.length).toBeGreaterThanOrEqual(1);
	});

	it('findFirstUrlSource works', () => {
		const post = new Post({
			id: 1,
			title: '',
			tags: [],
			sources: ['invalid', 'https://example.com'],
			score: 0,
			rating: PostRatings.Safe,
			createdAt: new Date(),
			creatorId: 0,
			fileUrl: '',
			size: [0, 0],
		});

		expect(post.findFirstUrlSource()).toBeTruthy();
	});

	it('findLastUrlSource works', () => {
		const post = new Post({
			id: 1,
			title: '',
			tags: [],
			sources: ['https://a.com', 'https://b.com'],
			score: 0,
			rating: PostRatings.Safe,
			createdAt: new Date(),
			creatorId: 0,
			fileUrl: '',
			size: [0, 0],
		});

		expect(post.findLastUrlSource()).toContain('b.com');
	});
});
