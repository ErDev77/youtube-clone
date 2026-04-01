'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

type LikedVideo = {
	liked_at: string
	id: string
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	category: string | null
	video_type: 'normal' | 'shorts' | null
	views_count: number
	likes_count: number
	created_at: string
	uploader_id: string
	username: string
	display_name: string | null
	avatar_url: string | null
}

type SortKey =
	| 'date_added_desc'
	| 'date_added_asc'
	| 'popularity'
	| 'most_liked'
	| 'title_asc'
	| 'title_desc'
	| 'date_published'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
	{ value: 'date_added_desc', label: 'Date added: newest first' },
	{ value: 'date_added_asc', label: 'Date added: oldest first' },
	{ value: 'popularity', label: 'Most viewed' },
	{ value: 'most_liked', label: 'Most liked' },
	{ value: 'title_asc', label: 'Title: A → Z' },
	{ value: 'title_desc', label: 'Title: Z → A' },
	{ value: 'date_published', label: 'Date published' },
]

function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
	const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
	if (d < 1) return 'today'
	if (d < 7) return `${d}d ago`
	if (d < 30) return `${Math.floor(d / 7)}w ago`
	if (d < 365) return `${Math.floor(d / 30)}mo ago`
	return `${Math.floor(d / 365)}y ago`
}

function colorFromId(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
}

function sortVideos(videos: LikedVideo[], sort: SortKey): LikedVideo[] {
	const arr = [...videos]
	switch (sort) {
		case 'date_added_desc':
			return arr.sort(
				(a, b) =>
					new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime(),
			)
		case 'date_added_asc':
			return arr.sort(
				(a, b) =>
					new Date(a.liked_at).getTime() - new Date(b.liked_at).getTime(),
			)
		case 'popularity':
			return arr.sort((a, b) => b.views_count - a.views_count)
		case 'most_liked':
			return arr.sort((a, b) => b.likes_count - a.likes_count)
		case 'title_asc':
			return arr.sort((a, b) => a.title.localeCompare(b.title))
		case 'title_desc':
			return arr.sort((a, b) => b.title.localeCompare(a.title))
		case 'date_published':
			return arr.sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
			)
		default:
			return arr
	}
}

function Spinner({ size = 14 }: { size?: number }) {
	return (
		<span
			style={{
				width: size,
				height: size,
				border: '2px solid rgba(255,255,255,0.2)',
				borderTopColor: '#fff',
				borderRadius: '50%',
				display: 'inline-block',
				animation: 'spin 0.7s linear infinite',
				flexShrink: 0,
			}}
		/>
	)
}

function SortDropdown({
	value,
	onChange,
}: {
	value: SortKey
	onChange: (v: SortKey) => void
}) {
	const [open, setOpen] = useState(false)
	const current = SORT_OPTIONS.find(o => o.value === value)!
	return (
		<div style={{ position: 'relative' }}>
			<button
				onClick={() => setOpen(v => !v)}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					padding: '8px 14px',
					background: '#111',
					border: '1px solid #222',
					borderRadius: 20,
					color: '#ccc',
					fontSize: 13,
					cursor: 'pointer',
					fontFamily: 'inherit',
					whiteSpace: 'nowrap',
					transition: 'border-color 0.15s',
				}}
				onMouseEnter={e => (e.currentTarget.style.borderColor = '#444')}
				onMouseLeave={e => {
					if (!open) e.currentTarget.style.borderColor = '#222'
				}}
			>
				<svg
					width='13'
					height='13'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
				>
					<line x1='3' y1='6' x2='21' y2='6' />
					<line x1='6' y1='12' x2='18' y2='12' />
					<line x1='9' y1='18' x2='15' y2='18' />
				</svg>
				{current.label}
				<svg
					width='12'
					height='12'
					viewBox='0 0 24 24'
					fill='currentColor'
					style={{
						opacity: 0.5,
						transition: 'transform 0.15s',
						transform: open ? 'rotate(180deg)' : 'none',
					}}
				>
					<path d='M7 10l5 5 5-5z' />
				</svg>
			</button>
			{open && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 6px)',
						right: 0,
						zIndex: 200,
						background: '#141414',
						border: '1px solid #222',
						borderRadius: 12,
						minWidth: 220,
						overflow: 'hidden',
						boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
						animation: 'popIn 0.12s ease',
					}}
				>
					{SORT_OPTIONS.map(opt => (
						<button
							key={opt.value}
							onClick={() => {
								onChange(opt.value)
								setOpen(false)
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								width: '100%',
								padding: '10px 14px',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								color: opt.value === value ? '#e63946' : '#ccc',
								fontSize: 13,
								fontFamily: 'inherit',
								textAlign: 'left',
								transition: 'background 0.1s',
							}}
							onMouseEnter={e => (e.currentTarget.style.background = '#1e1e1e')}
							onMouseLeave={e => (e.currentTarget.style.background = 'none')}
						>
							{opt.label}
							{opt.value === value && (
								<svg width='14' height='14' viewBox='0 0 24 24' fill='#e63946'>
									<path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
								</svg>
							)}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

function VideoRow({
	video,
	index,
	onPlay,
}: {
	video: LikedVideo
	index: number
	onPlay: () => void
}) {
	const [hovered, setHovered] = useState(false)
	const name = video.display_name || video.username
	const color = colorFromId(video.uploader_id)

	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '10px 12px',
				borderRadius: 10,
				background: hovered ? '#111' : 'transparent',
				border: '1px solid',
				borderColor: hovered ? '#1e1e1e' : 'transparent',
				transition: 'all 0.15s',
			}}
		>
			<div style={{ width: 28, flexShrink: 0, textAlign: 'center' }}>
				<span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
					{index + 1}
				</span>
			</div>
			<div
				onClick={onPlay}
				style={{
					width: 120,
					height: 68,
					borderRadius: 8,
					overflow: 'hidden',
					background: '#1a1a1a',
					flexShrink: 0,
					position: 'relative',
					cursor: 'pointer',
				}}
			>
				{video.thumbnail_url ? (
					<img
						src={video.thumbnail_url}
						alt={video.title}
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				) : (
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<svg width='22' height='22' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}
				{hovered && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: 'rgba(0,0,0,0.4)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								width: 32,
								height: 32,
								borderRadius: '50%',
								background: 'rgba(230,57,70,0.9)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<svg width='13' height='13' viewBox='0 0 24 24' fill='white'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					</div>
				)}
				{video.video_type === 'shorts' && (
					<div
						style={{
							position: 'absolute',
							bottom: 4,
							left: 4,
							background: '#e63946',
							borderRadius: 3,
							padding: '1px 5px',
							fontSize: 9,
							fontWeight: 800,
							color: '#fff',
						}}
					>
						SHORTS
					</div>
				)}
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<p
					onClick={onPlay}
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: '#fff',
						margin: '0 0 3px',
						cursor: 'pointer',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{video.title}
				</p>
				<Link
					href={`/en/channel/${video.uploader_id}`}
					style={{ textDecoration: 'none' }}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 6,
							marginBottom: 2,
						}}
					>
						{video.avatar_url ? (
							<img
								src={video.avatar_url}
								alt={name}
								style={{
									width: 16,
									height: 16,
									borderRadius: '50%',
									objectFit: 'cover',
								}}
							/>
						) : (
							<div
								style={{
									width: 16,
									height: 16,
									borderRadius: '50%',
									background: color,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 7,
									fontWeight: 700,
									color: '#fff',
								}}
							>
								{name.slice(0, 2).toUpperCase()}
							</div>
						)}
						<span style={{ fontSize: 12, color: '#888' }}>{name}</span>
					</div>
				</Link>
				<p style={{ fontSize: 11, color: '#555', margin: 0 }}>
					{fmt(video.views_count)} views · {timeAgo(video.created_at)}
				</p>
			</div>
			{/* Likes badge */}
			<div
				style={{
					flexShrink: 0,
					display: 'flex',
					alignItems: 'center',
					gap: 5,
					padding: '4px 10px',
					borderRadius: 20,
					background: 'rgba(230,57,70,0.1)',
					border: '1px solid rgba(230,57,70,0.2)',
				}}
			>
				<svg width='12' height='12' viewBox='0 0 24 24' fill='#e63946'>
					<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
				</svg>
				<span style={{ fontSize: 12, fontWeight: 600, color: '#e63946' }}>
					{fmt(video.likes_count)}
				</span>
			</div>
			<div style={{ flexShrink: 0, textAlign: 'right', minWidth: 64 }}>
				<p style={{ fontSize: 11, color: '#444', margin: 0 }}>Liked</p>
				<p style={{ fontSize: 11, color: '#555', margin: 0 }}>
					{timeAgo(video.liked_at)}
				</p>
			</div>
		</div>
	)
}

export default function LikedPage() {
	const router = useRouter()
	const { user } = useAuthContext()
	const [videos, setVideos] = useState<LikedVideo[]>([])
	const [loading, setLoading] = useState(true)
	const [sort, setSort] = useState<SortKey>('date_added_desc')
	const [search, setSearch] = useState('')

	useEffect(() => {
		if (!user) return
		fetch('/api/me/liked')
			.then(r => r.json())
			.then(d => {
				if (d.ok) setVideos(d.data.items)
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [user])

	const processed = useMemo(() => {
		let arr = sortVideos(videos, sort)
		if (search.trim()) {
			const q = search.toLowerCase()
			arr = arr.filter(
				v =>
					v.title.toLowerCase().includes(q) ||
					(v.display_name || v.username).toLowerCase().includes(q),
			)
		}
		return arr
	}, [videos, sort, search])

	const totalLikes = videos.reduce((s, v) => s + v.likes_count, 0)
	const coverThumb = videos[0]?.thumbnail_url ?? null

	function playAll() {
		if (processed.length)
			router.push(`/en/watch/${processed[0].id}?queue=liked&index=0`)
	}
	function playAt(i: number) {
		router.push(`/en/watch/${processed[i].id}?queue=liked&index=${i}`)
	}

	return (
		<UserLayout>
			<style>{`
				@keyframes spin  { to { transform: rotate(360deg) } }
				@keyframes fadeUp{ from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
				@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.45} }
				@keyframes popIn { from{opacity:0;transform:scale(.96) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)} }
			`}</style>

			{loading ? (
				<div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
					<div style={{ width: 280, flexShrink: 0 }}>
						<div
							style={{
								paddingBottom: '56.25%',
								background: '#1a1a1a',
								borderRadius: 14,
								marginBottom: 16,
								animation: 'pulse 1.6s ease-in-out infinite',
							}}
						/>
						{[22, 14, 14].map((h, i) => (
							<div
								key={i}
								style={{
									height: h,
									background: '#1a1a1a',
									borderRadius: 6,
									marginBottom: 10,
									width: i === 2 ? '60%' : '100%',
									animation: 'pulse 1.6s ease-in-out infinite',
								}}
							/>
						))}
					</div>
					<div style={{ flex: 1 }}>
						{[1, 2, 3, 4, 5].map(i => (
							<div
								key={i}
								style={{
									display: 'flex',
									gap: 12,
									marginBottom: 14,
									alignItems: 'center',
								}}
							>
								<div
									style={{
										width: 28,
										height: 14,
										background: '#1a1a1a',
										borderRadius: 4,
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
								<div
									style={{
										width: 120,
										height: 68,
										background: '#1a1a1a',
										borderRadius: 8,
										flexShrink: 0,
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
								<div style={{ flex: 1 }}>
									<div
										style={{
											height: 14,
											background: '#1a1a1a',
											borderRadius: 4,
											marginBottom: 8,
											animation: 'pulse 1.6s ease-in-out infinite',
										}}
									/>
									<div
										style={{
											height: 11,
											background: '#1a1a1a',
											borderRadius: 4,
											width: '50%',
											animation: 'pulse 1.6s ease-in-out infinite',
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			) : videos.length === 0 ? (
				<div
					style={{
						textAlign: 'center',
						padding: '80px 20px',
						border: '1px dashed #1e1e1e',
						borderRadius: 16,
						animation: 'fadeUp 0.3s ease both',
					}}
				>
					<div
						style={{
							width: 72,
							height: 72,
							borderRadius: '50%',
							background: 'rgba(230,57,70,0.08)',
							border: '1px solid rgba(230,57,70,0.15)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							margin: '0 auto 18px',
						}}
					>
						<svg width='30' height='30' viewBox='0 0 24 24' fill='#e63946'>
							<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
						</svg>
					</div>
					<p
						style={{
							fontSize: 18,
							fontWeight: 700,
							color: '#fff',
							margin: '0 0 8px',
						}}
					>
						No liked videos yet
					</p>
					<p
						style={{
							fontSize: 14,
							color: '#555',
							margin: '0 0 24px',
							maxWidth: 340,
							marginInline: 'auto',
							lineHeight: 1.6,
						}}
					>
						Videos you like will appear here. Hit 👍 on any video.
					</p>
					<Link
						href='/en'
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 8,
							padding: '10px 24px',
							borderRadius: 24,
							background: '#e63946',
							color: '#fff',
							fontSize: 14,
							fontWeight: 700,
							textDecoration: 'none',
						}}
					>
						Discover videos
					</Link>
				</div>
			) : (
				<div
					style={{
						display: 'flex',
						gap: 32,
						alignItems: 'flex-start',
						animation: 'fadeUp 0.25s ease both',
					}}
				>
					{/* LEFT */}
					<div
						style={{ width: 280, flexShrink: 0, position: 'sticky', top: 76 }}
					>
						<div
							style={{
								width: '100%',
								aspectRatio: '16/9',
								borderRadius: 14,
								overflow: 'hidden',
								background: '#1a1a1a',
								marginBottom: 16,
							}}
						>
							{coverThumb ? (
								<img
									src={coverThumb}
									alt='Liked'
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
								/>
							) : (
								<div
									style={{
										width: '100%',
										height: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<svg
										width='48'
										height='48'
										viewBox='0 0 24 24'
										fill='#2a2a2a'
									>
										<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
									</svg>
								</div>
							)}
						</div>
						<h1
							style={{
								fontSize: 20,
								fontWeight: 800,
								color: '#fff',
								margin: '0 0 8px',
							}}
						>
							Liked Videos
						</h1>
						<div
							style={{
								display: 'flex',
								gap: 14,
								marginBottom: 12,
								flexWrap: 'wrap',
							}}
						>
							{[
								[
									String(videos.length),
									videos.length === 1 ? 'video' : 'videos',
								],
								[fmt(totalLikes), 'total likes'],
							].map(([v, l]) => (
								<div key={l}>
									<span
										style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}
									>
										{v}
									</span>
									<span style={{ fontSize: 12, color: '#666' }}> {l}</span>
								</div>
							))}
						</div>
						<p style={{ fontSize: 11, color: '#444', margin: '0 0 20px' }}>
							Videos you&apos;ve given a thumbs up
						</p>
						<button
							onClick={playAll}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
								padding: '11px 20px',
								borderRadius: 24,
								width: '100%',
								background: '#e63946',
								border: 'none',
								color: '#fff',
								fontSize: 14,
								fontWeight: 700,
								cursor: 'pointer',
								fontFamily: 'inherit',
								transition: 'background 0.15s',
								boxSizing: 'border-box',
							}}
							onMouseEnter={e => (e.currentTarget.style.background = '#c62e3b')}
							onMouseLeave={e => (e.currentTarget.style.background = '#e63946')}
						>
							<svg
								width='16'
								height='16'
								viewBox='0 0 24 24'
								fill='currentColor'
							>
								<path d='M8 5v14l11-7z' />
							</svg>
							Play All
						</button>
					</div>

					{/* RIGHT */}
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								marginBottom: 16,
								flexWrap: 'wrap',
							}}
						>
							<h2
								style={{
									fontSize: 16,
									fontWeight: 700,
									color: '#fff',
									margin: 0,
									flex: 1,
								}}
							>
								{processed.length} {processed.length === 1 ? 'Video' : 'Videos'}
								{search && (
									<span
										style={{
											fontSize: 13,
											fontWeight: 400,
											color: '#555',
											marginLeft: 8,
										}}
									>
										for &ldquo;{search}&rdquo;
									</span>
								)}
							</h2>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									height: 36,
									background: '#111',
									border: '1px solid #1e1e1e',
									borderRadius: 20,
									overflow: 'hidden',
									transition: 'border-color 0.2s',
									minWidth: 200,
								}}
								onFocusCapture={e =>
									(e.currentTarget.style.borderColor = '#e63946')
								}
								onBlurCapture={e =>
									(e.currentTarget.style.borderColor = '#1e1e1e')
								}
							>
								<div
									style={{ padding: '0 12px', color: '#444', display: 'flex' }}
								>
									<svg
										width='13'
										height='13'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' />
									</svg>
								</div>
								<input
									type='text'
									placeholder='Search…'
									value={search}
									onChange={e => setSearch(e.target.value)}
									style={{
										flex: 1,
										background: 'transparent',
										border: 'none',
										outline: 'none',
										color: '#fff',
										fontSize: 13,
										fontFamily: 'inherit',
										paddingRight: 12,
									}}
								/>
								{search && (
									<button
										onClick={() => setSearch('')}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											color: '#444',
											display: 'flex',
											padding: '0 10px',
										}}
									>
										<svg
											width='11'
											height='11'
											viewBox='0 0 24 24'
											fill='currentColor'
										>
											<path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
										</svg>
									</button>
								)}
							</div>
							<SortDropdown value={sort} onChange={setSort} />
						</div>
						{processed.length === 0 ? (
							<div
								style={{
									textAlign: 'center',
									padding: '60px 20px',
									border: '1px dashed #1e1e1e',
									borderRadius: 14,
								}}
							>
								<p style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>
									No results for &ldquo;{search}&rdquo;
								</p>
								<button
									onClick={() => setSearch('')}
									style={{
										background: 'none',
										border: '1px solid #2a2a2a',
										borderRadius: 20,
										padding: '7px 16px',
										color: '#888',
										fontSize: 13,
										cursor: 'pointer',
										fontFamily: 'inherit',
									}}
								>
									Clear filter
								</button>
							</div>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								{processed.map((video, index) => (
									<VideoRow
										key={video.id}
										video={video}
										index={index}
										onPlay={() => playAt(index)}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</UserLayout>
	)
}
