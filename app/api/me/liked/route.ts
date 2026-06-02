// app/api/me/liked/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

// GET /api/me/liked — list all videos the current user has liked
export async function GET() {
	try {
		const session = await requireSession()

		const result = await pool.query(
			`SELECT
				vr.created_at AS liked_at,
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
			FROM video_reactions vr
			JOIN videos v ON v.id = vr.video_id
			JOIN users  u ON u.id = v.user_id
			WHERE vr.user_id = $1
			  AND vr.action  = 'like'
			ORDER BY vr.created_at DESC`,
			[session.userId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/liked]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

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
			`DELETE FROM video_reactions WHERE user_id = $1 AND video_id = $2 AND action = 'like'`,
			[session.userId, video_id],
		)

		return NextResponse.json({ ok: true, data: { removed: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/me/liked]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}