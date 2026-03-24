// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { signJWT } from '@/lib/auth/jwt'
import { AUTH_COOKIE } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { pool } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { email, password } = body as { email?: string; password?: string }

		// ── Validation ─────────────────────────────────────────
		if (!email || !password) {
			return NextResponse.json(
				{ ok: false, error: 'Email and password are required.' },
				{ status: 400 },
			)
		}

		if (!EMAIL_RE.test(email)) {
			return NextResponse.json(
				{ ok: false, error: 'Please enter a valid email address.' },
				{ status: 400 },
			)
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ ok: false, error: 'Password must be at least 8 characters.' },
				{ status: 400 },
			)
		}

		const normalized = email.toLowerCase().trim()

		// ── Uniqueness check ───────────────────────────────────
		const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
			normalized,
		])
		if (existing.rows.length > 0) {
			return NextResponse.json(
				{ ok: false, error: 'An account with this email already exists.' },
				{ status: 409 },
			)
		}

		// ── Create user ───────────────────────────────────────
		const passwordHash = await bcrypt.hash(password, 12)
		const user = {
			id: randomUUID(),
			email: normalized,
			passwordHash,
		}

		await pool.query(
			'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
			[user.id, user.email, user.passwordHash],
		)

		// ── Create JWT ────────────────────────────────────────
		const token = await signJWT({ userId: user.id, email: user.email })

		// ── Set auth cookie ──────────────────────────────────
		const res = NextResponse.json(
			{ ok: true, data: { user: { id: user.id, email: user.email } } },
			{ status: 201 },
		)

		res.cookies.set(AUTH_COOKIE, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 дней
			path: '/',
		})

		return res
	} catch (err) {
		console.error('[register]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error.' },
			{ status: 500 },
		)
	}
}
