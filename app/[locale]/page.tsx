'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import UserLayout from '../_components/layout/UserLayout'

type Video = {
	id: string
	title: string
	thumbnail_url: string | null
	video_url: string
	category: string | null
	video_type: 'normal' | 'shorts' | null
	views_count: number
	likes_count: number
	created_at: string
	uploader: { id: string; username: string; avatar_url?: string }
}

type Feed = { items: Video[]; next_cursor: string | null; has_more: boolean }

function fmtViews(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
	const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
	if (s < 60) return 'just now'
	if (s < 3600) return Math.floor(s / 60) + 'm ago'
	if (s < 86400) return Math.floor(s / 3600) + 'h ago'
	const d = Math.floor(s / 86400)
	if (d < 7) return d + 'd ago'
	if (d < 30) return Math.floor(d / 7) + 'w ago'
	if (d < 365) return Math.floor(d / 30) + 'mo ago'
	return Math.floor(d / 365) + 'y ago'
}

function avatarColor(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
}

// ── Kebab menu ────────────────────────────────────────────────────────────────
function KebabMenu({
	videoId,
	onClose,
}: {
	videoId: string
	onClose: () => void
}) {
	const ref = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const fn = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		document.addEventListener('mousedown', fn)
		return () => document.removeEventListener('mousedown', fn)
	}, [onClose])

	const actions = [
		{
			label: 'Save to Watch Later',
			icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
			onClick: async (e: React.MouseEvent) => {
				e.preventDefault()
				e.stopPropagation()
				await fetch('/api/me/watch-later', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ video_id: videoId }),
				}).catch(() => {})
				onClose()
			},
		},
		{
			label: 'Copy link',
			icon: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
			onClick: (e: React.MouseEvent) => {
				e.preventDefault()
				e.stopPropagation()
				navigator.clipboard
					?.writeText(`${window.location.origin}/en/watch/${videoId}`)
					.catch(() => {})
				onClose()
			},
		},
	]

	return (
		<div
			ref={ref}
			style={{
				position: 'absolute',
				top: '100%',
				right: 0,
				zIndex: 300,
				background: '#1c1c1c',
				border: '1px solid #2a2a2a',
				borderRadius: 10,
				minWidth: 186,
				overflow: 'hidden',
				boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
				animation: 'pop .12s ease',
			}}
		>
			{actions.map(a => (
				<button
					key={a.label}
					onClick={a.onClick}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						width: '100%',
						padding: '10px 14px',
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: '#ccc',
						fontSize: 13,
						fontFamily: 'inherit',
						textAlign: 'left',
						transition: 'background .1s',
					}}
					onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
					onMouseLeave={e => (e.currentTarget.style.background = 'none')}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='#555'>
						<path d={a.icon} />
					</svg>
					{a.label}
				</button>
			))}
		</div>
	)
}

// ── Normal video card ─────────────────────────────────────────────────────────
function VideoCard({ video }: { video: Video }) {
	const [hovered, setHovered] = useState(false)
	const [menu, setMenu] = useState(false)
	const color = avatarColor(video.uploader.id)
	const initials = video.uploader.username.slice(0, 2).toUpperCase()

	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ position: 'relative' }}
		>
			<Link
				href={`/en/watch/${video.id}`}
				style={{ textDecoration: 'none', display: 'block' }}
			>
				<div
					style={{
						position: 'relative',
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
								transform: hovered ? 'scale(1.04)' : 'scale(1)',
								transition: 'transform .2s',
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
							}}
						>
							<svg width='36' height='36' viewBox='0 0 24 24' fill='#333'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					)}
					{hovered && !menu && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: 'rgba(0,0,0,.28)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div
								style={{
									width: 44,
									height: 44,
									borderRadius: '50%',
									background: 'rgba(230,57,70,.9)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<svg width='18' height='18' viewBox='0 0 24 24' fill='#fff'>
									<path d='M8 5v14l11-7z' />
								</svg>
							</div>
						</div>
					)}
				</div>
			</Link>
			<div
				style={{
					display: 'flex',
					gap: 10,
					marginTop: 10,
					alignItems: 'flex-start',
				}}
			>
				<Link
					href={`/en/channel/${video.uploader.id}`}
					style={{ flexShrink: 0, textDecoration: 'none' }}
				>
					{video.uploader.avatar_url ? (
						<img
							src={video.uploader.avatar_url}
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								objectFit: 'cover',
							}}
							alt=''
						/>
					) : (
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: color,
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
				</Link>
				<div style={{ flex: 1, minWidth: 0 }}>
					<Link
						href={`/en/watch/${video.id}`}
						style={{ textDecoration: 'none' }}
					>
						<p
							style={{
								fontSize: 14,
								fontWeight: 600,
								color: '#fff',
								lineHeight: 1.4,
								margin: '0 0 2px',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{video.title}
						</p>
					</Link>
					<Link
						href={`/en/channel/${video.uploader.id}`}
						style={{ textDecoration: 'none' }}
					>
						<p style={{ fontSize: 13, color: '#999', margin: '0 0 1px' }}>
							{video.uploader.username}
						</p>
					</Link>
					<p style={{ fontSize: 13, color: '#666', margin: 0 }}>
						{fmtViews(video.views_count)} views · {timeAgo(video.created_at)}
					</p>
				</div>
				<div style={{ position: 'relative', flexShrink: 0 }}>
					<button
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
							setMenu(v => !v)
						}}
						style={{
							width: 32,
							height: 32,
							borderRadius: '50%',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#777',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							opacity: hovered || menu ? 1 : 0,
							transition: 'opacity .15s',
						}}
						onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
						onMouseLeave={e => (e.currentTarget.style.background = 'none')}
					>
						<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
							<circle cx='12' cy='5' r='2' />
							<circle cx='12' cy='12' r='2' />
							<circle cx='12' cy='19' r='2' />
						</svg>
					</button>
					{menu && (
						<KebabMenu videoId={video.id} onClose={() => setMenu(false)} />
					)}
				</div>
			</div>
		</div>
	)
}

// ── Shorts card ───────────────────────────────────────────────────────────────
// Uses 3:4 ratio (75% padding) instead of full 9:16 so cards aren't too tall
function ShortsCard({ video }: { video: Video }) {
	const [hovered, setHovered] = useState(false)

	return (
		<Link
			href='/en/shorts'
			style={{ textDecoration: 'none', display: 'block', minWidth: 0 }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{/* 3:4 aspect ratio keeps cards compact while still feeling vertical */}
			<div
				style={{
					position: 'relative',
					width: '85%',
					height: '75%',
					paddingBottom: '133%',
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
							transform: hovered ? 'scale(1.04)' : 'scale(1)',
							transition: 'transform .2s',
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
						}}
					>
						<svg width='24' height='24' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}

				{/* SHORTS pill */}
				<div
					style={{
						position: 'absolute',
						top: 7,
						left: 7,
						background: 'rgba(230,57,70,0.92)',
						color: '#fff',
						fontSize: 9,
						fontWeight: 800,
						padding: '2px 6px',
						borderRadius: 4,
						letterSpacing: '0.4px',
					}}
				>
					SHORTS
				</div>

				{/* Play overlay */}
				{hovered && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: 'rgba(0,0,0,.3)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: 'rgba(230,57,70,.9)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<svg width='14' height='14' viewBox='0 0 24 24' fill='#fff'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					</div>
				)}

				{/* Views badge */}
				<div
					style={{
						position: 'absolute',
						bottom: 6,
						left: 6,
						background: 'rgba(0,0,0,.72)',
						color: '#fff',
						fontSize: 10,
						fontWeight: 600,
						padding: '2px 6px',
						borderRadius: 5,
					}}
				>
					{fmtViews(video.views_count)}
				</div>
			</div>

			<p
				style={{
					fontSize: 12,
					fontWeight: 600,
					color: hovered ? '#fff' : '#ddd',
					margin: '6px 0 1px',
					lineHeight: 1.35,
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
					transition: 'color .15s',
				}}
			>
				{video.title}
			</p>
			<p style={{ fontSize: 11, color: '#666', margin: 0 }}>
				{video.uploader.username}
			</p>
		</Link>
	)
}

// ── Shorts shelf — always exactly 5 equal columns ────────────────────────────
function ShortsShelf({ videos }: { videos: Video[] }) {
	return (
		<div style={{ marginBottom: 36 }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 12,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<div
						style={{
							width: 3,
							height: 16,
							background: '#e63946',
							borderRadius: 2,
						}}
					/>
					<span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
						Shorts
					</span>
				</div>
				<Link
					href='/en/shorts'
					style={{
						fontSize: 12,
						color: '#e63946',
						textDecoration: 'none',
						fontWeight: 600,
						display: 'flex',
						alignItems: 'center',
						gap: 3,
					}}
				>
					View all
					<svg width='13' height='13' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
					</svg>
				</Link>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(5, 1fr)',
					gap: 6,
				}}
			>
				{videos.map(v => (
					<ShortsCard key={v.id} video={v} />
				))}
			</div>
		</div>
	)
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
	const s: React.CSSProperties = {
		background: '#1e1e1e',
		borderRadius: 6,
		animation: 'pulse 1.6s ease-in-out infinite',
	}
	return (
		<div>
			<div style={{ ...s, paddingBottom: '56.25%', borderRadius: 10 }} />
			<div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
				<div
					style={{
						...s,
						width: 36,
						height: 36,
						borderRadius: '50%',
						flexShrink: 0,
					}}
				/>
				<div style={{ flex: 1 }}>
					<div style={{ ...s, height: 14, marginBottom: 6 }} />
					<div style={{ ...s, height: 12, width: '65%' }} />
				</div>
			</div>
		</div>
	)
}

// ── Page ──────────────────────────────────────────────────────────────────────
const CATS = [
	{ v: '', l: 'All' },
	{ v: 'music', l: '🎵 Music' },
	{ v: 'streams', l: '🎮 Streams' },
	{ v: 'news', l: '📰 News' },
	{ v: 'sport', l: '⚽ Sport' },
	{ v: 'videogames', l: '🕹️ Video Games' },
]

/**
 * Converts a flat video list into alternating normal/shorts blocks.
 *
 * Strategy:
 *  - Walk through every video in order.
 *  - Normal videos go into a running buffer.
 *  - Shorts go into a SEPARATE pending buffer — they are NEVER emitted
 *    one-by-one; they only emit as a group.
 *  - Once we have accumulated >= NORMAL_BATCH normal videos AND there are
 *    pending shorts, flush normal → flush shorts (up to 5).
 *  - At the end, flush whatever remains: normal first, then pending shorts.
 *
 * This guarantees all shorts between two normal batches always appear
 * together in a single shelf, never split across multiple rows.
 */
function buildBlocks(items: Video[]) {
	const NORMAL_BATCH = 12

	type Block =
		| { type: 'normal'; items: Video[] }
		| { type: 'shorts'; items: Video[] }

	const blocks: Block[] = []
	let normBuf: Video[] = []
	let shortBuf: Video[] = []

	const flushNormal = () => {
		if (!normBuf.length) return
		blocks.push({ type: 'normal', items: normBuf })
		normBuf = []
	}

	const flushShorts = () => {
		if (!shortBuf.length) return
		blocks.push({ type: 'shorts', items: shortBuf.slice(0, 6) })
		shortBuf = []
	}

	for (const v of items) {
		if (v.video_type === 'shorts') {
			// Just accumulate — never emit immediately
			shortBuf.push(v)
		} else {
			normBuf.push(v)
			// Only flush when we've filled a full batch AND have shorts waiting
			if (normBuf.length >= NORMAL_BATCH && shortBuf.length > 0) {
				flushNormal()
				flushShorts()
			}
		}
	}

	// Drain remaining items
	flushNormal()
	flushShorts()

	return blocks
}

export default function Home() {
	const [feed, setFeed] = useState<Feed | null>(null)
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [cat, setCat] = useState('')
	const sentinel = useRef<HTMLDivElement>(null)
	const observer = useRef<IntersectionObserver | null>(null)

	const load = useCallback(
		async (category: string, cursor?: string | null): Promise<Feed | null> => {
			const p = new URLSearchParams()
			if (category) p.set('category', category)
			if (cursor) {
				try {
					const d = JSON.parse(atob(cursor))
					if (d.created_at) p.set('cursor_created_at', d.created_at)
					if (d.id) p.set('cursor_id', d.id)
				} catch {}
			}
			const r = await fetch(`/api/videos?${p}`)
			const j = await r.json()
			return j.ok ? j.data : null
		},
		[],
	)

	useEffect(() => {
		setLoading(true)
		setFeed(null)
		load(cat)
			.then(d => {
				if (d) setFeed(d)
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [cat, load])

	useEffect(() => {
		observer.current?.disconnect()
		if (!sentinel.current || !feed?.has_more) return
		observer.current = new IntersectionObserver(
			async ([e]) => {
				if (!e.isIntersecting || loadingMore || !feed.next_cursor) return
				setLoadingMore(true)
				const more = await load(cat, feed.next_cursor).catch(() => null)
				if (more)
					setFeed(prev =>
						prev ? { ...more, items: [...prev.items, ...more.items] } : more,
					)
				setLoadingMore(false)
			},
			{ threshold: 0.1 },
		)
		observer.current.observe(sentinel.current)
		return () => observer.current?.disconnect()
	}, [feed, loadingMore, cat, load])

	const blocks = feed ? buildBlocks(feed.items) : []

	return (
		<UserLayout>
			<style>{`
				@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.45} }
				@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
				@keyframes spin   { to{transform:rotate(360deg)} }
				@keyframes pop    { from{opacity:0;transform:scale(.95) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }

				.video-grid { container-type: inline-size; }
				.video-grid-inner {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 24px 16px;
					margin-bottom: 36px;
				}
				@container (max-width: 1270px) { .video-grid-inner { grid-template-columns: repeat(3, 1fr); } }
				@container (max-width: 860px)  { .video-grid-inner { grid-template-columns: repeat(2, 1fr); } }

				.skeleton-grid { container-type: inline-size; }
				.skeleton-grid-inner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 16px; }
				@container (max-width: 1270px) { .skeleton-grid-inner { grid-template-columns: repeat(3, 1fr); } }
				@container (max-width: 860px)  { .skeleton-grid-inner { grid-template-columns: repeat(2, 1fr); } }
			`}</style>

			{/* Category chips */}
			<div
				style={{
					display: 'flex',
					gap: 8,
					overflowX: 'auto',
					marginBottom: 28,
					paddingBottom: 2,
					scrollbarWidth: 'none',
				}}
			>
				{CATS.map(c => (
					<button
						key={c.v}
						onClick={() => setCat(c.v)}
						style={{
							flexShrink: 0,
							padding: '7px 16px',
							borderRadius: 20,
							border: `1px solid ${cat === c.v ? 'transparent' : '#242424'}`,
							background: cat === c.v ? '#fff' : '#111',
							color: cat === c.v ? '#000' : '#888',
							fontSize: 13,
							fontWeight: cat === c.v ? 600 : 400,
							cursor: 'pointer',
							fontFamily: 'inherit',
							transition: 'all .15s',
						}}
					>
						{c.l}
					</button>
				))}
			</div>

			{loading ? (
				<div className='skeleton-grid'>
					<div className='skeleton-grid-inner'>
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} />
						))}
					</div>
				</div>
			) : !feed || feed.items.length === 0 ? (
				<div style={{ textAlign: 'center', padding: '80px 20px' }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
					<p style={{ fontSize: 17, color: '#555', marginBottom: 6 }}>
						No videos yet
					</p>
					<p style={{ fontSize: 13, color: '#444' }}>
						{cat ? `No ${cat} videos uploaded yet.` : 'Be the first to upload!'}
					</p>
				</div>
			) : (
				<div style={{ animation: 'fadeUp .3s ease both' }}>
					{blocks.map((b, i) =>
						b.type === 'shorts' ? (
							<ShortsShelf key={`s${i}`} videos={b.items} />
						) : (
							<div key={`n${i}`} className='video-grid'>
								<div className='video-grid-inner'>
									{b.items.map(v => (
										<VideoCard key={v.id} video={v} />
									))}
								</div>
							</div>
						),
					)}
					<div
						ref={sentinel}
						style={{
							height: 40,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{loadingMore && (
							<div
								style={{
									width: 22,
									height: 22,
									border: '2px solid #222',
									borderTopColor: '#e63946',
									borderRadius: '50%',
									animation: 'spin .7s linear infinite',
								}}
							/>
						)}
					</div>
				</div>
			)}
		</UserLayout>
	)
}
