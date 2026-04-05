// app/api/me/settings/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

// PATCH /api/me/settings — handles password change
export async function PATCH(req: Request) {
	try {
		const session = await requireSession()
		const body = await req.json()
		const { action } = body as { action: string }

		// ── Change password ──────────────────────────────────────────────
		if (action === 'change_password') {
			const { current_password, new_password } = body as {
				current_password: string
				new_password: string
			}

			if (!current_password || !new_password) {
				return NextResponse.json(
					{ ok: false, error: 'Both current and new password are required.' },
					{ status: 400 },
				)
			}

			if (new_password.length < 8) {
				return NextResponse.json(
					{ ok: false, error: 'New password must be at least 8 characters.' },
					{ status: 400 },
				)
			}

			// Fetch current hash
			const result = await pool.query(
				'SELECT password FROM users WHERE id = $1',
				[session.userId],
			)
			if (result.rows.length === 0) {
				return NextResponse.json(
					{ ok: false, error: 'User not found.' },
					{ status: 404 },
				)
			}

			const valid = await bcrypt.compare(
				current_password,
				result.rows[0].password,
			)
			if (!valid) {
				return NextResponse.json(
					{ ok: false, error: 'Current password is incorrect.' },
					{ status: 400 },
				)
			}

			const newHash = await bcrypt.hash(new_password, 12)
			await pool.query('UPDATE users SET password = $1 WHERE id = $2', [
				newHash,
				session.userId,
			])

			return NextResponse.json({ ok: true, data: { updated: true } })
		}

		// ── Update username ──────────────────────────────────────────────
		if (action === 'change_username') {
			const { username } = body as { username: string }
			const USERNAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/

			if (!username || !USERNAME_RE.test(username)) {
				return NextResponse.json(
					{
						ok: false,
						error:
							'Username must be 3–30 characters: letters, numbers, _ or - only.',
					},
					{ status: 400 },
				)
			}

			const normalized = username.trim().toLowerCase()

			// Check uniqueness
			const existing = await pool.query(
				'SELECT id FROM users WHERE username = $1 AND id != $2',
				[normalized, session.userId],
			)
			if (existing.rows.length > 0) {
				return NextResponse.json(
					{ ok: false, error: 'This username is already taken.' },
					{ status: 409 },
				)
			}

			await pool.query('UPDATE users SET username = $1 WHERE id = $2', [
				normalized,
				session.userId,
			])

			return NextResponse.json({ ok: true, data: { username: normalized } })
		}

		// ── Update email ─────────────────────────────────────────────────
		if (action === 'change_email') {
			const { email, current_password } = body as {
				email: string
				current_password: string
			}
			const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

			if (!email || !EMAIL_RE.test(email)) {
				return NextResponse.json(
					{ ok: false, error: 'Please enter a valid email address.' },
					{ status: 400 },
				)
			}

			if (!current_password) {
				return NextResponse.json(
					{ ok: false, error: 'Current password is required to change email.' },
					{ status: 400 },
				)
			}

			// Verify password
			const result = await pool.query(
				'SELECT password FROM users WHERE id = $1',
				[session.userId],
			)
			const valid = await bcrypt.compare(
				current_password,
				result.rows[0].password,
			)
			if (!valid) {
				return NextResponse.json(
					{ ok: false, error: 'Current password is incorrect.' },
					{ status: 400 },
				)
			}

			const normalized = email.toLowerCase().trim()
			const existing = await pool.query(
				'SELECT id FROM users WHERE email = $1 AND id != $2',
				[normalized, session.userId],
			)
			if (existing.rows.length > 0) {
				return NextResponse.json(
					{ ok: false, error: 'An account with this email already exists.' },
					{ status: 409 },
				)
			}

			await pool.query('UPDATE users SET email = $1 WHERE id = $2', [
				normalized,
				session.userId,
			])

			return NextResponse.json({ ok: true, data: { email: normalized } })
		}

		return NextResponse.json(
			{ ok: false, error: 'Unknown action.' },
			{ status: 400 },
		)
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[PATCH /api/me/settings]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error.' },
			{ status: 500 },
		)
	}
}

// DELETE /api/me/settings — delete account
export async function DELETE(req: Request) {
	try {
		const session = await requireSession()
		const { current_password } = await req.json()

		if (!current_password) {
			return NextResponse.json(
				{ ok: false, error: 'Password is required to delete your account.' },
				{ status: 400 },
			)
		}

		const result = await pool.query(
			'SELECT password FROM users WHERE id = $1',
			[session.userId],
		)
		if (result.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'User not found.' },
				{ status: 404 },
			)
		}

		const valid = await bcrypt.compare(
			current_password,
			result.rows[0].password,
		)
		if (!valid) {
			return NextResponse.json(
				{ ok: false, error: 'Incorrect password.' },
				{ status: 400 },
			)
		}

		await pool.query('DELETE FROM users WHERE id = $1', [session.userId])
		return NextResponse.json({ ok: true, data: { deleted: true } })
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[DELETE /api/me/settings]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error.' },
			{ status: 500 },
		)
	}
}
