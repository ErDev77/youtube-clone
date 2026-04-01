// app/api/videos/[id]/like/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

// POST /api/videos/[id]/like
// Body: { action: 'like' | 'dislike' }
// Toggles: if already liked/disliked with same action → removes it (un-like/un-dislike)
//          if opposite action → switches
export async function POST(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: videoId } = params

		const body = await req.json().catch(() => ({}))
		const action: 'like' | 'dislike' =
			body.action === 'dislike' ? 'dislike' : 'like'

		// Check existing reaction
		const existing = await pool.query(
			'SELECT action FROM video_reactions WHERE user_id = $1 AND video_id = $2',
			[session.userId, videoId],
		)

		let liked = false
		let disliked = false

		if (existing.rows.length > 0) {
			const currentAction = existing.rows[0].action

			if (currentAction === action) {
				// Same action → remove (toggle off)
				await pool.query(
					'DELETE FROM video_reactions WHERE user_id = $1 AND video_id = $2',
					[session.userId, videoId],
				)
			} else {
				// Different action → switch
				await pool.query(
					'UPDATE video_reactions SET action = $1 WHERE user_id = $2 AND video_id = $3',
					[action, session.userId, videoId],
				)
				liked = action === 'like'
				disliked = action === 'dislike'
			}
		} else {
			// No existing reaction → insert
			await pool.query(
				'INSERT INTO video_reactions (user_id, video_id, action) VALUES ($1, $2, $3)',
				[session.userId, videoId, action],
			)
			liked = action === 'like'
			disliked = action === 'dislike'
		}

		// Recount from reactions table for accuracy
		const counts = await pool.query(
			`SELECT
				COUNT(*) FILTER (WHERE action = 'like') AS likes_count,
				COUNT(*) FILTER (WHERE action = 'dislike') AS dislikes_count
			FROM video_reactions WHERE video_id = $1`,
			[videoId],
		)

		const { likes_count, dislikes_count } = counts.rows[0]

		// Update denormalized counts on the videos table
		await pool.query(
			'UPDATE videos SET likes_count = $1, dislikes_count = $2 WHERE id = $3',
			[likes_count, dislikes_count, videoId],
		)

		return NextResponse.json({
			ok: true,
			data: {
				liked,
				disliked,
				likes_count: parseInt(likes_count, 10),
				dislikes_count: parseInt(dislikes_count, 10),
			},
		})
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/videos/[id]/like]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// GET /api/videos/[id]/like — check current user's reaction
export async function GET(req: Request, context: Params) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: videoId } = params

		let liked = false
		let disliked = false

		try {
			const session = await requireSession()
			const existing = await pool.query(
				'SELECT action FROM video_reactions WHERE user_id = $1 AND video_id = $2',
				[session.userId, videoId],
			)
			if (existing.rows.length > 0) {
				liked = existing.rows[0].action === 'like'
				disliked = existing.rows[0].action === 'dislike'
			}
		} catch {
			// not authenticated — return defaults
		}

		const counts = await pool.query(
			`SELECT
				COUNT(*) FILTER (WHERE action = 'like') AS likes_count,
				COUNT(*) FILTER (WHERE action = 'dislike') AS dislikes_count
			FROM video_reactions WHERE video_id = $1`,
			[videoId],
		)

		const { likes_count, dislikes_count } = counts.rows[0]

		return NextResponse.json({
			ok: true,
			data: {
				liked,
				disliked,
				likes_count: parseInt(likes_count, 10),
				dislikes_count: parseInt(dislikes_count, 10),
			},
		})
	} catch (err) {
		console.error('[GET /api/videos/[id]/like]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
