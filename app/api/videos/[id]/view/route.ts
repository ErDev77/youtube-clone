// app/api/videos/[id]/view/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function POST(
	req: Request,
	context: { params: { id: string } | Promise<{ id: string }> },
) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		// Increment view count
		await pool.query(
			'UPDATE videos SET views_count = views_count + 1 WHERE id = $1',
			[id],
		)

		// Record in watch_history for authenticated users
		try {
			const session = await getSession()
			if (session) {
				await pool.query(
					`INSERT INTO watch_history (user_id, video_id, watched_at)
					 VALUES ($1, $2, NOW())
					 ON CONFLICT (user_id, video_id)
					 DO UPDATE SET watched_at = NOW()`,
					[session.userId, id],
				)
			}
		} catch {
			// Non-critical — don't fail the request if history insert fails
		}

		const result = await pool.query(
			'SELECT views_count FROM videos WHERE id = $1',
			[id],
		)
		return NextResponse.json({
			ok: true,
			data: { views_count: result.rows[0]?.views_count ?? 0 },
		})
	} catch (err) {
		console.error('[POST /api/videos/[id]/view]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
