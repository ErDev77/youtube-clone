'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuthContext } from '@/context/AuthContext'

const CATEGORIES = [
	{ value: 'music', label: '🎵 Music' },
	{ value: 'streams', label: '🎮 Streams' },
	{ value: 'news', label: '📰 News' },
	{ value: 'sport', label: '⚽ Sport' },
	{ value: 'videogames', label: '🕹️ Video Games' },
]

const VIDEO_TYPES = [
	{ value: 'normal', label: '🎬 Normal Video' },
	{ value: 'shorts', label: '📱 Shorts' },
]

async function uploadToImageKit(file: File, folder: string): Promise<string> {
	const authRes = await fetch('/api/imagekit-auth')

	if (!authRes.ok) {
		const text = await authRes.text()
		throw new Error(`Auth failed: ${text}`)
	}

	const { token, expire, signature } = await authRes.json()

	const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!
	const uploadEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_ENDPOINT!

	if (!uploadEndpoint) {
		throw new Error('Upload endpoint missing')
	}

	const form = new FormData()
	form.append('file', file)
	form.append('fileName', `${Date.now()}-${file.name}`)
	form.append('folder', folder)
	form.append('publicKey', publicKey)
	form.append('signature', signature)
	form.append('expire', String(expire))
	form.append('token', token)

	const uploadRes = await fetch(`${uploadEndpoint}/api/v1/files/upload`, {
		method: 'POST',
		body: form,
	})

	if (!uploadRes.ok) {
		const text = await uploadRes.text()
		throw new Error(`Upload failed: ${text}`)
	}

	const data = await uploadRes.json()
	return data.url
}

interface VideoUploadFormProps {
	onClose: () => void
	onSuccess?: () => void
}

export default function VideoUploadForm({
	onClose,
	onSuccess,
}: VideoUploadFormProps) {
	const { user } = useAuthContext()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState('music')
	const [videoType, setVideoType] = useState<'normal' | 'shorts'>('normal')
	const [videoFile, setVideoFile] = useState<File | null>(null)
	const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
	const [thumbnailPreview, setThumbnailPreview] = useState('')
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState(0)
	const [progressLabel, setProgressLabel] = useState('')
	const [error, setError] = useState('')
	const [dragOver, setDragOver] = useState(false)

	const videoRef = useRef<HTMLInputElement>(null)
	const thumbRef = useRef<HTMLInputElement>(null)

	const handleVideoDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setDragOver(false)
		const file = e.dataTransfer.files[0]
		if (file && file.type.startsWith('video/')) {
			setVideoFile(file)
		}
	}, [])

	const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setThumbnailFile(file)
		setThumbnailPreview(URL.createObjectURL(file))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!videoFile) return setError('Please select a video file.')
		if (!title.trim()) return setError('Please enter a title.')
		if (!user) return setError('You must be signed in.')

		setError('')
		setUploading(true)

		try {
			let thumbnail_url: string | undefined
			if (thumbnailFile) {
				setProgressLabel('Uploading thumbnail…')
				setProgress(10)
				thumbnail_url = await uploadToImageKit(thumbnailFile, '/thumbnails')
				setProgress(30)
			}

			setProgressLabel('Uploading video…')
			setProgress(thumbnailFile ? 35 : 10)
			const video_url = await uploadToImageKit(videoFile, '/videos')
			setProgress(85)

			setProgressLabel('Saving…')
			const res = await fetch('/api/videos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || undefined,
					thumbnail_url,
					video_url,
					category,
					video_type: videoType,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed to save video')

			setProgress(100)
			setProgressLabel('Done!')
			setTimeout(() => {
				onSuccess?.()
				onClose()
			}, 600)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Upload failed. Please try again.',
			)
			setUploading(false)
			setProgress(0)
			setProgressLabel('')
		}
	}

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				background: 'rgba(0,0,0,0.85)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
				backdropFilter: 'blur(4px)',
			}}
			onClick={e => e.target === e.currentTarget && !uploading && onClose()}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 600,
					background: '#111',
					borderRadius: 16,
					border: '1px solid #222',
					overflow: 'hidden',
					maxHeight: '90vh',
					overflowY: 'auto',
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
								fontSize: 18,
								fontWeight: 700,
								color: '#fff',
								margin: 0,
							}}
						>
							Upload Video
						</h2>
						<p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>
							Share your content with ArmTube
						</p>
					</div>
					<button
						onClick={onClose}
						disabled={uploading}
						style={{
							background: 'none',
							border: 'none',
							cursor: uploading ? 'not-allowed' : 'pointer',
							color: '#666',
							display: 'flex',
							padding: 4,
							opacity: uploading ? 0.4 : 1,
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

				<form onSubmit={handleSubmit} style={{ padding: 24 }}>
					{/* Video drop zone */}
					<div
						onDragOver={e => {
							e.preventDefault()
							setDragOver(true)
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleVideoDrop}
						onClick={() => !uploading && videoRef.current?.click()}
						style={{
							border: `2px dashed ${dragOver ? '#e63946' : videoFile ? '#2a9d8f' : '#2a2a2a'}`,
							borderRadius: 12,
							padding: 32,
							textAlign: 'center',
							cursor: uploading ? 'not-allowed' : 'pointer',
							marginBottom: 20,
							background: dragOver
								? 'rgba(230,57,70,0.05)'
								: videoFile
									? 'rgba(42,157,143,0.05)'
									: 'transparent',
							transition: 'all 0.2s',
						}}
					>
						{videoFile ? (
							<>
								<div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
								<p
									style={{
										fontSize: 14,
										fontWeight: 600,
										color: '#fff',
										marginBottom: 4,
									}}
								>
									{videoFile.name}
								</p>
								<p style={{ fontSize: 12, color: '#666' }}>
									{(videoFile.size / 1024 / 1024).toFixed(1)} MB
									{!uploading && (
										<span
											onClick={e => {
												e.stopPropagation()
												setVideoFile(null)
											}}
											style={{
												color: '#e63946',
												marginLeft: 8,
												cursor: 'pointer',
											}}
										>
											Remove
										</span>
									)}
								</p>
							</>
						) : (
							<>
								<div style={{ fontSize: 40, marginBottom: 12 }}>📹</div>
								<p
									style={{
										fontSize: 15,
										fontWeight: 600,
										color: '#fff',
										marginBottom: 6,
									}}
								>
									Drag & drop your video here
								</p>
								<p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
									or click to browse
								</p>
								<span
									style={{
										display: 'inline-block',
										padding: '8px 16px',
										borderRadius: 20,
										border: '1px solid #333',
										fontSize: 13,
										color: '#888',
									}}
								>
									Select file
								</span>
								<p style={{ fontSize: 11, color: '#444', marginTop: 10 }}>
									MP4, WebM, MOV supported
								</p>
							</>
						)}
					</div>
					<input
						ref={videoRef}
						type='file'
						accept='video/*'
						style={{ display: 'none' }}
						onChange={e =>
							e.target.files?.[0] && setVideoFile(e.target.files[0])
						}
					/>

					{/* Progress */}
					{uploading && (
						<div style={{ marginBottom: 20 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									marginBottom: 6,
								}}
							>
								<span style={{ fontSize: 13, color: '#888' }}>
									{progressLabel}
								</span>
								<span
									style={{ fontSize: 13, color: '#e63946', fontWeight: 600 }}
								>
									{progress}%
								</span>
							</div>
							<div
								style={{
									height: 4,
									background: '#1e1e1e',
									borderRadius: 2,
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										height: '100%',
										background: '#e63946',
										borderRadius: 2,
										width: `${progress}%`,
										transition: 'width 0.3s ease',
									}}
								/>
							</div>
						</div>
					)}

					{/* Title */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>
							Title <span style={{ color: '#e63946' }}>*</span>
						</label>
						<input
							value={title}
							onChange={e => setTitle(e.target.value)}
							maxLength={100}
							placeholder='Enter a descriptive title…'
							disabled={uploading}
							style={inputStyle}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
						<p style={charCountStyle}>{title.length}/100</p>
					</div>

					{/* Description */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>Description</label>
						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							maxLength={500}
							rows={3}
							placeholder='Tell viewers about your video…'
							disabled={uploading}
							style={{ ...inputStyle, resize: 'none' }}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
						<p style={charCountStyle}>{description.length}/500</p>
					</div>

					{/* Video Type */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>
							Video Type <span style={{ color: '#e63946' }}>*</span>
						</label>
						<div style={{ display: 'flex', gap: 10 }}>
							{VIDEO_TYPES.map(type => (
								<button
									key={type.value}
									type='button'
									onClick={() =>
										setVideoType(type.value as 'normal' | 'shorts')
									}
									disabled={uploading}
									style={{
										flex: 1,
										padding: '10px 14px',
										borderRadius: 10,
										border: `2px solid ${videoType === type.value ? '#e63946' : '#222'}`,
										background:
											videoType === type.value
												? 'rgba(230,57,70,0.1)'
												: 'transparent',
										color: videoType === type.value ? '#e63946' : '#888',
										fontSize: 13,
										fontWeight: videoType === type.value ? 600 : 400,
										cursor: uploading ? 'not-allowed' : 'pointer',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 6,
									}}
								>
									{type.label}
									{type.value === 'shorts' && (
										<span
											style={{
												fontSize: 10,
												background: 'rgba(230,57,70,0.2)',
												color: '#e63946',
												padding: '1px 6px',
												borderRadius: 8,
												fontWeight: 700,
											}}
										>
											≤60s
										</span>
									)}
								</button>
							))}
						</div>
						{videoType === 'shorts' && (
							<p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
								Shorts are vertical short-form videos, up to 60 seconds.
							</p>
						)}
					</div>

					{/* Category */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>
							Category <span style={{ color: '#e63946' }}>*</span>
						</label>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
							{CATEGORIES.map(cat => (
								<button
									key={cat.value}
									type='button'
									onClick={() => setCategory(cat.value)}
									disabled={uploading}
									style={{
										padding: '8px 14px',
										borderRadius: 20,
										border: `1px solid ${category === cat.value ? '#e63946' : '#222'}`,
										background:
											category === cat.value
												? 'rgba(230,57,70,0.1)'
												: 'transparent',
										color: category === cat.value ? '#e63946' : '#888',
										fontSize: 13,
										cursor: uploading ? 'not-allowed' : 'pointer',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
									}}
								>
									{cat.label}
								</button>
							))}
						</div>
					</div>

					{/* Thumbnail */}
					<div style={{ marginBottom: 24 }}>
						<label style={labelStyle}>Thumbnail</label>
						<div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
							{thumbnailPreview ? (
								<div style={{ position: 'relative', flexShrink: 0 }}>
									<img
										src={thumbnailPreview}
										alt='thumbnail preview'
										style={{
											width: 120,
											height: 68,
											objectFit: 'cover',
											borderRadius: 8,
											border: '1px solid #222',
										}}
									/>
									{!uploading && (
										<button
											type='button'
											onClick={() => {
												setThumbnailFile(null)
												setThumbnailPreview('')
											}}
											style={{
												position: 'absolute',
												top: -6,
												right: -6,
												width: 20,
												height: 20,
												borderRadius: '50%',
												background: '#e63946',
												border: 'none',
												cursor: 'pointer',
												color: '#fff',
												fontSize: 12,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											×
										</button>
									)}
								</div>
							) : (
								<div
									onClick={() => !uploading && thumbRef.current?.click()}
									style={{
										width: 120,
										height: 68,
										borderRadius: 8,
										border: '2px dashed #2a2a2a',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: uploading ? 'not-allowed' : 'pointer',
										flexShrink: 0,
									}}
								>
									<svg
										width='20'
										height='20'
										viewBox='0 0 24 24'
										fill='none'
										stroke='#444'
										strokeWidth='1.5'
										style={{ marginBottom: 4 }}
									>
										<rect x='3' y='3' width='18' height='18' rx='2' />
										<circle cx='8.5' cy='8.5' r='1.5' />
										<path d='M21 15l-5-5L5 21' />
									</svg>
									<span style={{ fontSize: 10, color: '#444' }}>
										Add thumbnail
									</span>
								</div>
							)}
							<div>
								<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
									A great thumbnail stands out and draws viewers&apos;
									attention.
								</p>
								<button
									type='button'
									onClick={() => !uploading && thumbRef.current?.click()}
									disabled={uploading}
									style={{
										marginTop: 8,
										padding: '7px 14px',
										borderRadius: 8,
										border: '1px solid #2a2a2a',
										background: 'transparent',
										color: '#888',
										fontSize: 12,
										cursor: uploading ? 'not-allowed' : 'pointer',
										fontFamily: 'inherit',
									}}
								>
									Choose file
								</button>
							</div>
						</div>
						<input
							ref={thumbRef}
							type='file'
							accept='image/*'
							style={{ display: 'none' }}
							onChange={handleThumbnailChange}
						/>
					</div>

					{/* Error */}
					{error && (
						<div
							style={{
								background: 'rgba(230,57,70,0.1)',
								border: '1px solid rgba(230,57,70,0.3)',
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

					{/* Actions */}
					<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
						<button
							type='button'
							onClick={onClose}
							disabled={uploading}
							style={{
								padding: '11px 20px',
								borderRadius: 10,
								border: '1px solid #2a2a2a',
								background: 'none',
								color: '#888',
								fontSize: 14,
								cursor: uploading ? 'not-allowed' : 'pointer',
								fontFamily: 'inherit',
								opacity: uploading ? 0.4 : 1,
							}}
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={uploading || !videoFile || !title.trim()}
							style={{
								padding: '11px 28px',
								borderRadius: 10,
								border: 'none',
								background:
									uploading || !videoFile || !title.trim()
										? '#4a1a1e'
										: '#e63946',
								color: '#fff',
								fontSize: 14,
								fontWeight: 600,
								cursor:
									uploading || !videoFile || !title.trim()
										? 'not-allowed'
										: 'pointer',
								fontFamily: 'inherit',
								display: 'flex',
								alignItems: 'center',
								gap: 8,
							}}
						>
							{uploading && (
								<span
									style={{
										width: 14,
										height: 14,
										border: '2px solid rgba(255,255,255,0.3)',
										borderTopColor: '#fff',
										borderRadius: '50%',
										display: 'inline-block',
										animation: 'spin 0.7s linear infinite',
									}}
								/>
							)}
							{uploading ? 'Uploading…' : 'Upload Video'}
						</button>
					</div>
				</form>
				<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
			</div>
		</div>
	)
}

const labelStyle: React.CSSProperties = {
	display: 'block',
	fontSize: 12,
	fontWeight: 600,
	color: '#888',
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '12px 14px',
	background: '#0d0d0d',
	border: '1px solid #222',
	borderRadius: 10,
	color: '#fff',
	fontSize: 14,
	outline: 'none',
	fontFamily: 'inherit',
	boxSizing: 'border-box',
}

const charCountStyle: React.CSSProperties = {
	textAlign: 'right',
	fontSize: 11,
	color: '#444',
	marginTop: 4,
}
