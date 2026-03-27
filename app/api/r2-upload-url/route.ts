import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { createPresignedUploadUrl } from '@/lib/media/r2'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
	try {
		await requireSession()
		const { filename, contentType } = await req.json()

		const ext = filename.split('.').pop()
		const key = `videos/${randomUUID()}.${ext}`

		const uploadUrl = await createPresignedUploadUrl(key, contentType)

		// The public URL after upload (requires public bucket or a custom domain)
		const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

		return NextResponse.json({ ok: true, data: { uploadUrl, publicUrl, key } })
	} catch (err) {
		if (err instanceof Response) return err
		return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
	}
}
