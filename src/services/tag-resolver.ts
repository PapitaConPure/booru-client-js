import type { Tag } from '../domain/tag';
import type { TagStore } from '../stores/tag-store';
import type { TagFetchApproach, TagResolutionOptions } from '../types/booru';

/**
 * Resolves {@link Tag}s by coordinating {@link TagStore} cache layers and an API fallback to a certain booru.
 *
 * Responsible for:
 * * Querying a chain of {@link TagStore}s as cache layers
 * * Determining whether to fetch tags per-name or per-store based on a threshold
 * * Fetching missing tags from the API when not found in any store
 * * Writing fetched tags back into all cache layers
 *
 * The {@link Tag} resolution process follows this order:
 * 1. Try to fetch tags from cache layers (ideally, faster {@link TagStore}s are configured to go first in the chain)
 * 2. Identify missing tag names
 * 3. Try to fetch missing tags from a booru
 * 4. Store fetched tags in all cache layers
 */
export class TagResolver {
	/**
	 * Ordered chain of {@link TagStore}s used as cache layers.
	 * Stores at the beginning of the array are queried first.
	 */
	readonly #getTagStoreChain: () => readonly TagStore[];

	/**
	 * Approach used to fetch from the API when a tag name isn't found in any store.
	 * @remarks The returned Promise may reject with:
	 * * {@link ReferenceError} If no credentials were defined.
	 * * {@link TypeError} If the supplied credentials are invalid.
	 * * {@link BooruFetchError} If the request to the API fails.
	 * * {@link BooruUnknownTagError} If the booru adapter is unable to resolve the API response.
	 */
	readonly #fetchFromApi: TagFetchApproach;

	/**
	 * Threshold that determines the tag fetching strategy.
	 * If the number of requested tags is below this value, tags are fetched per name.
	 * Otherwise, they are fetched per store.
	 */
	readonly #tagFetchThreshold: number;

	constructor(
		tagStoreGetter: () => TagStore[],
		fetchFromApi: TagFetchApproach,
		options: TagResolutionOptions,
	) {
		const { fetchThreshold = 50 } = options;

		this.#getTagStoreChain = tagStoreGetter;
		this.#fetchFromApi = fetchFromApi;

		this.#tagFetchThreshold = fetchThreshold;
	}

	/**
	 * Obtains {@link Tag}s by their names. Uses the configured {@link TagStore} chain as sequential cache layers before actually making an API call.
	 *
	 * Missing tags are fetched based on the configured {@link TagFetchApproach} and stored back into the cache.
	 * @param normalizedTagNames The unique, normalized tag names to resolve.
	 * @returns An array containing the tags that were retrieved. Omits missing tags.
	 * @remarks The returned Promise may reject with:
	 * * {@link ReferenceError} If no credentials were defined.
	 * * {@link TypeError} If the supplied credentials are invalid.
	 * * {@link BooruFetchError} If the request to the API fails.
	 * * {@link BooruUnknownTagError} If the booru adapter is unable to resolve the API response.
	 */
	async resolveMany(normalizedTagNames: Set<string>): Promise<Tag[]> {
		if (!normalizedTagNames.size) return [];

		const uniqueTagNames = new Set(normalizedTagNames);

		const { foundTagsMap, missingTagNames } =
			uniqueTagNames.size < this.#tagFetchThreshold
				? await this.#fetchTagsByNamePerTag(uniqueTagNames)
				: await this.#fetchTagsByNamePerStore(uniqueTagNames);

		if (!missingTagNames.size) return [...foundTagsMap.values()];

		const fetchedTags = await this.#fetchFromApi(missingTagNames);

		if (!fetchedTags.length) return [...foundTagsMap.values()];

		const tagStoreChain = this.#getTagStoreChain();
		await Promise.all(tagStoreChain.map((s) => s.setMany(fetchedTags)));

		const resultingTags = new Map<string, Tag>();

		for (const tag of foundTagsMap.values()) resultingTags.set(tag.name, tag);

		for (const tag of fetchedTags)
			if (uniqueTagNames.has(tag.name)) resultingTags.set(tag.name, tag);

		return [...resultingTags.values()];
	}

	/**
	 * Obtains tags by tag names, using {@link TagStore} layers on a name by name basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `foundTagsMap`: Map of Tag names to Tags that were obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNamePerTag(
		normalizedTagNames: Set<string>,
	): Promise<{ foundTagsMap: Map<string, Tag>; missingTagNames: Set<string> }> {
		const missingTagNames = new Set<string>();
		const foundTagsMap = new Map<string, Tag>();
		const tagStoreChain = this.#getTagStoreChain();

		for (const name of normalizedTagNames) {
			let tag: Tag | undefined;

			for (const store of tagStoreChain) {
				tag = await store.getOne(name);
				if (tag) break;
			}

			if (tag) foundTagsMap.set(name, tag);
			else missingTagNames.add(name);
		}

		return {
			foundTagsMap,
			missingTagNames,
		};
	}

	/**
	 * Obtains tags by tag names, using {@link TagStore} layers on a store by store basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `foundTagsMap`: Map of Tag names to Tags that were obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNamePerStore(
		normalizedTagNames: Set<string>,
	): Promise<{ foundTagsMap: Map<string, Tag>; missingTagNames: Set<string> }> {
		const normalizedTagNamesToGet = new Set(normalizedTagNames);
		const foundTagsMap = new Map<string, Tag>();
		const tagStoreChain = this.#getTagStoreChain();

		for (const tagStore of tagStoreChain) {
			if (!normalizedTagNamesToGet.size) break;

			const foundTags = await tagStore.getMany(normalizedTagNamesToGet);

			for (const storedTag of foundTags) {
				if (foundTagsMap.has(storedTag.name)) continue;

				foundTagsMap.set(storedTag.name, storedTag);
				normalizedTagNamesToGet.delete(storedTag.name);
			}
		}

		return {
			foundTagsMap,
			missingTagNames: normalizedTagNamesToGet,
		};
	}
}
