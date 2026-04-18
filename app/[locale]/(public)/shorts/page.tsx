'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/context/AuthContext'
import UserLayout from '@/app/_components/layout/UserLayout'

/* ─── Types ─── */
type Short = {
	id: string
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	views_count: number
	likes_count: number
	created_at: string
	uploader: {
		id: string
		username: string
		display_name: string | null
		avatar_url: string | null
	}
}

/* ─── Helpers ─── */
function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
	const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
	if (d < 1) {
		const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
		if (h < 1) {
			const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
			return m < 1 ? 'just now' : `${m}m ago`
		}
		return `${h}h ago`
	}
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

/* ─────────────────────────────────────────────────────────────────────────────
   ACTION BUTTON — right side panel buttons
───────────────────────────────────────────────────────────────────────────── */
function ActionBtn({
	icon,
	label,
	active = false,
	activeColor = '#e63946',
	onClick,
}: {
	icon: React.ReactNode
	label?: string | React.ReactNode
	active?: boolean
	activeColor?: string
	onClick?: (e: React.MouseEvent) => void
}) {
	const [hovered, setHovered] = useState(false)
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 5,
				background: 'none',
				border: 'none',
				cursor: 'pointer',
				padding: '6px 0',
				fontFamily: 'inherit',
				color: active
					? activeColor
					: hovered
						? '#fff'
						: 'rgba(255,255,255,0.85)',
				transition: 'color 0.15s, transform 0.1s',
				transform: hovered ? 'scale(1.08)' : 'scale(1)',
			}}
		>
			<div
				style={{
					width: 48,
					height: 48,
					borderRadius: '50%',
					background: hovered
						? 'rgba(255,255,255,0.15)'
						: active
							? `rgba(230,57,70,0.15)`
							: 'rgba(255,255,255,0.08)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transition: 'background 0.15s',
					color: active ? activeColor : 'inherit',
				}}
			>
				{icon}
			</div>
			{label !== undefined && (
				<span
					style={{
						fontSize: 12,
						fontWeight: 600,
						color: active ? activeColor : 'rgba(255,255,255,0.7)',
						lineHeight: 1,
					}}
				>
					{label}
				</span>
			)}
		</button>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   INDIVIDUAL SHORT ITEM
───────────────────────────────────────────────────────────────────────────── */
function ShortItem({
	short,
	isActive,
	onVisible,
}: {
	short: Short
	isActive: boolean
	onVisible: () => void
}) {
	const { user } = useAuthContext()
	const videoRef = useRef<HTMLVideoElement>(null)
	const itemRef = useRef<HTMLDivElement>(null)
	const [muted, setMuted] = useState(true)
	const [paused, setPaused] = useState(false)
	const [showFlash, setShowFlash] = useState(false)
	const [liked, setLiked] = useState(false)
	const [likesCount, setLikesCount] = useState(short.likes_count)
	const [subscribed, setSubscribed] = useState(false)
	const [subLoading, setSubLoading] = useState(false)
	const [descExpanded, setDescExpanded] = useState(false)
	const [progress, setProgress] = useState(0)
	const [shareCopied, setShareCopied] = useState(false)
	const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	)

	const name = short.uploader.display_name || short.uploader.username
	const avatarColor = colorFromId(short.uploader.id)

	/* Intersection observer */
	useEffect(() => {
		const el = itemRef.current
		if (!el) return
		const obs = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting && e.intersectionRatio > 0.55) onVisible()
			},
			{ threshold: 0.55 },
		)
		obs.observe(el)
		return () => obs.disconnect()
	}, [onVisible])

	/* Play / pause when active changes */
	useEffect(() => {
		const vid = videoRef.current
		if (!vid) return
		if (isActive) {
			vid.currentTime = 0
			vid.muted = true
			setMuted(true)
			vid.play().catch(() => {})
			setPaused(false)
		} else {
			vid.pause()
			vid.currentTime = 0
			setDescExpanded(false)
		}
	}, [isActive])

	/* Fetch like/sub state */
	useEffect(() => {
		if (!user || !isActive) return
		fetch(`/api/videos/${short.id}/like`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) {
					setLiked(d.data.liked)
					setLikesCount(d.data.likes_count)
				}
			})
			.catch(() => {})
		fetch(`/api/users/${short.uploader.id}/subscribe`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) setSubscribed(d.data.subscribed)
			})
			.catch(() => {})
	}, [short.id, short.uploader.id, user, isActive])

	function tap() {
		const vid = videoRef.current
		if (!vid) return
		if (vid.paused) {
			vid.play()
			setPaused(false)
		} else {
			vid.pause()
			setPaused(true)
		}
		setShowFlash(true)
		clearTimeout(flashTimer.current)
		flashTimer.current = setTimeout(() => setShowFlash(false), 700)
	}

	function toggleMute(e: React.MouseEvent) {
		e.stopPropagation()
		const vid = videoRef.current
		if (!vid) return
		vid.muted = !vid.muted
		setMuted(vid.muted)
	}

	async function handleLike(e: React.MouseEvent) {
		e.stopPropagation()
		if (!user) {
			window.location.href = '/en/login'
			return
		}
		const prev = liked
		setLiked(!prev)
		setLikesCount(v => (prev ? v - 1 : v + 1))
		try {
			const res = await fetch(`/api/videos/${short.id}/like`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'like' }),
			})
			const data = await res.json()
			if (data.ok) {
				setLiked(data.data.liked)
				setLikesCount(data.data.likes_count)
			} else {
				setLiked(prev)
				setLikesCount(short.likes_count)
			}
		} catch {
			setLiked(prev)
			setLikesCount(short.likes_count)
		}
	}

	async function handleSubscribe(e: React.MouseEvent) {
		e.stopPropagation()
		if (!user) {
			window.location.href = '/en/login'
			return
		}
		setSubLoading(true)
		try {
			const res = await fetch(`/api/users/${short.uploader.id}/subscribe`, {
				method: 'POST',
			})
			const data = await res.json()
			if (data.ok) setSubscribed(data.data.subscribed)
		} finally {
			setSubLoading(false)
		}
	}

	async function handleShare(e: React.MouseEvent) {
		e.stopPropagation()
		await navigator.clipboard
			?.writeText(`${window.location.origin}/en/watch/${short.id}`)
			.catch(() => {})
		setShareCopied(true)
		setTimeout(() => setShareCopied(false), 2000)
	}

	return (
		<div
			ref={itemRef}
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				scrollSnapAlign: 'start',
				position: 'relative',
			}}
		>
			{/*
        Two-column layout: [video card] [action buttons]
        Centered together as a unit
      */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-end',
					gap: 12,
					/* nudge down slightly from center to leave room for title at bottom */
					marginTop: 24,
				}}
			>
				{/* ── VIDEO CARD ── */}
				<div
					onClick={tap}
					style={{
						position: 'relative',
						/* 9:16 aspect, max height = viewport minus header(56) minus padding */
						width: 'min(340px, calc(100vw - 280px))',
						height: 'min(604px, calc(100vh - 120px))',
						borderRadius: 16,
						overflow: 'hidden',
						background: '#000',
						cursor: 'pointer',
						boxShadow: isActive
							? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)'
							: '0 12px 32px rgba(0,0,0,0.5)',
						transition: 'box-shadow 0.35s ease, transform 0.35s ease',
						transform: isActive ? 'scale(1)' : 'scale(0.96)',
						flexShrink: 0,
					}}
				>
					<video
						ref={videoRef}
						src={short.video_url}
						poster={short.thumbnail_url ?? undefined}
						loop
						playsInline
						muted
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							display: 'block',
						}}
						onTimeUpdate={e => {
							const v = e.currentTarget
							if (v.duration) setProgress(v.currentTime / v.duration)
						}}
					/>

					{/* Bottom gradient */}
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							height: '60%',
							background:
								'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)',
							pointerEvents: 'none',
						}}
					/>

					{/* Top gradient */}
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: 72,
							background:
								'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
							pointerEvents: 'none',
						}}
					/>

					{/* Progress bar */}
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							height: 3,
							background: 'rgba(255,255,255,0.12)',
						}}
					>
						<div
							style={{
								height: '100%',
								background: '#e63946',
								width: `${progress * 100}%`,
								transition: 'width 0.2s linear',
								boxShadow: '0 0 5px rgba(230,57,70,0.7)',
							}}
						/>
					</div>

					{/* Mute button */}
					<button
						onClick={toggleMute}
						style={{
							position: 'absolute',
							top: 12,
							right: 12,
							width: 34,
							height: 34,
							borderRadius: '50%',
							background: 'rgba(0,0,0,0.5)',
							border: '1px solid rgba(255,255,255,0.2)',
							backdropFilter: 'blur(6px)',
							cursor: 'pointer',
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 2,
							transition: 'background 0.15s',
						}}
						onMouseEnter={e =>
							(e.currentTarget.style.background = 'rgba(0,0,0,0.75)')
						}
						onMouseLeave={e =>
							(e.currentTarget.style.background = 'rgba(0,0,0,0.5)')
						}
					>
						{muted ? (
							<svg
								width='15'
								height='15'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
							>
								<polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
								<line x1='23' y1='9' x2='17' y2='15' />
								<line x1='17' y1='9' x2='23' y2='15' />
							</svg>
						) : (
							<svg
								width='15'
								height='15'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
							>
								<polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
								<path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
								<path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
							</svg>
						)}
					</button>

					{/* Play/Pause flash overlay */}
					{showFlash && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								pointerEvents: 'none',
							}}
						>
							<div
								style={{
									width: 68,
									height: 68,
									borderRadius: '50%',
									background: 'rgba(0,0,0,0.55)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									animation: 'sfFlash 0.65s ease forwards',
								}}
							>
								{paused ? (
									<svg width='26' height='26' viewBox='0 0 24 24' fill='#fff'>
										<path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
									</svg>
								) : (
									<svg width='26' height='26' viewBox='0 0 24 24' fill='#fff'>
										<path d='M8 5v14l11-7z' />
									</svg>
								)}
							</div>
						</div>
					)}

					{/* Bottom info: channel + title */}
					<div
						style={{
							position: 'absolute',
							bottom: 12,
							left: 12,
							right: 12,
							zIndex: 2,
						}}
						onClick={e => e.stopPropagation()}
					>
						{/* Channel row */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginBottom: 8,
								flexWrap: 'wrap',
							}}
						>
							<Link
								href={`/en/channel/${short.uploader.id}`}
								style={{
									textDecoration: 'none',
									display: 'flex',
									alignItems: 'center',
									gap: 7,
								}}
							>
								{short.uploader.avatar_url ? (
									<img
										src={short.uploader.avatar_url}
										alt={name}
										style={{
											width: 30,
											height: 30,
											borderRadius: '50%',
											objectFit: 'cover',
											border: '2px solid rgba(255,255,255,0.35)',
										}}
									/>
								) : (
									<div
										style={{
											width: 30,
											height: 30,
											borderRadius: '50%',
											background: avatarColor,
											border: '2px solid rgba(255,255,255,0.35)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 11,
											fontWeight: 700,
											color: '#fff',
										}}
									>
										{name.slice(0, 2).toUpperCase()}
									</div>
								)}
								<span
									style={{
										fontSize: 13,
										fontWeight: 700,
										color: '#fff',
										textShadow: '0 1px 3px rgba(0,0,0,0.6)',
									}}
								>
									@{short.uploader.username}
								</span>
							</Link>
							{!subscribed && (
								<button
									onClick={handleSubscribe}
									disabled={subLoading}
									style={{
										padding: '4px 12px',
										borderRadius: 20,
										border: '1.5px solid rgba(255,255,255,0.9)',
										background: 'transparent',
										color: '#fff',
										fontSize: 12,
										fontWeight: 700,
										cursor: subLoading ? 'not-allowed' : 'pointer',
										opacity: subLoading ? 0.6 : 1,
										fontFamily: 'inherit',
										transition: 'background 0.15s',
									}}
									onMouseEnter={e =>
										(e.currentTarget.style.background =
											'rgba(255,255,255,0.15)')
									}
									onMouseLeave={e =>
										(e.currentTarget.style.background = 'transparent')
									}
								>
									{subLoading ? '…' : 'Subscribe'}
								</button>
							)}
							{subscribed && (
								<span
									style={{
										padding: '4px 12px',
										borderRadius: 20,
										border: '1.5px solid rgba(255,255,255,0.35)',
										color: 'rgba(255,255,255,0.6)',
										fontSize: 12,
										fontWeight: 600,
									}}
								>
									Subscribed
								</span>
							)}
						</div>

						{/* Title */}
						<p
							style={{
								fontSize: 14,
								fontWeight: 600,
								color: '#fff',
								margin: '0 0 3px',
								lineHeight: 1.45,
								textShadow: '0 1px 3px rgba(0,0,0,0.5)',
								cursor: short.description ? 'pointer' : 'default',
								display: descExpanded ? 'block' : '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: descExpanded ? 'visible' : 'hidden',
							}}
							onClick={() => short.description && setDescExpanded(v => !v)}
						>
							{short.title}
						</p>

						{/* Description */}
						{short.description && (
							<p
								style={{
									fontSize: 12,
									color: 'rgba(255,255,255,0.6)',
									margin: '0 0 3px',
									lineHeight: 1.5,
									cursor: 'pointer',
									display: descExpanded ? 'block' : '-webkit-box',
									WebkitLineClamp: 1,
									WebkitBoxOrient: 'vertical',
									overflow: descExpanded ? 'visible' : 'hidden',
								}}
								onClick={() => setDescExpanded(v => !v)}
							>
								{short.description}{' '}
								<span
									style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
								>
									{descExpanded ? 'less' : 'more'}
								</span>
							</p>
						)}

						<p
							style={{
								fontSize: 11,
								color: 'rgba(255,255,255,0.38)',
								margin: 0,
							}}
						>
							{fmt(short.views_count)} views · {timeAgo(short.created_at)}
						</p>
					</div>
				</div>

				{/* ── ACTION BUTTONS — directly to the right of the card ── */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 4,
						paddingBottom: 48 /* align with bottom content of card */,
						flexShrink: 0,
					}}
				>
					{/* Like */}
					<ActionBtn
						active={liked}
						label={fmt(likesCount)}
						onClick={handleLike}
						icon={
							<svg
								width='24'
								height='24'
								viewBox='0 0 24 24'
								fill={liked ? '#e63946' : 'none'}
								stroke={liked ? '#e63946' : 'currentColor'}
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
							</svg>
						}
					/>

					{/* Comment */}
					<Link
						href={`/en/watch/${short.id}`}
						style={{ textDecoration: 'none' }}
						onClick={e => e.stopPropagation()}
					>
						<ActionBtn
							label='Comment'
							onClick={e => e.stopPropagation()}
							icon={
								<svg
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
								</svg>
							}
						/>
					</Link>

					{/* Share / Copy link */}
					<ActionBtn
						active={shareCopied}
						activeColor='#2a9d8f'
						label={shareCopied ? 'Copied!' : 'Share'}
						onClick={handleShare}
						icon={
							shareCopied ? (
								<svg
									width='22'
									height='22'
									viewBox='0 0 24 24'
									fill='none'
									stroke='#2a9d8f'
									strokeWidth='2.5'
									strokeLinecap='round'
								>
									<polyline points='20 6 9 17 4 12' />
								</svg>
							) : (
								<svg
									width='22'
									height='22'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<circle cx='18' cy='5' r='3' />
									<circle cx='6' cy='12' r='3' />
									<circle cx='18' cy='19' r='3' />
									<line x1='8.59' y1='13.51' x2='15.42' y2='17.49' />
									<line x1='15.41' y1='6.51' x2='8.59' y2='10.49' />
								</svg>
							)
						}
					/>

					{/* Full page view */}
					<Link
						href={`/en/watch/${short.id}`}
						style={{ textDecoration: 'none' }}
						onClick={e => e.stopPropagation()}
					>
						<ActionBtn
							label='Full view'
							onClick={e => e.stopPropagation()}
							icon={
								<svg
									width='21'
									height='21'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<polyline points='15 3 21 3 21 9' />
									<polyline points='9 21 3 21 3 15' />
									<line x1='21' y1='3' x2='14' y2='10' />
									<line x1='3' y1='21' x2='10' y2='14' />
								</svg>
							}
						/>
					</Link>
				</div>
			</div>
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAV ARROW
───────────────────────────────────────────────────────────────────────────── */
function NavArrow({
	dir,
	onClick,
	disabled,
}: {
	dir: 'up' | 'down'
	onClick: () => void
	disabled: boolean
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			style={{
				width: 40,
				height: 40,
				borderRadius: '50%',
				background: disabled
					? 'rgba(255,255,255,0.03)'
					: 'rgba(255,255,255,0.08)',
				border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.14)'}`,
				cursor: disabled ? 'not-allowed' : 'pointer',
				color: disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.8)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				transition: 'background 0.15s, transform 0.1s',
				fontFamily: 'inherit',
			}}
			onMouseEnter={e => {
				if (!disabled) {
					e.currentTarget.style.background = 'rgba(255,255,255,0.16)'
					e.currentTarget.style.transform = 'scale(1.05)'
				}
			}}
			onMouseLeave={e => {
				if (!disabled) {
					e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
					e.currentTarget.style.transform = 'scale(1)'
				}
			}}
		>
			<svg
				width='18'
				height='18'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='2.5'
				strokeLinecap='round'
			>
				{dir === 'up' ? (
					<polyline points='18 15 12 9 6 15' />
				) : (
					<polyline points='6 9 12 15 18 9' />
				)}
			</svg>
		</button>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SHORTS PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function ShortsPage() {
	const [shorts, setShorts] = useState<Short[]>([])
	const [loading, setLoading] = useState(true)
	const [activeIndex, setActiveIndex] = useState(0)
	const [loadingMore, setLoadingMore] = useState(false)
	const [nextCursor, setNextCursor] = useState<string | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const isScrolling = useRef(false)
	const touchStartY = useRef(0)

	/* Load shorts */
	const loadShorts = useCallback(async (cursor?: string) => {
		const p = new URLSearchParams()
		p.set('video_type', 'shorts')
		p.set('limit', '20')
		if (cursor) {
			try {
				const d = JSON.parse(atob(cursor))
				if (d.created_at) p.set('cursor_created_at', d.created_at)
				if (d.id) p.set('cursor_id', d.id)
			} catch {}
		}
		const res = await fetch(`/api/videos?${p}`)
		const data = await res.json()
		if (!data.ok) return null
		const items: Short[] = data.data.items.map((v: Short) => ({
			...v,
			uploader: {
				id: v.uploader.id,
				username: v.uploader.username,
				display_name: v.uploader.display_name ?? null,
				avatar_url: v.uploader.avatar_url ?? null,
			},
		}))
		return { items, next_cursor: data.data.next_cursor }
	}, [])

	useEffect(() => {
		setLoading(true)
		loadShorts()
			.then(r => {
				if (r) {
					setShorts(r.items)
					setNextCursor(r.next_cursor)
				}
			})
			.finally(() => setLoading(false))
	}, [loadShorts])

	/* Load more near end */
	useEffect(() => {
		if (activeIndex >= shorts.length - 3 && nextCursor && !loadingMore) {
			setLoadingMore(true)
			loadShorts(nextCursor)
				.then(r => {
					if (r) {
						setShorts(prev => {
							const ids = new Set(prev.map(s => s.id))
							return [...prev, ...r.items.filter(s => !ids.has(s.id))]
						})
						setNextCursor(r.next_cursor)
					}
				})
				.finally(() => setLoadingMore(false))
		}
	}, [activeIndex, shorts.length, nextCursor, loadingMore, loadShorts])

	function scrollToIndex(index: number) {
		const c = containerRef.current
		if (!c) return
		c.scrollTo({ top: index * c.clientHeight, behavior: 'smooth' })
	}

	function goTo(index: number) {
		const next = Math.max(0, Math.min(shorts.length - 1, index))
		setActiveIndex(next)
		scrollToIndex(next)
	}

	/* Wheel */
	useEffect(() => {
		const c = containerRef.current
		if (!c) return
		function onWheel(e: WheelEvent) {
			e.preventDefault()
			if (isScrolling.current) return
			isScrolling.current = true
			const dir = e.deltaY > 0 ? 1 : -1
			setActiveIndex(prev => {
				const next = Math.max(0, Math.min(shorts.length - 1, prev + dir))
				scrollToIndex(next)
				return next
			})
			setTimeout(() => {
				isScrolling.current = false
			}, 600)
		}
		c.addEventListener('wheel', onWheel, { passive: false })
		return () => c.removeEventListener('wheel', onWheel)
	}, [shorts.length])

	/* Touch */
	useEffect(() => {
		const c = containerRef.current
		if (!c) return
		function onStart(e: TouchEvent) {
			touchStartY.current = e.touches[0].clientY
		}
		function onEnd(e: TouchEvent) {
			const diff = touchStartY.current - e.changedTouches[0].clientY
			if (Math.abs(diff) > 50) {
				setActiveIndex(prev => {
					const next = Math.max(
						0,
						Math.min(shorts.length - 1, prev + (diff > 0 ? 1 : -1)),
					)
					scrollToIndex(next)
					return next
				})
			}
		}
		c.addEventListener('touchstart', onStart, { passive: true })
		c.addEventListener('touchend', onEnd, { passive: true })
		return () => {
			c.removeEventListener('touchstart', onStart)
			c.removeEventListener('touchend', onEnd)
		}
	}, [shorts.length])

	/* Keyboard */
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'ArrowDown') goTo(activeIndex + 1)
			else if (e.key === 'ArrowUp') goTo(activeIndex - 1)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [activeIndex, shorts.length])

	/* ── Render inside UserLayout ── */
	return (
		<UserLayout>
			<style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes sfFlash { 0%,60%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.18)} }
      `}</style>

			{/*
        This div fills the UserLayout content area (which already has 56px header offset).
        We use negative margin to escape the 32px 24px padding of UserLayout's inner div,
        then go edge-to-edge inside that content area.
      */}
			<div
				style={{
					margin: '-32px -24px -64px',
					height: 'calc(100vh - 56px)',
					background: '#0a0a0a',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* ── Up/Down navigation arrows — top-right corner ── */}
				<div
					style={{
						position: 'absolute',
						top: 16,
						right: 20,
						display: 'flex',
						gap: 8,
						zIndex: 10,
					}}
				>
					<NavArrow
						dir='up'
						onClick={() => goTo(activeIndex - 1)}
						disabled={activeIndex === 0}
					/>
					<NavArrow
						dir='down'
						onClick={() => goTo(activeIndex + 1)}
						disabled={shorts.length === 0 || activeIndex === shorts.length - 1}
					/>
				</div>

				{/* ── "Shorts" title — top-left ── */}
				<div
					style={{
						position: 'absolute',
						top: 18,
						left: 24,
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						zIndex: 10,
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
						}}
					>
						<svg width='13' height='13' viewBox='0 0 24 24' fill='white'>
							<path d='M17.77 10.32l-1.2-.5L18 9.19C19.38 8.42 19.86 6.68 19.09 5.3c-.77-1.38-2.51-1.86-3.89-1.09l-5.85 3.28-.01.02-1.17.65c-1.38.77-1.86 2.51-1.09 3.89.28.49.68.87 1.14 1.12l1.2.5L8 13.81C6.62 14.58 6.14 16.32 6.91 17.7c.77 1.38 2.51 1.86 3.89 1.09l5.85-3.27.01-.01 1.17-.65c1.38-.77 1.86-2.51 1.09-3.89-.28-.49-.68-.87-1.15-1.14zM13 14.5l-2-1.17 2-1.16 2 1.16-2 1.17z' />
						</svg>
					</div>
					<span
						style={{
							fontSize: 18,
							fontWeight: 800,
							color: '#fff',
							letterSpacing: '-0.3px',
							fontFamily: 'DM Sans, sans-serif',
						}}
					>
						Shorts
					</span>
				</div>

				{/* ── Loading state ── */}
				{loading && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 14,
						}}
					>
						<div
							style={{
								width: 38,
								height: 38,
								border: '3px solid #1a1a1a',
								borderTopColor: '#e63946',
								borderRadius: '50%',
								animation: 'spin 0.8s linear infinite',
							}}
						/>
						<span
							style={{
								fontSize: 13,
								color: '#555',
								fontFamily: 'DM Sans, sans-serif',
							}}
						>
							Loading Shorts…
						</span>
					</div>
				)}

				{/* ── Empty state ── */}
				{!loading && shorts.length === 0 && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 12,
							fontFamily: 'DM Sans, sans-serif',
						}}
					>
						<div style={{ fontSize: 52 }}>📱</div>
						<p
							style={{
								fontSize: 18,
								fontWeight: 700,
								color: '#fff',
								margin: 0,
							}}
						>
							No Shorts yet
						</p>
						<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
							Upload a Short to get started
						</p>
						<Link
							href='/en'
							style={{
								marginTop: 8,
								padding: '10px 24px',
								borderRadius: 24,
								background: '#e63946',
								color: '#fff',
								fontSize: 13,
								fontWeight: 700,
								textDecoration: 'none',
							}}
						>
							Back to Home
						</Link>
					</div>
				)}

				{/* ── Scrollable feed ── */}
				{!loading && shorts.length > 0 && (
					<div
						ref={containerRef}
						style={{
							position: 'absolute',
							inset: 0,
							overflowY: 'hidden',
							scrollSnapType: 'y mandatory',
						}}
					>
						{shorts.map((short, index) => (
							<div
								key={short.id}
								style={{
									width: '100%',
									height: '100%',
									scrollSnapAlign: 'start',
									flexShrink: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<ShortItem
									short={short}
									isActive={index === activeIndex}
									onVisible={() => {
										if (index !== activeIndex) setActiveIndex(index)
									}}
								/>
							</div>
						))}

						{loadingMore && (
							<div
								style={{
									width: '100%',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<div
									style={{
										width: 28,
										height: 28,
										border: '3px solid #1a1a1a',
										borderTopColor: '#e63946',
										borderRadius: '50%',
										animation: 'spin 0.8s linear infinite',
									}}
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</UserLayout>
	)
}
