// app/api/me/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/me
 * Returns the currently authenticated user or 401.
 * Used by the client to check login state and get user info.
 */
export async function GET() {
	const session = await getSession()

	if (!session) {
		return NextResponse.json(
			{ ok: false, error: 'Unauthorized' },
			{ status: 401 },
		)
	}

	return NextResponse.json({
		ok: true,
		data: {
			user: {
				id: session.userId,
				email: session.email,
				username: session.email.split('@')[0],
			},
		},
	})
}
