'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

/* ─── Types ─── */
type PlaylistVideo = {
	id: string
	title: string
	thumbnail_url: string | null
	video_url: string
	views_count: number
	created_at: string
	category: string | null
	video_type: string | null
	duration?: string | null
	position: number
	uploader_id: string
	username: string
	display_name: string | null
	uploader_avatar: string | null
}

type Playlist = {
	id: string
	title: string
	description: string | null
	visibility: 'public' | 'private'
	video_count: number
	user_id: string
	username: string
	display_name: string | null
	avatar_url: string | null
	created_at: string
	updated_at: string
}

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

function colorFromId(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
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

/* ─── Video Row ─── */
function VideoRow({
	video,
	index,
	isOwner,
	dragging,
	onDragStart,
	onDragOver,
	onDrop,
	onRemove,
	removing,
	onPlay,
}: {
	video: PlaylistVideo
	index: number
	isOwner: boolean
	dragging: boolean
	onDragStart: () => void
	onDragOver: (e: React.DragEvent) => void
	onDrop: () => void
	onRemove: () => void
	removing: boolean
	onPlay: () => void
}) {
	const [hovered, setHovered] = useState(false)
	const name = video.display_name || video.username

	return (
		<div
			draggable={isOwner}
			onDragStart={onDragStart}
			onDragOver={e => {
				e.preventDefault()
				onDragOver(e)
			}}
			onDrop={onDrop}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '10px 12px',
				borderRadius: 10,
				background: dragging
					? 'rgba(230,57,70,0.06)'
					: hovered
						? '#111'
						: 'transparent',
				border: dragging
					? '1px solid rgba(230,57,70,0.3)'
					: '1px solid transparent',
				transition: 'background 0.15s, border-color 0.15s',
				cursor: isOwner ? 'grab' : 'default',
			}}
		>
			{/* Drag handle / index */}
			<div
				style={{
					width: 28,
					flexShrink: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{isOwner ? (
					<svg width='16' height='16' viewBox='0 0 24 24' fill='#333'>
						<path d='M9 3h2v2H9zm4 0h2v2h-2zM9 7h2v2H9zm4 0h2v2h-2zM9 11h2v2H9zm4 0h2v2h-2zM9 15h2v2H9zm4 0h2v2h-2z' />
					</svg>
				) : (
					<span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
						{index + 1}
					</span>
				)}
			</div>

			{/* Thumbnail */}
			<div
				onClick={onPlay}
				style={{
					width: 120,
					height: 68,
					borderRadius: 8,
					overflow: 'hidden',
					background: '#1a1a1a',
					position: 'relative',
					flexShrink: 0,
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
			</div>

			{/* Info */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<p
					onClick={onPlay}
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: '#fff',
						margin: '0 0 3px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
						cursor: 'pointer',
					}}
				>
					{video.title}
				</p>
				<Link
					href={`/en/channel/${video.uploader_id}`}
					style={{ textDecoration: 'none' }}
				>
					<p style={{ fontSize: 12, color: '#888', margin: '0 0 2px' }}>
						{name}
					</p>
				</Link>
				<p style={{ fontSize: 11, color: '#555', margin: 0 }}>
					{fmt(video.views_count)} views · {timeAgo(video.created_at)}
				</p>
			</div>

			{/* Remove button (owner only) */}
			{isOwner && (
				<button
					onClick={onRemove}
					disabled={removing}
					title='Remove from playlist'
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
			)}
		</div>
	)
}

/* ─── Main Page ─── */
export default function PlaylistDetailPage() {
	const { id } = useParams<{ id: string }>()
	const router = useRouter()
	const { user } = useAuthContext()

	const [playlist, setPlaylist] = useState<Playlist | null>(null)
	const [videos, setVideos] = useState<PlaylistVideo[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Drag state
	const dragIndexRef = useRef<number | null>(null)
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
	const [savingOrder, setSavingOrder] = useState(false)

	// Remove state
	const [removingId, setRemovingId] = useState<string | null>(null)

	// Toast
	const [toast, setToast] = useState<{
		msg: string
		type: 'success' | 'error'
	} | null>(null)

	const isOwner = !!user && !!playlist && user.id === playlist.user_id

	useEffect(() => {
		if (!id) return
		fetch(`/api/playlists/${id}`)
			.then(r => r.json())
			.then(data => {
				if (!data.ok) {
					setError(data.error || 'Not found')
					return
				}
				setPlaylist(data.data.playlist)
				setVideos(data.data.videos)
			})
			.catch(() => setError('Failed to load'))
			.finally(() => setLoading(false))
	}, [id])

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 3000)
	}

	/* ── Navigate to a video in the playlist queue ── */
	function playAt(index: number) {
		if (index < 0 || index >= videos.length) return
		const video = videos[index]
		const params = new URLSearchParams({
			queue: 'playlist',
			index: String(index),
			playlist_id: id,
		})
		router.push(`/en/watch/${video.id}?${params}`)
	}

	/* ── Drag & drop reorder ── */
	function handleDragStart(index: number) {
		dragIndexRef.current = index
	}

	function handleDragOver(index: number) {
		setDragOverIndex(index)
	}

	function handleDrop(dropIndex: number) {
		const fromIndex = dragIndexRef.current
		if (fromIndex === null || fromIndex === dropIndex) {
			dragIndexRef.current = null
			setDragOverIndex(null)
			return
		}
		const reordered = [...videos]
		const [moved] = reordered.splice(fromIndex, 1)
		reordered.splice(dropIndex, 0, moved)
		setVideos(reordered)
		dragIndexRef.current = null
		setDragOverIndex(null)

		setSavingOrder(true)
		fetch(`/api/playlists/${id}/videos`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ordered_video_ids: reordered.map(v => v.id) }),
		})
			.then(r => r.json())
			.then(data => {
				if (!data.ok) throw new Error()
			})
			.catch(() => showToast('Failed to save order.', 'error'))
			.finally(() => setSavingOrder(false))
	}

	/* ── Remove video ── */
	async function handleRemove(videoId: string) {
		setRemovingId(videoId)
		try {
			const res = await fetch(`/api/playlists/${id}/videos`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ video_id: videoId }),
			})
			if (!res.ok) throw new Error()
			setVideos(prev => prev.filter(v => v.id !== videoId))
			setPlaylist(prev =>
				prev ? { ...prev, video_count: prev.video_count - 1 } : prev,
			)
			showToast('Video removed from playlist.')
		} catch {
			showToast('Failed to remove video.', 'error')
		} finally {
			setRemovingId(null)
		}
	}

	/* ── Loading / error states ── */
	if (loading)
		return (
			<UserLayout>
				<style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
				<div
					style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}
				>
					<div
						style={{
							width: 32,
							height: 32,
							border: '2px solid #222',
							borderTopColor: '#e63946',
							borderRadius: '50%',
							animation: 'spin 0.7s linear infinite',
						}}
					/>
				</div>
			</UserLayout>
		)

	if (error || !playlist)
		return (
			<UserLayout>
				<div style={{ textAlign: 'center', paddingTop: 80 }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
					<p style={{ color: '#555', fontSize: 17, marginBottom: 16 }}>
						{error || 'Playlist not found'}
					</p>
					<Link
						href='/en/playlists'
						style={{
							color: '#e63946',
							fontSize: 14,
							fontWeight: 600,
							textDecoration: 'none',
						}}
					>
						← Back to Playlists
					</Link>
				</div>
			</UserLayout>
		)

	const ownerName = playlist.display_name || playlist.username
	const ownerColor = colorFromId(playlist.user_id)
	const coverThumb = videos[0]?.thumbnail_url ?? null
	const totalViews = videos.reduce((s, v) => s + v.views_count, 0)

	return (
		<UserLayout>
			<style>{`
				@keyframes spin { to { transform: rotate(360deg) } }
				@keyframes toastIn { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:translateY(0) } }
				@keyframes fadeUp { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
			`}</style>

			{toast && <Toast msg={toast.msg} type={toast.type} />}
			<div
				style={{
					display: 'flex',
					gap: 32,
					alignItems: 'flex-start',
					flexWrap: 'wrap',
					animation: 'fadeUp 0.25s ease both',
				}}
			>
				{/* ── Left: playlist info panel ── */}
				<div
					style={{
						width: 280,
						flexShrink: 0,
						position: 'sticky',
						top: 76,
					}}
				>
					{/* Cover */}
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
								alt={playlist.title}
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
									fill='none'
									stroke='#2a2a2a'
									strokeWidth='1.5'
								>
									<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
								</svg>
							</div>
						)}
					</div>

					{/* Title & meta */}
					<h1
						style={{
							fontSize: 20,
							fontWeight: 800,
							color: '#fff',
							margin: '0 0 8px',
							lineHeight: 1.3,
						}}
					>
						{playlist.title}
					</h1>

					{/* Owner */}
					<Link
						href={`/en/channel/${playlist.user_id}`}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							textDecoration: 'none',
							marginBottom: 12,
						}}
					>
						{playlist.avatar_url ? (
							<img
								src={playlist.avatar_url}
								alt={ownerName}
								style={{
									width: 22,
									height: 22,
									borderRadius: '50%',
									objectFit: 'cover',
								}}
							/>
						) : (
							<div
								style={{
									width: 22,
									height: 22,
									borderRadius: '50%',
									background: ownerColor,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 9,
									fontWeight: 700,
									color: '#fff',
								}}
							>
								{ownerName.slice(0, 2).toUpperCase()}
							</div>
						)}
						<span style={{ fontSize: 13, color: '#888' }}>{ownerName}</span>
					</Link>

					{/* Stats row */}
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
								String(playlist.video_count),
								playlist.video_count === 1 ? 'video' : 'videos',
							],
							[fmt(totalViews), 'views'],
							[
								playlist.visibility === 'private' ? '🔒 Private' : '🌐 Public',
								'',
							],
						].map(([val, label]) => (
							<div key={val}>
								<span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
									{val}
								</span>
								{label && (
									<span style={{ fontSize: 12, color: '#666' }}> {label}</span>
								)}
							</div>
						))}
					</div>

					{playlist.description && (
						<p
							style={{
								fontSize: 13,
								color: '#777',
								lineHeight: 1.6,
								margin: '0 0 16px',
							}}
						>
							{playlist.description}
						</p>
					)}

					<p style={{ fontSize: 11, color: '#444', margin: '0 0 20px' }}>
						Updated {timeAgo(playlist.updated_at)}
					</p>

					{/* Play All — uses queue */}
					{videos.length > 0 && (
						<button
							onClick={() => playAt(0)}
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
								textDecoration: 'none',
								transition: 'background 0.15s',
								marginBottom: 10,
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
					)}

					{isOwner && (
						<button
							onClick={() => router.push('/en/playlists')}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
								padding: '10px 20px',
								borderRadius: 24,
								width: '100%',
								background: 'transparent',
								border: '1px solid #2a2a2a',
								color: '#888',
								fontSize: 13,
								fontWeight: 600,
								cursor: 'pointer',
								fontFamily: 'inherit',
								transition: 'all 0.15s',
								boxSizing: 'border-box',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.borderColor = '#444'
								e.currentTarget.style.color = '#ccc'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.borderColor = '#2a2a2a'
								e.currentTarget.style.color = '#888'
							}}
						>
							← Back to Playlists
						</button>
					)}

					{isOwner && savingOrder && (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginTop: 14,
								color: '#666',
								fontSize: 12,
							}}
						>
							<Spinner size={12} /> Saving order…
						</div>
					)}
				</div>

				{/* ── Right: video list ── */}
				<div style={{ flex: 1, minWidth: 0 }}>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: 16,
							gap: 12,
						}}
					>
						<h2
							style={{
								fontSize: 16,
								fontWeight: 700,
								color: '#fff',
								margin: 0,
							}}
						>
							{playlist.video_count}{' '}
							{playlist.video_count === 1 ? 'Video' : 'Videos'}
						</h2>
						{isOwner && videos.length > 1 && (
							<p style={{ fontSize: 11, color: '#444', margin: 0 }}>
								Drag rows to reorder
							</p>
						)}
					</div>

					{videos.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: '60px 20px',
								border: '1px dashed #222',
								borderRadius: 14,
							}}
						>
							<div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
							<p style={{ fontSize: 15, color: '#555', marginBottom: 6 }}>
								This playlist is empty
							</p>
							{isOwner && (
								<p style={{ fontSize: 13, color: '#444' }}>
									Add videos from the watch page using &ldquo;Add to
									Playlist&rdquo;.
								</p>
							)}
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{videos.map((video, index) => (
								<VideoRow
									key={video.id}
									video={video}
									index={index}
									isOwner={isOwner}
									dragging={
										dragOverIndex === index && dragIndexRef.current !== index
									}
									onDragStart={() => handleDragStart(index)}
									onDragOver={() => handleDragOver(index)}
									onDrop={() => handleDrop(index)}
									onRemove={() => handleRemove(video.id)}
									removing={removingId === video.id}
									onPlay={() => playAt(index)}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</UserLayout>
	)
}
