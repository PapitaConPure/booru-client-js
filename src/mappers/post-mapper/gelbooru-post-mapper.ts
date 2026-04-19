import { Gelbooru } from '../../adapters/gelbooru/client';
import type { GelbooruPostDto, GelbooruPostRating } from '../../adapters/gelbooru/dto';
import { Post } from '../../domain/post';
import { type PostRating, PostRatings } from '../../domain/post-rating';
import type { PostMapper } from '../post-mapper';

const gelbooruRatingsMap = {
	general: PostRatings.General,
	sensitive: PostRatings.Sensitive,
	questionable: PostRatings.Questionable,
	explicit: PostRatings.Explicit,
} as const satisfies Record<GelbooruPostRating, PostRating>;

export class GelbooruPostMapper implements PostMapper<GelbooruPostDto, Gelbooru> {
	fromDto(dto: GelbooruPostDto): Post<Gelbooru> {
		const sources = dto.source
			?.split(/\s+/)
			.map((s) => s.trim())
			.filter((s) => s != null && s.length > 0);

		return new Post<Gelbooru>({
			booru: 'gelbooru',
			urlBuilder: Gelbooru.postUrlBuilder,
			id: `${dto.id}`,
			title: dto.title,
			tags: dto.tags.split(' '),
			sources: sources.length ? sources : undefined,
			score: dto.score,
			rating: gelbooruRatingsMap[dto.rating],
			createdAt: new Date(dto.created_at),
			creatorId: dto.creator_id,
			fileUrl: dto.file_url,
			size: [dto.width, dto.height],
			previewUrl: dto.preview_url,
			previewSize:
				dto.preview_width != null && dto.preview_height != null
					? [dto.preview_width, dto.preview_height]
					: undefined,
			sampleUrl: dto.sample_url,
			sampleSize:
				dto.sample_width != null && dto.sample_height != null
					? [dto.sample_width, dto.sample_height]
					: undefined,
		});
	}
}
