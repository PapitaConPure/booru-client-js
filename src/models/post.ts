import type { PostRating, PostResolvable } from '../types/gelbooru';
import { decodeEntities } from '../utils/encoding';
import { getSourceUrl } from '../utils/misc';

/**@class Representa una imagen publicada en un {@linkcode Booru}*/
export class Post {
	id: number;
	title: string;
	tags: string[];
	sources: string[] | undefined;
	score: number;
	rating: PostRating;
	createdAt: Date;
	creatorId: number;
	fileUrl: string;
	size: number[];
	previewUrl: string | undefined;
	previewSize: (number | undefined)[] | undefined;
	sampleUrl: string | undefined;
	sampleSize: (number | undefined)[] | undefined;

	constructor(data: PostResolvable) {
		this.id = data.id;
		this.title = data.title;
		this.tags = Array.isArray(data.tags)
			? data.tags.map(decodeEntities)
			: decodeEntities(data.tags ?? '').split(' ');

		if (data.source) {
			const sources =
				typeof data.source === 'object'
					? Array.isArray(data.source)
						? data.source
						: Object.values(data.source as Record<string, string>)
					: data.source.split(/[ \n]+/);
			this.sources = sources;
		}

		this.score = data.score;
		this.rating = data.rating;
		this.creatorId = 'creatorId' in data ? data.creatorId : data.creator_id;

		const createdAt = 'createdAt' in data ? data.createdAt : data.created_at;
		this.createdAt =
			typeof createdAt === 'string' || typeof createdAt === 'number'
				? new Date(createdAt)
				: createdAt;

		this.fileUrl = 'fileUrl' in data ? data.fileUrl : data.file_url;
		this.size = 'size' in data ? data.size : [data.width, data.height];

		if ('preview_url' in data) {
			this.previewUrl = data.preview_url;
			this.previewSize = [data.preview_width, data.preview_height];
		} else if ('previewUrl' in data) {
			this.previewUrl = data.previewUrl;
			this.previewSize = data.size;
		}

		if ('sample_url' in data) {
			this.sampleUrl = data.sample_url;
			this.sampleSize = [data.sample_width, data.sample_height];
		} else if ('sampleUrl' in data) {
			this.sampleUrl = data.sampleUrl;
			this.sampleSize = data.size;
		}
	}

	/**@description Tries to find sources that match a URL pattern, and returns all matches (if any)*/
	findUrlSources() {
		return this.sources?.map(getSourceUrl).filter((s) => s != null);
	}

	/**
	 * @description
	 * Finds and returns the first source that matches a URL pattern.
	 *
	 * If no URL source is found, `undefined` is returned
	 */
	findFirstUrlSource() {
		return this.sources?.map(getSourceUrl).find((s) => s != null);
	}

	/**
	 * @description
	 * Finds and returns the last source that matches a URL pattern.
	 *
	 * If no URL source is found, `undefined` is returned.
	 */
	findLastUrlSource() {
		const sources = this.sources?.map(getSourceUrl);

		if (!sources) return undefined;

		let i = sources.length;
		while (--i >= 0) if (sources[i] != null) return sources[i];

		return undefined;
	}

	get source() {
		return this.sources?.join(' ');
	}
}
