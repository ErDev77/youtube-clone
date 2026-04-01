// app/api/playlists/[id]/videos/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

async function resolveParams(context: Params) {
	return 'then' in context.params ? await context.params : context.params
}

// POST /api/playlists/[id]/videos — add a video
export async function POST(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const { id: playlistId } = await resolveParams(context)
		const { video_id } = await req.json()

		if (!video_id)
			return NextResponse.json(
				{ ok: false, error: 'video_id required' },
				{ status: 400 },
			)

		// Verify ownership
		const owner = await pool.query(
			'SELECT user_id FROM playlists WHERE id = $1',
			[playlistId],
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

		// Get next position
		const posResult = await pool.query(
			'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM playlist_videos WHERE playlist_id = $1',
			[playlistId],
		)
		const position = posResult.rows[0].next_pos

		await pool.query(
			`INSERT INTO playlist_videos (playlist_id, video_id, position)
			 VALUES ($1, $2, $3)
			 ON CONFLICT (playlist_id, video_id) DO NOTHING`,
			[playlistId, video_id, position],
		)

		// Bump updated_at on playlist
		await pool.query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [
			playlistId,
		])

		// Return updated video count
		const countResult = await pool.query(
			'SELECT COUNT(*)::int AS video_count FROM playlist_videos WHERE playlist_id = $1',
			[playlistId],
		)

		return NextResponse.json({
			ok: true,
			data: { added: true, video_count: countResult.rows[0].video_count },
		})
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/playlists/[id]/videos]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// DELETE /api/playlists/[id]/videos — remove a video
// Body: { video_id: string }
export async function DELETE(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const { id: playlistId } = await resolveParams(context)
		const { video_id } = await req.json()

		if (!video_id)
			return NextResponse.json(
				{ ok: false, error: 'video_id required' },
				{ status: 400 },
			)

		const owner = await pool.query(
			'SELECT user_id FROM playlists WHERE id = $1',
			[playlistId],
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

		await pool.query(
			'DELETE FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2',
			[playlistId, video_id],
		)

		// Re-number positions to keep them contiguous
		await pool.query(
			`UPDATE playlist_videos pv
			 SET position = sub.rn - 1
			 FROM (
				SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC, added_at ASC) AS rn
				FROM playlist_videos
				WHERE playlist_id = $1
			 ) sub
			 WHERE pv.id = sub.id`,
			[playlistId],
		)

		await pool.query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [
			playlistId,
		])

		return NextResponse.json({ ok: true, data: { removed: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/playlists/[id]/videos]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// PATCH /api/playlists/[id]/videos — reorder videos
// Body: { ordered_video_ids: string[] }
export async function PATCH(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const { id: playlistId } = await resolveParams(context)
		const { ordered_video_ids } = await req.json()

		if (!Array.isArray(ordered_video_ids)) {
			return NextResponse.json(
				{ ok: false, error: 'ordered_video_ids must be an array' },
				{ status: 400 },
			)
		}

		const owner = await pool.query(
			'SELECT user_id FROM playlists WHERE id = $1',
			[playlistId],
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

		// Update positions in a single query using unnest
		if (ordered_video_ids.length > 0) {
			const positions = ordered_video_ids.map((_, i) => i)
			await pool.query(
				`UPDATE playlist_videos pv
				 SET position = data.pos
				 FROM (SELECT unnest($1::uuid[]) AS vid, unnest($2::int[]) AS pos) AS data
				 WHERE pv.playlist_id = $3 AND pv.video_id = data.vid`,
				[ordered_video_ids, positions, playlistId],
			)
		}

		await pool.query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [
			playlistId,
		])
		return NextResponse.json({ ok: true, data: { reordered: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[PATCH /api/playlists/[id]/videos]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
