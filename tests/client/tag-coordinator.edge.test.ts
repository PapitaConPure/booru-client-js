import { describe, expect, test } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { TagCoordinator } from '../../src/services/tag-coordinator';
import type { TagResolver } from '../../src/services/tag-resolver';

function createResolver(fn: (names: Set<string>) => Promise<Tag[]>): TagResolver {
	return {
		resolveMany: fn,
	} as unknown as TagResolver;
}

describe('TagCoordinator - edge cases & robustness', () => {
	test.concurrent('handles empty input', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver);

		const result = await coordinator.getMany([]);

		expect(result).toEqual([]);
		expect(calls).toBe(0);
	});

	test.concurrent('handles large tag sets without excessive resolver calls', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const maxConcurrentTags = 100;

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 0,
			maxBatchingGraceWindowMs: 5,
			maxConcurrentTags,
		});

		const total = 1000;

		const promises = Array.from({ length: total }, (_, i) => coordinator.getOne(`tag_${i}`));

		const results = await Promise.all(promises);

		expect(results.length).toBe(total);
		expect(results.every((r) => r != null)).toBe(true);

		//Make sure it actually batched
		expect(calls).toBeLessThan(total);

		expect(calls).toBeLessThanOrEqual(Math.ceil(total / maxConcurrentTags));
	});

	test.concurrent('handles rapid-fire flushNow() calls without duplicate resolutions nor crashes', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 10,
			maxBatchingGraceWindowMs: 10,
		});

		const p1 = coordinator.getOne('a');
		const p2 = coordinator.getOne('b');
		const p3 = coordinator.getOne('c');

		for (let i = 0; i < 10; i++) coordinator.flushNow();

		const results = await Promise.all([p1, p2, p3]);

		expect(results.map((r) => (r as Tag)?.name)).toEqual(['a', 'b', 'c']);

		expect(calls).toBeGreaterThanOrEqual(1);
		expect(calls).toBeLessThanOrEqual(3);
	});

	test.concurrent('each request resolves exactly once', async () => {
		let resolveCount = 0;

		const resolver = createResolver(async (names) => {
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver);

		const promises = Array.from({ length: 20 }, () =>
			coordinator.getOne('same_tag').then((t) => {
				if (t) resolveCount++;
				return t;
			}),
		);

		await Promise.all(promises);

		expect(resolveCount).toBe(20);
	});
});
