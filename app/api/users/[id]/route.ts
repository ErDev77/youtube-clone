// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
	req: Request,
	context: { params: { id: string } | Promise<{ id: string }> },
) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const { id } = params

		const result = await pool.query(
			`
			SELECT 
				id, 
				email, 
				username, 
				display_name, 
				avatar_url,
				banner_url,
				bio,
				created_at
			FROM users 
			WHERE id = $1
			`,
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
					display_name: user.display_name,
					avatar_url: user.avatar_url,
					banner_url: user.banner_url,
					bio: user.bio,
					created_at: user.created_at,
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
