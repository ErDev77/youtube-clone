// import { NextResponse } from 'next/server'
// import { signJWT } from '@/lib/auth/jwt'
// import { comparePassword } from '@/lib/auth/hash'
// import { getUserByEmail } from '@/lib/db/queries/users'

// export async function POST(req: Request) {
// 	const { email, password } = await req.json()

// 	const user = await getUserByEmail(email)
// 	if (!user)
// 		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

// 	const valid = await comparePassword(password, user.password)
// 	if (!valid)
// 		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

// 	const token = await signJWT({ userId: user.id, email: user.email })

// 	const res = NextResponse.json({ ok: true })
// 	res.cookies.set('armtube_token', token, {
// 		httpOnly: true, // JS cannot read it — prevents XSS theft
// 		secure: true, // HTTPS only
// 		sameSite: 'lax',
// 		maxAge: 60 * 60 * 24 * 7, // 7 days
// 	})
// 	return res
// }
