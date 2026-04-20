import { Gelbooru } from '../../adapters/gelbooru/client';
import type { GelbooruPostDto } from '../../adapters/gelbooru/dto';
import type { GelbooruPostRating } from '../../adapters/gelbooru/types';
import { Post } from '../../domain/post';
import { type PostRating, PostRatings } from '../../domain/post-rating';
import { getSourcesArray } from '../../utils/booru';
import { fromUnix } from '../../utils/misc';
import type { PostMapper } from '../post-mapper';

const gelbooruRatingsMap = {
	general: PostRatings.General,
	sensitive: PostRatings.Sensitive,
	questionable: PostRatings.Questionable,
	explicit: PostRatings.Explicit,
} as const satisfies Record<GelbooruPostRating, PostRating>;

export class GelbooruPostMapper implements PostMapper<GelbooruPostDto, Gelbooru> {
	fromDto(dto: GelbooruPostDto): Post<Gelbooru> {
		return new Post<Gelbooru>({
			booru: 'gelbooru',
			urlBuilder: Gelbooru.POST_URL_BUILDER,
			id: `${dto.id}`,
			title: dto.title,
			tags: dto.tags.split(' '),
			sources: getSourcesArray(dto.source),
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
			extra: {
				md5: dto.md5,
				directory: dto.directory,
				imageName: dto.image,
				parentId: dto.parent_id,
				change: fromUnix(dto.change),
				ownerName: dto.owner,
				status: dto.status,
				postLocked: !!dto.post_locked,
			},
		});
	}
}
