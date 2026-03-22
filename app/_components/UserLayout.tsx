'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── Sidebar data ─── */
const mainNav = [
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
			</svg>
		),
		label: 'Home',
		active: true,
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z' />
			</svg>
		),
		label: 'Shorts',
		active: false,
	},
]

const subscriptions = [
	{ name: 'MrBeast', avatar: 'M', color: 'bg-red-600', dot: true },
	{ name: 'Dude Perfect', avatar: 'D', color: 'bg-blue-500', dot: false },
	{ name: 'T-Series', avatar: 'T', color: 'bg-indigo-600', dot: false },
	{ name: 'PewDiePie', avatar: 'P', color: 'bg-yellow-500', dot: true },
	{ name: '5-Minute Crafts', avatar: '5', color: 'bg-green-500', dot: false },
	{ name: 'Billie Eilish', avatar: 'B', color: 'bg-teal-600', dot: true },
	{ name: 'Dua Lipa', avatar: 'D', color: 'bg-pink-500', dot: false },
	{ name: 'NBA', avatar: 'N', color: 'bg-orange-600', dot: true },
	{ name: 'NASA', avatar: 'N', color: 'bg-gray-600', dot: false },
]

const youSection = [
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' />
			</svg>
		),
		label: 'History',
	},
	{
		icon: (
			<svg className='w-6 h-6shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V9h10v2z' />
			</svg>
		),
		label: 'Playlists',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M22 13h-4v4h-2v-4h-4v-2h4V7h2v4h4v2zm-8-6H2v1.5h12V7zM2 16.5h8V15H2v1.5zm0-4.5h10v-1.5H2V12z' />
			</svg>
		),
		label: 'Watch Later',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
			</svg>
		),
		label: 'Liked',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
			</svg>
		),
		label: 'Your Videos',
	},
]

const navSection = [
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
			</svg>
		),
		label: 'Music',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z' />
			</svg>
		),
		label: 'Streams',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z' />
			</svg>
		),
		label: 'News',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M21 16v-2l-6-3V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6l-6 3v2h22z' />
			</svg>
		),
		label: 'Sports',
	},
	{
		icon: (
			<svg className='w-6 h-6 shrink-0' viewBox='0 0 24 24' fill='currentColor'>
				<path d='M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z' />
			</svg>
		),
		label: 'Video Games',
	},
]

const langSection = [
	{
		icon: (
			<img
				src='https://flagcdn.com/w20/am.png'
				alt='Armenia'
				className='w-6 h-4 rounded-sm object-cover shrink-0'
			/>
		),
		label: 'Հայերեն',
	},
	{
		icon: (
			<img
				src='https://flagcdn.com/w20/ru.png'
				alt='Russia'
				className='w-6 h-4 rounded-sm object-cover shrink-0'
			/>
		),
		label: 'Русский',
	},
	{
		icon: (
			<img
				src='https://flagcdn.com/w20/gb.png'
				alt='English'
				className='w-6 h-4 rounded-sm object-cover shrink-0'
			/>
		),
		label: 'English',
	},
]

/* ─── Chevron icon helper ─── */
function Chevron({ open }: { open: boolean }) {
	return (
		<svg
			className={`w-4 h-4 ml-1 shrink-0 transition-transform duration-200 text-[#aaa] ${open ? 'rotate-90' : 'rotate-0'}`}
			viewBox='0 0 24 24'
			fill='currentColor'
		>
			<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
		</svg>
	)
}

/* ─── Collapsible section header ─── */
function SectionHeader({
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
			className='w-full flex items-center gap-1 px-4 py-2.5 mx-0 rounded-xl cursor-pointer hover:bg-white/8 transition-colors bg-transparent border-none text-left'
		>
			<span className='text-[16px] font-semibold tracking-widest text-[#aaa]'>
				{label}
			</span>
			<Chevron open={open} />
		</button>
	)
}

export default function UserLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')

	const [subsOpen, setSubsOpen] = useState(true)
	const [youOpen, setYouOpen] = useState(true)
	const [navOpen, setNavOpen] = useState(true)
	const [langOpen, setLangOpen] = useState(true)

	return (
		<div className='bg-[#0f0f0f] min-h-screen text-white text-sm'>
			{/* ══ HEADER ══ */}
			<header
				className='fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-4 bg-[#0f0f0f] gap-4'
				style={{ padding: '0 20px' }}
			>
				{/* Left: burger + logo */}
				<div className='flex items-center gap-3 shrink-0'>
					<button
						onClick={() => setSidebarOpen(v => !v)}
						className='p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-white'
					>
						<svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' />
						</svg>
					</button>
					<Link href='/' className='flex items-center no-underline'>
						<span className='text-[18px] font-bold tracking-tight text-white leading-none'>
							ArmTube
						</span>
					</Link>
				</div>

				{/* Center: search */}
				<div className='flex-1 flex justify-center px-6'>
					<div className='flex items-center gap-3 w-full max-w-[600px]'>
						<div className='flex flex-1 h-10 border border-[#303030] rounded-full overflow-hidden bg-[#121212]'>
							<input
								type='text'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder='Введите запрос'
								className='flex-1 bg-transparent border-none outline-none px-5 text-sm text-white placeholder:text-[#555]'
							/>
							<div className='flex items-center px-3 text-[#555]'>
								<svg
									className='w-5 h-5'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z' />
								</svg>
							</div>
							<button className='px-5 cursor-pointer text-white bg-[#222] hover:bg-[#2e2e2e] transition-colors border-l border-[#303030]'>
								<svg
									className='w-5 h-5'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' />
								</svg>
							</button>
						</div>
						<button className='w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center text-white hover:bg-[#2e2e2e] transition-colors cursor-pointer shrink-0 border border-[#303030]'>
							<svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
								<path d='M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z' />
							</svg>
						</button>
					</div>
				</div>

				{/* Right actions */}
				<div className='flex items-center gap-2 ml-auto shrink-0'>
					<button
						className='flex items-center gap-1 px-5 py-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer bg-transparent border border-[#303030] text-white text-base font-medium'
						style={{ padding: '8px 10px' }}
					>
						<svg
							style={{ width: '20px', height: '20px', minWidth: '20px' }}
							viewBox='0 0 24 24'
							fill='currentColor'
						>
							<path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
						</svg>
						Create
					</button>
					<button className='relative w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer bg-transparent border-none text-white'>
						<svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' />
						</svg>
						<span className='absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1 leading-none'>
							9+
						</span>
					</button>
					<div className='w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm cursor-pointer ml-1'>
						е
					</div>
				</div>
			</header>

			<div className='flex pt-16'>
				{/* ══ SIDEBAR ══ */}
				<aside
					className={`fixed top-16 left-0 bottom-0 bg-[#0f0f0f] overflow-y-auto z-40 transition-[width] duration-200 ease-in-out ${sidebarOpen ? 'w-[230px]' : 'w-0'}`}
					style={{ scrollbarWidth: 'none' }}
				>
					<div className='w-[230px] pt-3 pb-6 flex flex-col'>
						{/* ── Main nav ── */}
						<div
							className='flex flex-col gap-3'
							style={{
								paddingLeft: '20px',
								paddingRight: '12px',
								marginTop: '12px',
							}}
						>
							{mainNav.map(item => (
								<div
									key={item.label}
									className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors ${
										item.active
											? 'bg-[#272727] font-semibold'
											: 'text-[#e0e0e0]'
									}`}
								>
									{item.icon}
									<span className='text-[16px]'>{item.label}</span>
								</div>
							))}
						</div>

						{/* ── Divider ── */}
						<div
							className='h-px bg-[#222] mx-4'
							style={{ marginTop: '20px', marginBottom: '20px' }}
						/>

						{/* ── Subscriptions ── */}
						<div className='flex flex-col'>
							<div
								className='px-3'
								style={{ paddingLeft: '20px', paddingRight: '12px' }}
							>
								<SectionHeader
									label='Subscriptions'
									open={subsOpen}
									onToggle={() => setSubsOpen(v => !v)}
								/>
							</div>
							{subsOpen && (
								<div
									className='flex flex-col gap-3 px-3 mt-1'
									style={{
										paddingLeft: '20px',
										paddingRight: '12px',
										marginTop: '12px',
									}}
								>
									{subscriptions.map(sub => (
										<div
											key={sub.name}
											className='flex items-center gap-3.5 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors'
										>
											<div
												className={`w-6 h-6 rounded-full ${sub.color} flex items-center justify-center text-[11px] font-bold shrink-0`}
											>
												{sub.avatar}
											</div>
											<span className='text-[14px] text-[#e0e0e0] truncate flex-1'>
												{sub.name}
											</span>
											{sub.dot && (
												<span className='w-2 h-2 rounded-full bg-blue-500 shrink-0' />
											)}
										</div>
									))}
								</div>
							)}
						</div>

						{/* ── Divider ── */}
						<div
							className='h-px bg-[#222] mx-4'
							style={{ marginTop: '20px', marginBottom: '20px' }}
						/>

						{/* ── You ── */}
						<div className='flex flex-col'>
							<div
								className='px-3'
								style={{ paddingLeft: '20px', paddingRight: '12px' }}
							>
								<SectionHeader
									label='You'
									open={youOpen}
									onToggle={() => setYouOpen(v => !v)}
								/>
							</div>
							{youOpen && (
								<div
									className='flex flex-col gap-3 px-3 mt-1'
									style={{
										paddingLeft: '20px',
										paddingRight: '12px',
										marginTop: '12px',
									}}
								>
									{youSection.map(item => (
										<div
											key={item.label}
											className='flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-[#e0e0e0]'
										>
											{item.icon}
											<span className='text-[14px]'>{item.label}</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* ── Divider ── */}
						<div
							className='h-px bg-[#222] mx-4'
							style={{ marginTop: '20px', marginBottom: '20px' }}
						/>

						{/* ── Navigator ── */}
						<div className='flex flex-col'>
							<div
								className='px-3'
								style={{ paddingLeft: '20px', paddingRight: '12px' }}
							>
								<SectionHeader
									label='Navigator'
									open={navOpen}
									onToggle={() => setNavOpen(v => !v)}
								/>
							</div>
							{navOpen && (
								<div
									className='flex flex-col gap-3 px-3 mt-1'
									style={{
										paddingLeft: '20px',
										paddingRight: '12px',
										marginTop: '12px',
									}}
								>
									{navSection.map(item => (
										<div
											key={item.label}
											className='flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-[#e0e0e0]'
										>
											{item.icon}
											<span className='text-[14px]'>{item.label}</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* ── Divider ── */}
						<div
							className='h-px bg-[#222] mx-4'
							style={{ marginTop: '20px', marginBottom: '20px' }}
						/>

						{/* ── Languages ── */}
						<div className='flex flex-col'>
							<div
								className='px-3'
								style={{ paddingLeft: '20px', paddingRight: '12px' }}
							>
								<SectionHeader
									label='Languages'
									open={langOpen}
									onToggle={() => setLangOpen(v => !v)}
								/>
							</div>
							{langOpen && (
								<div
									className='flex flex-col gap-3 px-3 mt-1'
									style={{
										paddingLeft: '20px',
										paddingRight: '12px',
										marginTop: '12px',
									}}
								>
									{langSection.map(item => (
										<div
											key={item.label}
											className='flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-[#e0e0e0]'
										>
											{item.icon}
											<span className='text-[14px]'>{item.label}</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</aside>

				{/* ══ MAIN ══ */}
				<main
					className={`flex-1 min-w-0 transition-[margin-left] duration-200 ease-in-out ${sidebarOpen ? 'ml-[230px]' : 'ml-0'}`}
				>
					<div style={{ padding: '80px 20px' }}>{children}</div>
				</main>
			</div>
		</div>
	)
}
