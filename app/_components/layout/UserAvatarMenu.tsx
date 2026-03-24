'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useState, useRef, useEffect } from 'react'

export default function UserAvatarMenu() {
	const [open, setOpen] = useState(false)
	const [email, setEmail] = useState<string | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)
    const { language } = useLanguage()  
	useEffect(() => {
		async function fetchUser() {
			try {
				const res = await fetch('/api/me')
				if (!res.ok) return
				const data = await res.json()
				setEmail(data.data.user.email)
			} catch (err) {
				console.error(err)
			}
		}
		fetchUser()
	}, [])

	// Закрытие меню по клику вне
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const firstLetter = email ? email[0].toUpperCase() : '?'

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' })
			window.location.href = `${language}/login`
		} catch (err) {
			console.error(err)
		}
	}

	return (
		<div className='relative' ref={menuRef}>
			<button
				onClick={() => setOpen(v => !v)}
				className='w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm cursor-pointer ml-1 hover:bg-teal-500 transition-colors'
			>
				{firstLetter}
			</button>

			{open && (
				<div className='absolute right-0 mt-2 w-40 bg-[#1a1a1a] text-white rounded-lg shadow-lg border border-[#333] overflow-hidden z-50'>
					<button
						onClick={handleLogout}
						className='w-full text-left px-4 py-2 hover:bg-[#2a2a2a] transition-colors'
					>
						Logout
					</button>
				</div>
			)}
		</div>
	)
}
