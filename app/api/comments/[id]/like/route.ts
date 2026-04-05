// app/api/comments/[id]/like/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

// POST /api/comments/[id]/like — toggle like on a comment
export async function POST(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: commentId } = params

		const existing = await pool.query(
			'SELECT 1 FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
			[session.userId, commentId],
		)

		if (existing.rows.length > 0) {
			await pool.query(
				'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
				[session.userId, commentId],
			)
			await pool.query(
				'UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
				[commentId],
			)
		} else {
			await pool.query(
				'INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
				[session.userId, commentId],
			)
			await pool.query(
				'UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1',
				[commentId],
			)
		}

		const result = await pool.query(
			'SELECT likes_count FROM comments WHERE id = $1',
			[commentId],
		)

		return NextResponse.json({
			ok: true,
			data: {
				liked: existing.rows.length === 0,
				likes_count: result.rows[0]?.likes_count ?? 0,
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
