// app/api/me/playlists/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

// GET /api/me/playlists — list current user's playlists
export async function GET() {
	try {
		const session = await requireSession()

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
			GROUP BY p.id
			ORDER BY p.updated_at DESC`,
			[session.userId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/playlists]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// POST /api/me/playlists — create a playlist
export async function POST(req: Request) {
	try {
		const session = await requireSession()
		const { title, description, visibility } = await req.json()

		if (!title?.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'Title is required.' },
				{ status: 400 },
			)
		}

		const vis = visibility === 'private' ? 'private' : 'public'

		const result = await pool.query(
			`INSERT INTO playlists (user_id, title, description, visibility)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, title, description, visibility, created_at, updated_at`,
			[
				session.userId,
				title.trim().slice(0, 100),
				description?.trim().slice(0, 500) || null,
				vis,
			],
		)

		return NextResponse.json(
			{
				ok: true,
				data: {
					playlist: {
						...result.rows[0],
						video_count: 0,
						cover_thumbnail: null,
					},
				},
			},
			{ status: 201 },
		)
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/me/playlists]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
