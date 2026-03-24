import ImageKit from 'imagekit'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'

const imagekit = new ImageKit({
	publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
	urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

export async function GET() {
	const session = await getSession()
	if (!session)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const authParams = imagekit.getAuthenticationParameters()
	return NextResponse.json(authParams)
}
