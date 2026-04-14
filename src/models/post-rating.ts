import type { ValuesOf } from '../types/util';

export const PostRatings = {
	Safe: 'safe',
	General: 'general',
	Sensitive: 'sensitive',
	Questionable: 'questionable',
	Explicit: 'explicit',
} as const;

export type PostRating = ValuesOf<typeof PostRatings>;
