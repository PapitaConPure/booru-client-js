import { describe, expect, it } from 'bun:test';
import { Tag } from '../../domain/tag';
import type { TagStore } from '../../stores/tag-store';

function runContract(store: TagStore) {
	return describe('TagStore contract', () => {
		it('supports setOne + getOne roundtrip', async () => {
			const tag = Tag.mock({ name: 'test' });

			await store.setOne(tag);
			const result = await store.getOne('test');

			expect(result?.name).toBe('test');
		});

		it('supports setMany + getMany roundtrip', async () => {
			const tags = [Tag.mock({ id: 1, name: 'a' }), Tag.mock({ id: 2, name: 'b' })];

			await store.setMany(tags);

			const result = await store.getMany(['a', 'b']);

			expect(result.length).toBe(2);
		});
	});
}

import { MemoryTagStore } from '../../stores/memory-tag-store';

runContract(new MemoryTagStore());
