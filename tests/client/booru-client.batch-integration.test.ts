import { beforeEach, describe, expect, it } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { BooruClient } from '../../src/services/booru-client';
import type { AnyBooru } from '../../src/types/booru';

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
	};

	return {
		booru,
		getCalls: () => calls,
	};
}

describe('BooruClient - batching integration', () => {
	let mock: ReturnType<typeof createMockBooru>;
	let client: BooruClient;

	beforeEach(() => {
		mock = createMockBooru();

		client = new BooruClient(mock.booru, {
			credentials: { apiKey: 'x', userId: '1' },
			tags: {
				baseBatchingGraceWindowMs: 0,
				maxBatchingGraceWindowMs: 5,
			},
		});
	});

	it('batching across public API: multiple fetchTagsByNames calls in same tick coalesce', async () => {
		const p1 = client.fetchTagsByNames({ names: ['a'] });
		const p2 = client.fetchTagsByNames({ names: ['b'] });

		await Promise.all([p1, p2]);

		expect(mock.getCalls()).toBe(1);
	});

	it('batching across public API: concurrent calls are deduplicated', async () => {
		const p1 = client.fetchTagsByNames({ names: ['a'] });
		const p2 = client.fetchTagsByNames({ names: ['a'] });

		await Promise.all([p1, p2]);

		expect(mock.getCalls()).toBe(1);
	});

	it('first call hits API, second call uses cache', async () => {
		await client.fetchTagsByNames({ names: ['a'] });
		await client.fetchTagsByNames({ names: ['a'] });

		expect(mock.getCalls()).toBe(1);
	});

	it('result correctness across batch', async () => {
		const p1 = client.fetchTagsByNames({ names: ['a', 'b'] });
		const p2 = client.fetchTagsByNames({ names: ['c'] });

		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1.map((t) => t.name)).toEqual(['a', 'b']);
		expect(r2.map((t) => t.name)).toEqual(['c']);
		expect(mock.getCalls()).toBe(1);
	});
});
