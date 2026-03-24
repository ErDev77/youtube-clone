// hooks/useAuth.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
	UseAuthReturn,
	LoginInput,
	RegisterInput,
	AuthResponse,
} from '@/types/auth'

interface UserInfo {
	id: string
	email: string
	username: string
}

export function useAuth(): UseAuthReturn {
	// undefined = not yet loaded, null = unauthenticated, object = authenticated
	const [user, setUser] = useState<UserInfo | null | undefined>(undefined)
	const [isLoading, setIsLoading] = useState(true)

	// Fetch current session on mount
	useEffect(() => {
		let cancelled = false
		fetch('/api/me')
			.then(r => r.json())
			.then(data => {
				if (!cancelled) {
					setUser(data.ok ? data.data.user : null)
				}
			})
			.catch(() => {
				if (!cancelled) setUser(null)
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	const login = useCallback(
		async ({ email, password }: LoginInput): Promise<AuthResponse> => {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await res.json()
			if (data.ok) {
				setUser(data.data.user)
			}
			return {
				ok: data.ok,
				user: data.data?.user,
				error: data.error,
			}
		},
		[],
	)

	const register = useCallback(
		async ({
			email,
			password,
			confirmPassword,
		}: RegisterInput & { confirmPassword: string }): Promise<AuthResponse> => {
			if (password !== confirmPassword) {
				return { ok: false, error: 'Passwords do not match.' }
			}
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await res.json()
			if (data.ok) {
				setUser(data.data.user)
			}
			return {
				ok: data.ok,
				user: data.data?.user,
				error: data.error,
			}
		},
		[],
	)

	const logout = useCallback(async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		setUser(null)
		window.location.href = '/en'
	}, [])

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
		login,
		register,
		logout,
	}
}
