import { fetchExt } from './fetchExt';

export function defineEndpoint(
	methodVerb: 'get' | 'post' | 'put' | 'patch' | 'delete',
	baseUrl: URL | string,
	defaultParams: Record<string, string>,
) {
	const endpointURL = typeof baseUrl === 'string' ? new URL(baseUrl) : baseUrl;

	for (const [k, v] of Object.entries(defaultParams)) endpointURL.searchParams.set(k, v);

	return {
		async request<TSchema>(params: Record<string, unknown>) {
			const searchUrl = new URL(endpointURL);

			for (const [name, value] of Object.entries(params))
				if (value !== undefined) searchUrl.searchParams.set(name, `${value}`);

			return fetchExt<TSchema>(searchUrl, {
				type: 'json',
				init: {
					method: methodVerb,
					signal: AbortSignal.timeout(10_000),
				},
			});
		},
	};
}
