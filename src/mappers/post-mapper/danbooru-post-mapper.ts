import type { DanbooruPostDto, DanbooruPostRating } from '../../adapters/danbooru/dto';
import { Post } from '../../domain/post';
import { type PostRating, PostRatings } from '../../domain/post-rating';
import type { PostMapper } from '../post-mapper';

const danbooruRatingsMap = {
	g: PostRatings.General,
	s: PostRatings.Sensitive,
	q: PostRatings.Questionable,
	e: PostRatings.Explicit,
} as const satisfies Record<DanbooruPostRating, PostRating>;

export class DanbooruPostMapper implements PostMapper<DanbooruPostDto> {
	fromDto(dto: DanbooruPostDto): Post {
		const sources = dto.source
			.split(/\s+/)
			.map((s) => s.trim())
			.filter((s) => s != null);

		return new Post({
			id: dto.id,
			title: '',
			tags: dto.tag_string.split(' '),
			sources: sources.length ? sources : undefined,
			score: dto.score,
			rating: danbooruRatingsMap[dto.rating],
			createdAt: new Date(dto.created_at),
			creatorId: dto.uploader_id,
			fileUrl:
				(dto.has_large ? dto.large_file_url : dto.file_url)
				|| dto.file_url
				|| dto.preview_file_url
				|| '',
			size: [dto.image_width, dto.image_height],
			previewUrl: dto.preview_file_url,
			previewSize: undefined,
			sampleUrl: dto.has_large ? dto.file_url : undefined,
			sampleSize: undefined,
		});
	}
}
