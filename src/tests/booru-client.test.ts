import { mock } from 'bun:test';

mock.module('../utils/fetchExt', () => ({
	fetchExt: async () => ({
		success: true,
		data: {
			tag: [
				{ id: 1, name: 'reimu' },
				{ id: 2, name: 'marisa' },
			],
		},
	}),
}));
