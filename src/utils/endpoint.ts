import { type FetchResult, fetchExt } from './fetchExt';

export type FetchFn = typeof fetchExt;

export interface Endpoint {
	request<TSchema>(
		params: Record<string, unknown>,
		init?: RequestInit,
	): Promise<FetchResult<TSchema>>;
}

export function defineEndpoint(
	methodVerb: 'get' | 'post' | 'put' | 'patch' | 'delete',
	baseUrl: URL | string,
	defaultParams: Record<string, string> = {},
	endpointOptions: {
		fetchFn?: FetchFn;
	} = {},
): Endpoint {
	const { fetchFn = fetchExt } = endpointOptions;
	const endpointURL = typeof baseUrl === 'string' ? new URL(baseUrl) : baseUrl;

	for (const [k, v] of Object.entries(defaultParams)) endpointURL.searchParams.set(k, v);

	return {
		async request<TSchema>(params: Record<string, unknown>, init: RequestInit = {}) {
			const searchUrl = new URL(endpointURL);

			for (const [name, value] of Object.entries(params))
				if (value !== undefined) searchUrl.searchParams.set(name, `${value}`);

			return fetchFn<TSchema>(searchUrl, {
				type: 'json',
				init: {
					method: methodVerb,
					signal: AbortSignal.timeout(10_000),
					...init,
				},
			});
		},
	};
}
