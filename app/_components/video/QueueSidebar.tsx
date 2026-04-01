'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type QueueItem = {
	id: string
	title: string
	thumbnail_url: string | null
	views_count: number
	username: string
	display_name: string | null
}

type QueueType = 'liked' | 'watchlater' | 'playlist'

interface QueueSidebarProps {
	currentVideoId: string
	queueType: QueueType
	playlistId?: string | null
	startIndex: number
}

function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

const QUEUE_LABELS: Record<QueueType, string> = {
	liked: 'Liked Videos',
	watchlater: 'Watch Later',
	playlist: 'Playlist',
}

const QUEUE_ICONS: Record<QueueType, React.ReactNode> = {
	liked: (
		<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
			<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
		</svg>
	),
	watchlater: (
		<svg
			width='14'
			height='14'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
		>
			<circle cx='12' cy='12' r='10' />
			<polyline points='12 6 12 12 16 14' />
		</svg>
	),
	playlist: (
		<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
			<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
		</svg>
	),
}

const QUEUE_BACK: Record<QueueType, string> = {
	liked: '/en/liked',
	watchlater: '/en/watch-later',
	playlist: '/en/playlists',
}

export default function QueueSidebar({
	currentVideoId,
	queueType,
	playlistId,
	startIndex,
}: QueueSidebarProps) {
	const router = useRouter()
	const [items, setItems] = useState<QueueItem[]>([])
	const [loading, setLoading] = useState(true)
	const [currentIndex, setCurrentIndex] = useState(startIndex)
	const [autoplay, setAutoplay] = useState(true)
	const currentItemRef = useRef<HTMLDivElement>(null)

	// Find the actual index of the current video in the queue
	useEffect(() => {
		if (items.length === 0) return
		const idx = items.findIndex(item => item.id === currentVideoId)
		if (idx !== -1) setCurrentIndex(idx)
	}, [items, currentVideoId])

	// Fetch queue
	useEffect(() => {
		const params = new URLSearchParams({ type: queueType })
		if (playlistId) params.set('playlist_id', playlistId)
		fetch(`/api/me/queue?${params}`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) setItems(d.data.items)
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [queueType, playlistId])

	// Scroll current item into view
	useEffect(() => {
		if (currentItemRef.current) {
			currentItemRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			})
		}
	}, [currentIndex])

	function navigateTo(index: number) {
		if (index < 0 || index >= items.length) return
		const item = items[index]
		const params = new URLSearchParams({
			queue: queueType,
			index: String(index),
		})
		if (playlistId) params.set('playlist_id', playlistId)
		router.push(`/en/watch/${item.id}?${params}`)
	}

	const prevIndex = currentIndex - 1
	const nextIndex = currentIndex + 1
	const hasPrev = prevIndex >= 0
	const hasNext = nextIndex < items.length

	const backHref =
		queueType === 'playlist' && playlistId
			? `/en/playlists/${playlistId}`
			: QUEUE_BACK[queueType]

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				background: '#0d0d0d',
				border: '1px solid #1a1a1a',
				borderRadius: 14,
				overflow: 'hidden',
			}}
		>
			{/* Header */}
			<div
				style={{
					padding: '14px 16px',
					borderBottom: '1px solid #1a1a1a',
					flexShrink: 0,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: 10,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ color: '#e63946' }}>{QUEUE_ICONS[queueType]}</span>
						<span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
							{QUEUE_LABELS[queueType]}
						</span>
					</div>
					<Link
						href={backHref}
						style={{
							fontSize: 11,
							color: '#555',
							textDecoration: 'none',
							transition: 'color 0.15s',
						}}
						onMouseEnter={e => (e.currentTarget.style.color = '#e63946')}
						onMouseLeave={e => (e.currentTarget.style.color = '#555')}
					>
						View all →
					</Link>
				</div>

				{/* Progress + controls */}
				{!loading && items.length > 0 && (
					<>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginBottom: 10,
							}}
						>
							<span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
								{currentIndex + 1} / {items.length}
							</span>
							<div
								style={{
									flex: 1,
									height: 2,
									background: '#1e1e1e',
									borderRadius: 1,
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										height: '100%',
										background: '#e63946',
										borderRadius: 1,
										width: `${((currentIndex + 1) / items.length) * 100}%`,
										transition: 'width 0.3s ease',
									}}
								/>
							</div>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
							<button
								onClick={() => navigateTo(prevIndex)}
								disabled={!hasPrev}
								style={{
									width: 30,
									height: 30,
									borderRadius: 8,
									border: '1px solid #1e1e1e',
									background: 'transparent',
									color: hasPrev ? '#888' : '#2a2a2a',
									cursor: hasPrev ? 'pointer' : 'not-allowed',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'all 0.15s',
									flexShrink: 0,
								}}
								onMouseEnter={e => {
									if (hasPrev) {
										e.currentTarget.style.borderColor = '#444'
										e.currentTarget.style.color = '#fff'
									}
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = '#1e1e1e'
									e.currentTarget.style.color = hasPrev ? '#888' : '#2a2a2a'
								}}
							>
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z' />
								</svg>
							</button>
							<button
								onClick={() => navigateTo(nextIndex)}
								disabled={!hasNext}
								style={{
									width: 30,
									height: 30,
									borderRadius: 8,
									border: '1px solid #1e1e1e',
									background: 'transparent',
									color: hasNext ? '#888' : '#2a2a2a',
									cursor: hasNext ? 'pointer' : 'not-allowed',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'all 0.15s',
									flexShrink: 0,
								}}
								onMouseEnter={e => {
									if (hasNext) {
										e.currentTarget.style.borderColor = '#444'
										e.currentTarget.style.color = '#fff'
									}
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = '#1e1e1e'
									e.currentTarget.style.color = hasNext ? '#888' : '#2a2a2a'
								}}
							>
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
								</svg>
							</button>
							<div style={{ flex: 1 }} />
							{/* Autoplay toggle */}
							<button
								onClick={() => setAutoplay(v => !v)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									padding: '4px 10px',
									borderRadius: 20,
									border: '1px solid #1e1e1e',
									background: autoplay ? 'rgba(230,57,70,0.1)' : 'transparent',
									color: autoplay ? '#e63946' : '#555',
									fontSize: 11,
									fontWeight: 600,
									cursor: 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
							>
								<div
									style={{
										width: 24,
										height: 13,
										borderRadius: 7,
										background: autoplay ? '#e63946' : '#333',
										position: 'relative',
										transition: 'background 0.2s',
										flexShrink: 0,
									}}
								>
									<div
										style={{
											position: 'absolute',
											top: 2,
											left: autoplay ? 13 : 2,
											width: 9,
											height: 9,
											borderRadius: '50%',
											background: '#fff',
											transition: 'left 0.2s',
										}}
									/>
								</div>
								Autoplay
							</button>
						</div>
					</>
				)}
			</div>

			{/* Queue list */}
			<div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
				{loading ? (
					<div style={{ padding: 16 }}>
						{[1, 2, 3, 4, 5].map(i => (
							<div
								key={i}
								style={{
									display: 'flex',
									gap: 10,
									marginBottom: 12,
									alignItems: 'center',
								}}
							>
								<div
									style={{
										width: 80,
										height: 46,
										background: '#1a1a1a',
										borderRadius: 6,
										flexShrink: 0,
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
								<div style={{ flex: 1 }}>
									<div
										style={{
											height: 11,
											background: '#1a1a1a',
											borderRadius: 3,
											marginBottom: 5,
											animation: 'pulse 1.6s ease-in-out infinite',
										}}
									/>
									<div
										style={{
											height: 9,
											background: '#1a1a1a',
											borderRadius: 3,
											width: '60%',
											animation: 'pulse 1.6s ease-in-out infinite',
										}}
									/>
								</div>
							</div>
						))}
					</div>
				) : items.length === 0 ? (
					<div style={{ padding: '32px 16px', textAlign: 'center' }}>
						<p style={{ fontSize: 13, color: '#444' }}>Queue is empty</p>
					</div>
				) : (
					<div style={{ padding: '8px 0' }}>
						{items.map((item, index) => {
							const isCurrent = item.id === currentVideoId
							const name = item.display_name || item.username
							return (
								<div
									key={item.id}
									ref={isCurrent ? currentItemRef : undefined}
									onClick={() => navigateTo(index)}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 10,
										padding: '8px 12px',
										cursor: 'pointer',
										background: isCurrent
											? 'rgba(230,57,70,0.08)'
											: 'transparent',
										borderLeft: isCurrent
											? '3px solid #e63946'
											: '3px solid transparent',
										transition: 'background 0.12s',
									}}
									onMouseEnter={e => {
										if (!isCurrent) e.currentTarget.style.background = '#111'
									}}
									onMouseLeave={e => {
										if (!isCurrent)
											e.currentTarget.style.background = 'transparent'
									}}
								>
									{/* Index */}
									<span
										style={{
											fontSize: 11,
											color: isCurrent ? '#e63946' : '#3a3a3a',
											width: 18,
											textAlign: 'center',
											flexShrink: 0,
											fontWeight: isCurrent ? 700 : 400,
										}}
									>
										{isCurrent ? (
											<svg
												width='11'
												height='11'
												viewBox='0 0 24 24'
												fill='#e63946'
											>
												<path d='M8 5v14l11-7z' />
											</svg>
										) : (
											index + 1
										)}
									</span>
									{/* Thumbnail */}
									<div
										style={{
											width: 80,
											height: 46,
											borderRadius: 6,
											overflow: 'hidden',
											background: '#1a1a1a',
											flexShrink: 0,
											position: 'relative',
										}}
									>
										{item.thumbnail_url ? (
											<img
												src={item.thumbnail_url}
												alt={item.title}
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
													opacity: isCurrent ? 1 : 0.8,
												}}
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
													width='16'
													height='16'
													viewBox='0 0 24 24'
													fill='#333'
												>
													<path d='M8 5v14l11-7z' />
												</svg>
											</div>
										)}
										{isCurrent && (
											<div
												style={{
													position: 'absolute',
													inset: 0,
													background: 'rgba(230,57,70,0.2)',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												<div
													style={{
														width: 22,
														height: 22,
														borderRadius: '50%',
														background: 'rgba(230,57,70,0.9)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
												>
													<svg
														width='9'
														height='9'
														viewBox='0 0 24 24'
														fill='white'
													>
														<path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
													</svg>
												</div>
											</div>
										)}
									</div>
									{/* Info */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<p
											style={{
												fontSize: 12,
												fontWeight: isCurrent ? 700 : 500,
												color: isCurrent ? '#fff' : '#ccc',
												margin: '0 0 2px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
												lineHeight: 1.35,
											}}
										>
											{item.title}
										</p>
										<p
											style={{
												fontSize: 11,
												color: isCurrent ? '#888' : '#555',
												margin: 0,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{name} · {fmt(item.views_count)} views
										</p>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{/* Footer: next up */}
			{!loading && hasNext && autoplay && (
				<div
					style={{
						padding: '12px 16px',
						borderTop: '1px solid #1a1a1a',
						flexShrink: 0,
						background: '#0d0d0d',
					}}
				>
					<p
						style={{
							fontSize: 11,
							color: '#444',
							margin: '0 0 6px',
							textTransform: 'uppercase',
							letterSpacing: '0.8px',
						}}
					>
						Up Next
					</p>
					<div
						onClick={() => navigateTo(nextIndex)}
						style={{ display: 'flex', gap: 8, cursor: 'pointer' }}
						onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
						onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
					>
						<div
							style={{
								width: 60,
								height: 34,
								borderRadius: 5,
								overflow: 'hidden',
								background: '#1a1a1a',
								flexShrink: 0,
							}}
						>
							{items[nextIndex]?.thumbnail_url ? (
								<img
									src={items[nextIndex].thumbnail_url!}
									alt=''
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
									<svg width='12' height='12' viewBox='0 0 24 24' fill='#333'>
										<path d='M8 5v14l11-7z' />
									</svg>
								</div>
							)}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<p
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: '#ccc',
									margin: '0 0 1px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{items[nextIndex]?.title}
							</p>
							<p style={{ fontSize: 11, color: '#555', margin: 0 }}>
								{items[nextIndex]?.display_name || items[nextIndex]?.username}
							</p>
						</div>
					</div>
				</div>
			)}
			<style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
		</div>
	)
}
