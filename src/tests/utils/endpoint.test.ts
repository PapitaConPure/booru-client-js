import { describe, expect, it } from 'bun:test';
import type { FetchFn } from '../../utils/endpoint';
import { defineEndpoint } from '../../utils/endpoint';
import type { FetchSuccessResult } from '../../utils/fetchExt';

describe('defineEndpoint', () => {
	it('builds URL correctly', async () => {
		const fakeFetch = async (url: string) => ({
			success: true,
			data: url,
		});

		const endpoint = defineEndpoint(
			'get',
			'https://example.com',
			{ a: '1' },
			{ fetchFn: fakeFetch as FetchFn },
		);

		const res = (await endpoint.request({ b: '2' })) as FetchSuccessResult<URL>;

		expect(res.data).toBeTypeOf('object');
		expect(res.data.searchParams.get('a')).toBe('1');
		expect(res.data.searchParams.get('b')).toBe('2');
	});
});
