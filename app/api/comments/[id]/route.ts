// app/api/comments/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

// DELETE /api/comments/[id] — delete a comment (owner only)
export async function DELETE(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const { id: commentId } = params

		const owner = await pool.query(
			'SELECT user_id, video_id FROM comments WHERE id = $1',
			[commentId],
		)

		if (owner.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Comment not found.' },
				{ status: 404 },
			)
		}

		if (owner.rows[0].user_id !== session.userId) {
			return NextResponse.json(
				{ ok: false, error: 'Forbidden.' },
				{ status: 403 },
			)
		}

		await pool.query('DELETE FROM comments WHERE id = $1', [commentId])

		await pool
			.query(
				'UPDATE videos SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1',
				[owner.rows[0].video_id],
			)
			.catch(() => {})

		return NextResponse.json({ ok: true, data: { deleted: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/comments/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
