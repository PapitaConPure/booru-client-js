import type { Booru } from '../adapters/booru';
import type { AnyBooru, NameOf, PostInit, PostUrlBuilder } from '../types/booru';
import { getSourceUrl, parseUrlForField, parseValidDate } from '../utils/misc';
import { type PostRating, PostRatings } from './post-rating';

/**
 * Represents a domain entity for a post (image or media) published on a {@linkcode Booru}.
 *
 * Encapsulates canonical data associated with a booru post, independent of the underlying API representation.
 *
 * This object is immutable and should be treated as a read-only value.
 */
export class Post<TBooru extends AnyBooru = AnyBooru> {
	readonly _booruBrand!: TBooru;

	/**The identifier of the {@link Booru} this post originates from.*/
	readonly booruName: NameOf<TBooru>;

	/**Unique identifier of the {@link Post} within its source booru.*/
	readonly id: string;

	/**Title or caption of the {@link Post}. Rarely set in most booru services.*/
	readonly title: string;

	/**Tag names associated with the {@link Post}.*/
	readonly tags: string[];

	/**Optional list of source URLs referencing the origin of the {@link Post} content.*/
	readonly sources?: string[];

	/**Aggregated score representing the {@link Post}'s popularity.*/
	readonly score: number;

	/**Content rating classification of the {@link Post}.*/
	readonly rating: PostRating;

	/**Timestamp indicating when the {@link Post} was created.*/
	readonly createdAt: Date;

	/**Identifier of the creator/uploader of the {@link Post}.*/
	readonly creatorId: number;

	/**Direct URL to the original media file.*/
	readonly fileUrl: URL;

	/**Dimensions of the original media, as `[width, height]`.*/
	readonly size: [number, number];

	/**Optional URL to a preview (thumbnail) representation.*/
	readonly previewUrl?: URL;

	/**Dimensions of the preview media as `[width, height]`.*/
	readonly previewSize?: [number, number];

	/**Optional URL to a sample (resized or compressed) representation.*/
	readonly sampleUrl?: URL;

	/**Dimensions of the sample media as `[width, height]`.*/
	readonly sampleSize?: [number, number];

	readonly extra?: unknown;

	/**Internal service used to construct the URL this {@link Post} comes from.*/
	readonly #urlBuilder: PostUrlBuilder;

	/**
	 * Constructs a {@link Post} domain entity from normalized initialization data.
	 *
	 * URL fields are validated and normalized into {@link URL} instances.
	 *
	 * @param data Normalized data used to initialize this post.
	 * @throws {InvalidUrlError} If any provided URL is invalid.
	 */
	constructor(data: PostInit<TBooru>) {
		this.booruName = data.booru;
		this.#urlBuilder = data.urlBuilder;

		this.id = data.id;
		this.title = data.title;
		this.tags = data.tags;
		this.sources = data.sources;
		this.score = data.score;
		this.rating = data.rating;
		this.createdAt = parseValidDate('createdAt', data.createdAt);
		this.creatorId = data.creatorId;
		this.fileUrl = parseUrlForField('fileUrl', data.fileUrl);
		this.size = data.size;
		this.previewUrl = data.previewUrl
			? parseUrlForField('previewUrl', data.previewUrl)
			: undefined;
		this.previewSize = data.previewSize;
		this.sampleUrl = data.sampleUrl ? parseUrlForField('sampleUrl', data.sampleUrl) : undefined;
		this.sampleSize = data.sampleSize;
		this.extra = data.extra;

		Object.freeze(this);
	}

	/**The computed original URL this {@link Post} comes from.*/
	get url() {
		return this.#urlBuilder(this.id);
	}

	/**Tries to find sources that match a URL pattern, and returns all matches (if any)*/
	findUrlSources() {
		return this.sources?.map(getSourceUrl).filter((s) => s != null);
	}

	/**
	 * Finds and returns the first source that matches a URL pattern.
	 *
	 * If no URL source is found, `undefined` is returned
	 */
	findFirstUrlSource() {
		return this.sources?.map(getSourceUrl).find((s) => s != null);
	}

	/**
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

	/**Obtains all the sources of this {@link Post} as a string.*/
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

	/**
	 * Creates a mock {@link Post} instance for testing.
	 * @param initOverrides Overrides for the default initialization parameters.
	 */
	static mock(initOverrides: Partial<PostInit> = {}) {
		const defaultMockInit: PostInit = {
			id: '4939462',
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
