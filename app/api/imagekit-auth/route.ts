//app/api/imagekit-auth/route.ts
import { NextResponse } from 'next/server'
import { imagekit } from '@/lib/media/imagekit'
import { getSession } from '@/lib/auth/session'

export async function GET() {
	const session = await getSession()

	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const authParams = imagekit.getAuthenticationParameters()

	return NextResponse.json(authParams)
}
