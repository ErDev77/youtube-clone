//lib/media/imagekit.ts
import ImageKit from 'imagekit'

const requiredEnv = [
	'IMAGEKIT_PUBLIC_KEY',
	'IMAGEKIT_PRIVATE_KEY',
	'IMAGEKIT_URL_ENDPOINT',
] as const

for (const key of requiredEnv) {
	if (!process.env[key]) {
		throw new Error(`❌ Missing env: ${key}`)
	}
}

export const imagekit = new ImageKit({
	publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
	urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!, // CDN (ik.imagekit.io)
})
