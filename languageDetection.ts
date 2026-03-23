import { NextRequest } from 'next/server'

export function detectLanguage(request: NextRequest): 'hy' | 'en' | 'ru' {
	// 1. Check URL path
	const pathname = request.nextUrl.pathname
	const pathLang = pathname.split('/')[1]
	if (['hy', 'en', 'ru'].includes(pathLang)) {
		return pathLang as 'hy' | 'en' | 'ru'
	}

	// 2. Check cookie
	const cookieLang = request.cookies.get('preferred-language')?.value
	if (cookieLang && ['hy', 'en', 'ru'].includes(cookieLang)) {
		return cookieLang as 'hy' | 'en' | 'ru'
	}

	// 3. Check Accept-Language header
	const acceptLang = request.headers.get('accept-language')
	if (acceptLang) {
		// Check for Armenian
		if (acceptLang.includes('hy') || acceptLang.includes('am')) {
			return 'hy'
		}
		// Check for Russian
		if (acceptLang.includes('ru')) {
			return 'ru'
		}
		// Check for English
		if (acceptLang.includes('en')) {
			return 'en'
		}
	}

	// 4. Check geolocation (if available)
	const country = (request as NextRequest & { geo?: { country?: string } }).geo
		?.country
	if (country === 'AM') return 'hy' // Armenia
	if (['RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ'].includes(country || '')) return 'ru'

	// 5. Default to Armenian
	return 'hy'
}
