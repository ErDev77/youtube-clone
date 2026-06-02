'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'
import VideoPlayer from '@/app/_components/video/VideoPlayer'
import { Clock, ListVideo, Share2, ThumbsUp, ThumbsDown } from 'lucide-react'
import PlaylistPicker from '@/app/_components/video/PlaylistPicker'
import QueueSidebar from '@/app/_components/video/QueueSidebar'
import CommentsSection from '@/app/_components/comment/CommentsSection'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

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
	dislikes_count: number
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
	uploader: { id: string; username: string; avatar_url?: string }
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
	is_liked?: boolean
}

type QueueType = 'liked' | 'watchlater' | 'playlist'

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

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

function longDate(iso: string) {
	return new Date(iso).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

function colorFromId(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
}

function Avatar({
	url,
	name,
	id,
	size = 40,
}: {
	url?: string | null
	name: string
	id: string
	size?: number
}) {
	const bg = colorFromId(id)
	if (url)
		return (
			<img
				src={url}
				alt={name}
				style={{
					width: size,
					height: size,
					borderRadius: '50%',
					objectFit: 'cover',
					flexShrink: 0,
				}}
			/>
		)
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				background: bg,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: size * 0.38,
				fontWeight: 700,
				color: '#fff',
				flexShrink: 0,
			}}
		>
			{name.slice(0, 2).toUpperCase()}
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   RELATED NORMAL VIDEO CARD  (horizontal — for sidebar)
───────────────────────────────────────────────────────────────────────────── */

function RelatedCard({ video }: { video: Related }) {
	const [hovered, setHovered] = useState(false)
	const name = video.uploader.username

	return (
		<Link
			href={`/en/watch/${video.id}`}
			style={{
				textDecoration: 'none',
				display: 'flex',
				gap: 8,
				alignItems: 'flex-start',
			}}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div
				style={{
					width: 168,
					height: 94,
					borderRadius: 8,
					overflow: 'hidden',
					background: '#1a1a1a',
					flexShrink: 0,
					position: 'relative',
				}}
			>
				{video.thumbnail_url ? (
					<img
						src={video.thumbnail_url}
						alt={video.title}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: hovered ? 'scale(1.04)' : 'scale(1)',
							transition: 'transform 0.2s',
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
						<svg width='24' height='24' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}
				{hovered && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: 'rgba(0,0,0,0.22)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								width: 30,
								height: 30,
								borderRadius: '50%',
								background: 'rgba(230,57,70,0.92)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<svg width='12' height='12' viewBox='0 0 24 24' fill='white'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					</div>
				)}
			</div>
			<div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
				<p
					style={{
						fontSize: 13,
						fontWeight: 600,
						color: hovered ? '#fff' : '#ddd',
						lineHeight: 1.4,
						margin: '0 0 3px',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						transition: 'color 0.12s',
					}}
				>
					{video.title}
				</p>
				<p
					style={{
						fontSize: 12,
						color: '#888',
						margin: '0 0 2px',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{name}
				</p>
				<p style={{ fontSize: 11, color: '#555', margin: 0 }}>
					{fmt(video.views_count)} views · {timeAgo(video.created_at)}
				</p>
			</div>
		</Link>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHORTS CARD  (vertical 9:16 — for sidebar grid)
───────────────────────────────────────────────────────────────────────────── */

function SidebarShortCard({ video }: { video: Related }) {
	const [hovered, setHovered] = useState(false)

	return (
		<Link
			href={`/en/shorts/${video.id}`}
			style={{ textDecoration: 'none', display: 'block' }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{/* 9:16 thumbnail */}
			<div
				style={{
					position: 'relative',
					width: '100%',
					paddingBottom: '177.78%',
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
						}}
					>
						<svg width='20' height='20' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}

				{/* Play overlay */}
				{hovered && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: 'rgba(0,0,0,0.35)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								width: 34,
								height: 34,
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

				{/* Views badge */}
				<div
					style={{
						position: 'absolute',
						bottom: 6,
						left: 6,
						background: 'rgba(0,0,0,0.72)',
						color: '#fff',
						fontSize: 10,
						fontWeight: 600,
						padding: '2px 6px',
						borderRadius: 5,
					}}
				>
					{fmt(video.views_count)} views
				</div>
			</div>

			{/* Title */}
			<p
				style={{
					fontSize: 12,
					fontWeight: 600,
					color: hovered ? '#fff' : '#ccc',
					margin: '6px 0 1px',
					lineHeight: 1.35,
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
					transition: 'color 0.12s',
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

/* ─────────────────────────────────────────────────────────────────────────────
   SHORTS PLAYER  (unchanged)
───────────────────────────────────────────────────────────────────────────── */

function NormalPlayer({
	v,
	related,
	currentUser,
	queueType,
	queueIndex,
	playlistId,
}: {
	v: Video
	related: Related[]
	currentUser?: { id: string; username: string } | null
	queueType?: QueueType | null
	queueIndex: number
	playlistId?: string | null
}) {
	const name = v.display_name || v.username
	const [liked, setLiked] = useState(false)
	const [disliked, setDisliked] = useState(false)
	const [likesCount, setLikesCount] = useState(v.likes_count)
	const [dislikesCount, setDislikesCount] = useState(v.dislikes_count ?? 0)
	const [subscribed, setSubscribed] = useState(false)
	const [subscribersCount, setSubscribersCount] = useState(0)
	const [subLoading, setSubLoading] = useState(false)
	const [descExpanded, setDescExpanded] = useState(false)
	const [copied, setCopied] = useState(false)
	const [playlistOpen, setPlaylistOpen] = useState(false)
	const isOwn = currentUser?.id === v.user_id

	useEffect(() => {
		fetch(`/api/videos/${v.id}/like`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) {
					setLiked(data.data.liked)
					setDisliked(data.data.disliked)
					setLikesCount(data.data.likes_count)
					setDislikesCount(data.data.dislikes_count)
				}
			})
			.catch(() => {})

		fetch(`/api/users/${v.user_id}/subscribe`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) {
					setSubscribed(data.data.subscribed)
					setSubscribersCount(data.data.subscribers_count)
				}
			})
			.catch(() => {})
	}, [v.id, v.user_id])

	async function handleReaction(action: 'like' | 'dislike') {
		if (!currentUser) {
			window.location.href = '/en/login'
			return
		}
		const wasLiked = liked
		const wasDisliked = disliked
		if (action === 'like') {
			const newLiked = !liked
			setLiked(newLiked)
			setLikesCount(prev => (newLiked ? prev + 1 : prev - 1))
			if (wasDisliked) {
				setDisliked(false)
				setDislikesCount(prev => prev - 1)
			}
		} else {
			const newDisliked = !disliked
			setDisliked(newDisliked)
			setDislikesCount(prev => (newDisliked ? prev + 1 : prev - 1))
			if (wasLiked) {
				setLiked(false)
				setLikesCount(prev => prev - 1)
			}
		}
		try {
			const res = await fetch(`/api/videos/${v.id}/like`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			})
			const data = await res.json()
			if (data.ok) {
				setLiked(data.data.liked)
				setDisliked(data.data.disliked)
				setLikesCount(data.data.likes_count)
				setDislikesCount(data.data.dislikes_count)
			} else {
				setLiked(wasLiked)
				setDisliked(wasDisliked)
				setLikesCount(v.likes_count)
				setDislikesCount(v.dislikes_count ?? 0)
			}
		} catch {
			setLiked(wasLiked)
			setDisliked(wasDisliked)
			setLikesCount(v.likes_count)
			setDislikesCount(v.dislikes_count ?? 0)
		}
	}

	async function toggleSubscribe() {
		if (!currentUser) {
			window.location.href = '/en/login'
			return
		}
		setSubLoading(true)
		try {
			const res = await fetch(`/api/users/${v.user_id}/subscribe`, {
				method: 'POST',
			})
			const data = await res.json()
			if (data.ok) {
				setSubscribed(data.data.subscribed)
				setSubscribersCount(data.data.subscribers_count)
			}
		} finally {
			setSubLoading(false)
		}
	}

	function copyLink() {
		navigator.clipboard
			?.writeText(`${window.location.origin}/en/watch/${v.id}`)
			.catch(() => {})
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const showQueue = !!queueType

	// Split related into normal videos and shorts
	const relatedNormal = related
		.filter(r => r.video_type !== 'shorts' && r.id !== v.id)
		.slice(0, 15)
	const relatedShorts = related
		.filter(r => r.video_type === 'shorts' && r.id !== v.id)
		.slice(0, 3)

	return (
		<>
			<div
				style={{
					display: 'flex',
					gap: 24,
					alignItems: 'flex-start',
					margin: '-32px -24px',
					padding: '24px 24px 64px',
					boxSizing: 'border-box',
					width: 'calc(100% + 48px)',
				}}
			>
				{/* ── LEFT ── */}
				<div style={{ flex: 1, minWidth: 0 }}>
					<VideoPlayer
						src={v.video_url}
						poster={v.thumbnail_url}
						title={v.title}
					/>

					<h1
						style={{
							fontSize: 22,
							fontWeight: 700,
							color: '#fff',
							margin: '16px 0 14px',
							lineHeight: 1.3,
							letterSpacing: '-0.3px',
						}}
					>
						{v.title}
					</h1>

					{/* CHANNEL + ACTIONS */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							flexWrap: 'wrap',
							paddingBottom: 16,
							borderBottom: '1px solid #1e1e1e',
						}}
					>
						<Link
							href={`/en/channel/${v.user_id}`}
							style={{
								textDecoration: 'none',
								display: 'flex',
								alignItems: 'center',
								gap: 11,
							}}
						>
							<Avatar url={v.avatar_url} name={name} id={v.user_id} size={44} />
							<div>
								<p
									style={{
										fontSize: 15,
										fontWeight: 700,
										color: '#fff',
										margin: 0,
									}}
								>
									{name}
								</p>
								<p style={{ fontSize: 12, color: '#666', margin: 0 }}>
									{fmt(subscribersCount)} subscribers
								</p>
							</div>
						</Link>

						{!isOwn && (
							<button
								onClick={toggleSubscribe}
								disabled={subLoading}
								style={{
									padding: '9px 22px',
									borderRadius: 24,
									border: subscribed ? '1px solid #333' : 'none',
									background: subscribed ? 'rgba(255,255,255,0.06)' : '#fff',
									color: subscribed ? '#ccc' : '#000',
									fontSize: 14,
									fontWeight: 700,
									cursor: subLoading ? 'not-allowed' : 'pointer',
									opacity: subLoading ? 0.7 : 1,
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
							>
								{subLoading ? '…' : subscribed ? '✓ Subscribed' : 'Subscribe'}
							</button>
						)}

						<div style={{ flex: 1 }} />

						{/* Action pills */}
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
							{/* Like / Dislike */}
							<div
								style={{
									display: 'flex',
									borderRadius: 24,
									overflow: 'hidden',
									border: '1px solid #2a2a2a',
								}}
							>
								<button
									onClick={() => handleReaction('like')}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 8,
										padding: '9px 18px',
										background: liked ? 'rgba(230,57,70,0.15)' : '#1a1a1a',
										color: liked ? '#e63946' : '#ccc',
										fontSize: 14,
										fontWeight: 600,
										cursor: 'pointer',
										fontFamily: 'inherit',
										border: 'none',
										borderRight: '1px solid #2a2a2a',
										transition: 'all 0.15s',
									}}
								>
									<ThumbsUp size={18} fill={liked ? 'currentColor' : 'none'} />
									{fmt(likesCount)}
								</button>
								<button
									onClick={() => handleReaction('dislike')}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 8,
										padding: '9px 18px',
										background: disliked ? 'rgba(100,100,255,0.12)' : '#1a1a1a',
										color: disliked ? '#8888ff' : '#ccc',
										fontSize: 14,
										fontWeight: 600,
										cursor: 'pointer',
										fontFamily: 'inherit',
										border: 'none',
										transition: 'all 0.15s',
									}}
								>
									<ThumbsDown
										size={18}
										fill={disliked ? 'currentColor' : 'none'}
									/>
									{dislikesCount > 0 && fmt(dislikesCount)}
								</button>
							</div>

							<button
								onClick={async () => {
									if (!currentUser) {
										window.location.href = '/en/login'
										return
									}
									await fetch('/api/me/watch-later', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ video_id: v.id }),
									}).catch(() => {})
								}}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '9px 20px',
									borderRadius: 24,
									border: '1px solid #2a2a2a',
									background: '#1a1a1a',
									color: '#ccc',
									fontSize: 14,
									fontWeight: 600,
									cursor: 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
								onMouseEnter={e => {
									e.currentTarget.style.borderColor = '#444'
									e.currentTarget.style.color = '#fff'
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = '#2a2a2a'
									e.currentTarget.style.color = '#ccc'
								}}
							>
								<Clock size={18} /> Watch Later
							</button>

							<button
								onClick={() => {
									if (!currentUser) {
										window.location.href = '/en/login'
										return
									}
									setPlaylistOpen(true)
								}}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '9px 20px',
									borderRadius: 24,
									border: '1px solid #2a2a2a',
									background: '#1a1a1a',
									color: '#ccc',
									fontSize: 14,
									fontWeight: 600,
									cursor: 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
								onMouseEnter={e => {
									e.currentTarget.style.borderColor = '#444'
									e.currentTarget.style.color = '#fff'
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = '#2a2a2a'
									e.currentTarget.style.color = '#ccc'
								}}
							>
								<ListVideo size={18} /> Add to Playlist
							</button>

							<button
								onClick={copyLink}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '9px 20px',
									borderRadius: 24,
									border: `1px solid ${copied ? '#2a9d8f' : '#2a2a2a'}`,
									background: copied ? 'rgba(42,157,143,0.12)' : '#1a1a1a',
									color: copied ? '#2a9d8f' : '#ccc',
									fontSize: 14,
									fontWeight: 600,
									cursor: 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
							>
								<Share2 size={18} /> {copied ? 'Copied!' : 'Share'}
							</button>
						</div>
					</div>

					{/* DESCRIPTION BOX */}
					<div
						style={{
							marginTop: 14,
							background: '#111',
							borderRadius: 14,
							padding: '14px 18px',
							border: '1px solid #1a1a1a',
							cursor: v.description ? 'pointer' : 'default',
							transition: 'border-color 0.15s',
						}}
						onClick={() => v.description && setDescExpanded(x => !x)}
						onMouseEnter={e => {
							if (v.description) e.currentTarget.style.borderColor = '#2a2a2a'
						}}
						onMouseLeave={e => {
							e.currentTarget.style.borderColor = '#1a1a1a'
						}}
					>
						<div
							style={{
								display: 'flex',
								gap: 14,
								alignItems: 'center',
								marginBottom: 10,
							}}
						>
							<span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
								{v.views_count.toLocaleString()} views
							</span>
							<span style={{ fontSize: 13, color: '#666' }}>
								{longDate(v.created_at)}
							</span>
							{v.category && (
								<span
									style={{
										fontSize: 12,
										color: '#888',
										background: '#1e1e1e',
										padding: '2px 10px',
										borderRadius: 6,
										textTransform: 'capitalize',
									}}
								>
									{v.category}
								</span>
							)}
						</div>
						{v.description ? (
							<>
								<p
									style={{
										fontSize: 14,
										color: '#aaa',
										lineHeight: 1.7,
										margin: 0,
										display: descExpanded ? 'block' : '-webkit-box',
										WebkitLineClamp: descExpanded ? undefined : 3,
										WebkitBoxOrient: 'vertical' as const,
										overflow: descExpanded ? 'visible' : 'hidden',
										whiteSpace: 'pre-wrap',
									}}
								>
									{v.description}
								</p>
								<button
									style={{
										background: 'none',
										border: 'none',
										color: '#fff',
										fontSize: 13,
										fontWeight: 700,
										cursor: 'pointer',
										padding: '8px 0 0',
										fontFamily: 'inherit',
									}}
								>
									{descExpanded ? 'Show less' : 'Show more'}
								</button>
							</>
						) : (
							<p
								style={{
									fontSize: 14,
									color: '#444',
									margin: 0,
									fontStyle: 'italic',
								}}
							>
								No description provided.
							</p>
						)}
					</div>

					{/* COMMENTS */}
					<CommentsSection videoId={v.id} currentUser={currentUser} />
				</div>

				{/* ── RIGHT SIDEBAR ── */}
				<aside style={{ width: 400, flexShrink: 0, paddingTop: 2 }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
						{showQueue && (
							<div style={{ height: 520, maxHeight: '62vh' }}>
								<QueueSidebar
									currentVideoId={v.id}
									queueType={queueType as QueueType}
									playlistId={playlistId}
									startIndex={queueIndex}
								/>
							</div>
						)}
						<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
							{/* ── Shorts section (3-column grid) ── */}
							{relatedShorts.length > 0 && (
								<div style={{ marginBottom: 24 }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: 12,
										}}
									>
										<div
											style={{ display: 'flex', alignItems: 'center', gap: 7 }}
										>
											<svg
												width='20'
												height='20'
												viewBox='0 0 24 24'
												fill='red'
											>
												<path d='M17.77 10.32l-1.2-.5L18 9.19C19.38 8.42 19.86 6.68 19.09 5.3c-.77-1.38-2.51-1.86-3.89-1.09l-5.85 3.28-.01.02-1.17.65c-1.38.77-1.86 2.51-1.09 3.89.28.49.68.87 1.14 1.12l1.2.5L8 13.81C6.62 14.58 6.14 16.32 6.91 17.7c.77 1.38 2.51 1.86 3.89 1.09l5.85-3.27.01-.01 1.17-.65c1.38-.77 1.86-2.51 1.09-3.89-.28-.49-.68-.87-1.15-1.14zM13 14.5l-2-1.17 2-1.16 2 1.16-2 1.17z' />
											</svg>
											<span
												style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}
											>
												Shorts
											</span>
										</div>
									</div>
									{/* 3-column shorts grid */}
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(3, 1fr)',
											gap: 8,
										}}
									>
										{relatedShorts.map(r => (
											<SidebarShortCard key={r.id} video={r} />
										))}
									</div>
									{/* Divider */}
									<div
										style={{
											height: 1,
											background:
												'linear-gradient(90deg, transparent, #1e1e1e 20%, #1e1e1e 80%, transparent)',
											margin: '20px 0 0',
										}}
									/>
								</div>
							)}

							{/* ── Normal related videos ── */}
							<div>
								<p
									style={{
										fontSize: 12,
										fontWeight: 700,
										color: '#555',
										letterSpacing: '1px',
										textTransform: 'uppercase',
										margin: '0 0 14px',
									}}
								>
									Up Next
								</p>
								{relatedNormal.length === 0 ? (
									<p style={{ fontSize: 13, color: '#444' }}>
										No related videos
									</p>
								) : (
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: 10,
										}}
									>
										{relatedNormal.map(r => (
											<RelatedCard key={r.id} video={r} />
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</aside>
			</div>

			{playlistOpen && (
				<PlaylistPicker videoId={v.id} onClose={() => setPlaylistOpen(false)} />
			)}
		</>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function WatchPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const searchParams = useSearchParams()
	const { user } = useAuthContext()
	const [video, setVideo] = useState<Video | null>(null)
	const [related, setRelated] = useState<Related[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [redirectingShort, setRedirectingShort] = useState(false)

	const queueParam = searchParams.get('queue') as QueueType | null
	const queueIndex = parseInt(searchParams.get('index') || '0', 10)
	const playlistId = searchParams.get('playlist_id')
	const validQueueTypes: QueueType[] = ['liked', 'watchlater', 'playlist']
	const queueType =
		queueParam && validQueueTypes.includes(queueParam) ? queueParam : null

	useEffect(() => {
		if (!id) return
		setLoading(true)
		setError(null)
		setVideo(null)
		setRelated([])
		setRedirectingShort(false)
		Promise.all([
			fetch(`/api/videos/${id}`).then(r => r.json()),
			fetch('/api/videos?limit=24').then(r => r.json()),
		])
			.then(([vd, fd]) => {
				if (!vd.ok) {
					setError(vd.error || 'Not found')
					return
				}
				const nextVideo = vd.data.video as Video
				if (nextVideo.video_type === 'shorts') {
					setRedirectingShort(true)
					router.replace(`/en/shorts/${nextVideo.id}`)
					return
				}
				setVideo(nextVideo)
				fetch(`/api/videos/${id}/view`, { method: 'POST' }).catch(() => {})
				if (fd.ok) setRelated(fd.data.items)
			})
			.catch(() => setError('Failed to load'))
			.finally(() => setLoading(false))
	}, [id, router])

	return (
		<UserLayout>
			<style>{`
				@keyframes spin   { to { transform: rotate(360deg) } }
				@keyframes fadeUp { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
				@keyframes fadeOut { 0%,70% { opacity:1 } 100% { opacity:0 } }
				@keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:.4 } }
			`}</style>

			{loading ? (
				<div
					style={{
						display: 'flex',
						gap: 24,
						margin: '-32px -24px',
						padding: '24px',
						boxSizing: 'border-box',
						width: 'calc(100% + 48px)',
					}}
				>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								width: '100%',
								aspectRatio: '16/9',
								background: '#111',
								borderRadius: 12,
								animation: 'pulse 1.6s ease-in-out infinite',
								marginBottom: 18,
							}}
						/>
						<div
							style={{
								height: 26,
								background: '#111',
								borderRadius: 6,
								width: '65%',
								marginBottom: 12,
								animation: 'pulse 1.6s ease-in-out infinite',
							}}
						/>
						<div
							style={{
								height: 16,
								background: '#111',
								borderRadius: 6,
								width: '35%',
								animation: 'pulse 1.6s ease-in-out infinite',
							}}
						/>
					</div>
					<div style={{ width: 400, flexShrink: 0 }}>
						{[1, 2, 3, 4, 5, 6].map(i => (
							<div
								key={i}
								style={{ display: 'flex', gap: 10, marginBottom: 14 }}
							>
								<div
									style={{
										width: 168,
										height: 94,
										background: '#111',
										borderRadius: 8,
										flexShrink: 0,
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
								<div style={{ flex: 1 }}>
									<div
										style={{
											height: 13,
											background: '#111',
											borderRadius: 4,
											marginBottom: 7,
											animation: 'pulse 1.6s ease-in-out infinite',
										}}
									/>
									<div
										style={{
											height: 11,
											background: '#111',
											borderRadius: 4,
											width: '55%',
											animation: 'pulse 1.6s ease-in-out infinite',
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			) : redirectingShort ? (
				<div style={{ textAlign: 'center', paddingTop: 80 }}>
					<div
						style={{
							width: 28,
							height: 28,
							border: '3px solid #1a1a1a',
							borderTopColor: '#e63946',
							borderRadius: '50%',
							animation: 'spin .8s linear infinite',
							margin: '0 auto 14px',
						}}
					/>
					<p style={{ color: '#555', fontSize: 14, margin: 0 }}>
						Opening Shorts...
					</p>
				</div>
			) : error || !video ? (
				<div style={{ textAlign: 'center', paddingTop: 80 }}>
					<div style={{ fontSize: 52, marginBottom: 16 }}>😕</div>
					<p style={{ color: '#555', fontSize: 17, marginBottom: 10 }}>
						{error || 'Video not found'}
					</p>
					<Link
						href='/en'
						style={{
							color: '#e63946',
							fontSize: 14,
							textDecoration: 'none',
							fontWeight: 600,
						}}
					>
						← Back to Home
					</Link>
				</div>
			) : (
				<div style={{ animation: 'fadeUp .25s ease both' }}>
					<NormalPlayer
						v={video}
						related={related}
						currentUser={user}
						queueType={queueType}
						queueIndex={queueIndex}
						playlistId={playlistId}
					/>
				</div>
			)}
		</UserLayout>
	)
}
