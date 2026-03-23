import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'

// Pages that require login
const PROTECTED = [
	'/history',
	'/subscriptions',
	'/playlists',
	'/watch-later',
	'/liked',
	'/your-videos',
	'/settings',
]

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl

	// Step 1 — Handle locale prefix (e.g. /hy/history)
	const locales = ['en', 'hy', 'ru']
	const locale = locales.find(
		l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
	)
	const pathWithoutLocale = locale
		? pathname.slice(locale.length + 1)
		: pathname

	// Step 2 — Check if route needs auth
	const isProtected = PROTECTED.some(p => pathWithoutLocale.startsWith(p))
	if (!isProtected) return NextResponse.next()

	// Step 3 — Verify JWT from cookie
	const token = req.cookies.get('armtube_token')?.value
	if (!token) {
		return NextResponse.redirect(new URL(`/${locale ?? 'en'}/login`, req.url))
	}

	try {
		await verifyJWT(token)
		return NextResponse.next()
	} catch {
		return NextResponse.redirect(new URL(`/${locale ?? 'en'}/login`, req.url))
	}
}

export const config = {
	matcher: ['/((?!api|_next|.*\\..*).*)'],
}
