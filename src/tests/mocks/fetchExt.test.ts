import { mock } from 'bun:test';

mock.module('../../utils/fetchExt', () => ({
	fetchExt: async () => ({
		success: true,
		data: {
			tag: [
				{ id: 1, name: 'kishin_sagume' },
				{ id: 2, name: 'junko_(touhou)' },
			],
		},
	}),
}));
