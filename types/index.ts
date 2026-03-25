// =============================================================================
// ARMTUBE — GLOBAL TYPE DEFINITIONS
// =============================================================================
// Organisation:
//   1.  Primitives & shared enums
//   2.  Database row types  (1-to-1 with PostgreSQL tables)
//   3.  Domain / enriched types  (joins + computed fields)
//   4.  Auth types
//   5.  API request / response types
//   6.  Pagination types
//   7.  Form types
//   8.  i18n types
//   9.  Next.js helpers (params, search-params)
//  10.  UI / component prop types
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 1.  PRIMITIVES & SHARED ENUMS
// ─────────────────────────────────────────────────────────────────────────────

/** Must match the PostgreSQL ENUM `video_category` */
export type VideoCategory =
	| 'music'
	| 'streams'
	| 'news'
	| 'sport'
	| 'videogames'

export const VIDEO_CATEGORIES: VideoCategory[] = [
	'music',
	'streams',
	'news',
	'sport',
	'videogames',
]

export type VideoType = 'normal' | 'shorts'

export const VIDEO_TYPES: VideoType[] = ['normal', 'shorts']


export type Locale = 'en' | 'hy' | 'ru'
export const LOCALES: Locale[] = ['en', 'hy', 'ru']
export const DEFAULT_LOCALE: Locale = 'en'

/** Generic ID type — all PKs are UUIDs */
export type UUID = string

// ─────────────────────────────────────────────────────────────────────────────
// 2.  DATABASE ROW TYPES
//     Mirror every column in schema.sql exactly.
//     Use these when reading raw rows from Neon.
// ─────────────────────────────────────────────────────────────────────────────

export interface DbUser {
	id: UUID
	email: string
	username: string
	password: string
	created_at: Date
	display_name?: string
	bio?: string
	avatar_url?: string
	banner_url?: string
}

export interface DbVideo {
	id: UUID
	user_id: UUID
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	video_type: VideoType
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
// 3.  DOMAIN / ENRICHED TYPES
//     These are what the UI actually consumes — safe, joined, computed.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safe public user profile.
 * Password is intentionally absent — never include it here.
 */
export interface UserProfile {
	id: UUID
	email: string
	username: string // derived from email (before @) or a future display_name column
	created_at: string // ISO string (serialised from Date for JSON)
}

/** Uploader info embedded inside a video object */
export interface VideoUploader {
	id: UUID
	username: string
}

/** Full video as returned by the API to the client */
export interface Video {
	id: UUID
	uploader: VideoUploader
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	category: VideoCategory
	views_count: number
	likes_count: number
	comments_count: number
	created_at: string // ISO string
	/** Present only when the request is authenticated */
	is_liked?: boolean
	is_saved_for_later?: boolean
}

/** Minimal video card data — for feeds, grids, history lists */
export interface VideoCard {
	id: UUID
	title: string
	thumbnail_url: string | null
	duration?: string // e.g. "12:34" — stored/computed separately
	views_count: number
	created_at: string
	uploader: VideoUploader
	category: VideoCategory
}

/** Top-level comment or reply */
export interface Comment {
	id: UUID
	video_id: UUID
	author: UserProfile
	parent_comment_id: UUID | null
	content: string
	likes_count: number
	created_at: string
	/** Present only when authenticated */
	is_liked?: boolean
	/** Lazily loaded reply count */
	reply_count?: number
}

/** Playlist with its owner */
export interface Playlist {
	id: UUID
	owner: UserProfile
	title: string
	description: string | null
	video_count: number
	created_at: string
	/** First video thumbnail used as cover art */
	cover_thumbnail?: string | null
}

/** Playlist with its ordered videos */
export interface PlaylistWithVideos extends Playlist {
	videos: VideoCard[]
}

/** Watch-history entry */
export interface WatchHistoryEntry {
	video: VideoCard
	watched_at: string // ISO string
}

/** Watch-later entry */
export interface WatchLaterEntry {
	video: VideoCard
	added_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  AUTH TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of the JWT payload we sign */
export interface JWTPayload {
	userId: UUID
	email: string
	/** Issued-at timestamp (seconds) — added automatically by jose */
	iat?: number
	/** Expiry timestamp (seconds) — added automatically by jose */
	exp?: number
}

/**
 * The session object available in server components and route handlers.
 * Derived from a verified JWT — never contains the password.
 */
export interface Session {
	userId: UUID
	email: string
}

/** Result of a login / register API call */
export interface AuthResult {
	ok: boolean
	user?: UserProfile
	error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  API REQUEST / RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
	email: string
	password: string
}

export interface LoginRequest {
	email: string
	password: string
}

// ── Videos ───────────────────────────────────────────────────────────────────

export interface CreateVideoRequest {
	title: string
	description?: string
	thumbnail_url?: string
	video_url: string
	category: VideoCategory
}

export interface UpdateVideoRequest {
	title?: string
	description?: string
	thumbnail_url?: string
	category?: VideoCategory
}

export interface VideoFeedQuery {
	category?: VideoCategory
	cursor_created_at?: string // ISO string
	cursor_id?: UUID
	limit?: number // default 20, max 50
}

// ── Comments ─────────────────────────────────────────────────────────────────

export type CommentSortMode = 'newest' | 'top'

export interface CreateCommentRequest {
	video_id: UUID
	content: string
	parent_comment_id?: UUID
}

export interface CommentQuery {
	video_id: UUID
	sort?: CommentSortMode
	/** For "newest": ISO string */
	cursor_created_at?: string
	/** For "top": stringified number */
	cursor_likes_count?: string
	cursor_id?: UUID
	limit?: number
}

export interface RepliesQuery {
	parent_comment_id: UUID
	cursor_created_at?: string
	cursor_id?: UUID
	limit?: number
}

// ── Playlists ─────────────────────────────────────────────────────────────────

export interface CreatePlaylistRequest {
	title: string
	description?: string
}

export interface AddVideoToPlaylistRequest {
	video_id: UUID
	position?: number
}

// ── Generic API response wrappers ─────────────────────────────────────────────

export interface ApiSuccess<T> {
	ok: true
	data: T
}

export interface ApiError {
	ok: false
	error: string
	/** HTTP status code for client convenience */
	status?: number
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─────────────────────────────────────────────────────────────────────────────
// 6.  PAGINATION TYPES  (cursor-based — no OFFSET)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps any list response with cursor metadata.
 *
 * Usage in a route handler:
 *   return NextResponse.json<PaginatedResponse<VideoCard>>({
 *     items: rows,
 *     next_cursor: encodeCursor(lastRow),
 *     has_more: rows.length === limit,
 *   })
 */
export interface PaginatedResponse<T> {
	items: T[]
	/**
	 * Opaque base-64 encoded cursor string.
	 * Pass as `cursor` query param to fetch the next page.
	 * `null` means this is the last page.
	 */
	next_cursor: string | null
	has_more: boolean
}

/** Decoded cursor for video feeds (sorted by created_at DESC) */
export interface VideoCursor {
	created_at: string // ISO string
	id: UUID
}

/** Decoded cursor for "newest" comment sort */
export interface CommentNewestCursor {
	created_at: string
	id: UUID
}

/** Decoded cursor for "top" comment sort */
export interface CommentTopCursor {
	likes_count: number
	created_at: string
	id: UUID
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  FORM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginFormValues {
	email: string
	password: string
}

export interface RegisterFormValues {
	email: string
	password: string
	confirmPassword: string
}

export interface VideoUploadFormValues {
	title: string
	description: string
	category: VideoCategory
	/** File object from <input type="file"> */
	videoFile: File | null
	thumbnailFile: File | null
}

export interface CommentFormValues {
	content: string
}

export interface PlaylistFormValues {
	title: string
	description: string
}

/** Reusable form field state */
export interface FieldError {
	message: string
}

export type FormErrors<T> = Partial<Record<keyof T, FieldError>>

// ─────────────────────────────────────────────────────────────────────────────
// 8.  i18n TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the shape of messages/en.json.
 * Keep this in sync whenever you add / rename translation keys.
 */
export interface Messages {
	common: {
		loading: string
		error: string
		retry: string
		cancel: string
		save: string
		delete: string
		edit: string
		share: string
		views: string
		ago: string
	}
	nav: {
		home: string
		shorts: string
		subscriptions: string
		history: string
		playlists: string
		watchLater: string
		liked: string
		yourVideos: string
		music: string
		streams: string
		news: string
		sports: string
		videoGames: string
		languages: string
	}
	auth: {
		login: string
		register: string
		logout: string
		email: string
		password: string
		confirmPassword: string
		noAccount: string
		hasAccount: string
		invalidCredentials: string
		emailRequired: string
		passwordRequired: string
		passwordMismatch: string
	}
	video: {
		like: string
		liked: string
		save: string
		saved: string
		subscribe: string
		subscribed: string
		comments: string
		sortNewest: string
		sortTop: string
		addComment: string
		reply: string
		showReplies: string
		hideReplies: string
		uploadVideo: string
		noVideos: string
	}
	pages: {
		history: { title: string; empty: string }
		subscriptions: { title: string; empty: string }
		playlists: { title: string; empty: string; create: string }
		watchLater: { title: string; empty: string }
		liked: { title: string; empty: string }
		yourVideos: { title: string; empty: string; upload: string }
		settings: { title: string }
	}
	errors: {
		notFound: string
		unauthorized: string
		serverError: string
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 9.  NEXT.JS PAGE / LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props injected into every `page.tsx` and `layout.tsx` inside `[locale]`.
 * Use this as the base for all page prop types.
 */
export interface LocaleParams {
	locale: Locale
}

/** Page props for /[locale]/watch/[id] */
export interface WatchPageParams {
	locale: Locale
	id: UUID
}

/** Page props for /[locale]/channel/[userId] */
export interface ChannelPageParams {
	locale: Locale
	userId: UUID
}

/** Page props for /[locale]/playlists/[id] */
export interface PlaylistPageParams {
	locale: Locale
	id: UUID
}

/** Page props for /[locale]/category/[name] */
export interface CategoryPageParams {
	locale: Locale
	name: VideoCategory
}

/**
 * Generic Next.js 15+ page props shape.
 *
 * Usage:
 *   export default async function Page({ params, searchParams }: PageProps<WatchPageParams>) {}
 */
export interface PageProps<
	TParams = LocaleParams,
	TSearch extends Record<string, string | string[] | undefined> = Record<
		string,
		never
	>,
> {
	params: Promise<TParams>
	searchParams: Promise<TSearch>
}

/** Search params for the /results page */
export interface ResultsSearchParams {
	search_query?: string
	category?: VideoCategory
}

/** Search params for paginated feeds */
export interface FeedSearchParams {
	cursor?: string
	category?: VideoCategory
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. UI / COMPONENT PROP TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VideoCardProps {
	video: VideoCard
	/** Show uploader avatar + name (true by default) */
	showUploader?: boolean
	/** Compact mode for sidebar / queue */
	compact?: boolean
	className?: string
}

export interface CommentItemProps {
	comment: Comment
	/** Depth level — 0 = top-level, 1+ = nested reply */
	depth?: number
	onReply?: (commentId: UUID) => void
	onLike?: (commentId: UUID, liked: boolean) => void
	onDelete?: (commentId: UUID) => void
}

export interface VideoPlayerProps {
	video: Video
	/** Called once the video has played 30+ seconds (triggers view increment) */
	onViewCounted?: () => void
}

export interface AvatarProps {
	username: string
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	loading?: boolean
}

export interface InfiniteScrollProps<T> {
	items: T[]
	renderItem: (item: T) => React.ReactNode
	fetchNextPage: () => Promise<void>
	hasMore: boolean
	isLoading: boolean
	className?: string
}

export interface ModalProps {
	open: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
}
