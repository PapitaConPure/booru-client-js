import { Danbooru } from '../../adapters/danbooru/client';
import type { DanbooruPostDto } from '../../adapters/danbooru/dto';
import type { DanbooruPostRating } from '../../adapters/danbooru/types';
import { Post } from '../../domain/post';
import { type PostRating, PostRatings } from '../../domain/post-rating';
import { getSourcesArray } from '../../utils/booru';
import type { PostMapper } from '../post-mapper';

const danbooruRatingsMap = {
	g: PostRatings.General,
	s: PostRatings.Sensitive,
	q: PostRatings.Questionable,
	e: PostRatings.Explicit,
} as const satisfies Record<DanbooruPostRating, PostRating>;

export class DanbooruPostMapper implements PostMapper<DanbooruPostDto, Danbooru> {
	fromDto(dto: DanbooruPostDto): Post<Danbooru> {
		return new Post<Danbooru>({
			booru: 'danbooru',
			urlBuilder: Danbooru.POST_URL_BUILDER,
			id: `${dto.id}`,
			title: '',
			tags: dto.tag_string.split(' '),
			sources: getSourcesArray(dto.source),
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
			extra: {
				parentId: dto.parent_id,
				md5: dto.md5,
				approverId: dto.approver_id,
				fileExt: dto.file_ext,
				fileSize: dto.file_size,
				upScore: dto.up_score,
				downScore: dto.down_score,
				favCount: dto.fav_count,
				isPending: dto.is_pending,
				isFlagged: dto.is_flagged,
				isDeleted: dto.is_deleted,
				tagCount: dto.tag_count,
				tagCountGeneral: dto.tag_count_general,
				tagCountArtist: dto.tag_count_artist,
				tagCountCopyright: dto.tag_count_copyright,
				tagCountCharacter: dto.tag_count_character,
				tagCountMeta: dto.tag_count_meta,
				lastCommentedAt: dto.last_commented_at
					? new Date(dto.last_commented_at)
					: undefined,
				lastCommentBumpedAt: dto.last_comment_bumped_at
					? new Date(dto.last_comment_bumped_at)
					: undefined,
				lastNotedAt: dto.last_noted_at,
				hasChildren: dto.has_children,
				hasActiveChildren: dto.has_active_children,
				pixivId: dto.pixiv_id,
				bitFlags: dto.bit_flags,
				updatedAt: new Date(dto.updated_at),
				hasLarge: dto.has_large,
			},
		});
	}
}
