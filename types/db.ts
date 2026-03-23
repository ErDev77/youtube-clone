// =============================================================================
// ARMTUBE — DATABASE QUERY TYPES  (types/db.ts)
// =============================================================================
// Types used exclusively in lib/db/queries/*.ts
// These are the exact shapes that come back from Neon SQL results.
// ─────────────────────────────────────────────────────────────────────────────
// Convention:
//   - Db* prefix = raw row from the DB
//   - *Row suffix = a JOIN result (multiple tables in one row)
// =============================================================================

import type { UUID, VideoCategory } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// RAW TABLE ROWS
// ─────────────────────────────────────────────────────────────────────────────

export interface DbUser {
	id: UUID
	email: string
	password: string
	created_at: Date
}

export interface DbVideo {
	id: UUID
	user_id: UUID
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	category: VideoCategory
	views_count: number
	likes_count: number
	comments_count: number
	created_at: Date
}

export interface DbComment {
	id: UUID
	user_id: UUID
	video_id: UUID
	parent_comment_id: UUID | null
	content: string
	likes_count: number
	created_at: Date
}

export interface DbPlaylist {
	id: UUID
	user_id: UUID
	title: string
	description: string | null
	created_at: Date
}

export interface DbPlaylistVideo {
	playlist_id: UUID
	video_id: UUID
	position: number
}

export interface DbVideoLike {
	user_id: UUID
	video_id: UUID
	created_at: Date
}

export interface DbCommentLike {
	user_id: UUID
	comment_id: UUID
	created_at: Date
}

export interface DbWatchHistory {
	user_id: UUID
	video_id: UUID
	watched_at: Date
}

export interface DbWatchLater {
	user_id: UUID
	video_id: UUID
	added_at: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// JOIN RESULT ROWS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result of: SELECT videos.*, users.email as uploader_email
 *            FROM videos JOIN users ON users.id = videos.user_id
 */
export interface VideoWithUploaderRow extends DbVideo {
	uploader_email: string
}

/**
 * Result of: SELECT videos.*, users.email, vl.user_id as liked_by
 *            FROM videos
 *            JOIN users ON ...
 *            LEFT JOIN video_likes vl ON vl.video_id = videos.id AND vl.user_id = $userId
 */
export interface VideoWithLikeRow extends VideoWithUploaderRow {
	/** null if the requesting user has not liked this video */
	liked_by: UUID | null
	/** null if not in watch_later */
	saved_by: UUID | null
}

/**
 * Result of: SELECT comments.*, users.email as author_email
 *            FROM comments JOIN users ON users.id = comments.user_id
 */
export interface CommentWithAuthorRow extends DbComment {
	author_email: string
	/** null if the requesting user has not liked this comment */
	liked_by: UUID | null
}

/** Playlist row enriched with video count */
export interface PlaylistWithCountRow extends DbPlaylist {
	video_count: number
	/** thumbnail_url of the first video in the playlist, if any */
	cover_thumbnail: string | null
}

/** Watch-history row enriched with video info */
export interface HistoryRow {
	watched_at: Date
	video_id: UUID
	title: string
	thumbnail_url: string | null
	views_count: number
	created_at: Date // video's created_at
	uploader_id: UUID
	uploader_email: string
	category: VideoCategory
}

/** Watch-later row enriched with video info */
export interface WatchLaterRow {
	added_at: Date
	video_id: UUID
	title: string
	thumbnail_url: string | null
	views_count: number
	created_at: Date
	uploader_id: UUID
	uploader_email: string
	category: VideoCategory
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY OPTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationOptions {
	limit: number
}

/** Cursor options for video feed (ORDER BY created_at DESC, id DESC) */
export interface VideoCursorOptions extends PaginationOptions {
	cursor_created_at?: Date
	cursor_id?: UUID
}

/** Cursor options for "newest" comments */
export interface CommentNewestCursorOptions extends PaginationOptions {
	cursor_created_at?: Date
	cursor_id?: UUID
}

/** Cursor options for "top" comments */
export interface CommentTopCursorOptions extends PaginationOptions {
	cursor_likes_count?: number
	cursor_created_at?: Date
	cursor_id?: UUID
}

export interface GetVideosOptions extends VideoCursorOptions {
	category?: VideoCategory
	user_id?: UUID // filter by uploader
	/** When set, also fetches is_liked / is_saved */
	requesting_user_id?: UUID
}

export interface GetCommentsOptions {
	video_id: UUID
	sort: 'newest' | 'top'
	requesting_user_id?: UUID
	cursor?: CommentNewestCursorOptions | CommentTopCursorOptions
}

export interface GetRepliesOptions extends CommentNewestCursorOptions {
	parent_comment_id: UUID
	requesting_user_id?: UUID
}
