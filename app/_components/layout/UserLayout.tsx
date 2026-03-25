'use client'

import { useState, lazy, Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from '@/translations/translations'
import { useLanguage } from '@/context/LanguageContext'
import UserMenu from '../auth/UserMenu'
import { useAuthContext } from '@/context/AuthContext'

const VideoUploadForm = lazy(() => import('../video/VideoUploadForm'))

/* ─────────────────────────────────────────────
   SIDEBAR DATA
───────────────────────────────────────────── */

const mainNav = [
	{
		href: '/en',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
			</svg>
		),
		label: 'Home',
	},
	{
		href: '/en/shorts',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M17.77 10.32l-1.2-.5L18 9.19C19.38 8.42 19.86 6.68 19.09 5.3c-.77-1.38-2.51-1.86-3.89-1.09l-5.85 3.28-.01.02-1.17.65c-1.38.77-1.86 2.51-1.09 3.89.28.49.68.87 1.14 1.12l1.2.5L8 13.81C6.62 14.58 6.14 16.32 6.91 17.7c.77 1.38 2.51 1.86 3.89 1.09l5.85-3.27.01-.01 1.17-.65c1.38-.77 1.86-2.51 1.09-3.89-.28-.49-.68-.87-1.15-1.14zM13 14.5l-2-1.17 2-1.16 2 1.16-2 1.17z' />
			</svg>
		),
		label: 'Shorts',
	},
]

const youSection = [
	{
		href: '/en/history',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' />
			</svg>
		),
		label: 'History',
	},
	{
		href: '/en/playlists',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
			</svg>
		),
		label: 'Playlists',
	},
	{
		href: '/en/watch-later',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M22 13h-4v4h-2v-4h-4v-2h4V7h2v4h4v2zm-8-6H2v1.5h12V7zM2 16.5h8V15H2v1.5zm0-4.5h10v-1.5H2V12z' />
			</svg>
		),
		label: 'Watch Later',
	},
	{
		href: '/en/liked',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
			</svg>
		),
		label: 'Liked',
	},
	{
		href: '/en/your-videos',
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z' />
			</svg>
		),
		label: 'Your Videos',
	},
]

const navSection = [
	{
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
			</svg>
		),
		label: 'Music',
		href: '/en/category/music',
	},
	{
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z' />
			</svg>
		),
		label: 'Streams',
		href: '/en/category/streams',
	},
	{
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z' />
			</svg>
		),
		label: 'News',
		href: '/en/category/news',
	},
	{
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M21 16v-2l-6-3V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6l-6 3v2h22z' />
			</svg>
		),
		label: 'Sports',
		href: '/en/category/sport',
	},
	{
		icon: (
			<svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z' />
			</svg>
		),
		label: 'Video Games',
		href: '/en/category/videogames',
	},
]

const languages = [
	{ code: 'am', label: 'Հայերեն', flag: 'https://flagcdn.com/w20/am.png' },
	{ code: 'ru', label: 'Русский', flag: 'https://flagcdn.com/w20/ru.png' },
	{ code: 'gb', label: 'English', flag: 'https://flagcdn.com/w20/gb.png' },
]

function Chevron({ open }: { open: boolean }) {
	return (
		<svg
			width='14'
			height='14'
			viewBox='0 0 24 24'
			fill='currentColor'
			style={{
				color: '#444',
				flexShrink: 0,
				transition: 'transform 0.2s ease',
				transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
			}}
		>
			<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
		</svg>
	)
}

function SectionLabel({
	label,
	open,
	onToggle,
}: {
	label: string
	open: boolean
	onToggle: () => void
}) {
	return (
		<button
			onClick={onToggle}
			style={{
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '8px 12px',
				background: 'none',
				border: 'none',
				cursor: 'pointer',
				borderRadius: 8,
				transition: 'background 0.15s',
			}}
			onMouseEnter={e =>
				(e.currentTarget.style.background = 'rgba(255,255,255,0.04)')
			}
			onMouseLeave={e => (e.currentTarget.style.background = 'none')}
		>
			<span
				style={{
					fontSize: 10,
					fontWeight: 700,
					letterSpacing: '1.5px',
					textTransform: 'uppercase',
					color: '#3a3a3a',
				}}
			>
				{label}
			</span>
			<Chevron open={open} />
		</button>
	)
}

function NavItem({
	icon,
	label,
	href,
	active,
}: {
	icon: React.ReactNode
	label: string
	href: string
	active?: boolean
}) {
	return (
		<Link
			href={href}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '9px 12px',
				borderRadius: 10,
				textDecoration: 'none',
				color: active ? '#fff' : '#888',
				background: active ? 'rgba(230,57,70,0.1)' : 'transparent',
				transition: 'background 0.15s, color 0.15s',
				position: 'relative',
			}}
			onMouseEnter={e => {
				if (!active) {
					e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
					e.currentTarget.style.color = '#ccc'
				}
			}}
			onMouseLeave={e => {
				if (!active) {
					e.currentTarget.style.background = 'transparent'
					e.currentTarget.style.color = '#888'
				}
			}}
		>
			{active && (
				<span
					style={{
						position: 'absolute',
						left: 0,
						top: '50%',
						transform: 'translateY(-50%)',
						width: 3,
						height: 16,
						background: '#e63946',
						borderRadius: '0 2px 2px 0',
					}}
				/>
			)}
			<span style={{ color: active ? '#e63946' : 'inherit', display: 'flex' }}>
				{icon}
			</span>
			<span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>
				{label}
			</span>
		</Link>
	)
}

function Divider() {
	return (
		<div
			style={{
				height: 1,
				background:
					'linear-gradient(90deg, transparent, #1e1e1e 20%, #1e1e1e 80%, transparent)',
				margin: '8px 16px',
			}}
		/>
	)
}

export default function UserLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchFocused, setSearchFocused] = useState(false)
	const [subsOpen, setSubsOpen] = useState(true)
	const [youOpen, setYouOpen] = useState(true)
	const [navOpen, setNavOpen] = useState(true)
	const [langOpen, setLangOpen] = useState(false)
	const [uploadOpen, setUploadOpen] = useState(false)

	const t = useTranslations()
	const { language } = useLanguage()
	const { user, isAuthenticated } = useAuthContext()

	const handleUploadSuccess = () => {
		// Trigger page refresh of video feed
		window.location.reload()
	}

	return (
		<div
			style={{
				background: '#0a0a0a',
				minHeight: '100vh',
				color: '#fff',
				fontFamily: "'DM Sans', sans-serif",
			}}
		>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
				* { box-sizing: border-box; }
				::-webkit-scrollbar { width: 4px; height: 4px; }
				::-webkit-scrollbar-track { background: transparent; }
				::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
				::-webkit-scrollbar-thumb:hover { background: #333; }
				@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
				@keyframes spin { to { transform: rotate(360deg) } }
			`}</style>

			{/* HEADER */}
			<header
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					zIndex: 50,
					height: 56,
					background: 'rgba(10,10,10,0.95)',
					backdropFilter: 'blur(12px)',
					borderBottom: '1px solid #141414',
					display: 'flex',
					alignItems: 'center',
					padding: '0 16px',
					gap: 12,
				}}
			>
				{/* Left */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						flexShrink: 0,
					}}
				>
					<button
						onClick={() => setSidebarOpen(v => !v)}
						style={{
							width: 36,
							height: 36,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#666',
							borderRadius: 8,
							transition: 'background 0.15s, color 0.15s',
						}}
						onMouseEnter={e => {
							e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
							e.currentTarget.style.color = '#fff'
						}}
						onMouseLeave={e => {
							e.currentTarget.style.background = 'none'
							e.currentTarget.style.color = '#666'
						}}
					>
						<svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' />
						</svg>
					</button>
					<Link
						href='/'
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 6,
							textDecoration: 'none',
						}}
					>
						<div
							style={{
								width: 28,
								height: 28,
								background: '#e63946',
								borderRadius: 7,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<svg width='13' height='13' viewBox='0 0 24 24' fill='white'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
						<span
							style={{
								fontSize: 16,
								fontWeight: 700,
								color: '#fff',
								letterSpacing: '-0.3px',
							}}
						>
							ArmTube
						</span>
					</Link>
				</div>

				{/* Center: search */}
				<div
					style={{
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						padding: '0 20px',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							width: '100%',
							maxWidth: 580,
						}}
					>
						<div
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								height: 38,
								background: searchFocused ? '#111' : '#0d0d0d',
								border: `1px solid ${searchFocused ? '#e63946' : '#1e1e1e'}`,
								borderRadius: 20,
								overflow: 'hidden',
								transition: 'border-color 0.2s, background 0.2s',
								boxShadow: searchFocused
									? '0 0 0 3px rgba(230,57,70,0.08)'
									: 'none',
							}}
						>
							<div
								style={{
									padding: '0 14px',
									display: 'flex',
									alignItems: 'center',
									color: '#333',
									flexShrink: 0,
								}}
							>
								<svg
									width='15'
									height='15'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' />
								</svg>
							</div>
							<input
								type='text'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								onFocus={() => setSearchFocused(true)}
								onBlur={() => setSearchFocused(false)}
								placeholder={t.mainSearch}
								style={{
									flex: 1,
									background: 'transparent',
									border: 'none',
									outline: 'none',
									fontSize: 13,
									color: '#fff',
									fontFamily: 'inherit',
									minWidth: 0,
								}}
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									style={{
										padding: '0 12px',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: '#444',
										display: 'flex',
										alignItems: 'center',
										flexShrink: 0,
									}}
								>
									<svg
										width='13'
										height='13'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
									</svg>
								</button>
							)}
						</div>
						<button
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: '#111',
								border: '1px solid #1e1e1e',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								color: '#555',
								flexShrink: 0,
								transition: 'border-color 0.15s, color 0.15s',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.borderColor = '#333'
								e.currentTarget.style.color = '#ccc'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.borderColor = '#1e1e1e'
								e.currentTarget.style.color = '#555'
							}}
						>
							<svg
								width='14'
								height='14'
								viewBox='0 0 24 24'
								fill='currentColor'
							>
								<path d='M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z' />
							</svg>
						</button>
					</div>
				</div>

				{/* Right */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						flexShrink: 0,
					}}
				>
					{/* Upload button — only shown when authenticated */}
					{isAuthenticated && (
						<button
							onClick={() => setUploadOpen(true)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								padding: '7px 14px',
								borderRadius: 20,
								border: '1px solid #1e1e1e',
								background: 'none',
								color: '#888',
								fontSize: 12,
								fontWeight: 600,
								cursor: 'pointer',
								transition: 'border-color 0.15s, color 0.15s, background 0.15s',
								fontFamily: 'inherit',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.borderColor = '#e63946'
								e.currentTarget.style.color = '#e63946'
								e.currentTarget.style.background = 'rgba(230,57,70,0.08)'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.borderColor = '#1e1e1e'
								e.currentTarget.style.color = '#888'
								e.currentTarget.style.background = 'none'
							}}
						>
							<svg
								width='14'
								height='14'
								viewBox='0 0 24 24'
								fill='currentColor'
							>
								<path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
							</svg>
							Upload
						</button>
					)}

					{/* Notifications */}
					<button
						style={{
							position: 'relative',
							width: 36,
							height: 36,
							borderRadius: '50%',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#555',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'background 0.15s, color 0.15s',
						}}
						onMouseEnter={e => {
							e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
							e.currentTarget.style.color = '#ccc'
						}}
						onMouseLeave={e => {
							e.currentTarget.style.background = 'none'
							e.currentTarget.style.color = '#555'
						}}
					>
						<svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' />
						</svg>
						<span
							style={{
								position: 'absolute',
								top: 6,
								right: 6,
								width: 7,
								height: 7,
								background: '#e63946',
								borderRadius: '50%',
								border: '1.5px solid #0a0a0a',
							}}
						/>
					</button>

					<UserMenu />
				</div>
			</header>

			{/* BODY */}
			<div style={{ display: 'flex', paddingTop: 56 }}>
				{/* SIDEBAR */}
				<aside
					style={{
						position: 'fixed',
						top: 56,
						left: 0,
						bottom: 0,
						width: sidebarOpen ? 220 : 0,
						background: '#0a0a0a',
						borderRight: '1px solid #111',
						overflowY: 'auto',
						overflowX: 'hidden',
						zIndex: 40,
						transition: 'width 0.2s ease',
						scrollbarWidth: 'none',
					}}
				>
					<div
						style={{
							width: 220,
							padding: '12px 8px 32px',
							display: 'flex',
							flexDirection: 'column',
							gap: 2,
						}}
					>
						{mainNav.map(item => (
							<NavItem
								key={item.label}
								{...item}
								active={pathname === item.href}
							/>
						))}
						<Divider />
						<SectionLabel
							label='You'
							open={youOpen}
							onToggle={() => setYouOpen(v => !v)}
						/>
						{youOpen && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								{youSection.map(item => (
									<NavItem
										key={item.label}
										{...item}
										active={pathname === item.href}
									/>
								))}
							</div>
						)}
						<Divider />
						<SectionLabel
							label='Explore'
							open={navOpen}
							onToggle={() => setNavOpen(v => !v)}
						/>
						{navOpen && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								{navSection.map(item => (
									<NavItem
										key={item.label}
										{...item}
										active={pathname === item.href}
									/>
								))}
							</div>
						)}
						<Divider />
						<SectionLabel
							label='Languages'
							open={langOpen}
							onToggle={() => setLangOpen(v => !v)}
						/>
						{langOpen && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								{languages.map(lang => (
									<div
										key={lang.code}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 10,
											padding: '8px 12px',
											borderRadius: 10,
											cursor: 'pointer',
											transition: 'background 0.15s',
										}}
										onMouseEnter={e =>
											(e.currentTarget.style.background =
												'rgba(255,255,255,0.04)')
										}
										onMouseLeave={e =>
											(e.currentTarget.style.background = 'transparent')
										}
									>
										<img
											src={lang.flag}
											alt={lang.label}
											style={{
												width: 18,
												height: 12,
												borderRadius: 2,
												objectFit: 'cover',
												flexShrink: 0,
											}}
										/>
										<span style={{ fontSize: 12, color: '#666' }}>
											{lang.label}
										</span>
									</div>
								))}
							</div>
						)}
						<div style={{ padding: '24px 12px 0', marginTop: 8 }}>
							<p
								style={{
									fontSize: 10,
									color: '#2a2a2a',
									letterSpacing: '0.5px',
								}}
							>
								© 2025 ArmTube
							</p>
						</div>
					</div>
				</aside>

				{/* MAIN */}
				<main
					style={{
						flex: 1,
						minWidth: 0,
						marginLeft: sidebarOpen ? 220 : 0,
						transition: 'margin-left 0.2s ease',
					}}
				>
					<div style={{ padding: '32px 24px 64px' }}>{children}</div>
				</main>
			</div>

			{/* Upload modal */}
			{uploadOpen && (
				<Suspense fallback={null}>
					<VideoUploadForm
						onClose={() => setUploadOpen(false)}
						onSuccess={handleUploadSuccess}
					/>
				</Suspense>
			)}
		</div>
	)
}
