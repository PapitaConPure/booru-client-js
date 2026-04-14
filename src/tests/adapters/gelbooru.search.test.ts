import '../mocks/fetchExt.test';
import { describe, expect, it } from 'bun:test';
import Gelbooru from '../../adapters/gelbooru/client';

describe('Gelbooru adapter - search', () => {
	it('returns posts mapped to Post model', async () => {
		const api = new Gelbooru();

		const result = await api.search(
			'clownpiece',
			{
				limit: 1,
				random: false,
			},
			{
				apiKey: 'x',
				userId: '1',
			},
		);

		expect(result.length).toBe(1);
		expect(result[0]?.tags).toContain('clownpiece');
	});
});
