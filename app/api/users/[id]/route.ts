// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
	req: Request,
	context: { params: { id: string } | Promise<{ id: string }> },
) {
	try {
		// ⚡ unwrap, если params — Promise
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		// получаем юзера по id
		const result = await pool.query(
			'SELECT id, email, username FROM users WHERE id = $1',
			[id],
		)

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'User not found' },
				{ status: 404 },
			)
		}

		const user = result.rows[0]

		return NextResponse.json({
			ok: true,
			data: {
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
				},
			},
		})
	} catch (err) {
		console.error('[GET /api/users/[id]]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
