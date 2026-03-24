// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'

const PROTECTED_PATHS = [
	'/history',
	'/subscriptions',
	'/playlists',
	'/watch-later',
	'/liked',
	'/your-videos',
	'/settings',
]

const AUTH_PATHS = ['/login', '/register']

const LOCALES = ['en', 'hy', 'ru'] as const
type Locale = (typeof LOCALES)[number]

function extractLocale(pathname: string): { locale: Locale; rest: string } {
	const seg = pathname.split('/')[1]
	if ((LOCALES as readonly string[]).includes(seg)) {
		return {
			locale: seg as Locale,
			rest: pathname.slice(seg.length + 1) || '/',
		}
	}
	return { locale: 'en', rest: pathname }
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
	const token = req.cookies.get('armtube_token')?.value
	if (!token) return false
	try {
		await verifyJWT(token)
		return true
	} catch {
		return false
	}
}

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl
	const { locale, rest } = extractLocale(pathname)

	const isProtected = PROTECTED_PATHS.some(p => rest.startsWith(p))
	const isAuthPage = AUTH_PATHS.some(p => rest.startsWith(p))

	const authed = await isAuthenticated(req)

	// Redirect unauthenticated users away from protected routes
	if (isProtected && !authed) {
		const url = req.nextUrl.clone()
		url.pathname = `/${locale}/login`
		return NextResponse.redirect(url)
	}

	// Redirect already-authenticated users away from login/register
	if (isAuthPage && authed) {
		const url = req.nextUrl.clone()
		url.pathname = `/${locale}`
		return NextResponse.redirect(url)
	}

	// Redirect bare root `/` → `/en`
	if (pathname === '/') {
		const url = req.nextUrl.clone()
		url.pathname = '/en'
		return NextResponse.redirect(url)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next|.*\\..*).*)'],
}
