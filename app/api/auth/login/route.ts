// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { signJWT } from '@/lib/auth/jwt'
import { AUTH_COOKIE } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'
import { pool } from '@/lib/db'

// POST /api/auth/login
export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { email, password } = body as { email?: string; password?: string }

		if (!email || !password) {
			return NextResponse.json(
				{ ok: false, error: 'Email and password are required.' },
				{ status: 400 },
			)
		}

		const normalizedEmail = email.toLowerCase().trim()

		// 1️⃣ Ищем пользователя в базе
		const result = await pool.query(
			'SELECT id, email, password FROM users WHERE email = $1',
			[normalizedEmail],
		)

		const user = result.rows[0]

		// 2️⃣ Если пользователя нет — generic error
		const invalid = () =>
			NextResponse.json(
				{ ok: false, error: 'Invalid email or password.' },
				{ status: 401 },
			)

		if (!user) return invalid()

		// 3️⃣ Проверка пароля
		const passwordOk = await bcrypt.compare(password, user.password)
		if (!passwordOk) return invalid()

		// 4️⃣ Создаём JWT
		const token = await signJWT({ userId: user.id, email: user.email })

		// 5️⃣ Ставим cookie
		const res = NextResponse.json({
			ok: true,
			data: { user: { id: user.id, email: user.email } },
		})

		res.cookies.set(AUTH_COOKIE, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 дней
			path: '/',
		})

		return res
	} catch (err) {
		console.error('[login]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error.' },
			{ status: 500 },
		)
	}
}
