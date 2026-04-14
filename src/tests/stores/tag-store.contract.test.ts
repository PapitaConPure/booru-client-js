import { describe, expect, it } from 'bun:test';
import { Tag } from '../../domain/tag';
import type { TagStore } from '../../stores/tag-store';

function runContract(store: TagStore) {
	return describe('TagStore contract', () => {
		it('supports setOne + getOne roundtrip', async () => {
			const tag = new Tag({
				id: 1,
				name: 'test',
				type: 0,
				count: 1,
				fetchTimestamp: new Date(),
			});

			await store.setOne(tag);
			const result = await store.getOne('test');

			expect(result?.name).toBe('test');
		});

		it('supports setMany + getMany roundtrip', async () => {
			const tags = [
				new Tag({ id: 1, name: 'a', type: 0, count: 1, fetchTimestamp: new Date() }),
				new Tag({ id: 2, name: 'b', type: 0, count: 1, fetchTimestamp: new Date() }),
			];

			await store.setMany(tags);

			const result = await store.getMany(['a', 'b']);

			expect(result.length).toBe(2);
		});
	});
}

import { MemoryTagStore } from '../../stores/memory-tag-store';

runContract(new MemoryTagStore());
