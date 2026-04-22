// app/api/comments/[id]/replies/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

type Params = { params: { id: string } | Promise<{ id: string }> }

// GET /api/comments/[id]/replies
export async function GET(req: Request, context: Params) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: commentId } = params

		let userId: string | null = null
		try {
			const session = await getSession()
			if (session) userId = session.userId
		} catch {}

		const result = await pool.query(
			`SELECT
				c.id, c.content, c.created_at, c.likes_count, c.dislikes_count,
				c.user_id, c.parent_comment_id,
				u.username, u.display_name, u.avatar_url
				${userId ? `, EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2 AND cl.action = 'like') AS is_liked` : ', false AS is_liked'}
				${userId ? `, EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2 AND cl.action = 'dislike') AS is_disliked` : ', false AS is_disliked'}
			FROM comments c
			JOIN users u ON u.id = c.user_id
			WHERE c.parent_comment_id = $1
			ORDER BY c.created_at ASC
			LIMIT 100`,
			userId ? [commentId, userId] : [commentId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		console.error('[GET /api/comments/[id]/replies]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
