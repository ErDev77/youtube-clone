// app/api/me/history/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

// GET /api/me/history
export async function GET() {
	try {
		const session = await requireSession()

		const result = await pool.query(
			`SELECT
				wh.watched_at,
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
			FROM watch_history wh
			JOIN videos v ON v.id = wh.video_id
			JOIN users  u ON u.id = v.user_id
			WHERE wh.user_id = $1
			ORDER BY wh.watched_at DESC`,
			[session.userId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/history]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// DELETE /api/me/history — remove one or all
export async function DELETE(req: Request) {
	try {
		const session = await requireSession()
		const body = await req.json().catch(() => ({}))
		const { video_id, clear_all } = body as {
			video_id?: string
			clear_all?: boolean
		}

		if (clear_all) {
			await pool.query('DELETE FROM watch_history WHERE user_id = $1', [
				session.userId,
			])
			return NextResponse.json({ ok: true, data: { cleared: true } })
		}

		if (!video_id) {
			return NextResponse.json(
				{ ok: false, error: 'video_id or clear_all required.' },
				{ status: 400 },
			)
		}

		await pool.query(
			'DELETE FROM watch_history WHERE user_id = $1 AND video_id = $2',
			[session.userId, video_id],
		)
		return NextResponse.json({ ok: true, data: { removed: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/me/history]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
