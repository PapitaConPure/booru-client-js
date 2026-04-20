import { Konachan } from '../../adapters/konachan/client';
import type { KonachanPostDto, KonachanPostRating } from '../../adapters/konachan/dto';
import { Post } from '../../domain/post';
import { type PostRating, PostRatings } from '../../domain/post-rating';
import { getSourcesArray } from '../../utils/booru';
import type { PostMapper } from '../post-mapper';

const konachanRatingsMap = {
	s: PostRatings.Safe,
	q: PostRatings.Questionable,
	e: PostRatings.Explicit,
} as const satisfies Record<KonachanPostRating, PostRating>;

export class KonachanPostMapper implements PostMapper<KonachanPostDto, Konachan> {
	fromDto(dto: KonachanPostDto): Post<Konachan> {
		return new Post<Konachan>({
			booru: 'konachan',
			urlBuilder: Konachan.postUrlBuilder,
			id: `${dto.id}`,
			title: '',
			tags: dto.tags.split(' '),
			sources: getSourcesArray(dto.source),
			score: dto.score,
			rating: konachanRatingsMap[dto.rating],
			createdAt: new Date(dto.created_at),
			creatorId: dto.creator_id,
			fileUrl: dto.file_url,
			size: [dto.width, dto.height],
			previewUrl: dto.preview_url,
			previewSize: [dto.actual_preview_width, dto.actual_preview_height],
			sampleUrl: dto.sample_url,
			sampleSize: [dto.sample_width, dto.sample_height],
		});
	}
}
