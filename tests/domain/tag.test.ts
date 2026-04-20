import { describe, expect, it } from 'bun:test';
import { Tag } from '../../src/domain/tag';
import { TagTypes } from '../../src/domain/tag-type';

describe('Tag', () => {
	it('constructs correctly', () => {
		const tag = Tag.mock({
			name: 'test',
			type: TagTypes.GENERAL,
		});

		expect(tag.name).toBe('test');
		expect(tag.typeName).toBe('General');
	});

	it('is immutable', () => {
		const tag = Tag.mock();

		// biome-ignore lint/suspicious/noExplicitAny: Test throw
		expect(() => ((tag as any).name = 'nope')).toThrow();
	});

	it('toString works', () => {
		const tag = Tag.mock({ name: 'test' });

		expect(tag.toString()).toContain('test');
	});
});
