import type { PostInit } from '../types/booru';
import { getSourceUrl } from '../utils/misc';
import type { PostRating } from './post-rating';

/**@class Representa una imagen publicada en un {@linkcode Booru}*/
export class Post {
	readonly id: number;
	readonly title: string;
	readonly tags: string[];
	readonly sources?: string[];
	readonly score: number;
	readonly rating: PostRating;
	readonly createdAt: Date;
	readonly creatorId: number;
	readonly fileUrl: string;
	readonly size: [number, number];
	readonly previewUrl?: string;
	readonly previewSize?: [number, number];
	readonly sampleUrl?: string;
	readonly sampleSize?: [number, number];

	constructor(data: PostInit) {
		this.id = data.id;
		this.title = data.title;
		this.tags = data.tags;
		this.sources = data.sources;
		this.score = data.score;
		this.rating = data.rating;
		this.createdAt = new Date(data.createdAt);
		this.creatorId = data.creatorId;
		this.fileUrl = data.fileUrl;
		this.size = data.size;
		this.previewUrl = data.previewUrl;
		this.previewSize = data.previewSize;
		this.sampleUrl = data.sampleUrl;
		this.sampleSize = data.sampleSize;

		Object.freeze(this);
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

	[Symbol.toPrimitive](hint: string) {
		if (hint === 'string' || hint === 'default') return this.toString();
		return this.id;
	}

	toString() {
		return `[Post ${this.id}] (${this.rating}) ${this.fileUrl}`;
	}

	static mock() {
		return new Post({
			id: 1,
			title: 'title',
			tags: ['a', 'b', 'c'],
			sources: ['https://google.com'],
			score: 0,
			rating: 'general',
			createdAt: new Date(),
			creatorId: 0,
			fileUrl: '',
			size: [0, 0],
		});
	}
}
