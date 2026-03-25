'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import UserLayout from '../_components/layout/UserLayout'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Types ─── */
type Video = {
	id: string
	title: string
	thumbnail_url: string | null
	video_url: string
	category: string
	views_count: number
	likes_count: number
	created_at: string
	uploader: {
		id: string
		username: string
		avatar_url?: string
	}
}

type Feed = {
	items: Video[]
	next_cursor: string | null
	has_more: boolean
}

/* ─── Helpers ─── */
function formatViews(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const d = Math.floor(diff / 86400000)
	if (d < 1) return 'today'
	if (d < 7) return `${d}d ago`
	if (d < 30) return `${Math.floor(d / 7)}w ago`
	if (d < 365) return `${Math.floor(d / 30)}mo ago`
	return `${Math.floor(d / 365)}y ago`
}

function colorFromString(s: string): string {
	const colors = [
		'#e63946',
		'#2a9d8f',
		'#e76f51',
		'#457b9d',
		'#6a4c93',
		'#f4a261',
	]
	let hash = 0
	for (const c of s) hash = (hash * 31 + c.charCodeAt(0)) | 0
	return colors[Math.abs(hash) % colors.length]
}

/* ─── VideoCard ─── */
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
	const [hovered, setHovered] = useState(false)
	const initials = video.uploader.username.slice(0, 2).toUpperCase()
	const avatarColor = colorFromString(video.uploader.id)

	return (
		<div
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				cursor: 'pointer',
				display: 'flex',
				flexDirection: 'column',
				gap: 0,
			}}
		>
			{/* Thumbnail */}
			<div
				style={{
					position: 'relative',
					width: '100%',
					paddingBottom: '56.25%',
					borderRadius: 10,
					overflow: 'hidden',
					background: '#1a1a1a',
				}}
			>
				{video.thumbnail_url ? (
					<img
						src={video.thumbnail_url}
						alt={video.title}
						style={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: hovered ? 'scale(1.05)' : 'scale(1)',
							transition: 'transform 0.2s',
						}}
					/>
				) : (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
						}}
					>
						<svg width='36' height='36' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}
			</div>

			{/* Info */}
			<div
				style={{
					display: 'flex',
					gap: 10,
					marginTop: 10,
					alignItems: 'flex-start',
				}}
			>
				{video.uploader.avatar_url ? (
					<img
						src={video.uploader.avatar_url}
						alt={video.uploader.username}
						style={{
							width: 36,
							height: 36,
							borderRadius: '50%',
							objectFit: 'cover',
							flexShrink: 0,
						}}
					/>
				) : (
					<div
						style={{
							width: 36,
							height: 36,
							borderRadius: '50%',
							background: avatarColor,
							flexShrink: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 12,
							fontWeight: 700,
							color: '#fff',
						}}
					>
						{initials}
					</div>
				)}
				<div style={{ flex: 1, minWidth: 0 }}>
					<p
						style={{
							fontSize: 14,
							fontWeight: 600,
							color: '#fff',
							lineHeight: 1.4,
							margin: '0 0 3px',
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{video.title}
					</p>
					<p style={{ fontSize: 13, color: '#aaa', margin: '0 0 2px' }}>
						{video.uploader.username}
					</p>
					<p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
						{formatViews(video.views_count)} views · {timeAgo(video.created_at)}
					</p>
				</div>
			</div>
		</div>
	)
}

/* ─── VideoModal (inline player) ─── */
function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
	useEffect(() => {
		// Track view
		fetch(`/api/videos/${video.id}/view`, { method: 'POST' }).catch(() => {})
		const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [video.id, onClose])

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 2000,
				background: 'rgba(0,0,0,0.95)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
			}}
			onClick={e => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 900,
					borderRadius: 12,
					overflow: 'hidden',
					background: '#111',
				}}
			>
				<video
					src={video.video_url}
					controls
					autoPlay
					style={{
						width: '100%',
						maxHeight: '60vh',
						background: '#000',
						display: 'block',
					}}
				/>
				<div
					style={{
						padding: '16px 20px',
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						gap: 16,
					}}
				>
					<div>
						<h2
							style={{
								fontSize: 18,
								fontWeight: 700,
								color: '#fff',
								margin: '0 0 4px',
							}}
						>
							{video.title}
						</h2>
						<p style={{ fontSize: 13, color: '#666', margin: 0 }}>
							by {video.uploader.username} · {formatViews(video.views_count)}{' '}
							views
						</p>
					</div>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#666',
							padding: 4,
							flexShrink: 0,
						}}
					>
						<svg
							width='20'
							height='20'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<line x1='18' y1='6' x2='6' y2='18' />
							<line x1='6' y1='6' x2='18' y2='18' />
						</svg>
					</button>
				</div>
			</div>
		</div>
	)
}

/* ─── Skeleton ─── */
function VideoSkeleton() {
	return (
		<div>
			<div
				style={{
					width: '100%',
					paddingBottom: '56.25%',
					borderRadius: 10,
					background: '#1a1a1a',
					animation: 'pulse 1.5s ease-in-out infinite',
				}}
			/>
			<div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
				<div
					style={{
						width: 36,
						height: 36,
						borderRadius: '50%',
						background: '#1a1a1a',
						flexShrink: 0,
						animation: 'pulse 1.5s ease-in-out infinite',
					}}
				/>
				<div style={{ flex: 1 }}>
					<div
						style={{
							height: 14,
							background: '#1a1a1a',
							borderRadius: 4,
							marginBottom: 6,
							animation: 'pulse 1.5s ease-in-out infinite',
						}}
					/>
					<div
						style={{
							height: 12,
							background: '#1a1a1a',
							borderRadius: 4,
							width: '70%',
							animation: 'pulse 1.5s ease-in-out infinite',
						}}
					/>
				</div>
			</div>
		</div>
	)
}

/* ─── Main Page ─── */
export default function Home() {
	const [feed, setFeed] = useState<Feed | null>(null)
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
	const [activeCategory, setActiveCategory] = useState<string>('')
	const observerRef = useRef<IntersectionObserver | null>(null)
	const sentinelRef = useRef<HTMLDivElement | null>(null)
	const { language } = useLanguage()

	const CATEGORIES = [
		{ value: '', label: 'All' },
		{ value: 'music', label: '🎵 Music' },
		{ value: 'streams', label: '🎮 Streams' },
		{ value: 'news', label: '📰 News' },
		{ value: 'sport', label: '⚽ Sport' },
		{ value: 'videogames', label: '🕹️ Video Games' },
	]

	const fetchFeed = useCallback(async (category: string, cursor?: string) => {
		const params = new URLSearchParams()
		if (category) params.set('category', category)
		if (cursor) {
			try {
				const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString())
				if (decoded.created_at)
					params.set('cursor_created_at', decoded.created_at)
				if (decoded.id) params.set('cursor_id', decoded.id)
			} catch {}
		}
		const res = await fetch(`/api/videos?${params}`)
		const data = await res.json()
		return data.ok ? (data.data as Feed) : null
	}, [])

	useEffect(() => {
		setLoading(true)
		setFeed(null)
		fetchFeed(activeCategory).then(data => {
			if (data) setFeed(data)
			setLoading(false)
		})
	}, [activeCategory, fetchFeed])

	// Infinite scroll
	useEffect(() => {
		if (!sentinelRef.current) return
		observerRef.current?.disconnect()

		if (!feed?.has_more || !feed.next_cursor) return

		observerRef.current = new IntersectionObserver(
			async ([entry]) => {
				if (!entry.isIntersecting || loadingMore) return
				setLoadingMore(true)
				const more = await fetchFeed(activeCategory, feed.next_cursor!)
				if (more) {
					setFeed(prev =>
						prev
							? {
									items: [...prev.items, ...more.items],
									next_cursor: more.next_cursor,
									has_more: more.has_more,
								}
							: more,
					)
				}
				setLoadingMore(false)
			},
			{ threshold: 0.1 },
		)
		observerRef.current.observe(sentinelRef.current)
		return () => observerRef.current?.disconnect()
	}, [feed, loadingMore, activeCategory, fetchFeed])

	return (
		<UserLayout>
			<style>{`
				@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
				@keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
			`}</style>

			{/* Category chips */}
			<div
				style={{
					display: 'flex',
					gap: 8,
					overflowX: 'auto',
					paddingBottom: 4,
					marginBottom: 24,
					scrollbarWidth: 'none',
				}}
			>
				{CATEGORIES.map(cat => (
					<button
						key={cat.value}
						onClick={() => setActiveCategory(cat.value)}
						style={{
							flexShrink: 0,
							padding: '7px 16px',
							borderRadius: 20,
							border: `1px solid ${activeCategory === cat.value ? 'transparent' : '#222'}`,
							background: activeCategory === cat.value ? '#fff' : '#111',
							color: activeCategory === cat.value ? '#000' : '#888',
							fontSize: 13,
							fontWeight: activeCategory === cat.value ? 600 : 400,
							cursor: 'pointer',
							fontFamily: 'inherit',
							transition: 'all 0.15s',
						}}
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* Video grid */}
			{loading ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
						gap: '20px 16px',
					}}
				>
					{Array.from({ length: 8 }).map((_, i) => (
						<VideoSkeleton key={i} />
					))}
				</div>
			) : feed && feed.items.length > 0 ? (
				<>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
							gap: '24px 16px',
							animation: 'fadeUp 0.3s ease both',
						}}
					>
						{feed.items.map(video => (
							<VideoCard
								key={video.id}
								video={video}
								onClick={() => setSelectedVideo(video)}
							/>
						))}
					</div>
					{/* Infinite scroll sentinel */}
					<div
						ref={sentinelRef}
						style={{
							height: 40,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginTop: 24,
						}}
					>
						{loadingMore && (
							<div
								style={{
									width: 24,
									height: 24,
									border: '2px solid #222',
									borderTopColor: '#e63946',
									borderRadius: '50%',
									animation: 'spin 0.7s linear infinite',
								}}
							/>
						)}
					</div>
					<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
				</>
			) : (
				<div style={{ textAlign: 'center', padding: '80px 20px' }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
					<p style={{ fontSize: 18, color: '#555', marginBottom: 8 }}>
						No videos yet
					</p>
					<p style={{ fontSize: 14, color: '#444' }}>
						{activeCategory
							? `No ${activeCategory} videos uploaded yet.`
							: 'Be the first to upload a video!'}
					</p>
				</div>
			)}

			{/* Video modal */}
			{selectedVideo && (
				<VideoModal
					video={selectedVideo}
					onClose={() => setSelectedVideo(null)}
				/>
			)}
		</UserLayout>
	)
}
