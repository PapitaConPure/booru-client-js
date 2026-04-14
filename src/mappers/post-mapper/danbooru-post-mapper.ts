import type { DanbooruPostDto } from '../../adapters/danbooru/dto';
import type { GelbooruPostRating } from '../../adapters/gelbooru/dto';
import { Post } from '../../domain/post';
import { type PostRating, PostRatings } from '../../domain/post-rating';
import type { PostMapper } from '../post-mapper';

const danbooruRatingsMap = {
	general: PostRatings.General,
	sensitive: PostRatings.Sensitive,
	questionable: PostRatings.Questionable,
	explicit: PostRatings.Explicit,
} as const satisfies Record<GelbooruPostRating, PostRating>;

export class DanbooruPostMapper implements PostMapper<DanbooruPostDto> {
	fromDto(dto: DanbooruPostDto): Post {
		return new Post({
			id: dto.id,
			title: '',
			tags: dto.tag_string.split(' '),
			sources: undefined,
			score: -1,
			rating: danbooruRatingsMap.general,
			createdAt: new Date(dto.created_at),
			creatorId: 0,
			fileUrl: dto.large_file_url,
			size: [dto.image_width, dto.image_height],
			previewUrl: undefined,
			previewSize: undefined,
			sampleUrl: undefined,
			sampleSize: undefined,
		});
	}
}
