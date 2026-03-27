// app/api/comments/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'
import { randomUUID } from 'crypto'

// POST /api/comments — create a comment
export async function POST(req: Request) {
	try {
		const session = await requireSession()
		const { video_id, content, parent_comment_id } = await req.json()

		if (!video_id || !content?.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'video_id and content are required.' },
				{ status: 400 },
			)
		}

		const id = randomUUID()
		const result = await pool.query(
			`INSERT INTO comments (id, user_id, video_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, content, created_at, likes_count, user_id, video_id, parent_comment_id`,
			[id, session.userId, video_id, parent_comment_id || null, content.trim()],
		)

		// Fetch user info to return enriched comment
		const userResult = await pool.query(
			'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
			[session.userId],
		)

		const comment = {
			...result.rows[0],
			...userResult.rows[0],
		}

		// Update comments_count on video
		await pool
			.query(
				'UPDATE videos SET comments_count = comments_count + 1 WHERE id = $1',
				[video_id],
			)
			.catch(() => {}) // non-critical

		return NextResponse.json({ ok: true, data: { comment } }, { status: 201 })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/comments]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
