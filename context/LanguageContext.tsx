'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export type Language = 'hy' | 'en' | 'ru'

interface LanguageContextType {
	language: Language
	setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
	language: 'hy',
	setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const [language, setLanguage] = useState<Language>('hy')

	useEffect(() => {
		// Extract language from URL
		const pathParts = pathname.split('/')
		const urlLang = pathParts[1]

		if (['hy', 'en', 'ru'].includes(urlLang)) {
			setLanguage(urlLang as Language)
			localStorage.setItem('preferred-language', urlLang)
		} else {
			// Check localStorage for preference
			const savedLang = localStorage.getItem('preferred-language')
			if (savedLang && ['hy', 'en', 'ru'].includes(savedLang)) {
				setLanguage(savedLang as Language)
			}
		}
	}, [pathname])

	return (
		<LanguageContext.Provider value={{ language, setLanguage }}>
			{children}
		</LanguageContext.Provider>
	)
}

export function useLanguage() {
	const context = useContext(LanguageContext)
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider')
	}
	return context
}
