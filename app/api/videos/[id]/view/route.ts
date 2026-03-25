// app/api/videos/[id]/view/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(
	req: Request,
	context: { params: { id: string } | Promise<{ id: string }> },
) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		await pool.query(
			'UPDATE videos SET views_count = views_count + 1 WHERE id = $1',
			[id],
		)

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
