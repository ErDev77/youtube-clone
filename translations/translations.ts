export const translations = {
	hy: {
		mainSearch: 'Մուտքագրել հարցումը',
	},

	en: {
		mainSearch: 'Enter request',
	},

	ru: {
		mainSearch: 'Введите запрос',
	},
}

export function useTranslations() {
	const getCurrentLanguage = (): 'hy' | 'en' | 'ru' => {
		if (typeof window !== 'undefined') {
			const pathParts = window.location.pathname.split('/')
			const urlLang = pathParts[1]
			if (['hy', 'en', 'ru'].includes(urlLang)) {
				return urlLang as 'hy' | 'en' | 'ru'
			}
			const savedLang = localStorage.getItem('preferred-language')
			if (savedLang && ['hy', 'en', 'ru'].includes(savedLang)) {
				return savedLang as 'hy' | 'en' | 'ru'
			}
		}
		return 'hy'
	}

	const language = getCurrentLanguage()
	return translations[language]
}

export function t(key: string, language?: 'hy' | 'en' | 'ru'): string {
	const lang =
		language ||
		(() => {
			if (typeof window !== 'undefined') {
				const pathParts = window.location.pathname.split('/')
				const urlLang = pathParts[1]
				if (['hy', 'en', 'ru'].includes(urlLang)) {
					return urlLang as 'hy' | 'en' | 'ru'
				}
			}
			return 'hy'
		})()

	const keys = key.split('.')
	let value: unknown = translations[lang]

	for (const k of keys) {
		if (value && typeof value === 'object' && k in value) {
			value = (value as Record<string, unknown>)[k]
		} else {
			value = undefined
			break
		}
	}

	return typeof value === 'string' ? value : key
}
