// app/_components/auth/UserMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/context/AuthContext'

type ProfileData = {
	avatar_url: string | null
	display_name: string | null
}

export default function UserMenu() {
	const { user, isLoading, logout } = useAuthContext()
	const [open, setOpen] = useState(false)
	const [profile, setProfile] = useState<ProfileData | null>(null)
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

	useEffect(() => {
		if (!user) return
		fetch(`/api/users/${user.id}`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) {
					setProfile({
						avatar_url: d.data.user.avatar_url ?? null,
						display_name: d.data.user.display_name ?? null,
					})
				}
			})
			.catch(() => {})
	}, [user])

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

	const displayName = profile?.display_name || user.username || user.email
	const initials = displayName.slice(0, 2).toUpperCase()

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
	const avatarColour =
		colours[
			user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
				colours.length
		]

	function Avatar({ size }: { size: number }) {
		if (profile?.avatar_url) {
			return (
				<img
					src={profile.avatar_url}
					alt={displayName}
					style={{
						width: size,
						height: size,
						borderRadius: '50%',
						objectFit: 'cover',
						flexShrink: 0,
					}}
				/>
			)
		}
		return (
			<div
				style={{
					width: size,
					height: size,
					borderRadius: '50%',
					background: avatarColour,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: size * 0.38,
					fontWeight: 700,
					color: '#fff',
					flexShrink: 0,
				}}
			>
				{initials}
			</div>
		)
	}

	return (
		<div ref={menuRef} style={{ position: 'relative' }}>
			<button
				onClick={() => setOpen(v => !v)}
				style={{
					width: 36,
					height: 36,
					borderRadius: '50%',
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					padding: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				aria-label='Account menu'
			>
				<Avatar size={36} />
			</button>

			{open && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 10px)',
						right: 0,
						width: 230,
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
						<Avatar size={38} />
						<div style={{ minWidth: 0 }}>
							<div
								style={{
									fontSize: 13,
									fontWeight: 700,
									color: '#fff',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{displayName}
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
								@{user.username || user.email}
							</div>
						</div>
					</div>

					{/* Links */}
					<div style={{ padding: '6px 0' }}>
						{[
							{
								href: `/en/channel/${user.id}`,
								label: 'Your Channel',
								icon: (
									<svg
										width='15'
										height='15'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z' />
									</svg>
								),
							},
							{
								href: '/en/settings',
								label: 'Settings',
								icon: (
									<svg
										width='15'
										height='15'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94l-.36-2.54A.484.484 0 0 0 13.92 6h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' />
									</svg>
								),
							},
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
								<span style={{ color: '#555', display: 'flex' }}>
									{item.icon}
								</span>
								{item.label}
							</Link>
						))}
					</div>

					{/* Logout */}
					<div style={{ borderTop: '1px solid #1e1e1e', padding: '6px 0' }}>
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
								fontFamily: 'inherit',
								transition: 'background 0.1s',
							}}
							onMouseEnter={e =>
								(e.currentTarget.style.background = 'rgba(230,57,70,0.08)')
							}
							onMouseLeave={e =>
								(e.currentTarget.style.background = 'transparent')
							}
						>
							<svg
								width='15'
								height='15'
								viewBox='0 0 24 24'
								fill='currentColor'
								style={{ color: '#e63946', flexShrink: 0 }}
							>
								<path d='M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z' />
							</svg>
							Sign out
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
