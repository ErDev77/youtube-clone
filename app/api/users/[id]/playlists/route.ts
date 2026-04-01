// app/api/users/[id]/playlists/route.ts
// GET /api/users/[id]/playlists — returns PUBLIC playlists for a channel
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

export async function GET(req: Request, context: Params) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: userId } = params

		const result = await pool.query(
			`SELECT
				p.id,
				p.title,
				p.description,
				p.visibility,
				p.created_at,
				p.updated_at,
				COUNT(pv.id)::int AS video_count,
				(
					SELECT v.thumbnail_url
					FROM playlist_videos pv2
					JOIN videos v ON v.id = pv2.video_id
					WHERE pv2.playlist_id = p.id
					ORDER BY pv2.position ASC
					LIMIT 1
				) AS cover_thumbnail
			FROM playlists p
			LEFT JOIN playlist_videos pv ON pv.playlist_id = p.id
			WHERE p.user_id = $1
				AND p.visibility = 'public'
			GROUP BY p.id
			ORDER BY p.updated_at DESC`,
			[userId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		console.error('[GET /api/users/[id]/playlists]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
