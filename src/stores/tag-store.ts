import type { Tag } from '../models/tag';
import type { BooruClient } from '../services/booru';

/**@description Represents a repository of {@link Tag}s to be managed by a {@link BooruClient}.*/
export default interface TagStore {
	/**
	 * @description Obtains multiple {@link Tag}s from this {@link TagStore} based on the provided `names`.
	 * @param names The names to obtain tags from.
	 * @returns An array of all the obtained tags. Returns an empty array if no tags were obtained.
	 */
	getMany(names: Iterable<string>): Promise<Tag[]>;

	/**
	 * @description Obtains a {@link Tag} from this {@link TagStore} based on the provided `name`.
	 * @param name The names to obtain a tag from.
	 * @returns The obtained tags, or `undefined` if none was obtained.
	 */
	getOne(name: string): Promise<Tag | undefined>;

	/**
	 * @description Stores multiple {@link Tag}s into this {@link TagStore}.
	 * @param tags The tags to store.
	 */
	setMany(tags: Iterable<Tag>): Promise<void>;

	/**
	 * @description Stores a {@link Tag} into this {@link TagStore}.
	 * @param tag The tag to store.
	 */
	setOne(tag: Tag): Promise<void>;

	/**
	 * @description Cleans up all {@link Tag}s that are deemed as no longer valid, based on this {@link TagStore}'s criteria.
	 *
	 * Use this as a means of both keeping fresh/up-to-date tags and reducing resource consumption.
	 */
	cleanup?(): void | Promise<void>;
}
