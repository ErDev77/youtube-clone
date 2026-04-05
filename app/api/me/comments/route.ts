// app/api/me/comments/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

// GET /api/me/comments — list all comments the current user has written
export async function GET() {
	try {
		const session = await requireSession()

		const result = await pool.query(
			`SELECT
				c.id,
				c.content,
				c.created_at,
				c.likes_count,
				c.video_id,
				c.parent_comment_id,
				v.title        AS video_title,
				v.thumbnail_url AS video_thumbnail,
				v.video_type
			FROM comments c
			JOIN videos v ON v.id = c.video_id
			WHERE c.user_id = $1
			ORDER BY c.created_at DESC`,
			[session.userId],
		)

		return NextResponse.json({ ok: true, data: { items: result.rows } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[GET /api/me/comments]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// DELETE /api/me/comments — delete a specific comment
export async function DELETE(req: Request) {
	try {
		const session = await requireSession()
		const { comment_id } = await req.json()

		if (!comment_id) {
			return NextResponse.json(
				{ ok: false, error: 'comment_id is required.' },
				{ status: 400 },
			)
		}

		// Verify ownership
		const owner = await pool.query(
			'SELECT user_id FROM comments WHERE id = $1',
			[comment_id],
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

		await pool.query('DELETE FROM comments WHERE id = $1', [comment_id])
		return NextResponse.json({ ok: true, data: { deleted: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/me/comments]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
