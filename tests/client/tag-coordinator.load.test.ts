import { describe, expect, it } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { TagCoordinator } from '../../src/services/tag-coordinator';
import type { TagResolver } from '../../src/services/tag-resolver';

function createResolver(fn: (names: Set<string>) => Promise<Tag[]>): TagResolver {
	return {
		resolveMany: fn,
	} as unknown as TagResolver;
}

describe('TagCoordinator - load & burst behavior', () => {
	it('burst of 100-1000 tag requests performs limited calls and does not drop requests', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 0,
			maxBatchingGraceWindowMs: 5,
			maxConcurrentTags: 100,
		});

		const total = 500;
		const promises = Array.from({ length: total }, (_, i) => coordinator.getOne(`tag_${i}`));

		const results = await Promise.all(promises);

		//Ensure no request was dropped
		expect(results.length).toBe(total);
		expect(results.every((r) => r != null)).toBe(true);

		//Make sure it actually batched
		expect(calls).toBeLessThan(total);

		expect(calls).toBeLessThanOrEqual(Math.ceil(total / 100) + 1);
	});

	it('100 requests for only 5 unique tags deduplicates correctly', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 5,
			maxBatchingGraceWindowMs: 5,
		});

		const unique = ['a', 'b', 'c', 'd', 'e'];

		const promises: Promise<unknown>[] = [];

		for (let i = 0; i < 100; i++) {
			const name = unique[i % unique.length];
			promises.push(coordinator.getOne(name as string));
		}

		const results = await Promise.all(promises);

		expect(results.length).toBe(100);

		//Ensure correct mapping
		for (let i = 0; i < 100; i++) {
			const expectedName = unique[i % unique.length];
			expect((results[i] as Tag)?.name).toBe(expectedName as string);
		}

		expect(calls).toBe(1);
	});

	it('some requests within batch window and some outside create separate batches', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 10,
			maxBatchingGraceWindowMs: 10,
		});

		//First batch
		const p1 = coordinator.getOne('a');
		const p2 = coordinator.getOne('b');

		//Request in batch window should go to same batch
		await new Promise((r) => setTimeout(r, 5));
		const p3 = coordinator.getOne('c');

		//Exceeded batch window so should go to new batch
		await new Promise((r) => setTimeout(r, 15));
		const p4 = coordinator.getOne('d');

		const results = await Promise.all([p1, p2, p3, p4]);

		expect(results.map((r) => (r as Tag)?.name)).toEqual(['a', 'b', 'c', 'd']);

		expect(calls).toBeGreaterThanOrEqual(2);
	});
});
