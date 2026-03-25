// app/api/users/[id]/subscribe/route.ts
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { pool } from '@/lib/db'

type Params = { params: { id: string } | Promise<{ id: string }> }

// POST /api/users/[id]/subscribe  — toggles subscribe/unsubscribe
export async function POST(req: Request, context: Params) {
	try {
		const session = await requireSession()
		const params =
			'then' in context.params ? await context.params : context.params
		const channelId = params.id

		if (channelId === session.userId) {
			return NextResponse.json(
				{ ok: false, error: 'You cannot subscribe to yourself.' },
				{ status: 400 },
			)
		}

		// Check if already subscribed
		const existing = await pool.query(
			'SELECT 1 FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
			[session.userId, channelId],
		)

		if (existing.rows.length > 0) {
			// Unsubscribe
			await pool.query(
				'DELETE FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
				[session.userId, channelId],
			)
		} else {
			// Subscribe
			await pool.query(
				'INSERT INTO subscriptions (subscriber_id, channel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
				[session.userId, channelId],
			)
		}

		// Return updated count
		const countResult = await pool.query(
			'SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = $1',
			[channelId],
		)

		return NextResponse.json({
			ok: true,
			data: {
				subscribed: existing.rows.length === 0, // true = just subscribed
				subscribers_count: parseInt(countResult.rows[0].count, 10),
			},
		})
	} catch (err) {
		if (err instanceof Response) return err
		console.error('[POST /api/users/[id]/subscribe]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}

// GET /api/users/[id]/subscribe  — check status + count
export async function GET(req: Request, context: Params) {
	try {
		const params =
			'then' in context.params ? await context.params : context.params
		const channelId = params.id

		// Try to get current user (optional — not required to view count)
		let isSubscribed = false
		try {
			const session = await requireSession()
			const existing = await pool.query(
				'SELECT 1 FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
				[session.userId, channelId],
			)
			isSubscribed = existing.rows.length > 0
		} catch {
			// not authenticated — that's fine
		}

		const countResult = await pool.query(
			'SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = $1',
			[channelId],
		)

		return NextResponse.json({
			ok: true,
			data: {
				subscribed: isSubscribed,
				subscribers_count: parseInt(countResult.rows[0].count, 10),
			},
		})
	} catch (err) {
		console.error('[GET /api/users/[id]/subscribe]', err)
		return NextResponse.json(
			{ ok: false, error: 'Internal server error' },
			{ status: 500 },
		)
	}
}
