import type { ValuesOf } from '../../types/util';

export interface GelbooruCredentials {
	apiKey: string;
	userId: string;
}

export const GelbooruPostRatings = {
	General: 'general',
	Sensitive: 'sensitive',
	Questionable: 'questionable',
	Explicit: 'explicit',
} as const;
export type PostRating = ValuesOf<typeof GelbooruPostRatings>;

export interface GelbooruAPIPostData {
	id: number;
	title: string;
	tags: string[] | string;
	source: string | string[];
	score: number;
	rating: PostRating;
	created_at: Date | string | number;
	creator_id: number;
	file_url: string;
	width: number;
	height: number;
	preview_url?: string;
	preview_width?: number;
	preview_height?: number;
	sample_url?: string;
	sample_width?: number;
	sample_height?: number;
}
