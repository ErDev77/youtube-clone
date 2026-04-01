// app/api/playlists/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

async function resolveParams(context: Params) {
	return 'then' in context.params ? await context.params : context.params
}

// GET /api/playlists/[id] — get playlist with its videos (public or owner)
export async function GET(req: Request, context: Params) {
	try {
		const { id } = await resolveParams(context)

		const plResult = await pool.query(
			`SELECT p.*, u.username, u.display_name, u.avatar_url,
				COUNT(pv.id)::int AS video_count
			FROM playlists p
			JOIN users u ON u.id = p.user_id
			LEFT JOIN playlist_videos pv ON pv.playlist_id = p.id
			WHERE p.id = $1
			GROUP BY p.id, u.username, u.display_name, u.avatar_url`,
			[id],
		)

		if (plResult.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Playlist not found' },
				{ status: 404 },
			)
		}

		const playlist = plResult.rows[0]

		// Check visibility — private playlists only accessible by owner
		if (playlist.visibility === 'private') {
			try {
				const session = await requireSession()
				if (session.userId !== playlist.user_id) {
					return NextResponse.json(
						{ ok: false, error: 'Forbidden' },
						{ status: 403 },
					)
				}
			} catch {
				return NextResponse.json(
					{ ok: false, error: 'Forbidden' },
					{ status: 403 },
				)
			}
		}

		// Fetch ordered videos
		const videosResult = await pool.query(
			`SELECT
				v.id, v.title, v.thumbnail_url, v.video_url, v.views_count,
				v.likes_count, v.category, v.video_type, v.created_at,
				u.id AS uploader_id, u.username, u.display_name, u.avatar_url AS uploader_avatar,
				pv.position, pv.added_at
			FROM playlist_videos pv
			JOIN videos v ON v.id = pv.video_id
			JOIN users u ON u.id = v.user_id
			WHERE pv.playlist_id = $1
			ORDER BY pv.position ASC`,
			[id],
		)

		return NextResponse.json({
			ok: true,
			data: {
				playlist,
				videos: videosResult.rows,
			},
		})
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/playlists/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// PATCH /api/playlists/[id] — update playlist metadata
export async function PATCH(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const { id } = await resolveParams(context)

		const owner = await pool.query(
			'SELECT user_id FROM playlists WHERE id = $1',
			[id],
		)
		if (owner.rows.length === 0)
			return NextResponse.json(
				{ ok: false, error: 'Not found' },
				{ status: 404 },
			)
		if (owner.rows[0].user_id !== session.userId)
			return NextResponse.json(
				{ ok: false, error: 'Forbidden' },
				{ status: 403 },
			)

		const { title, description, visibility } = await req.json()

		const updates: string[] = ['updated_at = NOW()']
		const values: unknown[] = []
		let idx = 1

		if (title !== undefined) {
			updates.push(`title = $${idx++}`)
			values.push(title.trim().slice(0, 100))
		}
		if (description !== undefined) {
			updates.push(`description = $${idx++}`)
			values.push(description?.trim().slice(0, 500) || null)
		}
		if (visibility !== undefined) {
			updates.push(`visibility = $${idx++}`)
			values.push(visibility === 'private' ? 'private' : 'public')
		}

		values.push(id)
		const result = await pool.query(
			`UPDATE playlists SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
			values,
		)

		return NextResponse.json({ ok: true, data: { playlist: result.rows[0] } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[PATCH /api/playlists/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// DELETE /api/playlists/[id]
export async function DELETE(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const { id } = await resolveParams(context)

		const owner = await pool.query(
			'SELECT user_id FROM playlists WHERE id = $1',
			[id],
		)
		if (owner.rows.length === 0)
			return NextResponse.json(
				{ ok: false, error: 'Not found' },
				{ status: 404 },
			)
		if (owner.rows[0].user_id !== session.userId)
			return NextResponse.json(
				{ ok: false, error: 'Forbidden' },
				{ status: 403 },
			)

		await pool.query('DELETE FROM playlists WHERE id = $1', [id])
		return NextResponse.json({ ok: true, data: { deleted: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/playlists/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
