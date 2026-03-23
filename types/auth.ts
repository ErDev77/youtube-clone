// =============================================================================
// ARMTUBE — AUTH TYPES  (lib/auth/types.ts)
// =============================================================================
// Import these anywhere you need auth-specific shapes.
// The root types/index.ts re-exports some of these, but keeping them here
// makes the auth module self-contained.
// =============================================================================

import type { UUID } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// JWT
// ─────────────────────────────────────────────────────────────────────────────

/** What we encode into the JWT — keep it small */
export interface JWTPayload {
	userId: UUID
	email: string
	iat?: number // issued-at  — set by jose automatically
	exp?: number // expiry     — set by jose automatically
}

/** Cookie name used for the auth token */
export const AUTH_COOKIE = 'armtube_token' as const

/** JWT expiry string accepted by jose */
export const JWT_EXPIRY = '7d' as const

// ─────────────────────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The minimal identity object available to server components and route
 * handlers after a token has been verified.
 */
export interface Session {
	userId: UUID
	email: string
}

/** Returned by `getSession()` — null when no valid token exists */
export type MaybeSession = Session | null

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER / LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterInput {
	email: string
	/** Plain-text; must be hashed before storage */
	password: string
}

export interface LoginInput {
	email: string
	password: string
}

/** What the auth API endpoints return to the browser */
export interface AuthResponse {
	ok: boolean
	/** Present on success */
	user?: {
		id: UUID
		email: string
	}
	/** Present on failure */
	error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthValidationErrors {
	email?: string
	password?: string
	confirmPassword?: string
}

/**
 * Result of client-side form validation.
 * `valid: true` means the form can be submitted.
 */
export type ValidationResult =
	| { valid: true }
	| { valid: false; errors: AuthValidationErrors }

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Passed internally within middleware.ts to avoid re-parsing the URL.
 */
export interface MiddlewareContext {
	/** Full original pathname, e.g. "/hy/history" */
	pathname: string
	/** Locale extracted from the URL, e.g. "hy" */
	locale: string
	/** Pathname without locale prefix, e.g. "/history" */
	pathWithoutLocale: string
	/** Whether this path requires authentication */
	isProtected: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK TYPES  (used by useAuth.ts on the client)
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAuthReturn {
	/** null while loading, undefined if unauthenticated */
	user: { id: UUID; email: string } | null | undefined
	isLoading: boolean
	isAuthenticated: boolean
	login: (input: LoginInput) => Promise<AuthResponse>
	register: (
		input: RegisterInput & { confirmPassword: string },
	) => Promise<AuthResponse>
	logout: () => Promise<void>
}
