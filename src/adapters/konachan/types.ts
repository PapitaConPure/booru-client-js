import type { PostMapper } from '../../mappers/post-mapper';
import type { TagMapper } from '../../mappers/tag-mapper';
import type { FetchFn } from '../../utils/endpoint';
import type { DanbooruPostExtra } from '../danbooru/types';
import type { Konachan } from './client';
import type { KonachanPostDto, KonachanTagDto } from './dto';

export interface KonachanOptions {
	/**Mapper used to transform Konachan post DTOs into {@link Post} domain entities.*/
	postMapper?: PostMapper<KonachanPostDto, Konachan>;
	tagMapper?: TagMapper<KonachanTagDto>;
	fetchFn?: FetchFn;
}

export interface KonachanCredentials extends Record<string, never> {}

export type KonachanSearchOptions = object;

export interface KonachanPostExtra extends DanbooruPostExtra {}

export type KonachanPostRating = 's' | 'q' | 'e';
