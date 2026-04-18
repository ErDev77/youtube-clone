// app/api/me/notifications/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

// GET /api/me/notifications
// Returns latest 30 notifications for the current user.
export async function GET() {
	try {
		const session = await requireSession()

		const result = await pool.query(
			`SELECT
        n.id,
        n.type,
        n.is_read,
        n.created_at,
        n.video_id,
        -- actor info
        a.id          AS actor_id,
        a.username    AS actor_username,
        a.display_name AS actor_display_name,
        a.avatar_url  AS actor_avatar_url,
        -- video info (may be null)
        v.title       AS video_title,
        v.thumbnail_url AS video_thumbnail
      FROM notifications n
      JOIN users a ON a.id = n.actor_id
      LEFT JOIN videos v ON v.id = n.video_id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT 30`,
			[session.userId],
		)

		const unreadCount = result.rows.filter(r => !r.is_read).length

		return NextResponse.json({
			ok: true,
			data: {
				items: result.rows,
				unread_count: unreadCount,
			},
		})
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/notifications]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// PATCH /api/me/notifications — mark as read
// Body: { ids?: string[] }  — if omitted, marks ALL as read
export async function PATCH(req: Request) {
	try {
		const session = await requireSession()
		const body = await req.json().catch(() => ({}))
		const { ids } = body as { ids?: string[] }

		if (ids && ids.length > 0) {
			await pool.query(
				`UPDATE notifications
         SET is_read = TRUE
         WHERE recipient_id = $1 AND id = ANY($2::uuid[])`,
				[session.userId, ids],
			)
		} else {
			await pool.query(
				`UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1`,
				[session.userId],
			)
		}

		return NextResponse.json({ ok: true, data: { updated: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[PATCH /api/me/notifications]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
