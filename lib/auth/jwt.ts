import { SignJWT, jwtVerify } from 'jose' // jose works in Edge runtime

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signJWT(payload: { userId: string; email: string }) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime('7d')
		.sign(SECRET)
}

export async function verifyJWT(token: string) {
	const { payload } = await jwtVerify(token, SECRET)
	return payload
}
