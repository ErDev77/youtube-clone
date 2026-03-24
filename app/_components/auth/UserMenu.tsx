// app/_components/auth/UserMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/context/AuthContext'

export default function UserMenu() {
	const { user, isLoading, logout } = useAuthContext()
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function handler(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	if (isLoading) {
		return (
			<div
				style={{
					width: 36,
					height: 36,
					borderRadius: '50%',
					background: '#1a1a1a',
					animation: 'pulse 1.5s ease-in-out infinite',
				}}
			/>
		)
	}

	if (!user) {
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<Link
					href='/en/login'
					style={{
						padding: '7px 16px',
						borderRadius: 20,
						border: '1px solid #3a3a3a',
						color: '#ccc',
						fontSize: 13,
						fontWeight: 500,
						textDecoration: 'none',
						transition: 'border-color 0.15s, color 0.15s',
					}}
				>
					Sign in
				</Link>
				<Link
					href='/en/register'
					style={{
						padding: '7px 16px',
						borderRadius: 20,
						background: '#e63946',
						color: '#fff',
						fontSize: 13,
						fontWeight: 600,
						textDecoration: 'none',
					}}
				>
					Join
				</Link>
			</div>
		)
	}

	const initials = user.email
		? user.email[0].toUpperCase()
		: user.email[0].toUpperCase()

	// Pick a colour based on username hash
	const colours = [
		'#e63946',
		'#2a9d8f',
		'#e76f51',
		'#457b9d',
		'#6a4c93',
		'#f4a261',
		'#2ec4b6',
		'#c77dff',
	]
	const colourIdx =
		user.email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
		colours.length
	const avatarColour = colours[colourIdx]

	return (
		<div ref={menuRef} style={{ position: 'relative' }}>
			<button
				onClick={() => setOpen(v => !v)}
				style={{
					width: 36,
					height: 36,
					borderRadius: '50%',
					background: avatarColour,
					border: 'none',
					cursor: 'pointer',
					fontSize: 14,
					fontWeight: 700,
					color: '#fff',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transition: 'opacity 0.15s',
				}}
				aria-label='Account menu'
			>
				{initials}
			</button>

			{open && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 10px)',
						right: 0,
						width: 220,
						background: '#141414',
						border: '1px solid #222',
						borderRadius: 12,
						boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
						overflow: 'hidden',
						zIndex: 200,
					}}
				>
					{/* Header */}
					<div
						style={{
							padding: '14px 16px',
							borderBottom: '1px solid #1e1e1e',
							display: 'flex',
							alignItems: 'center',
							gap: 10,
						}}
					>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: avatarColour,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 15,
								fontWeight: 700,
								color: '#fff',
								flexShrink: 0,
							}}
						>
							{initials}
						</div>
						<div style={{ minWidth: 0 }}>
							<div
								style={{
									fontSize: 13,
									fontWeight: 600,
									color: '#fff',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{user.email}
							</div>
							<div
								style={{
									fontSize: 11,
									color: '#666',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{user.email}
							</div>
						</div>
					</div>

					{/* Links */}
					<div style={{ padding: '6px 0' }}>
						{[
							{ href: '/en/your-videos', label: 'Your Videos', icon: '▶' },
							{ href: '/en/playlists', label: 'Playlists', icon: '≡' },
							{ href: '/en/liked', label: 'Liked Videos', icon: '♥' },
							{ href: '/en/history', label: 'History', icon: '↺' },
							{ href: '/en/settings', label: 'Settings', icon: '⚙' },
						].map(item => (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setOpen(false)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									padding: '9px 16px',
									color: '#ccc',
									textDecoration: 'none',
									fontSize: 13,
									transition: 'background 0.1s',
								}}
								onMouseEnter={e =>
									(e.currentTarget.style.background = '#1e1e1e')
								}
								onMouseLeave={e =>
									(e.currentTarget.style.background = 'transparent')
								}
							>
								<span
									style={{
										fontSize: 14,
										width: 18,
										textAlign: 'center',
										color: '#555',
									}}
								>
									{item.icon}
								</span>
								{item.label}
							</Link>
						))}
					</div>

					{/* Logout */}
					<div
						style={{
							borderTop: '1px solid #1e1e1e',
							padding: '6px 0',
						}}
					>
						<button
							onClick={() => {
								setOpen(false)
								logout()
							}}
							style={{
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								padding: '9px 16px',
								color: '#e63946',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								fontSize: 13,
								textAlign: 'left',
								transition: 'background 0.1s',
							}}
							onMouseEnter={e =>
								(e.currentTarget.style.background = 'rgba(230,57,70,0.08)')
							}
							onMouseLeave={e =>
								(e.currentTarget.style.background = 'transparent')
							}
						>
							<span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>
								→
							</span>
							Sign out
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
