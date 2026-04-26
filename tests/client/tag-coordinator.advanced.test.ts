import { describe, expect, test } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { TagCoordinator } from '../../src/services/tag-coordinator';
import type { TagResolver } from '../../src/services/tag-resolver';

function createResolver(fn: (names: Set<string>) => Promise<Tag[]>): TagResolver {
	return { resolveMany: fn } as unknown as TagResolver;
}

describe('TagCoordinator - advanced behavior', () => {
	test.concurrent('all callers for same tag receive same resolved value', async () => {
		const resolver = createResolver(async (names) =>
			[...names].map((n) => Tag.mock({ id: 1, name: n, count: 1, type: 0 })),
		);

		const coordinator = new TagCoordinator(resolver);

		const [a, b, c] = await Promise.all([
			coordinator.getOne('same'),
			coordinator.getOne('same'),
			coordinator.getOne('same'),
		]);

		expect(a).toBeDefined();
		expect(a?.name).toBe('same');
		expect(b?.name).toBe('same');
		expect(c?.name).toBe('same');
	});

	test.concurrent('some tags resolve while others return undefined', async () => {
		const resolver = createResolver(async (names) => {
			return [...names]
				.filter((n) => n !== 'missing')
				.map((n) => Tag.mock({ id: 1, name: n, count: 1, type: 0 }));
		});

		const coordinator = new TagCoordinator(resolver);

		const [a, b] = await Promise.all([coordinator.getOne('a'), coordinator.getOne('missing')]);

		expect(a?.name).toBe('a');
		expect(b).toBeUndefined();
	});

	test.concurrent('ensures correct mapping per name', async () => {
		const resolver = createResolver(async (names) => {
			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: i,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver);

		const results = await Promise.all([
			coordinator.getOne('a'),
			coordinator.getOne('b'),
			coordinator.getOne('c'),
		]);

		expect(results.map((r) => r?.name).sort()).toEqual(['a', 'b', 'c']);
	});

	test.concurrent('handles sudden 100+ requests', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver);

		const input = Array.from({ length: 120 }, (_, i) => coordinator.getOne(`tag_${i}`));

		await Promise.all(input);

		expect(calls).toBeGreaterThanOrEqual(1);
		expect(calls).toBeLessThanOrEqual(2);
	});

	test.concurrent('handles stairway of 100+ requests within grace window', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 10,
			maxBatchingGraceWindowMs: 10,
		});

		const promises: Promise<unknown>[] = [];

		for (let i = 0; i < 100; i++) {
			promises.push(coordinator.getOne(`tag_${i}`));
			await new Promise((r) => setTimeout(r, 1));
		}

		await Promise.all(promises);

		expect(calls).toBeLessThan(60);
		expect(calls).toBeGreaterThan(0);
	});

	test.concurrent('no promise hangs because of an error', async () => {
		expect(async () => {
			const resolver = createResolver(async () => {
				throw new Error('fail');
			});

			const coordinator = new TagCoordinator(resolver);

			const p1 = coordinator.getOne('a');
			const p2 = coordinator.getOne('b');

			expect(p1).rejects.toThrow();
			expect(p2).rejects.toThrow();
		});
	});

	test.concurrent('system recovers after error', async () => {
		let shouldFail = true;

		const resolver = createResolver(async (names) => {
			if (shouldFail) throw new Error('fail');

			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver);

		expect(coordinator.getOne('a')).rejects;

		shouldFail = false;

		const result = await coordinator.getOne('a');

		expect(result?.name).toBe('a');
	});

	test.concurrent('state integrity after flush', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver);

		await coordinator.getOne('a');
		coordinator.flushNow();

		//Check no state leak
		await coordinator.getOne('b');
		coordinator.flushNow();

		expect(calls).toBe(2);
	});

	test.concurrent('state integrity after rejection', async () => {
		let shouldFail = true;

		const resolver = createResolver(async (names) => {
			if (shouldFail) throw new Error('fail');

			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver);

		expect(coordinator.getOne('a')).rejects;

		shouldFail = false;

		const result = await coordinator.getOne('b');

		expect(result?.name).toBe('b');
	});

	test.concurrent('recovers from timeout error', async () => {
		const resolver = createResolver(async () => {
			return new Promise(() => {});
		});

		const coordinator = new TagCoordinator(resolver, { resolutionTimeoutMs: 1000 });

		const tagName = 'ibuki_suika';

		expect(coordinator.getOne(tagName)).rejects.toMatchObject(
			new Error(`Tag resolution timeout: ${tagName}`),
		);
	});

	test.concurrent('adaptive delay responds to batch sizes', async () => {
		const observedSizes: number[] = [];

		const resolver = createResolver(async (names) => {
			observedSizes.push(names.size);
			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 0,
			maxBatchingGraceWindowMs: 20,
		});

		await Promise.all([coordinator.getOne('a'), coordinator.getOne('b')]);

		await Promise.all(Array.from({ length: 40 }, (_, i) => coordinator.getOne(`tag_${i}`)));

		expect(observedSizes.length).toBe(2);
		expect(observedSizes[1]).toBeGreaterThan(observedSizes[0] as number);
	});

	test.concurrent('adaptive delay naturally grows batches', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 5,
			maxBatchingGraceWindowMs: 20,
		});

		const promises: Promise<unknown>[] = [];

		for (let i = 0; i < 50; i++) {
			promises.push(coordinator.getOne(`tag_${i}`));
			await new Promise((r) => setTimeout(r, 1));
		}

		await Promise.all(promises);

		expect(calls).toBeLessThan(30);
	});

	test.concurrent('Optimizes repeated tags properly', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((n, i) =>
				Tag.mock({
					id: i,
					name: n,
					count: 1,
					type: 0,
				}),
			);
		});

		const coordinator = new TagCoordinator(resolver);

		const results = await Promise.all([
			coordinator.getMany(['hakurei_reimu']),
			coordinator.getMany(['hakurei_reimu', 'kirisame_marisa']),
			coordinator.getMany(['hakurei_reimu', 'kirisame_marisa', 'alice_margatroid']),
			coordinator.getMany(['kirisame_marisa', 'alice_margatroid', 'ibuki_suika']),
			coordinator.getMany(['alice_margatroid', 'ibuki_suika', 'houraisan_kaguya']),
			coordinator.getMany(['ibuki_suika', 'houraisan_kaguya', 'shameimaru_aya']),
			coordinator.getMany(['houraisan_kaguya', 'shameimaru_aya', 'kochiya_sanae']),
			coordinator.getMany(['shameimaru_aya', 'kochiya_sanae', 'hinanawi_tenshi']),
			coordinator.getMany(['kochiya_sanae', 'hinanawi_tenshi']),
			coordinator.getMany(['hinanawi_tenshi']),
		]);

		expect(results).toBeArrayOfSize(10);
		expect(calls).toBeGreaterThanOrEqual(1);
		expect(calls).toBeLessThanOrEqual(2);
	});
});
