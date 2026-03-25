// app/api/videos/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/videos — public feed
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const category = searchParams.get('category')
		const cursor_created_at = searchParams.get('cursor_created_at')
		const cursor_id = searchParams.get('cursor_id')
		const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

		let query = `
			SELECT 
				v.id,
				v.title,
				v.thumbnail_url,
				v.video_url,
				v.category,
				v.views_count,
				v.likes_count,
				v.comments_count,
				v.created_at,
				u.id as uploader_id,
				u.username,
				u.display_name,
				u.avatar_url
			FROM videos v
			JOIN users u ON u.id = v.user_id
			WHERE 1=1
		`
		const params: unknown[] = []
		let paramIdx = 1

		if (category) {
			query += ` AND v.category = $${paramIdx++}`
			params.push(category)
		}

		if (cursor_created_at && cursor_id) {
			query += ` AND (v.created_at, v.id) < ($${paramIdx++}::timestamptz, $${paramIdx++}::uuid)`
			params.push(cursor_created_at, cursor_id)
		}

		query += ` ORDER BY v.created_at DESC, v.id DESC LIMIT $${paramIdx++}`
		params.push(limit + 1)

		const result = await pool.query(query, params)
		const rows = result.rows
		const has_more = rows.length > limit
		const items = has_more ? rows.slice(0, limit) : rows

		const next_cursor =
			has_more && items.length > 0
				? Buffer.from(
						JSON.stringify({
							created_at: items[items.length - 1].created_at,
							id: items[items.length - 1].id,
						}),
					).toString('base64')
				: null

		return NextResponse.json({
			ok: true,
			data: {
				items: items.map(row => ({
					id: row.id,
					title: row.title,
					thumbnail_url: row.thumbnail_url,
					video_url: row.video_url,
					category: row.category,
					views_count: row.views_count,
					likes_count: row.likes_count,
					comments_count: row.comments_count,
					created_at: row.created_at,
					uploader: {
						id: row.uploader_id,
						username: row.display_name || row.username,
						avatar_url: row.avatar_url,
					},
				})),
				next_cursor,
				has_more,
			},
		})
	} catch (err) {
		console.error('[GET /api/videos]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// POST /api/videos — create video (authenticated)
export async function POST(req: Request) {
	try {
		const session = await requireSession()
		const body = await req.json()
		const { title, description, thumbnail_url, video_url, category } = body as {
			title?: string
			description?: string
			thumbnail_url?: string
			video_url?: string
			category?: string
		}

		if (!title || !video_url || !category) {
			return NextResponse.json(
				{ ok: false, error: 'title, video_url, and category are required.' },
				{ status: 400 },
			)
		}

		const id = randomUUID()
		const result = await pool.query(
			`INSERT INTO videos (id, user_id, title, description, thumbnail_url, video_url, category)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 RETURNING id, title, thumbnail_url, video_url, category, views_count, likes_count, comments_count, created_at`,
			[
				id,
				session.userId,
				title.trim(),
				description?.trim() || null,
				thumbnail_url || null,
				video_url,
				category,
			],
		)

		return NextResponse.json(
			{ ok: true, data: { video: result.rows[0] } },
			{ status: 201 },
		)
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/videos]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
