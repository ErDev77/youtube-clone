'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'
import VideoPlayer from '@/app/_components/video/VideoPlayer'
import { Clock, ListVideo, Share2, ThumbsUp } from 'lucide-react'

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
   RELATED VIDEO CARD — YouTube sidebar style
───────────────────────────────────────────────────────────────────────────── */

function RelatedCard({ video }: { video: Related }) {
	const [hovered, setHovered] = useState(false)
	const name = video.uploader.username
	const isShort = video.video_type === 'shorts'

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
					width: isShort ? 68 : 168,
					height: isShort ? 120 : 94,
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
				{isShort && (
					<div
						style={{
							position: 'absolute',
							bottom: 4,
							left: 4,
							background: '#e63946',
							borderRadius: 4,
							padding: '1px 5px',
							fontSize: 9,
							fontWeight: 800,
							color: '#fff',
						}}
					>
						SHORTS
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
   COMMENT ITEM
───────────────────────────────────────────────────────────────────────────── */

function CommentItem({ comment }: { comment: Comment }) {
	const name = comment.display_name || comment.username
	const [liked, setLiked] = useState(comment.is_liked ?? false)
	const [likesCount, setLikesCount] = useState(comment.likes_count)

	function toggleLike() {
		setLiked(v => !v)
		setLikesCount(v => (liked ? v - 1 : v + 1))
	}

	return (
		<div style={{ display: 'flex', gap: 12, paddingBottom: 22 }}>
			<Link
				href={`/en/channel/${comment.user_id}`}
				style={{ flexShrink: 0, textDecoration: 'none' }}
			>
				<Avatar
					url={comment.avatar_url}
					name={name}
					id={comment.user_id}
					size={38}
				/>
			</Link>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: 8,
						marginBottom: 5,
					}}
				>
					<Link
						href={`/en/channel/${comment.user_id}`}
						style={{ textDecoration: 'none' }}
					>
						<span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
							{name}
						</span>
					</Link>
					<span style={{ fontSize: 11, color: '#555' }}>
						{timeAgo(comment.created_at)}
					</span>
				</div>
				<p
					style={{
						fontSize: 14,
						color: '#ccc',
						lineHeight: 1.65,
						margin: '0 0 8px',
						whiteSpace: 'pre-wrap',
					}}
				>
					{comment.content}
				</p>
				<button
					onClick={toggleLike}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 5,
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: liked ? '#e63946' : '#666',
						fontSize: 12,
						fontFamily: 'inherit',
						padding: '2px 0',
						transition: 'color 0.15s',
					}}
				>
					<svg
						width='13'
						height='13'
						viewBox='0 0 24 24'
						fill={liked ? 'currentColor' : 'none'}
						stroke='currentColor'
						strokeWidth='2'
					>
						<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
					</svg>
					{likesCount > 0 && <span>{fmt(likesCount)}</span>}
				</button>
			</div>
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMMENTS SECTION
───────────────────────────────────────────────────────────────────────────── */

function CommentsSection({
	videoId,
	currentUser,
}: {
	videoId: string
	currentUser?: { id: string; username: string } | null
}) {
	const [comments, setComments] = useState<Comment[]>([])
	const [loading, setLoading] = useState(true)
	const [newComment, setNewComment] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [focused, setFocused] = useState(false)
	const [count, setCount] = useState(0)

	useEffect(() => {
		fetch(`/api/videos/${videoId}/comments`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) {
					setComments(data.data.items)
					setCount(data.data.total ?? data.data.items.length)
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [videoId])

	async function submitComment() {
		if (!newComment.trim() || submitting) return
		setSubmitting(true)
		try {
			const res = await fetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ video_id: videoId, content: newComment.trim() }),
			})
			const data = await res.json()
			if (data.ok) {
				setComments(prev => [data.data.comment, ...prev])
				setCount(v => v + 1)
				setNewComment('')
				setFocused(false)
			}
		} catch {
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div style={{ marginTop: 28 }}>
			<h3
				style={{
					fontSize: 17,
					fontWeight: 700,
					color: '#fff',
					margin: '0 0 22px',
				}}
			>
				{count > 0 ? `${fmt(count)} Comments` : 'Comments'}
			</h3>
			{currentUser ? (
				<div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
					<Avatar
						url={null}
						name={currentUser.username}
						id={currentUser.id}
						size={38}
					/>
					<div style={{ flex: 1 }}>
						<textarea
							placeholder='Add a comment…'
							value={newComment}
							onChange={e => setNewComment(e.target.value)}
							onFocus={() => setFocused(true)}
							rows={focused ? 3 : 1}
							style={{
								width: '100%',
								background: 'transparent',
								border: 'none',
								borderBottom: `2px solid ${focused ? '#e63946' : '#2a2a2a'}`,
								outline: 'none',
								color: '#fff',
								fontSize: 14,
								fontFamily: 'inherit',
								resize: 'none',
								lineHeight: 1.65,
								padding: '6px 0',
								transition: 'border-color 0.2s',
								boxSizing: 'border-box',
							}}
						/>
						{focused && (
							<div
								style={{
									display: 'flex',
									justifyContent: 'flex-end',
									gap: 10,
									marginTop: 10,
								}}
							>
								<button
									onClick={() => {
										setFocused(false)
										setNewComment('')
									}}
									style={{
										padding: '8px 18px',
										borderRadius: 20,
										border: 'none',
										background: 'none',
										color: '#aaa',
										fontSize: 13,
										cursor: 'pointer',
										fontFamily: 'inherit',
									}}
								>
									Cancel
								</button>
								<button
									onClick={submitComment}
									disabled={!newComment.trim() || submitting}
									style={{
										padding: '8px 18px',
										borderRadius: 20,
										border: 'none',
										background: newComment.trim() ? '#e63946' : '#2a2a2a',
										color: newComment.trim() ? '#fff' : '#666',
										fontSize: 13,
										fontWeight: 600,
										cursor: newComment.trim() ? 'pointer' : 'not-allowed',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
									}}
								>
									{submitting ? 'Posting…' : 'Comment'}
								</button>
							</div>
						)}
					</div>
				</div>
			) : (
				<div
					style={{
						marginBottom: 24,
						padding: '14px 18px',
						background: '#111',
						borderRadius: 12,
						border: '1px solid #1e1e1e',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<svg
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#555'
						strokeWidth='2'
					>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
					<span style={{ fontSize: 13, color: '#666' }}>
						<Link
							href='/en/login'
							style={{
								color: '#e63946',
								textDecoration: 'none',
								fontWeight: 600,
							}}
						>
							Sign in
						</Link>{' '}
						to leave a comment
					</span>
				</div>
			)}
			{loading ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
					{[1, 2, 3].map(i => (
						<div key={i} style={{ display: 'flex', gap: 12 }}>
							<div
								style={{
									width: 38,
									height: 38,
									borderRadius: '50%',
									background: '#1e1e1e',
									flexShrink: 0,
									animation: 'pulse 1.6s ease-in-out infinite',
								}}
							/>
							<div style={{ flex: 1 }}>
								<div
									style={{
										height: 12,
										background: '#1e1e1e',
										borderRadius: 4,
										width: '25%',
										marginBottom: 8,
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
								<div
									style={{
										height: 12,
										background: '#1e1e1e',
										borderRadius: 4,
										width: '75%',
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
							</div>
						</div>
					))}
				</div>
			) : comments.length === 0 ? (
				<div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
					<svg
						width='40'
						height='40'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#2a2a2a'
						strokeWidth='1.5'
						style={{ display: 'block', margin: '0 auto 12px' }}
					>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
					<p style={{ fontSize: 14, color: '#555' }}>
						No comments yet. Be the first!
					</p>
				</div>
			) : (
				<div>
					{comments.map(c => (
						<CommentItem key={c.id} comment={c} />
					))}
				</div>
			)}
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHORTS PLAYER
───────────────────────────────────────────────────────────────────────────── */

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
		.slice(0, 6)

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				gap: 32,
				alignItems: 'flex-start',
				flexWrap: 'wrap',
			}}
		>
			<div style={{ width: 380, flexShrink: 0 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						marginBottom: 12,
					}}
				>
					<span
						style={{
							background: '#e63946',
							color: '#fff',
							fontSize: 11,
							fontWeight: 700,
							padding: '3px 10px',
							borderRadius: 6,
						}}
					>
						SHORTS
					</span>
					<span style={{ fontSize: 12, color: '#555' }}>
						{timeAgo(v.created_at)}
					</span>
				</div>
				<div
					style={{
						width: 380,
						height: 675,
						borderRadius: 18,
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
									width: 64,
									height: 64,
									borderRadius: '50%',
									background: 'rgba(0,0,0,.55)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									animation: 'fadeOut .6s ease forwards',
								}}
							>
								{paused ? (
									<svg width='28' height='28' viewBox='0 0 24 24' fill='#fff'>
										<path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
									</svg>
								) : (
									<svg width='28' height='28' viewBox='0 0 24 24' fill='#fff'>
										<path d='M8 5v14l11-7z' />
									</svg>
								)}
							</div>
						</div>
					)}
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							background:
								'linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 100%)',
							padding: '60px 16px 16px',
							pointerEvents: 'none',
						}}
					>
						<p
							style={{
								fontSize: 15,
								fontWeight: 700,
								color: '#fff',
								margin: '0 0 4px',
							}}
						>
							{v.title}
						</p>
						{v.description && (
							<p
								style={{
									fontSize: 13,
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
					<button
						onClick={toggleMute}
						style={{
							position: 'absolute',
							top: 14,
							right: 14,
							width: 36,
							height: 36,
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
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginTop: 14,
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
						<Avatar url={v.avatar_url} name={name} id={v.user_id} size={36} />
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
					</Link>
					<div
						style={{ display: 'flex', gap: 18, fontSize: 13, color: '#666' }}
					>
						<span>👁 {fmt(v.views_count)}</span>
						<span>♥ {fmt(v.likes_count)}</span>
					</div>
				</div>
			</div>
			{nearby.length > 0 && (
				<div style={{ paddingTop: 52 }}>
					<p
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#444',
							letterSpacing: '1.2px',
							textTransform: 'uppercase',
							marginBottom: 16,
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
										width: 76,
										height: 136,
										borderRadius: 10,
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
											lineHeight: 1.35,
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

/* ─────────────────────────────────────────────────────────────────────────────
   NORMAL PLAYER — full-bleed two-column layout
───────────────────────────────────────────────────────────────────────────── */

function NormalPlayer({
	v,
	related,
	currentUser,
}: {
	v: Video
	related: Related[]
	currentUser?: { id: string; username: string } | null
}) {
	const name = v.display_name || v.username
	const [liked, setLiked] = useState(false)
	const [likesCount, setLikesCount] = useState(v.likes_count)
	const [subscribed, setSubscribed] = useState(false)
	const [subscribersCount, setSubscribersCount] = useState(0)
	const [subLoading, setSubLoading] = useState(false)
	const [descExpanded, setDescExpanded] = useState(false)
	const [copied, setCopied] = useState(false)
	const isOwn = currentUser?.id === v.user_id

	useEffect(() => {
		fetch(`/api/users/${v.user_id}/subscribe`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) {
					setSubscribed(data.data.subscribed)
					setSubscribersCount(data.data.subscribers_count)
				}
			})
			.catch(() => {})
	}, [v.user_id])

	async function toggleLike() {
		if (!currentUser) {
			window.location.href = '/en/login'
			return
		}
		setLiked(x => !x)
		setLikesCount(prev => (liked ? prev - 1 : prev + 1))
		await fetch(`/api/videos/${v.id}/like`, { method: 'POST' }).catch(() => {})
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

	const sidebarVideos = related.filter(r => r.id !== v.id).slice(0, 22)

	return (
		/*
      KEY: negative margin + adjusted padding + calc width
      This breaks the component out of UserLayout's 32px 24px padding
      so the layout fills the full available content area.
      The sidebar is fixed at 400px — matching YouTube's ~402px sidebar.
    */
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
			{/* ── LEFT: player + info + comments ── */}
			<div style={{ flex: 1, minWidth: 0 }}>
				{/* PLAYER — custom player fills entire left column */}
				<VideoPlayer
					src={v.video_url}
					poster={v.thumbnail_url}
					title={v.title}
				/>

				{/* TITLE */}
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
					<div style={{ display: 'flex', gap: 8 }}>
						<button
							onClick={toggleLike}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								padding: '9px 20px',
								borderRadius: 24,
								border: `1px solid ${liked ? 'rgba(230,57,70,0.4)' : '#2a2a2a'}`,
								background: liked ? 'rgba(230,57,70,0.12)' : '#1a1a1a',
								color: liked ? '#e63946' : '#ccc',
								fontSize: 14,
								fontWeight: 600,
								cursor: 'pointer',
								fontFamily: 'inherit',
								transition: 'all 0.15s',
							}}
						>
							<ThumbsUp size={20} />
							{fmt(likesCount)}
						</button>
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
							<Clock size={20} />
							Watch Later
						</button>
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
							<ListVideo size={20} />
							Add to Playlist
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
							<Share2 size={18} />
							{copied ? 'Copied!' : 'Share'}
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
							marginBottom: v.description ? 10 : 0,
						}}
					>
						<span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
							{fmt(v.views_count)} views
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
					{v.description && (
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
					)}
				</div>

				{/* COMMENTS */}
				<CommentsSection videoId={v.id} currentUser={currentUser} />
			</div>

			{/* ── RIGHT: sidebar — fixed 400px ── */}
			<aside style={{ width: 400, flexShrink: 0, paddingTop: 2 }}>
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
				<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
					{sidebarVideos.length === 0 ? (
						<p style={{ fontSize: 13, color: '#444' }}>No related videos</p>
					) : (
						sidebarVideos.map(r => <RelatedCard key={r.id} video={r} />)
					)}
				</div>
			</aside>
		</div>
	)
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function WatchPage() {
	const { id } = useParams<{ id: string }>()
	const { user } = useAuthContext()
	const [video, setVideo] = useState<Video | null>(null)
	const [related, setRelated] = useState<Related[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return
		Promise.all([
			fetch(`/api/videos/${id}`).then(r => r.json()),
			fetch('/api/videos?limit=24').then(r => r.json()),
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
					{video.video_type === 'shorts' ? (
						<ShortsPlayer v={video} related={related} />
					) : (
						<NormalPlayer v={video} related={related} currentUser={user} />
					)}
				</div>
			)}
		</UserLayout>
	)
}
