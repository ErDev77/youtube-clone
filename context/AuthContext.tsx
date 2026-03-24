// context/AuthContext.tsx
'use client'

import React, { createContext, useContext } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { UseAuthReturn } from '@/types/auth'

const AuthContext = createContext<UseAuthReturn | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const auth = useAuth()
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): UseAuthReturn {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
	return ctx
}
