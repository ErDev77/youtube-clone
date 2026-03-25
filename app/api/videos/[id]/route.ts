// app/api/videos/[id]/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

// GET /api/videos/[id]
export async function GET(req: Request, context: Params) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		const result = await pool.query(
			`SELECT v.*, u.username, u.display_name, u.avatar_url
			 FROM videos v
			 JOIN users u ON u.id = v.user_id
			 WHERE v.id = $1`,
			[id],
		)

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Video not found' },
				{ status: 404 },
			)
		}

		return NextResponse.json({ ok: true, data: { video: result.rows[0] } })
	} catch (err) {
		console.error('[GET /api/videos/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// PATCH /api/videos/[id]
export async function PATCH(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		// Verify ownership
		const owner = await pool.query('SELECT user_id FROM videos WHERE id = $1', [
			id,
		])
		if (owner.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Video not found' },
				{ status: 404 },
			)
		}
		if (owner.rows[0].user_id !== session.userId) {
			return NextResponse.json(
				{ ok: false, error: 'Forbidden' },
				{ status: 403 },
			)
		}

		const body = await req.json()
		const { title, description, category, video_type, thumbnail_url } =
			body as {
				title?: string
				description?: string | null
				category?: string
				video_type?: string
				thumbnail_url?: string | null
			}

		const updates: string[] = []
		const values: unknown[] = []
		let idx = 1

		if (title !== undefined) {
			updates.push(`title = $${idx++}`)
			values.push(title.trim().slice(0, 100))
		}
		if (description !== undefined) {
			updates.push(`description = $${idx++}`)
			// guard: description may arrive as null (no description set)
			values.push(
				description === null ? null : description.trim().slice(0, 500) || null,
			)
		}
		if (category !== undefined) {
			updates.push(`category = $${idx++}`)
			values.push(category)
		}
		if (video_type !== undefined) {
			updates.push(`video_type = $${idx++}`)
			values.push(video_type)
		}
		if (thumbnail_url !== undefined) {
			updates.push(`thumbnail_url = $${idx++}`)
			values.push(thumbnail_url || null)
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Nothing to update' },
				{ status: 400 },
			)
		}

		values.push(id)
		const result = await pool.query(
			`UPDATE videos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
			values,
		)

		return NextResponse.json({ ok: true, data: { video: result.rows[0] } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[PATCH /api/videos/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// DELETE /api/videos/[id]
export async function DELETE(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		// Verify ownership
		const owner = await pool.query('SELECT user_id FROM videos WHERE id = $1', [
			id,
		])
		if (owner.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Video not found' },
				{ status: 404 },
			)
		}
		if (owner.rows[0].user_id !== session.userId) {
			return NextResponse.json(
				{ ok: false, error: 'Forbidden' },
				{ status: 403 },
			)
		}

		await pool.query('DELETE FROM videos WHERE id = $1', [id])

		return NextResponse.json({ ok: true, data: { deleted: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/videos/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
