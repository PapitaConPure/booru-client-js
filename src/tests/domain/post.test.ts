import { describe, expect, it } from 'bun:test';
import { Post } from '../../domain/post';

describe('Post', () => {
	it('constructs correctly', () => {
		const post = Post.mock({
			id: 1,
			tags: ['a', 'b'],
			size: [100, 200],
		});

		expect(post.id).toBe(1);
		expect(post.tags).toEqual(['a', 'b']);
		expect(post.size).toEqual([100, 200]);
	});

	it('is immutable', () => {
		const post = Post.mock();

		// biome-ignore lint/suspicious/noExplicitAny: Test throw
		expect(() => ((post as any).id = 2)).toThrow();
	});

	it('findUrlSources works', () => {
		const post = Post.mock();

		const sources = post.findUrlSources();
		expect(sources?.length).toBeGreaterThanOrEqual(1);
	});

	it('findFirstUrlSource works', () => {
		const post = Post.mock();

		expect(post.findFirstUrlSource()).toBeTruthy();
	});

	it('findLastUrlSource works', () => {
		const post = Post.mock({
			sources: ['https://a.com', 'https://b.com'],
		});

		expect(post.findLastUrlSource()).toContain('b.com');
	});
});
