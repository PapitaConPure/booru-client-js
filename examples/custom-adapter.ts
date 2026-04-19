import { type Booru, BooruClient, BooruFetchError, type BooruSearchOptions, type BooruSpec, booruSpec, Danbooru, defineEndpoint, Post, type PostMapper, PostRatings, Tag, type TagMapper, TagTypes } from '../src';

interface CustombooruCredentials {
	apiKey: string;
	bananas: number;
	superUltraSecretCode: string;
}

interface CustombooruPostDto {
	post_id: string;
	file: {
		url: string;
		width: number;
		height: number;
	};
	sample: {
		url: string;
		width: number;
		height: number;
	},
	meta: {
		title: string;
		tag_string: string;
		score_value: number;
		created_at: number;
		uploader: {
			id: number;
			name: string;
		};
	};
}

type CustombooruPostsResponse = { myAwesomePosts: CustombooruPostDto[] };

interface CustombooruTagDto {
	id: number;
	label: string;
	usage: number;
}

type CustombooruTagsResponse = { someIncredibleTags: CustombooruTagDto[] };

class CustombooruPostMapper implements PostMapper<CustombooruPostDto, Custombooru> {
	fromDto(dto: CustombooruPostDto): Post<Custombooru> {
		return new Post<Custombooru>({
			booru: 'custombooru',
			urlBuilder: (id) => `https://custombooru.com/posts/${id}`,
			id: dto.post_id,
			title: dto.meta.title,
			tags: dto.meta.tag_string.split(' '),
			score: dto.meta.score_value,
			rating: PostRatings.General,
			createdAt: new Date(dto.meta.created_at),
			creatorId: dto.meta.uploader.id,
			fileUrl: dto.file.url,
			size: [dto.file.width, dto.file.height],
			sampleUrl: dto.sample.url,
			sampleSize: [dto.sample.width, dto.sample.height],
		});
	}
}

class CustombooruTagMapper implements TagMapper<CustombooruTagDto> {
	fromDto(dto: CustombooruTagDto): Tag {
		return new Tag({
			id: `${dto.id}`,
			name: dto.label,
			count: dto.usage,
			type: TagTypes.UNKNOWN,
		});
	}
}

const customBooruName = 'custombooru' as const;

interface CustomBooruSpec extends BooruSpec<Custombooru> {
	name: typeof customBooruName;
	credentials: CustombooruCredentials;
	searchOptions: BooruSearchOptions;
	postExtra: {};
}

class Custombooru implements Booru<Custombooru, CustomBooruSpec> {
	readonly [booruSpec]?: CustomBooruSpec;

	static readonly POSTS_ENDPOINT = defineEndpoint('get', 'https://custombooru.com/api/v1/posts?json=1');
	static readonly TAGS_ENDPOINT = defineEndpoint('get', 'https://custombooru.com/api/v1/tags?json=1');

	#postMapper: PostMapper<CustombooruPostDto, Custombooru>;
	#tagMapper: TagMapper<CustombooruTagDto>;

	/**
	 * Creates a new {@link Danbooru} adapter.
	 *
	 * @param options Defines various configurations for this Danbooru adapter.
	 */
	constructor(options: { postMapper?: PostMapper<CustombooruPostDto, Custombooru>, tagMapper?: TagMapper<CustombooruTagDto> } = {}) {
		const {
			postMapper = new CustombooruPostMapper(),
			tagMapper = new CustombooruTagMapper(),
		} = options;

		this.#postMapper = postMapper;
		this.#tagMapper = tagMapper;
	}

	get name() {
		return customBooruName;
	}

	async search(tags: string, searchOptions: Required<BooruSearchOptions>, credentials: CustombooruCredentials): Promise<Post<Custombooru>[]> {
		const { limit, random } = searchOptions;
		const { apiKey, bananas, superUltraSecretCode } = credentials;

		const fetchResult = await Custombooru.POSTS_ENDPOINT.request<CustombooruPostsResponse>({
			api_key: apiKey,
			bananas,
			super_ultra_secret: superUltraSecretCode,
			limit,
			random: random ? 1 : 0,
			tags,
		});

		if(!fetchResult.success)
			throw new BooruFetchError('Failed to fetch from Custombooru during search! Oh no!');

		const postDtos = fetchResult.data.myAwesomePosts;
		const posts = postDtos.map((dto) => this.#postMapper.fromDto(dto));

		return posts;
	}

	async fetchPostById(postId: string, credentials: CustombooruCredentials): Promise<Post<Custombooru> | undefined> {
		const { apiKey, bananas, superUltraSecretCode } = credentials;

		const fetchResult = await Custombooru.POSTS_ENDPOINT.request<CustombooruPostDto>({
			id: postId,
			api_key: apiKey,
			bananas,
			super_ultra_secret: superUltraSecretCode,
		});

		if(!fetchResult.success)
			throw new BooruFetchError('Failed to fetch a post by ID from Custombooru');

		const postDto = fetchResult.data;

		return this.#postMapper.fromDto(postDto);
	}

	async fetchPostByUrl(postUrl: URL, credentials: CustombooruCredentials): Promise<Post<Custombooru> | undefined> {
		const match = `${postUrl}`.match(/custombooru\.com\/posts\/(\d+)/);

		if (!match || !match[1]) return;

		const id = match[1];

		return this.fetchPostById(id, credentials);
	}

	async fetchTagsByNames(names: Iterable<string>, credentials: CustombooruCredentials): Promise<Tag[]> {
		const { apiKey, bananas, superUltraSecretCode } = credentials;

		const fetchResult = await Custombooru.TAGS_ENDPOINT.request<CustombooruTagsResponse>({
			tag_str: [...names].join(','),
			api_key: apiKey,
			bananas,
			super_ultra_secret: superUltraSecretCode,
		});

		if(!fetchResult.success)
			throw new BooruFetchError('Failed to fetch a post by ID from Custombooru');

		const tagsDto = fetchResult.data.someIncredibleTags;
		const tags = tagsDto.map(t => this.#tagMapper.fromDto(t));

		return tags;
	}

	validateCredentials(credentials: CustombooruCredentials): asserts credentials is CustombooruCredentials {
		if(
			typeof credentials.apiKey !== "string" ||
			typeof credentials.bananas !== "number" ||
			typeof credentials.superUltraSecretCode !== "string"
		)
			throw new TypeError('Bro what are those credentials wtf');
	}
}

//Instance a Booru adapter
const custombooru = new Custombooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(custombooru, {
	apiKey: 'some.api-key.123456-ABCDEF',
	bananas: 42,
	superUltraSecretCode: 'i want burger',
});

//Return the last post
const posts = await client.search('');

//Log the id, tags and url of the obtained post
console.log({
	file: posts[0]?.fileUrl,
	tags: posts[0]?.tags,
	url: posts[0]?.url,
});
