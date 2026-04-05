// types/auth.ts
import type { UUID } from '@/types'

export interface JWTPayload {
	userId: UUID
	email: string
	iat?: number
	exp?: number
}

export const AUTH_COOKIE = 'armtube_token' as const
export const JWT_EXPIRY = '7d' as const

export interface Session {
	userId: UUID
	email: string
}

export type MaybeSession = Session | null

export interface RegisterInput {
	email: string
	password: string
}

export interface LoginInput {
	email: string
	password: string
}

export interface AuthResponse {
	ok: boolean
	user?: {
		id: UUID
		email: string
		username?: string
	}
	error?: string
}

export interface AuthValidationErrors {
	email?: string
	password?: string
	confirmPassword?: string
}

export type ValidationResult =
	| { valid: true }
	| { valid: false; errors: AuthValidationErrors }

export interface MiddlewareContext {
	pathname: string
	locale: string
	pathWithoutLocale: string
	isProtected: boolean
}

export interface UseAuthReturn {
	user: { id: UUID; email: string; username: string } | null | undefined
	isLoading: boolean
	isAuthenticated: boolean
	login: (input: LoginInput) => Promise<AuthResponse>
	register: (
		input: RegisterInput & { confirmPassword: string },
	) => Promise<AuthResponse>
	logout: () => Promise<void>
}
