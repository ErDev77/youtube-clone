import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const q = searchParams.get('q')?.trim()

		if (!q || q.length < 2) {
			return NextResponse.json({ ok: true, data: [] })
		}

		const { rows } = await pool.query(
			`SELECT title
       FROM videos
       WHERE title ILIKE $1
       ORDER BY views_count DESC
       LIMIT 8`,
			[`%${q}%`],
		)

		const titles = [...new Set(rows.map((r: { title: string }) => r.title))]

		return NextResponse.json({ ok: true, data: titles })
	} catch (err) {
		console.error('[GET /api/videos/suggestions]', err)
		return NextResponse.json({ ok: false, data: [] })
	}
}
