import { mock } from 'bun:test';

mock.module('../../utils/fetchExt', () => ({
	fetchExt: async (params: URL) => {
		let data: unknown;

		console.log(params);

		switch (params.searchParams.get('s')) {
			case 'post':
				data = {
					post: [{ id: 1, tags: 'clownpiece' }],
				};
				break;

			case 'tag':
				data = {
					tag: [
						{ id: 1, name: 'kishin_sagume' },
						{ id: 2, name: 'junko_(touhou)' },
					],
				};
				break;
		}

		return {
			success: true,
			data,
		};
	},
}));
