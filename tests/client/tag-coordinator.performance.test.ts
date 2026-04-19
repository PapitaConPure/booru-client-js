import { describe, expect, it } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { TagCoordinator } from '../../src/services/tag-coordinator';
import type { TagResolver } from '../../src/services/tag-resolver';

function createResolver(fn: (names: Set<string>) => Promise<Tag[]>): TagResolver {
	return {
		resolveMany: fn,
	} as unknown as TagResolver;
}

describe('TagCoordinator - performance characteristics', () => {
	it('dramatically reduces resolver calls under heavy load', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver, {
			baseBatchingGraceWindowMs: 0,
			maxBatchingGraceWindowMs: 5,
		});

		const total = 200;

		const promises = Array.from({ length: total }, (_, i) => coordinator.getOne(`tag_${i}`));

		await Promise.all(promises);

		expect(calls).toBeLessThan(total);
		expect(calls).toBeLessThanOrEqual(10);
	});

	it('handles timing-sensitive batching with timers', async () => {
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

		await new Promise((r) => setTimeout(r, 5));

		const p2 = coordinator.getOne('b');

		await Promise.all([p1, p2]);

		expect(calls).toBe(1);
	});
});
