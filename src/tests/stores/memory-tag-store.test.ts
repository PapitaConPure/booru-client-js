import { beforeEach, describe, expect, it } from 'bun:test';
import { Tag } from '../../domain/tag';
import { MemoryTagStore } from '../../stores/memory-tag-store';

function createTag(name: string, ageMs = 0) {
	return Tag.mock({
		name,
		fetchTimestamp: new Date(Date.now() - ageMs),
	});
}

describe('MemoryTagStore', () => {
	let store: MemoryTagStore;

	beforeEach(() => {
		store = new MemoryTagStore();
	});

	it('stores and retrieves a tag', async () => {
		const tag = createTag('touhou');

		await store.setOne(tag);
		const result = await store.getOne('touhou');

		expect(result).toBeDefined();
		expect(result?.name).toBe('touhou');
	});

	it('returns undefined for missing tag', async () => {
		const result = await store.getOne('missing');
		expect(result).toBeUndefined();
	});

	it('stores and retrieves multiple tags', async () => {
		const tags = [createTag('a'), createTag('b')];

		await store.setMany(tags);
		const result = await store.getMany(['a', 'b', 'c']);

		expect(result.length).toBe(2);
	});

	it('does not return expired tags', async () => {
		const expired = createTag('old', store.ttl + 1000);

		await store.setOne(expired);
		const result = await store.getOne('old');

		expect(result).toBeUndefined();
	});

	it('cleans expired tags during getMany', async () => {
		const valid = createTag('new');
		const expired = createTag('old', store.ttl + 1000);

		await store.setMany([valid, expired]);

		const result = await store.getMany(['new', 'old']);

		expect(result.length).toBe(1);
		expect(result[0]?.name).toBe('new');
	});

	it('cleanup removes expired tags', async () => {
		const expired = createTag('old', store.ttl + 1000);

		await store.setOne(expired);
		await store.cleanup?.();

		const result = await store.getOne('old');
		expect(result).toBeUndefined();
	});
});
