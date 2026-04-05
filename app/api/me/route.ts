// app/api/me/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

export async function GET() {
	const session = await getSession()

	if (!session) {
		return NextResponse.json(
			{ ok: false, error: 'Unauthorized' },
			{ status: 401 },
		)
	}

	const result = await pool.query(
		'SELECT id, email, username FROM users WHERE id = $1',
		[session.userId],
	)

	if (result.rows.length === 0) {
		return NextResponse.json(
			{ ok: false, error: 'User not found' },
			{ status: 404 },
		)
	}

	const user = result.rows[0]

	return NextResponse.json({
		ok: true,
		data: {
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
			},
		},
	})
}
