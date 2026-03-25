// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { signJWT } from '@/lib/auth/jwt'
import { AUTH_COOKIE } from '@/lib/auth/session'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { pool } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// username: 3-30 chars, letters/numbers/underscores/hyphens, must start with letter or number
const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { email, password, username } = body as {
			email?: string
			password?: string
			username?: string
		}

		// ── Validation ──────────────────────────────────────────────
		if (!email || !password || !username) {
			return NextResponse.json(
				{ ok: false, error: 'Email, username, and password are required.' },
				{ status: 400 },
			)
		}

		if (!EMAIL_RE.test(email)) {
			return NextResponse.json(
				{ ok: false, error: 'Please enter a valid email address.' },
				{ status: 400 },
			)
		}

		if (!USERNAME_RE.test(username)) {
			return NextResponse.json(
				{
					ok: false,
					error:
						'Username must be 3–30 characters and can only contain letters, numbers, underscores, or hyphens.',
				},
				{ status: 400 },
			)
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ ok: false, error: 'Password must be at least 8 characters.' },
				{ status: 400 },
			)
		}

		const normalizedEmail = email.toLowerCase().trim()
		const normalizedUsername = username.trim().toLowerCase()

		// ── Uniqueness checks ────────────────────────────────────────
		const [existingEmail, existingUsername] = await Promise.all([
			pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]),
			pool.query('SELECT id FROM users WHERE username = $1', [
				normalizedUsername,
			]),
		])

		if (existingEmail.rows.length > 0) {
			return NextResponse.json(
				{ ok: false, error: 'An account with this email already exists.' },
				{ status: 409 },
			)
		}

		if (existingUsername.rows.length > 0) {
			return NextResponse.json(
				{ ok: false, error: 'This username is already taken.' },
				{ status: 409 },
			)
		}

		// ── Create user ──────────────────────────────────────────────
		const passwordHash = await bcrypt.hash(password, 12)
		const id = randomUUID()

		await pool.query(
			'INSERT INTO users (id, email, username, password) VALUES ($1, $2, $3, $4)',
			[id, normalizedEmail, normalizedUsername, passwordHash],
		)

		// ── JWT + cookie ─────────────────────────────────────────────
		const token = await signJWT({ userId: id, email: normalizedEmail })

		const res = NextResponse.json(
			{
				ok: true,
				data: {
					user: { id, email: normalizedEmail, username: normalizedUsername },
				},
			},
			{ status: 201 },
		)

		res.cookies.set(AUTH_COOKIE, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7,
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
