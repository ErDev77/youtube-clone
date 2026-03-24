// lib/auth/session.ts
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import type { Session, MaybeSession } from '@/types/auth'

export const AUTH_COOKIE = 'armtube_token'

/**
 * Reads and verifies the JWT from cookies.
 * Returns a Session object or null if unauthenticated / invalid.
 * Safe to call in Server Components, Route Handlers, and Middleware.
 */
export async function getSession(): Promise<MaybeSession> {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get(AUTH_COOKIE)?.value
		if (!token) return null

		const payload = await verifyJWT(token)

		if (
			typeof payload.userId !== 'string' ||
			typeof payload.email !== 'string'
		) {
			return null
		}

		return {
			userId: payload.userId,
			email: payload.email,
		} satisfies Session
	} catch {
		return null
	}
}

/**
 * Like getSession() but throws a 401 Response if unauthenticated.
 * Use inside Route Handlers that require auth.
 */
export async function requireSession(): Promise<Session> {
	const session = await getSession()
	if (!session) {
		throw new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		})
	}
	return session
}
