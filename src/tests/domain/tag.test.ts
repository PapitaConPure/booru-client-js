import { describe, expect, it } from 'bun:test';
import { Tag } from '../../domain/tag';
import { TagTypes } from '../../types/booru';

describe('Tag', () => {
	it('constructs correctly', () => {
		const tag = new Tag({
			id: 1,
			name: 'test',
			count: 5,
			type: TagTypes.GENERAL,
			fetchTimestamp: new Date(),
		});

		expect(tag.name).toBe('test');
		expect(tag.typeName).toBe('General');
	});

	it('is immutable', () => {
		const tag = new Tag({
			id: 1,
			name: 'test',
			count: 1,
			type: TagTypes.GENERAL,
			fetchTimestamp: new Date(),
		});

		// biome-ignore lint/suspicious/noExplicitAny: Test throw
		expect(() => ((tag as any).name = 'nope')).toThrow();
	});

	it('toString works', () => {
		const tag = new Tag({
			id: 1,
			name: 'test',
			count: 2,
			type: TagTypes.GENERAL,
			fetchTimestamp: new Date(),
		});

		expect(tag.toString()).toContain('test');
	});
});
