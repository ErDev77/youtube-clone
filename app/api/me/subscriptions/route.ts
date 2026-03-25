// app/api/me/subscriptions/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

export async function GET() {
	try {
		const session = await requireSession()

		const result = await pool.query(
			`SELECT
				u.id,
				u.username,
				u.display_name,
				u.avatar_url,
				s.created_at as subscribed_at,
				COUNT(v.id) as video_count,
				MAX(v.created_at) as latest_video_at
			FROM subscriptions s
			JOIN users u ON u.id = s.channel_id
			LEFT JOIN videos v ON v.user_id = u.id
			WHERE s.subscriber_id = $1
			GROUP BY u.id, u.username, u.display_name, u.avatar_url, s.created_at
			ORDER BY MAX(v.created_at) DESC NULLS LAST, s.created_at DESC`,
			[session.userId],
		)

		return NextResponse.json({
			ok: true,
			data: { items: result.rows },
		})
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/subscriptions]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
