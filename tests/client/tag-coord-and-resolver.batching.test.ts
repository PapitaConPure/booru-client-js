import { describe, expect, it } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { TagCoordinator } from '../../src/services/tag-coordinator';
import type { TagResolver } from '../../src/services/tag-resolver';

function createResolver(fn: (names: Set<string>) => Promise<Tag[]>): TagResolver {
	return {
		resolveMany: fn,
	} as unknown as TagResolver;
}

describe('TagCoordinator + TagResolver - batching', () => {
	it('multiple getOne() calls → single resolveMany() call', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver);

		const p1 = coordinator.getOne('a');
		const p2 = coordinator.getOne('b');
		const p3 = coordinator.getOne('c');

		coordinator.flushNow();

		await Promise.all([p1, p2, p3]);

		expect(calls).toBe(1);
	});

	it('returns correct results across a batch', async () => {
		const resolver = createResolver(async (names) => {
			return [...names].map((name, i) => Tag.mock({ id: i, name, count: i }));
		});

		const coordinator = new TagCoordinator(resolver);

		const p1 = coordinator.getOne('x');
		const p2 = coordinator.getOne('y');

		coordinator.flushNow();

		const [x, y] = await Promise.all([p1, p2]);

		expect(x?.name).toBe('x');
		expect(y?.name).toBe('y');
		expect(x?.count).not.toBe(y?.count);
	});

	it('deduplicates same tag requests and reuses result within batch', async () => {
		let calls = 0;

		const resolver = createResolver(async (names) => {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver);

		const p1 = coordinator.getOne('dup');
		const p2 = coordinator.getOne('dup');
		const p3 = coordinator.getOne('dup');

		coordinator.flushNow();

		const results = await Promise.all([p1, p2, p3]);

		expect(calls).toBe(1);
		expect(results.every((r) => r?.name === 'dup')).toBe(true);
	});

	it('resolves some tags and returns undefined for missing ones', async () => {
		const resolver = createResolver(async (names) => {
			return [...names]
				.filter((n) => n !== 'missing')
				.map((name, id) => Tag.mock({ id, name }));
		});

		const coordinator = new TagCoordinator(resolver);

		const p1 = coordinator.getOne('exists');
		const p2 = coordinator.getOne('missing');

		coordinator.flushNow();

		const [exists, missing] = await Promise.all([p1, p2]);

		expect(exists?.name).toBe('exists');
		expect(missing).toBeUndefined();
	});
});
