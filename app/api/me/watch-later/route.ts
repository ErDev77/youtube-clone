// app/api/me/watch-later/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

// GET /api/me/watch-later — list all watch-later videos for the current user
export async function GET() {
	try {
		const session = await requireSession()

		const result = await pool.query(
			`SELECT
				wl.added_at,
				v.id,
				v.title,
				v.description,
				v.thumbnail_url,
				v.video_url,
				v.category,
				v.video_type,
				v.views_count,
				v.likes_count,
				v.created_at,
				u.id        AS uploader_id,
				u.username,
				u.display_name,
				u.avatar_url
			FROM watch_later wl
			JOIN videos v ON v.id = wl.video_id
			JOIN users  u ON u.id = v.user_id
			WHERE wl.user_id = $1
			ORDER BY wl.added_at DESC`,
			[session.userId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/watch-later]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// POST /api/me/watch-later — add a video (idempotent)
// Body: { video_id: string }
export async function POST(req: Request) {
	try {
		const session = await requireSession()
		const { video_id } = await req.json()

		if (!video_id) {
			return NextResponse.json(
				{ ok: false, error: 'video_id is required.' },
				{ status: 400 },
			)
		}

		await pool.query(
			`INSERT INTO watch_later (user_id, video_id)
			 VALUES ($1, $2)
			 ON CONFLICT (user_id, video_id) DO NOTHING`,
			[session.userId, video_id],
		)

		return NextResponse.json({ ok: true, data: { added: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/me/watch-later]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// DELETE /api/me/watch-later — remove a video
// Body: { video_id: string }
export async function DELETE(req: Request) {
	try {
		const session = await requireSession()
		const { video_id } = await req.json()

		if (!video_id) {
			return NextResponse.json(
				{ ok: false, error: 'video_id is required.' },
				{ status: 400 },
			)
		}

		await pool.query(
			`DELETE FROM watch_later WHERE user_id = $1 AND video_id = $2`,
			[session.userId, video_id],
		)

		return NextResponse.json({ ok: true, data: { removed: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/me/watch-later]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
