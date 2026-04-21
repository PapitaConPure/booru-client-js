import { beforeEach, describe, expect, it } from 'bun:test';
import { booruSpec } from '@papitaconpure/booru-client';
import { Gelbooru } from '../../src/adapters/gelbooru/client';
import type { GelbooruTagsResponseDto } from '../../src/adapters/gelbooru/dto';
import { Post } from '../../src/domain/post';
import { Tag } from '../../src/domain/tag';
import { BooruClient } from '../../src/services/booru-client';
import type { AnyBooru } from '../../src/types/booru';
import type { FetchSuccessResult } from '../../src/utils/fetchExt';

const credentials = {
	apiKey: 'test',
	userId: '123',
};

let booru: Gelbooru;

describe('BooruClient - tag fetching', () => {
	beforeEach(() => {
		booru = new Gelbooru({
			fetchFn: async (): Promise<FetchSuccessResult<GelbooruTagsResponseDto>> => ({
				success: true,
				response: new Response(),
				data: {
					tag: [
						{ id: 1, name: 'kishin_sagume', count: 1, type: 0, ambiguous: 1 },
						{ id: 2, name: 'junko_(touhou)', count: 1, type: 0, ambiguous: 1 },
					],
				},
			}),
		});
	});

	it('fetches tags from API when not cached', async () => {
		const client = new BooruClient(booru, credentials);

		const tags = await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(tags.length).toBeGreaterThan(0);
		expect(tags[0]?.name).toBe('kishin_sagume');
	});

	it('caches tags between calls', async () => {
		const client = new BooruClient(booru, credentials);

		await client.fetchTagsByNames({ names: ['kishin_sagume'] });
		const second = await client.fetchTagsByNames({ names: ['kishin_sagume'] });

		expect(second.length).toBe(1);
	});
});

function createMockBooru() {
	let calls = 0;

	const booru: AnyBooru = {
		get name() {
			return 'mock';
		},

		async search() {
			return [];
		},

		async fetchPostById() {
			return undefined;
		},

		async fetchPostByUrl() {
			return undefined;
		},

		async fetchTagsByNames(names) {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		},

		validateCredentials() {
			return;
		},

		[booruSpec]: {},
	};

	return {
		booru,
		getCalls: () => calls,
	};
}

describe('BooruClient - fetchPostTags integration', () => {
	it('fetchPostTags goes through full pipeline correctly', async () => {
		const mock = createMockBooru();

		const client = new BooruClient(mock.booru, {
			credentials: { apiKey: 'x', userId: '1' },
		});

		const post = Post.mock({
			tags: ['a', 'b'],
		});

		const tags = await client.fetchPostTags(post);

		expect(tags.map((t) => t.name)).toEqual(['a', 'b']);
		expect(mock.getCalls()).toBe(1);
	});

	it('fetchPostTags + fetchTagsByNames share batching behavior', async () => {
		const mock = createMockBooru();

		const client = new BooruClient(mock.booru, {
			credentials: { apiKey: 'x', userId: '1' },
			tags: {
				baseBatchingGraceWindowMs: 0,
				maxBatchingGraceWindowMs: 5,
			},
		});

		const post = Post.mock({ tags: ['a'] });

		const p1 = client.fetchPostTags(post);
		const p2 = client.fetchTagsByNames({ names: ['b'] });

		await Promise.all([p1, p2]);

		expect(mock.getCalls()).toBe(1);
	});
});
