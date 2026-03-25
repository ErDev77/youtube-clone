import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const category = searchParams.get('category')
		const cursor_created_at = searchParams.get('cursor_created_at')
		const cursor_id = searchParams.get('cursor_id')
		const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

		const values: unknown[] = []
		let i = 1
		let where = 'WHERE 1=1'

		if (category) {
			where += ` AND v.category = $${i++}`
			values.push(category)
		}
		if (cursor_created_at && cursor_id) {
			where += ` AND (v.created_at, v.id) < ($${i++}::timestamptz, $${i++}::uuid)`
			values.push(cursor_created_at, cursor_id)
		}
		values.push(limit + 1)

		const { rows } = await pool.query(
			`
			SELECT v.id, v.title, v.thumbnail_url, v.video_url, v.category,
			       v.video_type, v.views_count, v.likes_count, v.created_at,
			       u.id AS uploader_id, u.username, u.display_name, u.avatar_url
			FROM videos v
			JOIN users u ON u.id = v.user_id
			${where}
			ORDER BY v.created_at DESC, v.id DESC
			LIMIT $${i}
		`,
			values,
		)

		const has_more = rows.length > limit
		const items = has_more ? rows.slice(0, limit) : rows
		const last = items[items.length - 1]
		const next_cursor =
			has_more && last
				? Buffer.from(
						JSON.stringify({ created_at: last.created_at, id: last.id }),
					).toString('base64')
				: null

		return NextResponse.json({
			ok: true,
			data: {
				has_more,
				next_cursor,
				items: items.map(r => ({
					id: r.id,
					title: r.title,
					thumbnail_url: r.thumbnail_url,
					video_url: r.video_url,
					category: r.category,
					video_type: r.video_type,
					views_count: r.views_count,
					likes_count: r.likes_count,
					created_at: r.created_at,
					uploader: {
						id: r.uploader_id,
						username: r.display_name || r.username,
						avatar_url: r.avatar_url,
					},
				})),
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

export async function POST(req: Request) {
	try {
		const session = await requireSession()
		const {
			title,
			description,
			thumbnail_url,
			video_url,
			category,
			video_type,
		} = await req.json()

		if (!title?.trim() || !video_url) {
			return NextResponse.json(
				{ ok: false, error: 'title and video_url are required.' },
				{ status: 400 },
			)
		}

		const id = randomUUID()
		const { rows } = await pool.query(
			`INSERT INTO videos (id, user_id, title, description, thumbnail_url, video_url, category, video_type)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			 RETURNING id, title, thumbnail_url, video_url, category, video_type, views_count, likes_count, created_at`,
			[
				id,
				session.userId,
				title.trim(),
				description?.trim() || null,
				thumbnail_url || null,
				video_url,
				category || null,
				video_type || 'normal',
			],
		)

		return NextResponse.json(
			{ ok: true, data: { video: rows[0] } },
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
