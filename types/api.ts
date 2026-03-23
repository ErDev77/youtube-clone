// =============================================================================
// ARMTUBE — API TYPES  (types/api.ts)
// =============================================================================
// Types used both by route handlers (server) and fetch calls (client).
// Every API route should return one of the shapes defined here.
// =============================================================================

import type {
	UUID,
	Video,
	VideoCard,
	Comment,
	Playlist,
	PlaylistWithVideos,
	WatchHistoryEntry,
	WatchLaterEntry,
	UserProfile,
	VideoCategory,
	PaginatedResponse,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
	ok: true
	data: T
}

export interface ApiError {
	ok: false
	error: string
	/** Field-level validation errors, keyed by field name */
	fieldErrors?: Record<string, string>
}

/** Every API route returns one of these */
export type ApiResponse<T> = ApiSuccess<T> | ApiError

/** Shorthand for paginated list responses */
export type PagedResponse<T> = ApiSuccess<PaginatedResponse<T>>

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
export interface RegisterBody {
	email: string
	password: string
}
export type RegisterResponse = ApiResponse<{ user: UserProfile }>

// POST /api/auth/login
export interface LoginBody {
	email: string
	password: string
}
export type LoginResponse = ApiResponse<{ user: UserProfile }>

// POST /api/auth/logout
export type LogoutResponse = ApiResponse<{ message: string }>

// ─────────────────────────────────────────────────────────────────────────────
// VIDEOS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/videos  — feed
export interface GetVideosQuery {
	category?: VideoCategory
	cursor?: string // opaque base-64 cursor
	limit?: string // string because URLSearchParams
}
export type GetVideosResponse = PagedResponse<VideoCard>

// POST /api/videos  — upload
export interface CreateVideoBody {
	title: string
	description?: string
	thumbnail_url?: string
	video_url: string
	category: VideoCategory
}
export type CreateVideoResponse = ApiResponse<Video>

// GET /api/videos/[id]
export type GetVideoResponse = ApiResponse<Video>

// PATCH /api/videos/[id]
export interface UpdateVideoBody {
	title?: string
	description?: string
	thumbnail_url?: string
	category?: VideoCategory
}
export type UpdateVideoResponse = ApiResponse<Video>

// DELETE /api/videos/[id]
export type DeleteVideoResponse = ApiResponse<{ deleted: true }>

// POST /api/videos/[id]/like
export type LikeVideoResponse = ApiResponse<{
	liked: boolean
	likes_count: number
}>

// POST /api/videos/[id]/view
export type ViewVideoResponse = ApiResponse<{ views_count: number }>

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/videos/[id]/comments
export interface GetCommentsQuery {
	sort?: 'newest' | 'top'
	cursor?: string
	limit?: string
}
export type GetCommentsResponse = PagedResponse<Comment>

// GET /api/comments/[id]/replies
export interface GetRepliesQuery {
	cursor?: string
	limit?: string
}
export type GetRepliesResponse = PagedResponse<Comment>

// POST /api/comments
export interface CreateCommentBody {
	video_id: UUID
	content: string
	parent_comment_id?: UUID
}
export type CreateCommentResponse = ApiResponse<Comment>

// DELETE /api/comments/[id]
export type DeleteCommentResponse = ApiResponse<{ deleted: true }>

// POST /api/comments/[id]/like
export type LikeCommentResponse = ApiResponse<{
	liked: boolean
	likes_count: number
}>

// ─────────────────────────────────────────────────────────────────────────────
// ME ENDPOINTS  (authenticated user)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/me/history
export interface GetHistoryQuery {
	cursor?: string
	limit?: string
}
export type GetHistoryResponse = PagedResponse<WatchHistoryEntry>

// DELETE /api/me/history  — clear all
export type ClearHistoryResponse = ApiResponse<{ deleted: true }>

// GET /api/me/watch-later
export type GetWatchLaterResponse = PagedResponse<WatchLaterEntry>

// POST /api/me/watch-later
export interface AddWatchLaterBody {
	video_id: UUID
}
export type AddWatchLaterResponse = ApiResponse<{ added: true }>

// DELETE /api/me/watch-later/[videoId]
export type RemoveWatchLaterResponse = ApiResponse<{ removed: true }>

// GET /api/me/liked
export type GetLikedResponse = PagedResponse<VideoCard>

// GET /api/me/subscriptions
export type GetSubscriptionsResponse = ApiResponse<UserProfile[]>

// GET /api/me/playlists
export type GetMyPlaylistsResponse = ApiResponse<Playlist[]>

// ─────────────────────────────────────────────────────────────────────────────
// PLAYLISTS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/playlists
export interface CreatePlaylistBody {
	title: string
	description?: string
}
export type CreatePlaylistResponse = ApiResponse<Playlist>

// GET /api/playlists/[id]
export type GetPlaylistResponse = ApiResponse<PlaylistWithVideos>

// PATCH /api/playlists/[id]
export interface UpdatePlaylistBody {
	title?: string
	description?: string
}
export type UpdatePlaylistResponse = ApiResponse<Playlist>

// DELETE /api/playlists/[id]
export type DeletePlaylistResponse = ApiResponse<{ deleted: true }>

// POST /api/playlists/[id]/videos
export interface AddVideoToPlaylistBody {
	video_id: UUID
	position?: number
}
export type AddVideoToPlaylistResponse = ApiResponse<{ added: true }>

// DELETE /api/playlists/[id]/videos/[videoId]
export type RemoveVideoFromPlaylistResponse = ApiResponse<{ removed: true }>

// ─────────────────────────────────────────────────────────────────────────────
// USERS / CHANNEL ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/users/[id]
export type GetUserResponse = ApiResponse<UserProfile>

// GET /api/users/[id]/videos
export interface GetUserVideosQuery {
	cursor?: string
	limit?: string
}
export type GetUserVideosResponse = PagedResponse<VideoCard>

// POST /api/users/[id]/subscribe
export type SubscribeResponse = ApiResponse<{ subscribed: boolean }>

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/search
export interface SearchQuery {
	q: string
	category?: VideoCategory
	cursor?: string
	limit?: string
}
export type SearchResponse = PagedResponse<VideoCard>
