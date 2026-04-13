import type { Tag } from '../models/tag';

export default interface TagStore {
	getMany(names: Iterable<string>): Promise<Tag[]>;
	getOne(name: string): Promise<Tag | null | undefined>;
	setMany(tags: Iterable<Tag>): Promise<void>;
	setOne(tag: Tag): Promise<void>;
}
