import { describe, expect, it } from 'bun:test';
import { booruSpec } from '@papitaconpure/booru-client';
import { Tag } from '../../src/domain/tag';
import { BooruClient } from '../../src/services/booru-client';
import type { AnyBooru } from '../../src/types/booru';

function createMockBooru() {
	let calls = 0;

	const booru: AnyBooru = {
		get name() {
			return 'mock';
		},

		async search() {
			return [];
		},

		async fetchPostById() {
			return undefined;
		},

		async fetchPostByUrl() {
			return undefined;
		},

		async fetchTagsByNames(names) {
			calls++;
			return [...names].map((name, id) => Tag.mock({ id, name }));
		},

		validateCredentials() {},

		[booruSpec]: {},
	};

	return {
		booru,
		getCalls: () => calls,
	};
}

describe('BooruClient - normalization', () => {
	it("ninomae_ina%27nis resolves the same as ninomae_ina'nis", async () => {
		const mock = createMockBooru();

		const client = new BooruClient(mock.booru, {
			credentials: { apiKey: 'x', userId: '1' },
		});

		const [a] = await client.fetchTagsByNames({
			names: ["ninomae_ina'nis"],
		});

		const [b] = await client.fetchTagsByNames({
			names: ['ninomae_ina%27nis'],
		});

		expect(a?.name).toBe(b?.name);
	});
});
