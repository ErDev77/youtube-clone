// app/api/comments/[id]/like/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

// POST /api/comments/[id]/like — toggle like or dislike on a comment
export async function POST(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: commentId } = params

		const body = await req.json().catch(() => ({}))
		const action: 'like' | 'dislike' =
			body.action === 'dislike' ? 'dislike' : 'like'

		const existing = await pool.query(
			'SELECT action FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
			[session.userId, commentId],
		)

		let liked = false
		let disliked = false

		if (existing.rows.length > 0) {
			const currentAction = existing.rows[0].action
			if (currentAction === action) {
				// Toggle off
				await pool.query(
					'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
					[session.userId, commentId],
				)
			} else {
				// Switch reaction
				await pool.query(
					'UPDATE comment_likes SET action = $1 WHERE user_id = $2 AND comment_id = $3',
					[action, session.userId, commentId],
				)
				liked = action === 'like'
				disliked = action === 'dislike'
			}
		} else {
			await pool.query(
				'INSERT INTO comment_likes (user_id, comment_id, action) VALUES ($1, $2, $3)',
				[session.userId, commentId, action],
			)
			liked = action === 'like'
			disliked = action === 'dislike'
		}

		// Recount
		const counts = await pool.query(
			`SELECT
				COUNT(*) FILTER (WHERE action = 'like') AS likes_count,
				COUNT(*) FILTER (WHERE action = 'dislike') AS dislikes_count
			FROM comment_likes WHERE comment_id = $1`,
			[commentId],
		)
		const { likes_count, dislikes_count } = counts.rows[0]

		// Sync counts to comments table
		await pool
			.query(
				'UPDATE comments SET likes_count = $1, dislikes_count = $2 WHERE id = $3',
				[likes_count, dislikes_count, commentId],
			)
			.catch(() => {
				// dislikes_count column may not exist yet — just update likes
				pool
					.query('UPDATE comments SET likes_count = $1 WHERE id = $2', [
						likes_count,
						commentId,
					])
					.catch(() => {})
			})

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
		console.error('[POST /api/comments/[id]/like]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
