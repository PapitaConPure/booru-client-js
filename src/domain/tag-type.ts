import type { ValuesOf } from '../types/util';

export const TagTypes = {
	GENERAL: 0,
	ARTIST: 1,
	UNKNOWN: 2,
	COPYRIGHT: 3,
	CHARACTER: 4,
	METADATA: 5,
	DEPRECATED: 6,
} as const satisfies Record<string, number>;
export type TagType = ValuesOf<typeof TagTypes>;
export const ValidTagTypes = new Set<TagType>(Object.values(TagTypes));
