// app/api/videos/[id]/comments/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { randomUUID } from 'crypto'

type Params = { params: { id: string } | Promise<{ id: string }> }

// GET /api/videos/[id]/comments
export async function GET(req: Request, context: Params) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params
		const { searchParams } = new URL(req.url)
		const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

		const result = await pool.query(
			`SELECT
        c.id, c.content, c.created_at, c.likes_count,
        c.user_id,
        u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.video_id = $1 AND c.parent_comment_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2`,
			[id, limit],
		)

		const countResult = await pool.query(
			'SELECT COUNT(*) as total FROM comments WHERE video_id = $1',
			[id],
		)

		return NextResponse.json({
			ok: true,
			data: {
				items: result.rows,
				total: parseInt(countResult.rows[0]?.total ?? '0', 10),
			},
		})
	} catch (err) {
		console.error('[GET /api/videos/[id]/comments]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
