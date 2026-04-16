import type { Tag } from '../domain/tag';
import type { TagStore } from '../stores/tag-store';
import type { BooruClientTagOptions, TagFetchApproach } from '../types/booru';

export class TagResolver {
	readonly #storeChain: TagStore[];
	readonly #fetchFromApi: TagFetchApproach;

	/**
	 * Threshold that determines the tag fetching strategy.
	 * If the number of requested tags is below this value, tags are fetched per name.
	 * Otherwise, they are fetched per store.
	 */
	readonly #tagFetchThreshold: number;

	constructor(
		stores: TagStore[],
		fetchFromApi: TagFetchApproach,
		options: BooruClientTagOptions,
	) {
		const { fetchThreshold = 50 } = options;

		this.#storeChain = stores;
		this.#fetchFromApi = fetchFromApi;

		this.#tagFetchThreshold = fetchThreshold;
	}

	async resolveMany(normalizedTagNames: string[]): Promise<Tag[]> {
		if (!normalizedTagNames.length) return [];

		const foundTags = new Map<string, Tag>();

		const { storedTags, missingTagNames } =
			normalizedTagNames.length < this.#tagFetchThreshold
				? await this.#fetchTagsByNamePerTag(normalizedTagNames)
				: await this.#fetchTagsByNamePerStore(normalizedTagNames);

		if (!missingTagNames.length) return storedTags;

		const fetchedTags = await this.#fetchFromApi([...missingTagNames]);

		if (fetchedTags.length) {
			await Promise.all(this.#storeChain.map((s) => s.setMany(fetchedTags)));

			for (const tag of fetchedTags) foundTags.set(tag.name, tag);
		}

		return normalizedTagNames.map((n) => foundTags.get(n)).filter((n) => n != null);
	}

	/**
	 * Obtains tags by tag names, using {@link TagStore} layers on a name by name basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `storedTags`: Tags that could be obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNamePerTag(
		normalizedTagNames: string[],
	): Promise<{ storedTags: Tag[]; missingTagNames: string[] }> {
		const results = await Promise.all(
			normalizedTagNames.map(async (tagName) => {
				for (const tagStore of this.#storeChain) {
					const storedTag = await tagStore.getOne(tagName);
					if (storedTag) return storedTag;
				}
				return null;
			}),
		);

		const storedTagsMap = new Map<string, Tag>();
		const missingTagNames: string[] = [];

		for (const [i, name] of normalizedTagNames.entries()) {
			const tag = results[i];

			if (tag) storedTagsMap.set(tag.name, tag);
			else missingTagNames.push(name);
		}

		return {
			storedTags: [...storedTagsMap.values()],
			missingTagNames,
		};
	}

	/**
	 * Obtains tags by tag names, using {@link TagStore} layers on a store by store basis.
	 * @param normalizedTagNames The tag names from which to obtain tag objects.
	 * @returns An object, containing:
	 * * `storedTags`: Tags that could be obtained from a store layer.
	 * * `missingTagNames`: Tag names that weren't available on any store.
	 */
	async #fetchTagsByNamePerStore(
		normalizedTagNames: string[],
	): Promise<{ storedTags: Tag[]; missingTagNames: string[] }> {
		const normalizedTagNamesToGet = new Set(normalizedTagNames);
		const storedTagsMap = new Map<string, Tag>();

		for (const tagStore of this.#storeChain) {
			if (!normalizedTagNamesToGet.size) break;

			const storedTags = await tagStore.getMany(normalizedTagNamesToGet);

			for (const storedTag of storedTags) {
				if (storedTagsMap.has(storedTag.name)) continue;

				storedTagsMap.set(storedTag.name, storedTag);
				normalizedTagNamesToGet.delete(storedTag.name);
			}
		}

		return {
			storedTags: [...storedTagsMap.values()],
			missingTagNames: [...normalizedTagNamesToGet],
		};
	}
}
