import type { Booru } from '../adapters/booru';
import type { NameOf, PostInit, PostUrlBuilder } from '../types/booru';
import { getSourceUrl } from '../utils/misc';
import { type PostRating, PostRatings } from './post-rating';

/**@class Representa una imagen publicada en un {@linkcode Booru}*/
export class Post<TBooru extends Booru = Booru> {
	readonly booruName: NameOf<TBooru>;

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

	readonly #urlBuilder: PostUrlBuilder;

	constructor(data: PostInit<TBooru>) {
		this.booruName = data.booru;
		this.#urlBuilder = data.urlBuilder;

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

	get url() {
		return this.#urlBuilder(this.id);
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

	static mock(initOverrides: Partial<PostInit> = {}) {
		const defaultMockInit: PostInit = {
			id: 4939462,
			booru: 'gelbooru',
			urlBuilder: () => '',
			title: 'title',
			tags: [
				'1girl',
				'chocolate_chip_cookie',
				'cookie',
				'cursor',
				'disembodied_hand',
				'eyewear_strap',
				'female_focus',
				'food',
				'forehead',
				'frown',
				'glasses',
				'old',
				'old_woman',
				'rolling_pin',
				'serious',
				'short_hair',
				'solo',
				'upper_body',
				'wrinkled_skin',
			],
			sources: ['https://twitter.com/click_burgundy/status/1179386273024417792'],
			score: 7,
			rating: PostRatings.Sensitive,
			createdAt: new Date(2019, 9, 2, 12, 0, 2),
			creatorId: 6498,
			fileUrl: 'https://img2.gelbooru.com/images/ce/d7/ced791390bc43829361ae47bd043ba7b.jpg',
			size: [500, 714],
		};

		return new Post({ ...defaultMockInit, ...initOverrides });
	}
}
