// app/api/me/profile/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

export async function PATCH(req: Request) {
	try {
		const session = await requireSession()
		const body = await req.json()

		const { display_name, bio, avatar_url, banner_url } = body as {
			display_name?: string
			bio?: string
			avatar_url?: string
			banner_url?: string
		}

		// Build dynamic SET clause — only update fields that were sent
		const updates: string[] = []
		const values: unknown[] = []
		let idx = 1

		if (display_name !== undefined) {
			updates.push(`display_name = $${idx++}`)
			values.push(display_name.trim().slice(0, 50))
		}
		if (bio !== undefined) {
			updates.push(`bio = $${idx++}`)
			values.push(bio.trim().slice(0, 300))
		}
		if (avatar_url !== undefined) {
			updates.push(`avatar_url = $${idx++}`)
			values.push(avatar_url)
		}
		if (banner_url !== undefined) {
			updates.push(`banner_url = $${idx++}`)
			values.push(banner_url)
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Nothing to update' },
				{ status: 400 },
			)
		}

		values.push(session.userId)

		await pool.query(
			`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
			values,
		)

		return NextResponse.json({ ok: true })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[PATCH /api/me/profile]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
