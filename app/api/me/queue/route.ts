// app/api/me/queue/route.ts
// GET /api/me/queue?type=liked|watchlater|playlist&playlist_id=xxx
// Returns a compact ordered list of videos for the player queue sidebar.
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

export async function GET(req: Request) {
	try {
		const session = await requireSession()
		const { searchParams } = new URL(req.url)
		const type = searchParams.get('type') // 'liked' | 'watchlater' | 'playlist'
		const playlist_id = searchParams.get('playlist_id')

		let rows: {
			id: string
			title: string
			thumbnail_url: string | null
			views_count: number
			username: string
			display_name: string | null
		}[] = []

		if (type === 'liked') {
			const result = await pool.query(
				`SELECT v.id, v.title, v.thumbnail_url, v.views_count, u.username, u.display_name
				 FROM video_reactions vr
				 JOIN videos v ON v.id = vr.video_id
				 JOIN users  u ON u.id = v.user_id
				 WHERE vr.user_id = $1 AND vr.action = 'like'
				 ORDER BY vr.created_at DESC`,
				[session.userId],
			)
			rows = result.rows
		} else if (type === 'watchlater') {
			const result = await pool.query(
				`SELECT v.id, v.title, v.thumbnail_url, v.views_count, u.username, u.display_name
				 FROM watch_later wl
				 JOIN videos v ON v.id = wl.video_id
				 JOIN users  u ON u.id = v.user_id
				 WHERE wl.user_id = $1
				 ORDER BY wl.added_at DESC`,
				[session.userId],
			)
			rows = result.rows
		} else if (type === 'playlist' && playlist_id) {
			const result = await pool.query(
				`SELECT v.id, v.title, v.thumbnail_url, v.views_count, u.username, u.display_name
				 FROM playlist_videos pv
				 JOIN videos v ON v.id = pv.video_id
				 JOIN users  u ON u.id = v.user_id
				 WHERE pv.playlist_id = $1
				 ORDER BY pv.position ASC`,
				[playlist_id],
			)
			rows = result.rows
		} else {
			return NextResponse.json(
				{ ok: false, error: 'Invalid type' },
				{ status: 400 },
			)
		}

		return NextResponse.json({ ok: true, data: { items: rows } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/queue]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
