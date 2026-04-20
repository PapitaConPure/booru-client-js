import type { PostMapper } from '../../mappers/post-mapper';
import type { DanbooruOptions, DanbooruPostExtra, DanbooruSearchOptions } from '../danbooru/types';
import type { Konachan } from './client';
import type { KonachanPostDto } from './dto';

export interface KonachanOptions extends Omit<DanbooruOptions, 'postMapper'> {
	/**Mapper used to transform Konachan post DTOs into {@link Post} domain entities.*/
	postMapper?: PostMapper<KonachanPostDto, Konachan>;
}

export interface KonachanCredentials extends Record<string, never> {}

export interface KonachanSearchOptions extends DanbooruSearchOptions {
	width?: number;
	height?: number;
}

export interface KonachanPostExtra extends DanbooruPostExtra {}
