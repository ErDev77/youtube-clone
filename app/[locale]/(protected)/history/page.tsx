'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

/* ─── Types ─── */
type HistoryVideo = {
	watched_at: string
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

type UserComment = {
	id: string
	content: string
	created_at: string
	likes_count: number
	video_id: string
	parent_comment_id: string | null
	video_title: string
	video_thumbnail: string | null
	video_type: string | null
}

type Tab = 'history' | 'comments'
type DateFilter = 'all' | 'today' | 'week' | 'month'

/* ─── Helpers ─── */
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

function longDate(iso: string) {
	return new Date(iso).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function colorFromId(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
}

function groupByDate(
	videos: HistoryVideo[],
): { label: string; items: HistoryVideo[] }[] {
	const groups: Map<string, HistoryVideo[]> = new Map()
	const now = new Date()

	for (const v of videos) {
		const d = new Date(v.watched_at)
		const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)

		let label: string
		if (diffDays === 0) label = 'Today'
		else if (diffDays === 1) label = 'Yesterday'
		else if (diffDays < 7) label = 'This week'
		else if (diffDays < 30) label = 'This month'
		else {
			label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
		}

		if (!groups.has(label)) groups.set(label, [])
		groups.get(label)!.push(v)
	}

	return Array.from(groups.entries()).map(([label, items]) => ({
		label,
		items,
	}))
}

function isWithinFilter(iso: string, filter: DateFilter): boolean {
	if (filter === 'all') return true
	const now = Date.now()
	const t = new Date(iso).getTime()
	const diff = now - t
	if (filter === 'today') return diff < 86400000
	if (filter === 'week') return diff < 7 * 86400000
	if (filter === 'month') return diff < 30 * 86400000
	return true
}

/* ─── Spinner ─── */
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

/* ─── Toast ─── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
	return (
		<div
			style={{
				position: 'fixed',
				bottom: 28,
				right: 28,
				zIndex: 9999,
				background: type === 'success' ? '#1a3a2a' : '#3a1a1e',
				border: `1px solid ${type === 'success' ? '#2a9d6a' : '#e63946'}`,
				color: type === 'success' ? '#57cc99' : '#e63946',
				borderRadius: 10,
				padding: '12px 18px',
				fontSize: 13,
				fontWeight: 500,
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				animation: 'toastIn 0.25s ease',
				boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
			}}
		>
			{type === 'success' ? '✓' : '✕'} {msg}
		</div>
	)
}

/* ─── History Video Row ─── */
function HistoryRow({
	video,
	onPlay,
	onRemove,
	removing,
}: {
	video: HistoryVideo
	onPlay: () => void
	onRemove: () => void
	removing: boolean
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
			{/* Thumbnail */}
			<div
				onClick={onPlay}
				style={{
					width: 160,
					height: 90,
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
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: 'rgba(230,57,70,0.9)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<svg width='14' height='14' viewBox='0 0 24 24' fill='white'>
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

			{/* Info */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<p
					onClick={onPlay}
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: '#fff',
						margin: '0 0 4px',
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
							marginBottom: 3,
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
					{video.category && (
						<span
							style={{
								marginLeft: 8,
								background: '#1a1a1a',
								border: '1px solid #222',
								borderRadius: 4,
								padding: '1px 7px',
								fontSize: 10,
								color: '#666',
								textTransform: 'capitalize',
							}}
						>
							{video.category}
						</span>
					)}
				</p>
			</div>

			{/* Remove */}
			<button
				onClick={onRemove}
				disabled={removing}
				title='Remove from history'
				style={{
					width: 32,
					height: 32,
					borderRadius: 8,
					border: '1px solid transparent',
					background: 'transparent',
					color: '#555',
					cursor: removing ? 'not-allowed' : 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
					transition: 'all 0.15s',
					opacity: hovered ? 1 : 0,
				}}
				onMouseEnter={e => {
					e.currentTarget.style.borderColor = '#e63946'
					e.currentTarget.style.color = '#e63946'
					e.currentTarget.style.background = 'rgba(230,57,70,0.08)'
				}}
				onMouseLeave={e => {
					e.currentTarget.style.borderColor = 'transparent'
					e.currentTarget.style.color = '#555'
					e.currentTarget.style.background = 'transparent'
				}}
			>
				{removing ? (
					<Spinner size={13} />
				) : (
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
					>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				)}
			</button>
		</div>
	)
}

/* ─── Comment Row ─── */
function CommentRow({
	comment,
	onDelete,
	deleting,
}: {
	comment: UserComment
	onDelete: () => void
	deleting: boolean
}) {
	const [hovered, setHovered] = useState(false)

	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: 'flex',
				gap: 14,
				padding: '14px 16px',
				borderRadius: 12,
				background: hovered ? '#111' : '#0d0d0d',
				border: '1px solid',
				borderColor: hovered ? '#222' : '#161616',
				transition: 'all 0.15s',
			}}
		>
			{/* Video thumbnail */}
			<Link
				href={`/en/watch/${comment.video_id}`}
				style={{ textDecoration: 'none', flexShrink: 0 }}
			>
				<div
					style={{
						width: 80,
						height: 46,
						borderRadius: 6,
						overflow: 'hidden',
						background: '#1a1a1a',
						position: 'relative',
					}}
				>
					{comment.video_thumbnail ? (
						<img
							src={comment.video_thumbnail}
							alt={comment.video_title}
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
							<svg width='16' height='16' viewBox='0 0 24 24' fill='#333'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					)}
					{comment.video_type === 'shorts' && (
						<div
							style={{
								position: 'absolute',
								bottom: 2,
								left: 2,
								background: '#e63946',
								borderRadius: 2,
								padding: '0 4px',
								fontSize: 8,
								fontWeight: 800,
								color: '#fff',
							}}
						>
							S
						</div>
					)}
				</div>
			</Link>

			{/* Comment content */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						gap: 8,
						marginBottom: 6,
					}}
				>
					<div style={{ minWidth: 0 }}>
						<Link
							href={`/en/watch/${comment.video_id}`}
							style={{ textDecoration: 'none' }}
						>
							<p
								style={{
									fontSize: 12,
									color: '#666',
									margin: '0 0 4px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									transition: 'color 0.15s',
								}}
								onMouseEnter={e => (e.currentTarget.style.color = '#e63946')}
								onMouseLeave={e => (e.currentTarget.style.color = '#666')}
							>
								{comment.parent_comment_id ? '↩ Reply on' : 'Comment on'}:{' '}
								{comment.video_title}
							</p>
						</Link>
						<p
							style={{
								fontSize: 14,
								color: '#ddd',
								margin: 0,
								lineHeight: 1.6,
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
							}}
						>
							{comment.content}
						</p>
					</div>

					{/* Delete */}
					<button
						onClick={onDelete}
						disabled={deleting}
						title='Delete comment'
						style={{
							width: 28,
							height: 28,
							borderRadius: 6,
							flexShrink: 0,
							border: '1px solid transparent',
							background: 'transparent',
							color: '#555',
							cursor: deleting ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'all 0.15s',
							opacity: hovered ? 1 : 0,
						}}
						onMouseEnter={e => {
							e.currentTarget.style.borderColor = '#e63946'
							e.currentTarget.style.color = '#e63946'
							e.currentTarget.style.background = 'rgba(230,57,70,0.08)'
						}}
						onMouseLeave={e => {
							e.currentTarget.style.borderColor = 'transparent'
							e.currentTarget.style.color = '#555'
							e.currentTarget.style.background = 'transparent'
						}}
					>
						{deleting ? (
							<Spinner size={12} />
						) : (
							<svg
								width='13'
								height='13'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
							>
								<polyline points='3 6 5 6 21 6' />
								<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
								<path d='M10 11v6M14 11v6' />
							</svg>
						)}
					</button>
				</div>

				{/* Meta */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<span style={{ fontSize: 11, color: '#444' }}>
						{longDate(comment.created_at)}
					</span>
					{comment.likes_count > 0 && (
						<span
							style={{
								fontSize: 11,
								color: '#555',
								display: 'flex',
								alignItems: 'center',
								gap: 4,
							}}
						>
							<svg width='11' height='11' viewBox='0 0 24 24' fill='#555'>
								<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
							</svg>
							{fmt(comment.likes_count)}
						</span>
					)}
				</div>
			</div>
		</div>
	)
}

/* ─── Main Page ─── */
export default function HistoryPage() {
	const router = useRouter()
	const { user } = useAuthContext()

	// History
	const [history, setHistory] = useState<HistoryVideo[]>([])
	const [historyLoading, setHistoryLoading] = useState(true)
	const [removingId, setRemovingId] = useState<string | null>(null)
	const [clearing, setClearing] = useState(false)
	const [dateFilter, setDateFilter] = useState<DateFilter>('all')
	const [search, setSearch] = useState('')

	// Comments
	const [comments, setComments] = useState<UserComment[]>([])
	const [commentsLoading, setCommentsLoading] = useState(true)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [clearingComments, setClearingComments] = useState(false)
	const [commentSearch, setCommentSearch] = useState('')

	const [tab, setTab] = useState<Tab>('history')
	const [toast, setToast] = useState<{
		msg: string
		type: 'success' | 'error'
	} | null>(null)

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 3000)
	}

	useEffect(() => {
		if (!user) return
		fetch('/api/me/history')
			.then(r => r.json())
			.then(d => {
				if (d.ok) setHistory(d.data.items)
			})
			.catch(() => {})
			.finally(() => setHistoryLoading(false))

		fetch('/api/me/comments')
			.then(r => r.json())
			.then(d => {
				if (d.ok) setComments(d.data.items)
			})
			.catch(() => {})
			.finally(() => setCommentsLoading(false))
	}, [user])

	/* ── History filtering ── */
	const filteredHistory = useMemo(() => {
		let arr = history.filter(v => isWithinFilter(v.watched_at, dateFilter))
		if (search.trim()) {
			const q = search.toLowerCase()
			arr = arr.filter(
				v =>
					v.title.toLowerCase().includes(q) ||
					(v.display_name || v.username).toLowerCase().includes(q) ||
					(v.category || '').toLowerCase().includes(q),
			)
		}
		return arr
	}, [history, dateFilter, search])

	const groupedHistory = useMemo(
		() => groupByDate(filteredHistory),
		[filteredHistory],
	)

	/* ── Comments filtering ── */
	const filteredComments = useMemo(() => {
		if (!commentSearch.trim()) return comments
		const q = commentSearch.toLowerCase()
		return comments.filter(
			c =>
				c.content.toLowerCase().includes(q) ||
				c.video_title.toLowerCase().includes(q),
		)
	}, [comments, commentSearch])

	async function handleRemoveHistory(videoId: string) {
		setRemovingId(videoId)
		try {
			const res = await fetch('/api/me/history', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ video_id: videoId }),
			})
			if (!res.ok) throw new Error()
			setHistory(prev => prev.filter(v => v.id !== videoId))
			showToast('Removed from history')
		} catch {
			showToast('Failed to remove', 'error')
		} finally {
			setRemovingId(null)
		}
	}

	async function handleClearHistory() {
		if (!confirm('Clear your entire watch history?')) return
		setClearing(true)
		try {
			const res = await fetch('/api/me/history', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clear_all: true }),
			})
			if (!res.ok) throw new Error()
			setHistory([])
			showToast('Watch history cleared')
		} catch {
			showToast('Failed to clear history', 'error')
		} finally {
			setClearing(false)
		}
	}

	async function handleDeleteComment(commentId: string) {
		setDeletingId(commentId)
		try {
			const res = await fetch('/api/me/comments', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ comment_id: commentId }),
			})
			if (!res.ok) throw new Error()
			setComments(prev => prev.filter(c => c.id !== commentId))
			showToast('Comment deleted')
		} catch {
			showToast('Failed to delete comment', 'error')
		} finally {
			setDeletingId(null)
		}
	}

	async function handleClearComments() {
		if (!confirm('Delete all your comments?')) return
		setClearingComments(true)
		try {
			const res = await fetch('/api/me/comments', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clear_all: true }),
			})
			if (!res.ok) throw new Error()
			setComments([])
			setCommentSearch('')
			showToast('Comments cleared')
		} catch {
			showToast('Failed to clear comments', 'error')
		} finally {
			setClearingComments(false)
		}
	}

	const DATE_FILTERS: { value: DateFilter; label: string }[] = [
		{ value: 'all', label: 'All time' },
		{ value: 'today', label: 'Today' },
		{ value: 'week', label: 'This week' },
		{ value: 'month', label: 'This month' },
	]

	return (
		<UserLayout>
			<style>{`
				@keyframes spin    { to { transform: rotate(360deg) } }
				@keyframes toastIn { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
				@keyframes fadeUp  { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
				@keyframes pulse   { 0%,100%{opacity:1}50%{opacity:.45} }
			`}</style>

			{toast && <Toast msg={toast.msg} type={toast.type} />}

			{/* Page header */}
			<div style={{ marginBottom: 28 }}>
				<h1
					style={{
						fontSize: 24,
						fontWeight: 800,
						color: '#fff',
						margin: '0 0 4px',
						letterSpacing: '-0.4px',
					}}
				>
					History
				</h1>
				<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
					Your watch history and comments
				</p>
			</div>

			{/* Tabs */}
			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid #1a1a1a',
					marginBottom: 24,
					gap: 0,
				}}
			>
				{(
					[
						{
							id: 'history',
							label: 'Watch History',
							icon: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
							count: history.length,
						},
						{
							id: 'comments',
							label: 'My Comments',
							icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
							count: comments.length,
						},
					] as { id: Tab; label: string; icon: string; count: number }[]
				).map(t => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							padding: '11px 18px',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: tab === t.id ? '#fff' : '#555',
							fontSize: 13,
							fontWeight: tab === t.id ? 700 : 400,
							borderBottom:
								tab === t.id ? '2px solid #e63946' : '2px solid transparent',
							transition: 'color 0.15s',
							fontFamily: 'inherit',
						}}
					>
						<svg
							width='15'
							height='15'
							viewBox='0 0 24 24'
							fill={tab === t.id ? '#e63946' : '#555'}
						>
							<path d={t.icon} />
						</svg>
						{t.label}
						{t.count > 0 && (
							<span
								style={{
									fontSize: 11,
									fontWeight: 700,
									background: tab === t.id ? 'rgba(230,57,70,0.15)' : '#1a1a1a',
									color: tab === t.id ? '#e63946' : '#555',
									padding: '1px 7px',
									borderRadius: 10,
									border: `1px solid ${tab === t.id ? 'rgba(230,57,70,0.3)' : '#222'}`,
								}}
							>
								{t.count}
							</span>
						)}
					</button>
				))}
			</div>

			{/* ── HISTORY TAB ── */}
			{tab === 'history' && (
				<div style={{ animation: 'fadeUp 0.2s ease both' }}>
					{/* Controls */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							marginBottom: 20,
							flexWrap: 'wrap',
						}}
					>
						{/* Search */}
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
								minWidth: 220,
								flex: 1,
								maxWidth: 340,
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
								placeholder='Search history…'
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

						{/* Date filter chips */}
						<div style={{ display: 'flex', gap: 6 }}>
							{DATE_FILTERS.map(f => (
								<button
									key={f.value}
									onClick={() => setDateFilter(f.value)}
									style={{
										padding: '7px 14px',
										borderRadius: 20,
										border: `1px solid ${dateFilter === f.value ? 'transparent' : '#222'}`,
										background: dateFilter === f.value ? '#fff' : '#111',
										color: dateFilter === f.value ? '#000' : '#888',
										fontSize: 12,
										fontWeight: dateFilter === f.value ? 600 : 400,
										cursor: 'pointer',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
									}}
								>
									{f.label}
								</button>
							))}
						</div>

						<div style={{ flex: 1 }} />

						{/* Clear all */}
						{history.length > 0 && (
							<button
								onClick={handleClearHistory}
								disabled={clearing}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									padding: '8px 16px',
									borderRadius: 20,
									border: '1px solid #2a2a2a',
									background: 'transparent',
									color: '#888',
									fontSize: 12,
									fontWeight: 600,
									cursor: clearing ? 'not-allowed' : 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
								onMouseEnter={e => {
									e.currentTarget.style.borderColor = '#e63946'
									e.currentTarget.style.color = '#e63946'
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = '#2a2a2a'
									e.currentTarget.style.color = '#888'
								}}
							>
								{clearing ? (
									<Spinner size={12} />
								) : (
									<svg
										width='13'
										height='13'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<polyline points='3 6 5 6 21 6' />
										<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
									</svg>
								)}
								{clearing ? 'Clearing…' : 'Clear all'}
							</button>
						)}
					</div>

					{historyLoading ? (
						/* Skeleton */
						<div>
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
											width: 160,
											height: 90,
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
					) : history.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: '80px 20px',
								border: '1px dashed #1e1e1e',
								borderRadius: 16,
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
								<svg
									width='28'
									height='28'
									viewBox='0 0 24 24'
									fill='none'
									stroke='#e63946'
									strokeWidth='1.5'
								>
									<path d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' />
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
								No watch history
							</p>
							<p
								style={{
									fontSize: 14,
									color: '#555',
									margin: '0 0 24px',
									maxWidth: 320,
									marginInline: 'auto',
									lineHeight: 1.6,
								}}
							>
								Videos you watch will appear here.
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
					) : filteredHistory.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: '60px 20px',
								border: '1px dashed #1e1e1e',
								borderRadius: 14,
							}}
						>
							<p style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>
								No results found
							</p>
							<button
								onClick={() => {
									setSearch('')
									setDateFilter('all')
								}}
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
								Clear filters
							</button>
						</div>
					) : (
						/* Grouped list */
						<div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
							{groupedHistory.map(group => (
								<div key={group.label}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 10,
											marginBottom: 10,
										}}
									>
										<div
											style={{
												width: 3,
												height: 16,
												background: '#e63946',
												borderRadius: 2,
												flexShrink: 0,
											}}
										/>
										<span
											style={{
												fontSize: 11,
												fontWeight: 700,
												color: '#555',
												letterSpacing: '1.2px',
												textTransform: 'uppercase',
											}}
										>
											{group.label}
										</span>
										<span style={{ fontSize: 11, color: '#333' }}>
											· {group.items.length}
										</span>
									</div>
									<div
										style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
									>
										{group.items.map(video => (
											<HistoryRow
												key={`${video.id}-${video.watched_at}`}
												video={video}
												onPlay={() => router.push(`/en/watch/${video.id}`)}
												onRemove={() => handleRemoveHistory(video.id)}
												removing={removingId === video.id}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* ── COMMENTS TAB ── */}
			{tab === 'comments' && (
				<div style={{ animation: 'fadeUp 0.2s ease both' }}>
					{/* Controls */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							marginBottom: 20,
							flexWrap: 'wrap',
						}}
					>
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
								minWidth: 220,
								flex: 1,
								maxWidth: 340,
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
								placeholder='Search comments…'
								value={commentSearch}
								onChange={e => setCommentSearch(e.target.value)}
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
							{commentSearch && (
								<button
									onClick={() => setCommentSearch('')}
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
						{!commentsLoading && (
							<p style={{ fontSize: 13, color: '#444', margin: 0 }}>
								{filteredComments.length}{' '}
								{filteredComments.length === 1 ? 'comment' : 'comments'}
								{commentSearch && (
									<span style={{ color: '#555' }}>
										{' '}
										matching &ldquo;{commentSearch}&rdquo;
									</span>
								)}
							</p>
						)}

						<div style={{ flex: 1 }} />

						{comments.length > 0 && (
							<button
								onClick={handleClearComments}
								disabled={clearingComments}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									padding: '8px 16px',
									borderRadius: 20,
									border: '1px solid #2a2a2a',
									background: 'transparent',
									color: '#888',
									fontSize: 12,
									fontWeight: 600,
									cursor: clearingComments ? 'not-allowed' : 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
								onMouseEnter={e => {
									e.currentTarget.style.borderColor = '#e63946'
									e.currentTarget.style.color = '#e63946'
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = '#2a2a2a'
									e.currentTarget.style.color = '#888'
								}}
							>
								{clearingComments ? (
									<Spinner size={12} />
								) : (
									<svg
										width='13'
										height='13'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<polyline points='3 6 5 6 21 6' />
										<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
									</svg>
								)}
								{clearingComments ? 'Clearingâ€¦' : 'Clear all'}
							</button>
						)}
					</div>

					{commentsLoading ? (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
							{[1, 2, 3, 4].map(i => (
								<div
									key={i}
									style={{
										height: 80,
										background: '#0d0d0d',
										borderRadius: 12,
										animation: 'pulse 1.6s ease-in-out infinite',
										border: '1px solid #161616',
									}}
								/>
							))}
						</div>
					) : comments.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: '80px 20px',
								border: '1px dashed #1e1e1e',
								borderRadius: 16,
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
								<svg
									width='28'
									height='28'
									viewBox='0 0 24 24'
									fill='none'
									stroke='#e63946'
									strokeWidth='1.5'
								>
									<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
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
								No comments yet
							</p>
							<p
								style={{
									fontSize: 14,
									color: '#555',
									margin: '0 0 24px',
									lineHeight: 1.6,
								}}
							>
								Comments you leave on videos will appear here.
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
					) : filteredComments.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: '60px 20px',
								border: '1px dashed #1e1e1e',
								borderRadius: 14,
							}}
						>
							<p style={{ fontSize: 15, color: '#555', marginBottom: 12 }}>
								No results for &ldquo;{commentSearch}&rdquo;
							</p>
							<button
								onClick={() => setCommentSearch('')}
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
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							{filteredComments.map(comment => (
								<CommentRow
									key={comment.id}
									comment={comment}
									onDelete={() => handleDeleteComment(comment.id)}
									deleting={deletingId === comment.id}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</UserLayout>
	)
}
