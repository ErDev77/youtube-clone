'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/context/AuthContext'
import UserLayout from '@/app/_components/layout/UserLayout'
import CommentsSection from '@/app/_components/comment/CommentsSection'

/* ─── Types ─── */
type Short = {
	id: string
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	views_count: number
	likes_count: number
	dislikes_count?: number
	created_at: string
	comments_count: number
	uploader: {
		id: string
		username: string
		display_name: string | null
		avatar_url: string | null
	}
}

type Comment = {
	id: string
	content: string
	created_at: string
	user_id: string
	username: string
	display_name: string | null
	avatar_url: string | null
	likes_count: number
	dislikes_count?: number
	reply_count?: number
	is_liked?: boolean
	is_disliked?: boolean
}

/* ─── Helpers ─── */
function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
	const ms = Date.now() - new Date(iso).getTime()
	const m = Math.floor(ms / 60000)
	if (m < 1) return 'just now'
	if (m < 60) return `${m}m ago`
	const h = Math.floor(m / 60)
	if (h < 24) return `${h}h ago`
	const d = Math.floor(h / 24)
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

const SHORT_CARD_WIDTH =
	'clamp(280px, min(24vw, calc((100vh - 112px) * 9 / 16)), 420px)'


/* ─────────────────────────────────────────────────────────────────────────────
   ACTION BUTTON
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
							? `${activeColor}22`
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
   COMMENTS PANEL
───────────────────────────────────────────────────────────────────────────── */
function CommentsPanel({
	shortId,
	currentUser,
	onClose,
}: {
	shortId: string
	currentUser?: { id: string; username: string } | null
	onClose: () => void
}) {
	return (
		<div
			style={{
				width: SHORT_CARD_WIDTH,
				aspectRatio: '9 / 16',
				marginLeft: 24,
				background: '#111',
				borderRadius: 16,
				border: '1px solid #1e1e1e',
				boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
				display: 'flex',
				flexDirection: 'column',
				flexShrink: 0,
				overflow: 'hidden',
				animation:
					'slideInPanel 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '16px 18px 14px',
					borderBottom: '1px solid #1e1e1e',
					flexShrink: 0,
				}}
			>
				<span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
					Comments
				</span>

				<button
					onClick={onClose}
					style={{
						width: 32,
						height: 32,
						borderRadius: '50%',
						background: 'rgba(255,255,255,0.06)',
						border: 'none',
						cursor: 'pointer',
						color: '#aaa',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
					>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				</button>
			</div>

			<div
				style={{
					flex: 1,
					overflowY: 'auto',
					padding: '0 16px 18px',
				}}
			>
				<CommentsSection videoId={shortId} currentUser={currentUser} />
			</div>
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   DESCRIPTION PANEL  (slides in same way as comments)
───────────────────────────────────────────────────────────────────────────── */
function DescriptionPanel({
	short,
	onClose,
}: {
	short: Short
	onClose: () => void
}) {
	const name = short.uploader.display_name || short.uploader.username
	const avatarColor = colorFromId(short.uploader.id)
	return (
		<div
			style={{
				width: SHORT_CARD_WIDTH,
				aspectRatio: '9 / 16',
				background: '#111',
				borderRadius: 16,
				border: '1px solid #1e1e1e',
				boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
				display: 'flex',
				flexDirection: 'column',
				flexShrink: 0,
				animation:
					'slideInPanel 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
			}}
		>
			{/* Header */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '16px 18px 14px',
					borderBottom: '1px solid #1e1e1e',
					flexShrink: 0,
				}}
			>
				<span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
					Description
				</span>
				<button
					onClick={onClose}
					style={{
						width: 32,
						height: 32,
						borderRadius: '50%',
						background: 'rgba(255,255,255,0.06)',
						border: 'none',
						cursor: 'pointer',
						color: '#aaa',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transition: 'background 0.15s',
					}}
					onMouseEnter={e =>
						(e.currentTarget.style.background = 'rgba(255,255,255,0.12)')
					}
					onMouseLeave={e =>
						(e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
					}
				>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
					>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				</button>
			</div>

			<div
				style={{
					flex: 1,
					overflowY: 'auto',
					padding: '18px 18px',
					scrollbarWidth: 'thin',
					scrollbarColor: '#2a2a2a transparent',
				}}
			>
				{/* Uploader */}
				<Link
					href={`/en/channel/${short.uploader.id}`}
					style={{
						textDecoration: 'none',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						marginBottom: 18,
					}}
				>
					{short.uploader.avatar_url ? (
						<img
							src={short.uploader.avatar_url}
							alt={name}
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								objectFit: 'cover',
							}}
						/>
					) : (
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: avatarColor,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 12,
								fontWeight: 700,
								color: '#fff',
								flexShrink: 0,
							}}
						>
							{name.slice(0, 2).toUpperCase()}
						</div>
					)}
					<div>
						<p
							style={{
								fontSize: 13,
								fontWeight: 700,
								color: '#fff',
								margin: 0,
							}}
						>
							@{short.uploader.username}
						</p>
						{short.uploader.display_name && (
							<p style={{ fontSize: 11, color: '#666', margin: 0 }}>
								{short.uploader.display_name}
							</p>
						)}
					</div>
				</Link>

				{/* Title */}
				<h2
					style={{
						fontSize: 15,
						fontWeight: 700,
						color: '#fff',
						margin: '0 0 12px',
						lineHeight: 1.4,
					}}
				>
					{short.title}
				</h2>

				{/* Stats */}
				<div
					style={{
						display: 'flex',
						gap: 16,
						marginBottom: 18,
						fontSize: 13,
						color: '#666',
                        alignItems: 'center',
                        justifyContent: 'center',
					}}
				>
					<span>{short.likes_count} Likes</span>
					<span>{fmt(short.views_count)} Views</span>
					<span>
						{new Date(short.created_at).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						})}
					</span>
				</div>

				{/* Description */}
				{short.description ? (
					<div
						style={{
							background: '#161616',
							borderRadius: 12,
							padding: '14px 16px',
							border: '1px solid #1e1e1e',
						}}
					>
						<p
							style={{
								fontSize: 13,
								color: '#fff',
								lineHeight: 1.75,
								margin: 0,
								whiteSpace: 'pre-wrap',
							}}
						>
							{short.description}
						</p>
					</div>
				) : (
					<p style={{ fontSize: 13, color: '#444', fontStyle: 'italic' }}>
						No description provided.
					</p>
				)}
			</div>
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   INDIVIDUAL SHORT ITEM
───────────────────────────────────────────────────────────────────────────── */
function ShortItem({
	short,
	isActive,
	onVisible,
	panelOpen,
	onOpenComments,
	onOpenDescription,
	currentUser,
}: {
	short: Short
	isActive: boolean
	onVisible: () => void
	panelOpen: boolean
	onOpenComments: () => void
	onOpenDescription: () => void
	currentUser?: { id: string; username: string } | null
}) {
	const router = useRouter()
    const [total, setTotal] = useState(0)
	const videoRef = useRef<HTMLVideoElement>(null)
	const itemRef = useRef<HTMLDivElement>(null)
    const [muted, setMuted] = useState(false)
    const [volume, setVolume] = useState(0.8)
	const [paused, setPaused] = useState(false)
	const [showFlash, setShowFlash] = useState(false)
	const [liked, setLiked] = useState(false)
	const [disliked, setDisliked] = useState(false)
	const [likesCount, setLikesCount] = useState(short.likes_count)
	const [dislikesCount, setDislikesCount] = useState(short.dislikes_count ?? 0)
	const [subscribed, setSubscribed] = useState(false)
	const [subLoading, setSubLoading] = useState(false)
	const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
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

	useEffect(() => {
		const vid = videoRef.current
		if (!vid) return

		if (isActive) {
			vid.volume = volume
			vid.muted = muted
			vid.play().catch(() => {})
			setPaused(false)
		} else {
			vid.pause()
		}
	}, [isActive, muted, volume])

	/* Fetch like/sub state */
	useEffect(() => {
		if (!currentUser || !isActive) return
		fetch(`/api/videos/${short.id}/like`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) {
					setLiked(d.data.liked)
					setDisliked(d.data.disliked)
					setLikesCount(d.data.likes_count)
					setDislikesCount(d.data.dislikes_count ?? 0)
				}
			})
			.catch(() => {})
		fetch(`/api/users/${short.uploader.id}/subscribe`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) setSubscribed(d.data.subscribed)
			})
			.catch(() => {})
		fetch(`/api/videos/${short.id}/comments?limit=1`)
			.then(r => r.json())
			.then(d => {
				if (d.ok) setTotal(d.data.total)
			})
            .catch(() => {})
	}, [short.id, short.uploader.id, currentUser, isActive])

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
    
    function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
			e.stopPropagation()
			const next = Number(e.target.value)
			const vid = videoRef.current

			setVolume(next)
			setMuted(next === 0)

			if (vid) {
				vid.volume = next
				vid.muted = next === 0
			}
		}

		function seekVideo(e: React.ChangeEvent<HTMLInputElement>) {
			e.stopPropagation()
			const next = Number(e.target.value)
			const vid = videoRef.current

			setProgress(next)

			if (vid && vid.duration) {
				vid.currentTime = next * vid.duration
			}
		}

		function wheelSeek(e: React.WheelEvent) {
			if (e.ctrlKey || e.shiftKey) return

			const vid = videoRef.current
			if (!vid || !vid.duration) return

			e.preventDefault()
			e.stopPropagation()

			const delta = e.deltaY > 0 ? 5 : -5
			vid.currentTime = Math.max(
				0,
				Math.min(vid.duration, vid.currentTime + delta),
			)
		}

	async function handleReaction(
		action: 'like' | 'dislike',
		e: React.MouseEvent,
	) {
		e.stopPropagation()
		if (!currentUser) {
			window.location.href = '/en/login'
			return
		}
		const wasLiked = liked
		const wasDisliked = disliked
		if (action === 'like') {
			const newLiked = !liked
			setLiked(newLiked)
			setLikesCount(v => (newLiked ? v + 1 : v - 1))
			if (wasDisliked) {
				setDisliked(false)
				setDislikesCount(v => v - 1)
			}
		} else {
			const newDisliked = !disliked
			setDisliked(newDisliked)
			setDislikesCount(v => (newDisliked ? v + 1 : v - 1))
			if (wasLiked) {
				setLiked(false)
				setLikesCount(v => v - 1)
			}
		}
		try {
			const res = await fetch(`/api/videos/${short.id}/like`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			})
			const data = await res.json()
			if (data.ok) {
				setLiked(data.data.liked)
				setDisliked(data.data.disliked)
				setLikesCount(data.data.likes_count)
				setDislikesCount(data.data.dislikes_count ?? 0)
			} else {
				setLiked(wasLiked)
				setDisliked(wasDisliked)
				setLikesCount(short.likes_count)
				setDislikesCount(short.dislikes_count ?? 0)
			}
		} catch {
			setLiked(wasLiked)
			setDisliked(wasDisliked)
			setLikesCount(short.likes_count)
			setDislikesCount(short.dislikes_count ?? 0)
		}
	}

	async function handleSubscribe(e: React.MouseEvent) {
		e.stopPropagation()
		if (!currentUser) {
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
			?.writeText(`${window.location.origin}/en/shorts/${short.id}`)
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
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-end',
					gap: 12,
					marginTop: 0,
					transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					/* When panel is open, shift left so the combined unit stays centered */
					transform: 'translateX(0)',
				}}
			>
				{/* ── VIDEO CARD ── */}
				<div
					onClick={tap}
					onWheel={wheelSeek}
					style={{
						position: 'relative',
						width: SHORT_CARD_WIDTH,
						aspectRatio: '9 / 16',
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
						muted={muted}
						onLoadedMetadata={e => {
							setDuration(e.currentTarget.duration || 0)
							e.currentTarget.volume = volume
							e.currentTarget.muted = muted
						}}
						playsInline
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							display: 'block',
						}}
						onTimeUpdate={e => {
							const v = e.currentTarget
							if (v.duration) {
								setProgress(v.currentTime / v.duration)
								setDuration(v.duration)
							}
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

					{/* Progress slider */}
					<input
						type='range'
						min={0}
						max={1}
						step={0.001}
						value={progress}
						onChange={seekVideo}
						onClick={e => e.stopPropagation()}
						className='shorts-progress'
						style={
							{ '--progress': `${progress * 100}%` } as React.CSSProperties
						}
					/>

					<div
						className='shorts-volume-wrap'
						onClick={e => e.stopPropagation()}
					>
						<button onClick={toggleMute}>
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
						<input
							type='range'
							min={0}
							max={1}
							step={0.01}
							value={muted ? 0 : volume}
							onChange={changeVolume}
							className='shorts-volume'
							style={
								{
									'--volume': `${(muted ? 0 : volume) * 100}%`,
								} as React.CSSProperties
							}
						/>
					</div>

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

					{/* Bottom info */}
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
							{!subscribed ? (
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
							) : (
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

						{/* Title — tappable to open description panel */}
						<p
							style={{
								fontSize: 14,
								fontWeight: 600,
								color: '#fff',
								margin: '0 0 3px',
								lineHeight: 1.45,
								textShadow: '0 1px 3px rgba(0,0,0,0.5)',
								cursor: 'pointer',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
							onClick={onOpenDescription}
						>
							{short.title}
						</p>

						{/* Description teaser */}
						{short.description && (
							<p
								style={{
									fontSize: 12,
									color: 'rgba(255,255,255,0.6)',
									margin: '0 0 3px',
									lineHeight: 1.5,
									cursor: 'pointer',
									display: '-webkit-box',
									WebkitLineClamp: 1,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
								onClick={onOpenDescription}
							>
								{short.description}{' '}
								<span
									style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
								>
									more
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

				{/* ── ACTION BUTTONS ── */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 4,
						paddingBottom: 48,
						flexShrink: 0,
					}}
				>
					{/* Like */}
					<ActionBtn
						active={liked}
						label={fmt(likesCount)}
						onClick={e => handleReaction('like', e)}
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
								<path d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z' />
							</svg>
						}
					/>
					{/* Dislike */}
					<ActionBtn
						active={disliked}
						activeColor='#8888ff'
						label={dislikesCount > 0 ? fmt(dislikesCount) : 'Dislike'}
						onClick={e => handleReaction('dislike', e)}
						icon={
							<svg
								width='24'
								height='24'
								viewBox='0 0 24 24'
								fill={disliked ? '#8888ff' : 'none'}
								stroke={disliked ? '#8888ff' : 'currentColor'}
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<path d='M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17' />
							</svg>
						}
					/>
					{/* Comment */}
					<ActionBtn
						active={false}
						label={total > 0 ? fmt(total) : 'Comment'}
						onClick={e => {
							e.stopPropagation()
							onOpenComments()
						}}
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
					{/* Share */}
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
   MAIN SHORTS PAGE  —  /shorts/[id]
───────────────────────────────────────────────────────────────────────────── */
export default function ShortsPage() {
	const params = useParams<{ id?: string }>()
	const router = useRouter()
	const { user } = useAuthContext()

	const [shorts, setShorts] = useState<Short[]>([])
	const [loading, setLoading] = useState(true)
	const [activeIndex, setActiveIndex] = useState(0)
	const [loadingMore, setLoadingMore] = useState(false)
	const [nextCursor, setNextCursor] = useState<string | null>(null)

	// Panel state: null | 'comments' | 'description'
	const [openPanel, setOpenPanel] = useState<'comments' | 'description' | null>(
		null,
	)

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

	/* Initial load — jump to the ID in the URL if present */
	useEffect(() => {
		setLoading(true)
		loadShorts()
			.then(r => {
				if (r) {
					setShorts(r.items)
					setNextCursor(r.next_cursor)
					// If URL has an id, find it and jump there
					if (params.id) {
						const idx = r.items.findIndex((s: Short) => s.id === params.id)
						if (idx > -1) {
							setActiveIndex(idx)
							setTimeout(() => {
								const c = containerRef.current
								if (c) c.scrollTop = idx * c.clientHeight
							}, 50)
						}
					}
				}
			})
			.finally(() => setLoading(false))
	}, [loadShorts]) // intentionally not re-running on params.id change

	/* Update URL when active short changes */
	useEffect(() => {
		if (shorts.length === 0) return
		const current = shorts[activeIndex]
		if (!current) return
		// Use replaceState so back button works naturally
		router.replace(`/en/shorts/${current.id}`, { scroll: false })
		// Close panel when switching shorts
		setOpenPanel(null)
	}, [activeIndex, shorts, router])

	/* Load more near end */
	useEffect(() => {
		if (activeIndex >= shorts.length - 3 && nextCursor && !loadingMore) {
			setLoadingMore(true)
			loadShorts(nextCursor)
				.then(r => {
					if (r) {
						setShorts(prev => {
							const ids = new Set(prev.map(s => s.id))
							return [...prev, ...r.items.filter((s: Short) => !ids.has(s.id))]
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
			else if (e.key === 'Escape') setOpenPanel(null)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [activeIndex, shorts.length])

	const activeShort = shorts[activeIndex] ?? null

	return (
		<UserLayout>
			<style>{`
				@keyframes spin    { to { transform: rotate(360deg) } }
				@keyframes sfFlash { 0%,60%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.18)} }
				@keyframes slideInPanel {
					from { opacity: 0; transform: translateX(24px); }
					to   { opacity: 1; transform: translateX(0); }
				}
                .shorts-progress {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100%;
                height: 4px;
                margin: 0;
                z-index: 8;
                cursor: pointer;
                appearance: none;
                background: linear-gradient(
                    to right,
                    #e63946 0%,
                    #e63946 var(--progress),
                    rgba(255,255,255,0.24) var(--progress),
                    rgba(255,255,255,0.24) 100%
                );
                transition: height 0.12s ease;
            }

            .shorts-progress:hover {
                height: 6px;
            }

            .shorts-progress::-webkit-slider-thumb {
                appearance: none;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #e63946;
                opacity: 0;
                transition: opacity 0.12s ease;
            }

            .shorts-progress:hover::-webkit-slider-thumb {
                opacity: 1;
            }

            .shorts-progress::-moz-range-thumb {
                width: 10px;
                height: 10px;
                border: none;
                border-radius: 50%;
                background: #e63946;
                opacity: 0;
            }

            .shorts-volume-wrap {
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 0;
            padding: 0;
            border-radius: 999px;
            background: rgba(0, 0, 0, 0.50);
            backdrop-filter: blur(8px);
            overflow: hidden;
            transition:
                gap 0.16s ease,
                padding-right 0.16s ease,
                background 0.16s ease;
            }

        .shorts-volume-wrap:hover {
            gap: 8px;
            padding-right: 10px;
            background: rgba(0, 0, 0, 0.62);
            }

        .shorts-volume-button,
        .shorts-volume-wrap button {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            width: 40px;
            height: 40px;
            min-width: 40px;
            border: none !important;
            border-radius: 999px;
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            font-family: inherit;
            transition: none;
        }

        .shorts-volume-button:hover,
        .shorts-volume-wrap button:hover {
            background: transparent !important;
        }

        .shorts-volume {
            width: 0;
            height: 3px;
            margin: 0;
            cursor: pointer;
            appearance: none;
            border-radius: 999px;
            background: linear-gradient(
                to right,
                #fff 0%,
                #fff var(--volume),
                rgba(255, 255, 255, 0.3) var(--volume),
                rgba(255, 255, 255, 0.3) 100%
            );
            opacity: 0;
            pointer-events: none;
            transition:
                width 0.16s ease,
                opacity 0.16s ease;
        }

        .shorts-volume-wrap:hover .shorts-volume {
            width: 82px;
            opacity: 1;
            pointer-events: auto;
        }

        .shorts-volume::-webkit-slider-thumb {
            appearance: none;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #fff;
            border: none;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.45);
        }

        .shorts-volume::-moz-range-thumb {
            width: 9px;
            height: 9px;
            border: none;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.45);
        }
			`}</style>

			<div
				style={{
					margin: '-32px -24px -64px',
					height: 'calc(100vh - 56px)',
					background: '#0a0a0a',
					position: 'relative',
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: openPanel ? 'center' : 'stretch',
				}}
			>
				{/* ── Feed (left, takes up remaining space) ── */}
				<div
					style={{
						flex: openPanel ? `0 0 calc(${SHORT_CARD_WIDTH} + 88px)` : 1,
						height: '100%',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					{/* Loading */}
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

					{/* Empty state */}
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

					{/* Scrollable feed */}
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
										boxSizing: 'border-box',
									}}
								>
									<ShortItem
										short={short}
										isActive={index === activeIndex}
										onVisible={() => {
											if (index !== activeIndex) setActiveIndex(index)
										}}
										panelOpen={openPanel !== null && index === activeIndex}
										onOpenComments={() =>
											setOpenPanel(p => (p === 'comments' ? null : 'comments'))
										}
										onOpenDescription={() =>
											setOpenPanel(p =>
												p === 'description' ? null : 'description',
											)
										}
										currentUser={user}
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
				{/* Nav arrows */}
				<div
					style={{
						position: 'absolute',
						top: 16,
						right: 24,
						display: 'flex',
						gap: 8,
						zIndex: 30,
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
				{/* ── Side panel (comments or description) ── */}
				{openPanel && activeShort && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							transform: 'translateX(90px)',
							flexShrink: 0,
						}}
					>
						{openPanel === 'comments' ? (
							<CommentsPanel
								key={`comments-${activeShort.id}`}
								shortId={activeShort.id}
								currentUser={user}
								onClose={() => setOpenPanel(null)}
							/>
						) : (
							<DescriptionPanel
								key={`desc-${activeShort.id}`}
								short={activeShort}
								onClose={() => setOpenPanel(null)}
							/>
						)}
					</div>
				)}
			</div>
		</UserLayout>
	)
}
