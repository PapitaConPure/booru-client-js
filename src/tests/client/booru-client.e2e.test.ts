import { describe, expect, it } from 'bun:test';
import Danbooru from '../../adapters/danbooru/client';
import Gelbooru from '../../adapters/gelbooru/client';
import { BooruClient } from '../../services/booru-client';

const skipE2E = !new Set(['true', 't', '1', 'on']).has(
	process.env.TEST_PERFORM_E2E?.toLowerCase() as string,
);

describe.skipIf(skipE2E)('E2E: search posts', () => {
	it('returns posts for a simple tag', async () => {
		const client = new BooruClient(new Danbooru(), {
			apiKey: process.env.TEST_DANBOORU_APIKEY as string,
			login: process.env.TEST_DANBOORU_LOGIN as string,
		});

		const posts = await client.search('touhou', {
			limit: 3,
		});

		expect(posts.length).toBeGreaterThan(0);

		for (const post of posts) {
			expect(post.id).toBeTypeOf('number');
			expect(post.tags).toBeInstanceOf(Array);
			expect(post.fileUrl).toBeTypeOf('string');
		}
	});

	it('returns empty array for impossible tag', async () => {
		const client = new BooruClient(new Gelbooru(), {
			apiKey: process.env.TEST_GELBOORU_APIKEY as string,
			userId: process.env.TEST_GELBOORU_USERID as string,
		});

		const posts = await client.search('asdasd_nonexistent_tag_987654321', {
			limit: 5,
		});

		expect(posts).toEqual([]);
	});
});

describe.skipIf(skipE2E)('E2E: get post', () => {
	it('fetches a known post by ID', async () => {
		const client = new BooruClient(new Gelbooru(), {
			apiKey: process.env.TEST_GELBOORU_APIKEY as string,
			userId: process.env.TEST_GELBOORU_USERID as string,
		});

		const post = await client.fetchPostById('13485950');

		expect(post?.id).toBe(13485950);
		expect(post?.fileUrl).toBeTruthy();
		expect(post?.sources).toContain('https://x.com/kadokawasneaker/status/2018995447658951079');
	});
});

describe.skipIf(skipE2E)('E2E: adapter normalization', () => {
	it('returns consistent shape across adapters', async () => {
		const danbooru = new BooruClient(new Danbooru(), {
			apiKey: process.env.TEST_DANBOORU_APIKEY as string,
			login: process.env.TEST_DANBOORU_LOGIN as string,
		});

		const gelbooru = new BooruClient(new Gelbooru(), {
			apiKey: process.env.TEST_GELBOORU_APIKEY as string,
			userId: process.env.TEST_GELBOORU_USERID as string,
		});

		const [dPost] = await danbooru.search('touhou', { limit: 1 });
		const [gPost] = await gelbooru.search('touhou', { limit: 1 });

		expect(dPost).toBeDefined();
		expect(gPost).toBeDefined();

		expect(dPost?.id).toBeNumber();
		expect(gPost?.id).toBeNumber();

		expect(dPost?.tags).toBeArray();
		expect(gPost?.tags).toBeArray();

		expect(dPost?.fileUrl).toBeString();
		expect(gPost?.fileUrl).toBeString();

		expect(dPost?.createdAt).toBeInstanceOf(Date);
		expect(gPost?.createdAt).toBeInstanceOf(Date);
	});
});
