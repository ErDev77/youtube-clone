'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'

type Video = {
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
	username: string
	display_name: string | null
	avatar_url: string | null
	user_id: string
}

type Related = {
	id: string
	title: string
	thumbnail_url: string | null
	views_count: number
	created_at: string
	video_type: 'normal' | 'shorts' | null
	uploader: { id: string; username: string }
}

function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
	const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
	if (d < 1) return 'today'
	if (d < 7) return d + 'd ago'
	if (d < 30) return Math.floor(d / 7) + 'w ago'
	if (d < 365) return Math.floor(d / 30) + 'mo ago'
	return Math.floor(d / 365) + 'y ago'
}

function color(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
}

// ── Normal player ─────────────────────────────────────────────────────────────
function NormalPlayer({ v }: { v: Video }) {
	const name = v.display_name || v.username
	return (
		<div style={{ maxWidth: 900 }}>
			{/* 16:9 box — explicit height so video fills it */}
			<div
				style={{
					width: '100%',
					aspectRatio: '16/9',
					borderRadius: 14,
					overflow: 'hidden',
					background: '#000',
				}}
			>
				<video
					src={v.video_url}
					controls
					autoPlay
					poster={v.thumbnail_url || undefined}
					style={{ width: '100%', height: '100%', display: 'block' }}
				/>
			</div>
			<h1
				style={{
					fontSize: 20,
					fontWeight: 700,
					color: '#fff',
					margin: '16px 0 10px',
					lineHeight: 1.3,
				}}
			>
				{v.title}
			</h1>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 14,
					flexWrap: 'wrap',
				}}
			>
				<Link
					href={`/en/channel/${v.user_id}`}
					style={{
						textDecoration: 'none',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
					}}
				>
					{v.avatar_url ? (
						<img
							src={v.avatar_url}
							style={{
								width: 38,
								height: 38,
								borderRadius: '50%',
								objectFit: 'cover',
							}}
							alt=''
						/>
					) : (
						<div
							style={{
								width: 38,
								height: 38,
								borderRadius: '50%',
								background: color(v.user_id),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 13,
								fontWeight: 700,
								color: '#fff',
							}}
						>
							{name.slice(0, 2).toUpperCase()}
						</div>
					)}
					<div>
						<p
							style={{
								fontSize: 14,
								fontWeight: 600,
								color: '#fff',
								margin: 0,
							}}
						>
							{name}
						</p>
						<p style={{ fontSize: 12, color: '#666', margin: 0 }}>
							@{v.username}
						</p>
					</div>
				</Link>
				<p
					style={{ fontSize: 13, color: '#666', margin: 0, marginLeft: 'auto' }}
				>
					{fmt(v.views_count)} views · {timeAgo(v.created_at)}
				</p>
			</div>
			{v.description && (
				<div
					style={{
						marginTop: 14,
						background: '#111',
						borderRadius: 12,
						padding: '12px 16px',
						fontSize: 14,
						color: '#aaa',
						lineHeight: 1.7,
						whiteSpace: 'pre-wrap',
					}}
				>
					{v.description}
				</div>
			)}
		</div>
	)
}

// ── Shorts player ─────────────────────────────────────────────────────────────
function ShortsPlayer({ v, related }: { v: Video; related: Related[] }) {
	const name = v.display_name || v.username
	const vidRef = useRef<HTMLVideoElement>(null)
	const [muted, setMuted] = useState(true)
	const [paused, setPaused] = useState(false)
	const [showIcon, setShowIcon] = useState(false)

	useEffect(() => {
		const el = vidRef.current
		if (!el) return
		el.muted = true
		el.play().catch(() => {})
	}, [v.video_url])

	function tap() {
		const el = vidRef.current
		if (!el) return
		if (el.paused) {
			el.play()
			setPaused(false)
		} else {
			el.pause()
			setPaused(true)
		}
		setShowIcon(true)
		setTimeout(() => setShowIcon(false), 700)
	}

	function toggleMute(e: React.MouseEvent) {
		e.stopPropagation()
		const el = vidRef.current
		if (!el) return
		el.muted = !el.muted
		setMuted(el.muted)
	}

	const nearby = related
		.filter(r => r.video_type === 'shorts' && r.id !== v.id)
		.slice(0, 5)

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				gap: 28,
				alignItems: 'flex-start',
				flexWrap: 'wrap',
			}}
		>
			{/* Player */}
			<div style={{ width: 340, flexShrink: 0 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						marginBottom: 10,
					}}
				>
					<span
						style={{
							background: '#e63946',
							color: '#fff',
							fontSize: 11,
							fontWeight: 700,
							padding: '2px 9px',
							borderRadius: 6,
						}}
					>
						SHORTS
					</span>
					<span style={{ fontSize: 12, color: '#555' }}>
						{timeAgo(v.created_at)}
					</span>
				</div>

				{/*
					KEY FIX: use explicit width+height in px, not padding-bottom trick.
					340 × 604 = exactly 9:16. overflow:hidden clips the video.
					No padding-bottom, no position:relative on a zero-height box.
				*/}
				<div
					style={{
						width: 340,
						height: 604,
						borderRadius: 16,
						overflow: 'hidden',
						background: '#000',
						position: 'relative',
						cursor: 'pointer',
					}}
					onClick={tap}
				>
					<video
						ref={vidRef}
						src={v.video_url}
						loop
						playsInline
						muted
						poster={v.thumbnail_url || undefined}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							display: 'block',
							background: '#000',
						}}
					/>

					{/* tap-to-pause icon flash */}
					{showIcon && (
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
									width: 60,
									height: 60,
									borderRadius: '50%',
									background: 'rgba(0,0,0,.55)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									animation: 'fadeOut .6s ease forwards',
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

					{/* Bottom overlay — gradient + title/desc + controls */}
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							background:
								'linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 100%)',
							padding: '52px 14px 14px',
							pointerEvents: 'none',
						}}
					>
						<p
							style={{
								fontSize: 14,
								fontWeight: 700,
								color: '#fff',
								margin: '0 0 3px',
							}}
						>
							{v.title}
						</p>
						{v.description && (
							<p
								style={{
									fontSize: 12,
									color: 'rgba(255,255,255,.6)',
									margin: 0,
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{v.description}
							</p>
						)}
					</div>

					{/* Mute button — top right, pointer-events on */}
					<button
						onClick={toggleMute}
						style={{
							position: 'absolute',
							top: 12,
							right: 12,
							width: 34,
							height: 34,
							borderRadius: '50%',
							background: 'rgba(0,0,0,.5)',
							border: 'none',
							cursor: 'pointer',
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{muted ? (
							<svg
								width='15'
								height='15'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
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
								strokeWidth='2'
							>
								<polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
								<path d='M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07' />
							</svg>
						)}
					</button>
				</div>

				{/* Uploader + stats */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginTop: 12,
					}}
				>
					<Link
						href={`/en/channel/${v.user_id}`}
						style={{
							textDecoration: 'none',
							display: 'flex',
							alignItems: 'center',
							gap: 9,
						}}
					>
						{v.avatar_url ? (
							<img
								src={v.avatar_url}
								style={{
									width: 34,
									height: 34,
									borderRadius: '50%',
									objectFit: 'cover',
								}}
								alt=''
							/>
						) : (
							<div
								style={{
									width: 34,
									height: 34,
									borderRadius: '50%',
									background: color(v.user_id),
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 12,
									fontWeight: 700,
									color: '#fff',
								}}
							>
								{name.slice(0, 2).toUpperCase()}
							</div>
						)}
						<p
							style={{
								fontSize: 13,
								fontWeight: 600,
								color: '#fff',
								margin: 0,
							}}
						>
							{name}
						</p>
					</Link>
					<div
						style={{ display: 'flex', gap: 16, fontSize: 13, color: '#666' }}
					>
						<span>👁 {fmt(v.views_count)}</span>
						<span>♥ {fmt(v.likes_count)}</span>
					</div>
				</div>
			</div>

			{/* Related shorts */}
			{nearby.length > 0 && (
				<div style={{ paddingTop: 48 }}>
					<p
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#444',
							letterSpacing: '1.2px',
							textTransform: 'uppercase',
							marginBottom: 14,
						}}
					>
						More Shorts
					</p>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
						{nearby.map(r => (
							<Link
								key={r.id}
								href={`/en/watch/${r.id}`}
								style={{ textDecoration: 'none', display: 'flex', gap: 10 }}
							>
								<div
									style={{
										width: 72,
										height: 128,
										borderRadius: 8,
										overflow: 'hidden',
										background: '#1a1a1a',
										flexShrink: 0,
									}}
								>
									{r.thumbnail_url ? (
										<img
											src={r.thumbnail_url}
											alt={r.title}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
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
												width='18'
												height='18'
												viewBox='0 0 24 24'
												fill='#333'
											>
												<path d='M8 5v14l11-7z' />
											</svg>
										</div>
									)}
								</div>
								<div style={{ flex: 1, minWidth: 0 }}>
									<p
										style={{
											fontSize: 13,
											fontWeight: 600,
											color: '#fff',
											margin: '0 0 4px',
											lineHeight: 1.3,
											display: '-webkit-box',
											WebkitLineClamp: 3,
											WebkitBoxOrient: 'vertical',
											overflow: 'hidden',
										}}
									>
										{r.title}
									</p>
									<p style={{ fontSize: 11, color: '#666', margin: 0 }}>
										{fmt(r.views_count)} views
									</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WatchPage() {
	const { id } = useParams<{ id: string }>()
	const [video, setVideo] = useState<Video | null>(null)
	const [related, setRelated] = useState<Related[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return
		Promise.all([
			fetch(`/api/videos/${id}`).then(r => r.json()),
			fetch('/api/videos?limit=12').then(r => r.json()),
		])
			.then(([vd, fd]) => {
				if (!vd.ok) {
					setError(vd.error || 'Not found')
					return
				}
				setVideo(vd.data.video)
				fetch(`/api/videos/${id}/view`, { method: 'POST' }).catch(() => {})
				if (fd.ok) setRelated(fd.data.items)
			})
			.catch(() => setError('Failed to load'))
			.finally(() => setLoading(false))
	}, [id])

	return (
		<UserLayout>
			<style>{`
				@keyframes spin{to{transform:rotate(360deg)}}
				@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
				@keyframes fadeOut{0%{opacity:1}70%{opacity:1}100%{opacity:0}}
			`}</style>
			{loading ? (
				<div
					style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}
				>
					<div
						style={{
							width: 30,
							height: 30,
							border: '2px solid #222',
							borderTopColor: '#e63946',
							borderRadius: '50%',
							animation: 'spin .7s linear infinite',
						}}
					/>
				</div>
			) : error || !video ? (
				<div style={{ textAlign: 'center', paddingTop: 80 }}>
					<p style={{ color: '#555', fontSize: 16 }}>
						{error || 'Video not found'}
					</p>
					<Link href='/en' style={{ color: '#e63946', fontSize: 14 }}>
						← Back
					</Link>
				</div>
			) : (
				<div style={{ animation: 'fadeUp .25s ease both' }}>
					{video.video_type === 'shorts' ? (
						<ShortsPlayer v={video} related={related} />
					) : (
						<NormalPlayer v={video} />
					)}
				</div>
			)}
		</UserLayout>
	)
}
