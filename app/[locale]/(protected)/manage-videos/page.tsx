'use client'

import { useEffect, useState, useRef } from 'react'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

const CATEGORIES = ['music', 'streams', 'news', 'sport', 'videogames'] as const
const VIDEO_TYPES = ['normal', 'shorts'] as const

type Category = (typeof CATEGORIES)[number]
type VideoType = (typeof VIDEO_TYPES)[number]

type Video = {
	id: string
	title: string
	description: string | null
	thumbnail_url: string | null
	video_url: string
	category: Category | null
	video_type: VideoType
	views_count: number
	likes_count: number
	created_at: string
}

function timeAgo(iso: string) {
	const diff = Date.now() - new Date(iso).getTime()
	const d = Math.floor(diff / 86400000)
	if (d < 1) return 'today'
	if (d < 7) return `${d}d ago`
	if (d < 30) return `${Math.floor(d / 7)}w ago`
	if (d < 365) return `${Math.floor(d / 30)}mo ago`
	return `${Math.floor(d / 365)}y ago`
}

function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

async function uploadThumbnail(file: File): Promise<string> {
	const authRes = await fetch('/api/imagekit-auth')
	if (!authRes.ok) throw new Error('Auth failed')
	const { token, expire, signature } = await authRes.json()
	const form = new FormData()
	form.append('file', file)
	form.append('fileName', `${Date.now()}-${file.name}`)
	form.append('folder', '/thumbnails')
	form.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!)
	form.append('signature', signature)
	form.append('expire', String(expire))
	form.append('token', token)
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_ENDPOINT}/api/v1/files/upload`,
		{ method: 'POST', body: form },
	)
	if (!res.ok) throw new Error('Upload failed')
	return (await res.json()).url
}

function DeleteModal({
	video,
	onCancel,
	onConfirm,
	deleting,
}: {
	video: Video
	onCancel: () => void
	onConfirm: () => void
	deleting: boolean
}) {
	return (
		<div
			style={overlayStyle}
			onClick={e => e.target === e.currentTarget && onCancel()}
		>
			<div
				style={{
					background: '#111',
					border: '1px solid #2a2a2a',
					borderRadius: 16,
					width: '100%',
					maxWidth: 420,
					padding: 28,
					animation: 'slideUp 0.2s ease',
				}}
			>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: '50%',
						background: 'rgba(230,57,70,0.12)',
						border: '1px solid rgba(230,57,70,0.25)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 16,
					}}
				>
					<svg
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#e63946'
						strokeWidth='2'
					>
						<polyline points='3 6 5 6 21 6' />
						<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
						<path d='M10 11v6M14 11v6' />
						<path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
					</svg>
				</div>
				<h2
					style={{
						fontSize: 17,
						fontWeight: 700,
						color: '#fff',
						margin: '0 0 8px',
					}}
				>
					Delete video?
				</h2>
				<p
					style={{
						fontSize: 13,
						color: '#666',
						margin: '0 0 6px',
						lineHeight: 1.6,
					}}
				>
					You&apos;re about to permanently delete:
				</p>
				<p
					style={{
						fontSize: 13,
						fontWeight: 600,
						color: '#ccc',
						background: '#1a1a1a',
						borderRadius: 8,
						padding: '8px 12px',
						margin: '0 0 20px',
						lineHeight: 1.4,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{video.title}
				</p>
				<p style={{ fontSize: 12, color: '#555', margin: '0 0 24px' }}>
					This action cannot be undone. Views and stats will be lost
					permanently.
				</p>
				<div style={{ display: 'flex', gap: 10 }}>
					<button onClick={onCancel} disabled={deleting} style={cancelBtnStyle}>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={deleting}
						style={{
							...cancelBtnStyle,
							flex: 1,
							background: deleting ? '#5a1a1e' : '#e63946',
							border: 'none',
							color: '#fff',
							fontWeight: 600,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
						}}
					>
						{deleting && <Spinner />}
						{deleting ? 'Deleting…' : 'Yes, delete it'}
					</button>
				</div>
			</div>
		</div>
	)
}

function EditModal({
	video,
	onCancel,
	onSave,
}: {
	video: Video
	onCancel: () => void
	onSave: (updated: Video) => void
}) {
	const [title, setTitle] = useState(video.title)
	const [description, setDescription] = useState(video.description ?? '')
	const [category, setCategory] = useState<Category | null>(
		video.category ?? null,
	)
	const [videoType, setVideoType] = useState<VideoType>(
		video.video_type ?? 'normal',
	)
	const [thumbnailPreview, setThumbnailPreview] = useState(
		video.thumbnail_url ?? '',
	)
	const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const thumbRef = useRef<HTMLInputElement>(null)

	const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setThumbnailFile(file)
		setThumbnailPreview(URL.createObjectURL(file))
	}

	async function handleSave() {
		if (!title.trim()) return setError('Title is required.')
		setSaving(true)
		setError('')
		try {
			let thumbnail_url = video.thumbnail_url
			if (thumbnailFile) thumbnail_url = await uploadThumbnail(thumbnailFile)
			const trimmedDesc = description.trim()
			const res = await fetch(`/api/videos/${video.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: trimmedDesc === '' ? null : trimmedDesc,
					category: category ?? null,
					video_type: videoType,
					thumbnail_url: thumbnail_url ?? null,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed to save')
			onSave(data.data.video)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			style={overlayStyle}
			onClick={e => e.target === e.currentTarget && !saving && onCancel()}
		>
			<div
				style={{
					background: '#111',
					border: '1px solid #222',
					borderRadius: 16,
					width: '100%',
					maxWidth: 560,
					maxHeight: '90vh',
					overflowY: 'auto',
					animation: 'slideUp 0.2s ease',
				}}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '20px 24px',
						borderBottom: '1px solid #1e1e1e',
						position: 'sticky',
						top: 0,
						background: '#111',
						zIndex: 2,
					}}
				>
					<div>
						<h2
							style={{
								fontSize: 17,
								fontWeight: 700,
								color: '#fff',
								margin: 0,
							}}
						>
							Edit Video
						</h2>
						<p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>
							Update your video details
						</p>
					</div>
					<button onClick={onCancel} disabled={saving} style={iconBtnStyle}>
						<svg
							width='18'
							height='18'
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

				<div style={{ padding: 24 }}>
					{/* Thumbnail */}
					<div style={{ marginBottom: 20 }}>
						<label style={labelStyle}>Thumbnail</label>
						<div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
							<div
								onClick={() => !saving && thumbRef.current?.click()}
								style={{
									position: 'relative',
									width: 140,
									height: 80,
									flexShrink: 0,
									borderRadius: 10,
									overflow: 'hidden',
									background: thumbnailPreview ? 'transparent' : '#1a1a1a',
									border: '2px dashed #2a2a2a',
									cursor: saving ? 'not-allowed' : 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
								onMouseEnter={e => {
									const o = e.currentTarget.querySelector(
										'.thumb-overlay',
									) as HTMLElement
									if (o) o.style.opacity = '1'
								}}
								onMouseLeave={e => {
									const o = e.currentTarget.querySelector(
										'.thumb-overlay',
									) as HTMLElement
									if (o) o.style.opacity = '0'
								}}
							>
								{thumbnailPreview ? (
									<img
										src={thumbnailPreview}
										alt=''
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
										}}
									/>
								) : (
									<svg
										width='22'
										height='22'
										viewBox='0 0 24 24'
										fill='none'
										stroke='#444'
										strokeWidth='1.5'
									>
										<rect x='3' y='3' width='18' height='18' rx='2' />
										<circle cx='8.5' cy='8.5' r='1.5' />
										<path d='M21 15l-5-5L5 21' />
									</svg>
								)}
								<div
									className='thumb-overlay'
									style={{
										position: 'absolute',
										inset: 0,
										background: 'rgba(0,0,0,0.55)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										opacity: 0,
										transition: 'opacity 0.15s',
									}}
								>
									<svg
										width='20'
										height='20'
										viewBox='0 0 24 24'
										fill='none'
										stroke='#fff'
										strokeWidth='2'
									>
										<path d='M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z' />
										<circle cx='12' cy='13' r='4' />
									</svg>
								</div>
							</div>
							<div style={{ flex: 1 }}>
								<p
									style={{
										fontSize: 13,
										color: '#666',
										margin: '0 0 8px',
										lineHeight: 1.5,
									}}
								>
									Click the thumbnail to replace it. JPG or PNG recommended.
								</p>
								{thumbnailFile && (
									<p style={{ fontSize: 12, color: '#2a9d8f', margin: 0 }}>
										✓ New thumbnail selected
									</p>
								)}
							</div>
						</div>
						<input
							ref={thumbRef}
							type='file'
							accept='image/*'
							style={{ display: 'none' }}
							onChange={handleThumbChange}
						/>
					</div>

					{/* Title */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>
							Title <span style={{ color: '#e63946' }}>*</span>
						</label>
						<input
							value={title}
							onChange={e => setTitle(e.target.value)}
							maxLength={100}
							disabled={saving}
							style={inputStyle}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
						<p style={charStyle}>{title.length}/100</p>
					</div>

					{/* Description */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>Description</label>
						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							maxLength={500}
							rows={3}
							placeholder='Add a description…'
							disabled={saving}
							style={{ ...inputStyle, resize: 'none' }}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
						<p style={charStyle}>{description.length}/500</p>
					</div>

					{/* Video Type */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>Video Type</label>
						<div style={{ display: 'flex', gap: 10 }}>
							{VIDEO_TYPES.map(t => (
								<button
									key={t}
									type='button'
									onClick={() => setVideoType(t)}
									disabled={saving}
									style={{
										flex: 1,
										padding: '9px 14px',
										borderRadius: 10,
										border: `2px solid ${videoType === t ? '#e63946' : '#222'}`,
										background:
											videoType === t ? 'rgba(230,57,70,0.1)' : 'transparent',
										color: videoType === t ? '#e63946' : '#666',
										fontSize: 13,
										fontWeight: videoType === t ? 600 : 400,
										cursor: saving ? 'not-allowed' : 'pointer',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
									}}
								>
									{t === 'normal' ? '🎬 Normal' : '📱 Shorts'}
								</button>
							))}
						</div>
					</div>

					{/* Category — optional */}
					<div style={{ marginBottom: 24 }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginBottom: 8,
							}}
						>
							<label style={{ ...labelStyle, margin: 0 }}>Category</label>
							<span
								style={{
									fontSize: 11,
									color: '#444',
									fontWeight: 400,
									textTransform: 'none',
									letterSpacing: 0,
								}}
							>
								optional
							</span>
						</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
							<button
								type='button'
								onClick={() => setCategory(null)}
								disabled={saving}
								style={{
									padding: '7px 14px',
									borderRadius: 20,
									border: `1px solid ${category === null ? '#666' : '#222'}`,
									background:
										category === null
											? 'rgba(255,255,255,0.07)'
											: 'transparent',
									color: category === null ? '#ccc' : '#555',
									fontSize: 12,
									cursor: saving ? 'not-allowed' : 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
							>
								🌐 No category
							</button>
							{CATEGORIES.map(cat => (
								<button
									key={cat}
									type='button'
									onClick={() => setCategory(cat)}
									disabled={saving}
									style={{
										padding: '7px 14px',
										borderRadius: 20,
										border: `1px solid ${category === cat ? '#e63946' : '#222'}`,
										background:
											category === cat ? 'rgba(230,57,70,0.1)' : 'transparent',
										color: category === cat ? '#e63946' : '#666',
										fontSize: 12,
										cursor: saving ? 'not-allowed' : 'pointer',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
										textTransform: 'capitalize',
									}}
								>
									{cat}
								</button>
							))}
						</div>
					</div>

					{error && (
						<div
							style={{
								background: 'rgba(230,57,70,0.08)',
								border: '1px solid rgba(230,57,70,0.25)',
								borderRadius: 8,
								padding: '10px 14px',
								fontSize: 13,
								color: '#e63946',
								marginBottom: 16,
							}}
						>
							{error}
						</div>
					)}

					<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
						<button onClick={onCancel} disabled={saving} style={cancelBtnStyle}>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={saving || !title.trim()}
							style={{
								...cancelBtnStyle,
								background: saving || !title.trim() ? '#333' : '#e63946',
								border: 'none',
								color: '#fff',
								fontWeight: 600,
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								opacity: saving || !title.trim() ? 0.6 : 1,
								cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
							}}
						>
							{saving && <Spinner />}
							{saving ? 'Saving…' : 'Save Changes'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

function Spinner() {
	return (
		<span
			style={{
				width: 13,
				height: 13,
				border: '2px solid rgba(255,255,255,0.25)',
				borderTopColor: '#fff',
				borderRadius: '50%',
				display: 'inline-block',
				animation: 'spin 0.7s linear infinite',
				flexShrink: 0,
			}}
		/>
	)
}

export default function ManageVideosPage() {
	const { user } = useAuthContext()
	const [videos, setVideos] = useState<Video[]>([])
	const [loading, setLoading] = useState(true)
	const [editTarget, setEditTarget] = useState<Video | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Video | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [toast, setToast] = useState<{
		msg: string
		type: 'success' | 'error'
	} | null>(null)

	useEffect(() => {
		if (!user) return
		fetch(`/api/users/${user.id}/videos`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) setVideos(data.data.items)
			})
			.finally(() => setLoading(false))
	}, [user])

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 3000)
	}

	async function handleDelete() {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			const res = await fetch(`/api/videos/${deleteTarget.id}`, {
				method: 'DELETE',
			})
			if (!res.ok) throw new Error('Failed to delete')
			setVideos(prev => prev.filter(v => v.id !== deleteTarget.id))
			showToast('Video deleted successfully')
		} catch {
			showToast('Failed to delete video', 'error')
		} finally {
			setDeleting(false)
			setDeleteTarget(null)
		}
	}

	function handleSaved(updated: Video) {
		setVideos(prev => prev.map(v => (v.id === updated.id ? updated : v)))
		setEditTarget(null)
		showToast('Video updated successfully')
	}

	const categoryEmoji: Record<string, string> = {
		music: '🎵',
		streams: '🎮',
		news: '📰',
		sport: '⚽',
		videogames: '🕹️',
	}

	return (
		<UserLayout>
			<style>{`
				@keyframes spin { to { transform: rotate(360deg) } }
				@keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
				@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
				@keyframes toastIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
				.video-row:hover { background: #161616 !important; }
			`}</style>

			{toast && (
				<div
					style={{
						position: 'fixed',
						bottom: 28,
						right: 28,
						zIndex: 9999,
						background: toast.type === 'success' ? '#1a3a2a' : '#3a1a1e',
						border: `1px solid ${toast.type === 'success' ? '#2a9d6a' : '#e63946'}`,
						color: toast.type === 'success' ? '#57cc99' : '#e63946',
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
					{toast.type === 'success' ? '✓' : '✕'} {toast.msg}
				</div>
			)}

			<div style={{ marginBottom: 32 }}>
				<h1
					style={{
						fontSize: 24,
						fontWeight: 800,
						color: '#fff',
						margin: '0 0 4px',
						letterSpacing: '-0.4px',
					}}
				>
					Manage Videos
				</h1>
				<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
					{loading
						? '…'
						: `${videos.length} ${videos.length === 1 ? 'video' : 'videos'}`}
				</p>
			</div>

			{loading ? (
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
			) : videos.length === 0 ? (
				<div
					style={{
						textAlign: 'center',
						padding: '80px 20px',
						border: '1px dashed #222',
						borderRadius: 16,
					}}
				>
					<div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
					<p style={{ fontSize: 17, color: '#555', marginBottom: 6 }}>
						No videos yet
					</p>
					<p style={{ fontSize: 13, color: '#444' }}>
						Upload your first video using the Upload button in the header.
					</p>
				</div>
			) : (
				<div
					style={{
						border: '1px solid #1a1a1a',
						borderRadius: 14,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '2fr 100px 110px 70px 90px 80px',
							padding: '11px 20px',
							background: '#0f0f0f',
							borderBottom: '1px solid #1a1a1a',
						}}
					>
						{['Video', 'Type', 'Category', 'Views', 'Uploaded', 'Actions'].map(
							h => (
								<span
									key={h}
									style={{
										fontSize: 11,
										fontWeight: 700,
										color: '#444',
										letterSpacing: '1px',
										textTransform: 'uppercase',
									}}
								>
									{h}
								</span>
							),
						)}
					</div>
					{videos.map((video, i) => (
						<div
							key={video.id}
							className='video-row'
							style={{
								display: 'grid',
								gridTemplateColumns: '2fr 100px 110px 70px 90px 80px',
								padding: '14px 20px',
								alignItems: 'center',
								borderBottom:
									i < videos.length - 1 ? '1px solid #141414' : 'none',
								background: 'transparent',
								transition: 'background 0.15s',
							}}
						>
							{/* Video info */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									minWidth: 0,
									paddingRight: 16,
								}}
							>
								<div
									style={{
										width: 72,
										height: 42,
										flexShrink: 0,
										borderRadius: 6,
										overflow: 'hidden',
										background: '#1a1a1a',
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
								<div style={{ minWidth: 0 }}>
									<p
										style={{
											fontSize: 13,
											fontWeight: 600,
											color: '#fff',
											margin: '0 0 3px',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{video.title}
									</p>
									{video.description ? (
										<p
											style={{
												fontSize: 11,
												color: '#555',
												margin: 0,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{video.description}
										</p>
									) : (
										<p
											style={{
												fontSize: 11,
												color: '#333',
												margin: 0,
												fontStyle: 'italic',
											}}
										>
											No description
										</p>
									)}
								</div>
							</div>
							{/* Type badge */}
							<div>
								<span
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 4,
										fontSize: 11,
										fontWeight: 600,
										padding: '3px 8px',
										borderRadius: 6,
										background:
											video.video_type === 'shorts'
												? 'rgba(230,57,70,0.1)'
												: 'rgba(255,255,255,0.05)',
										color: video.video_type === 'shorts' ? '#e63946' : '#888',
										border: `1px solid ${video.video_type === 'shorts' ? 'rgba(230,57,70,0.2)' : '#222'}`,
									}}
								>
									{video.video_type === 'shorts' ? '📱 Shorts' : '🎬 Normal'}
								</span>
							</div>
							{/* Category */}
							<div>
								<span
									style={{
										fontSize: 12,
										color: '#777',
										textTransform: 'capitalize',
									}}
								>
									{video.category ? (
										`${categoryEmoji[video.category] ?? ''} ${video.category}`
									) : (
										<span style={{ color: '#444', fontStyle: 'italic' }}>
											No category
										</span>
									)}
								</span>
							</div>
							{/* Views */}
							<div>
								<span
									style={{
										fontSize: 13,
										color: '#888',
										fontVariantNumeric: 'tabular-nums',
									}}
								>
									{fmt(video.views_count)}
								</span>
							</div>
							{/* Date */}
							<div>
								<span style={{ fontSize: 12, color: '#555' }}>
									{timeAgo(video.created_at)}
								</span>
							</div>
							{/* Actions */}
							<div style={{ display: 'flex', gap: 6 }}>
								<button
									onClick={() => setEditTarget(video)}
									title='Edit video'
									style={actionBtnStyle}
									onMouseEnter={e => {
										e.currentTarget.style.borderColor = '#e63946'
										e.currentTarget.style.color = '#e63946'
									}}
									onMouseLeave={e => {
										e.currentTarget.style.borderColor = '#222'
										e.currentTarget.style.color = '#666'
									}}
								>
									<svg
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' />
										<path d='M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' />
									</svg>
								</button>
								<button
									onClick={() => setDeleteTarget(video)}
									title='Delete video'
									style={actionBtnStyle}
									onMouseEnter={e => {
										e.currentTarget.style.borderColor = '#e63946'
										e.currentTarget.style.color = '#e63946'
										e.currentTarget.style.background = 'rgba(230,57,70,0.08)'
									}}
									onMouseLeave={e => {
										e.currentTarget.style.borderColor = '#222'
										e.currentTarget.style.color = '#666'
										e.currentTarget.style.background = 'transparent'
									}}
								>
									<svg
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<polyline points='3 6 5 6 21 6' />
										<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
										<path d='M10 11v6M14 11v6' />
										<path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
									</svg>
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{editTarget && (
				<EditModal
					video={editTarget}
					onCancel={() => setEditTarget(null)}
					onSave={handleSaved}
				/>
			)}
			{deleteTarget && (
				<DeleteModal
					video={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
					deleting={deleting}
				/>
			)}
		</UserLayout>
	)
}

const overlayStyle: React.CSSProperties = {
	position: 'fixed',
	inset: 0,
	zIndex: 1000,
	background: 'rgba(0,0,0,0.8)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 20,
	backdropFilter: 'blur(4px)',
	animation: 'fadeIn 0.15s ease',
}
const labelStyle: React.CSSProperties = {
	display: 'block',
	fontSize: 11,
	fontWeight: 700,
	color: '#555',
	textTransform: 'uppercase',
	letterSpacing: '1px',
	marginBottom: 8,
}
const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '11px 14px',
	background: '#0d0d0d',
	border: '1px solid #222',
	borderRadius: 10,
	color: '#fff',
	fontSize: 14,
	outline: 'none',
	fontFamily: 'inherit',
	boxSizing: 'border-box',
	transition: 'border-color 0.15s',
}
const charStyle: React.CSSProperties = {
	textAlign: 'right',
	fontSize: 11,
	color: '#444',
	marginTop: 4,
}
const cancelBtnStyle: React.CSSProperties = {
	padding: '10px 20px',
	borderRadius: 10,
	border: '1px solid #2a2a2a',
	background: 'transparent',
	color: '#888',
	fontSize: 13,
	cursor: 'pointer',
	fontFamily: 'inherit',
	transition: 'all 0.15s',
}
const iconBtnStyle: React.CSSProperties = {
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	color: '#555',
	display: 'flex',
	padding: 4,
	borderRadius: 6,
	transition: 'color 0.15s',
}
const actionBtnStyle: React.CSSProperties = {
	width: 32,
	height: 32,
	borderRadius: 8,
	border: '1px solid #222',
	background: 'transparent',
	color: '#666',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'all 0.15s',
}
