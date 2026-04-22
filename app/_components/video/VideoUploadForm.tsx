'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
	if (!authRes.ok) throw new Error(`Auth failed: ${await authRes.text()}`)
	const { token, expire, signature } = await authRes.json()
	const form = new FormData()
	form.append('file', file)
	form.append('fileName', `${Date.now()}-${file.name}`)
	form.append('folder', folder)
	form.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!)
	form.append('signature', signature)
	form.append('expire', String(expire))
	form.append('token', token)
	const uploadRes = await fetch(
		`${process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_ENDPOINT!}/api/v1/files/upload`,
		{ method: 'POST', body: form },
	)
	if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`)
	return (await uploadRes.json()).url
}

async function uploadVideoToR2(file: File): Promise<string> {
	const res = await fetch('/api/r2-upload-url', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ filename: file.name, contentType: file.type }),
	})
	if (!res.ok) throw new Error('Failed to get upload URL')
	const { data } = await res.json()
	const uploadRes = await fetch(data.uploadUrl, {
		method: 'PUT',
		body: file,
		headers: { 'Content-Type': file.type },
	})
	if (!uploadRes.ok) throw new Error('Upload to R2 failed')
	return data.publicUrl
}

/**
 * Extracts a frame from a video File at `seekTo` seconds (default 1s),
 * returns it as a PNG File ready for upload.
 */
function extractVideoFrame(videoFile: File, seekTo = 1): Promise<File> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video')
		video.preload = 'metadata'
		video.muted = true
		video.playsInline = true

		const objectUrl = URL.createObjectURL(videoFile)
		video.src = objectUrl

		video.addEventListener('loadedmetadata', () => {
			// Clamp seek to within the video duration
			const target = Math.min(
				seekTo,
				video.duration * 0.25,
				video.duration - 0.1,
			)
			video.currentTime = Math.max(0, target)
		})

		video.addEventListener('seeked', () => {
			const canvas = document.createElement('canvas')
			canvas.width = video.videoWidth || 1280
			canvas.height = video.videoHeight || 720
			const ctx = canvas.getContext('2d')
			if (!ctx) {
				URL.revokeObjectURL(objectUrl)
				reject(new Error('Canvas context unavailable'))
				return
			}
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
			URL.revokeObjectURL(objectUrl)
			canvas.toBlob(blob => {
				if (!blob) {
					reject(new Error('Failed to extract frame'))
					return
				}
				resolve(new File([blob], 'auto-thumbnail.png', { type: 'image/png' }))
			}, 'image/png')
		})

		video.addEventListener('error', () => {
			URL.revokeObjectURL(objectUrl)
			reject(new Error('Video load error'))
		})
	})
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
	const [category, setCategory] = useState<string | null>(null)
	const [videoType, setVideoType] = useState<'normal' | 'shorts'>('normal')
	const [videoFile, setVideoFile] = useState<File | null>(null)
	const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
	const [thumbnailPreview, setThumbnailPreview] = useState('')
	const [autoThumbnail, setAutoThumbnail] = useState(false)
	const [generatingThumb, setGeneratingThumb] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState(0)
	const [progressLabel, setProgressLabel] = useState('')
	const [error, setError] = useState('')
	const [dragOver, setDragOver] = useState(false)

	const videoRef = useRef<HTMLInputElement>(null)
	const thumbRef = useRef<HTMLInputElement>(null)

	// Auto-generate thumbnail whenever a video is selected and no manual thumb exists
	useEffect(() => {
		if (!videoFile || thumbnailFile) return
		let cancelled = false

		setGeneratingThumb(true)
		extractVideoFrame(videoFile)
			.then(frameFile => {
				if (cancelled) return
				setThumbnailFile(frameFile)
				setThumbnailPreview(URL.createObjectURL(frameFile))
				setAutoThumbnail(true)
			})
			.catch(() => {
				// Silently fail — user can still add manually
			})
			.finally(() => {
				if (!cancelled) setGeneratingThumb(false)
			})

		return () => {
			cancelled = true
		}
	}, [videoFile]) // eslint-disable-line react-hooks/exhaustive-deps

	const handleVideoDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setDragOver(false)
		const file = e.dataTransfer.files[0]
		if (file && file.type.startsWith('video/')) {
			setVideoFile(file)
			// Reset thumb so auto-gen triggers
			setThumbnailFile(null)
			setThumbnailPreview('')
			setAutoThumbnail(false)
		}
	}, [])

	const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setThumbnailFile(file)
		setThumbnailPreview(URL.createObjectURL(file))
		setAutoThumbnail(false)
	}

	const handleVideoFileChange = (file: File) => {
		setVideoFile(file)
		// Reset thumb so auto-gen triggers fresh
		setThumbnailFile(null)
		setThumbnailPreview('')
		setAutoThumbnail(false)
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
			const video_url = await uploadVideoToR2(videoFile)
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
					category: category ?? null,
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
												setThumbnailFile(null)
												setThumbnailPreview('')
												setAutoThumbnail(false)
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
							e.target.files?.[0] && handleVideoFileChange(e.target.files[0])
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
						<label style={labelStyle}>Category</label>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
							<button
								type='button'
								onClick={() => setCategory(null)}
								disabled={uploading}
								style={{
									padding: '8px 14px',
									borderRadius: 20,
									border: `1px solid ${category === null ? '#666' : '#222'}`,
									background:
										category === null
											? 'rgba(255,255,255,0.07)'
											: 'transparent',
									color: category === null ? '#ccc' : '#888',
									fontSize: 13,
									cursor: uploading ? 'not-allowed' : 'pointer',
									fontFamily: 'inherit',
									transition: 'all 0.15s',
								}}
							>
								🌐 No category
							</button>
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
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								marginBottom: 8,
							}}
						>
							<label style={{ ...labelStyle, margin: 0 }}>Thumbnail</label>
							{generatingThumb && (
								<span
									style={{
										fontSize: 11,
										color: '#2a9d8f',
										display: 'flex',
										alignItems: 'center',
										gap: 5,
									}}
								>
									<span
										style={{
											width: 10,
											height: 10,
											border: '1.5px solid rgba(42,157,143,0.3)',
											borderTopColor: '#2a9d8f',
											borderRadius: '50%',
											display: 'inline-block',
											animation: 'spin 0.7s linear infinite',
										}}
									/>
									Generating…
								</span>
							)}
							{autoThumbnail && !generatingThumb && (
								<span
									style={{
										fontSize: 11,
										color: '#2a9d8f',
										background: 'rgba(42,157,143,0.1)',
										border: '1px solid rgba(42,157,143,0.25)',
										padding: '2px 8px',
										borderRadius: 10,
									}}
								>
									✓ Auto-generated
								</span>
							)}
						</div>

						<div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
							{/* Preview box */}
							<div
								onClick={() => !uploading && thumbRef.current?.click()}
								style={{
									position: 'relative',
									width: 160,
									height: 90,
									borderRadius: 8,
									overflow: 'hidden',
									border: thumbnailPreview
										? `2px solid ${autoThumbnail ? 'rgba(42,157,143,0.4)' : '#333'}`
										: '2px dashed #2a2a2a',
									background: thumbnailPreview ? 'transparent' : '#0d0d0d',
									flexShrink: 0,
									cursor: uploading ? 'not-allowed' : 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'border-color 0.2s',
								}}
								onMouseEnter={e => {
									if (!uploading) e.currentTarget.style.borderColor = '#e63946'
								}}
								onMouseLeave={e => {
									e.currentTarget.style.borderColor = thumbnailPreview
										? autoThumbnail
											? 'rgba(42,157,143,0.4)'
											: '#333'
										: '#2a2a2a'
								}}
							>
								{thumbnailPreview ? (
									<>
										<img
											src={thumbnailPreview}
											alt='thumbnail preview'
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
										{/* Hover overlay */}
										<div
											style={{
												position: 'absolute',
												inset: 0,
												background: 'rgba(0,0,0,0)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												transition: 'background 0.15s',
											}}
											onMouseEnter={e =>
												(e.currentTarget.style.background = 'rgba(0,0,0,0.5)')
											}
											onMouseLeave={e =>
												(e.currentTarget.style.background = 'rgba(0,0,0,0)')
											}
										>
											<span
												style={{
													fontSize: 11,
													color: '#fff',
													fontWeight: 600,
													opacity: 0,
													transition: 'opacity 0.15s',
													pointerEvents: 'none',
												}}
												className='thumb-change-label'
											>
												Change
											</span>
										</div>
									</>
								) : generatingThumb ? (
									<div style={{ textAlign: 'center', color: '#555' }}>
										<span
											style={{
												width: 20,
												height: 20,
												border: '2px solid #1e1e1e',
												borderTopColor: '#2a9d8f',
												borderRadius: '50%',
												display: 'block',
												margin: '0 auto 6px',
												animation: 'spin 0.7s linear infinite',
											}}
										/>
										<span style={{ fontSize: 10 }}>Generating…</span>
									</div>
								) : (
									<div style={{ textAlign: 'center', color: '#444' }}>
										<svg
											width='22'
											height='22'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='1.5'
											style={{ display: 'block', margin: '0 auto 4px' }}
										>
											<rect x='3' y='3' width='18' height='18' rx='2' />
											<circle cx='8.5' cy='8.5' r='1.5' />
											<path d='M21 15l-5-5L5 21' />
										</svg>
										<span style={{ fontSize: 10 }}>Add thumbnail</span>
									</div>
								)}
							</div>

							{/* Info + actions */}
							<div style={{ flex: 1 }}>
								<p
									style={{
										fontSize: 13,
										color: '#555',
										margin: '0 0 10px',
										lineHeight: 1.5,
									}}
								>
									{autoThumbnail
										? 'A frame was automatically extracted from your video. Click the preview to replace it.'
										: thumbnailPreview
											? 'Custom thumbnail selected. Click to replace.'
											: 'No thumbnail yet. One will be auto-generated when you select a video, or you can upload your own.'}
								</p>
								<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
									<button
										type='button'
										onClick={() => !uploading && thumbRef.current?.click()}
										disabled={uploading}
										style={{
											padding: '7px 14px',
											borderRadius: 8,
											border: '1px solid #2a2a2a',
											background: 'transparent',
											color: '#888',
											fontSize: 12,
											cursor: uploading ? 'not-allowed' : 'pointer',
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
										{thumbnailPreview ? '🖼 Replace' : '🖼 Upload'}
									</button>

									{/* Re-generate button — only shown when video is loaded */}
									{videoFile && !generatingThumb && (
										<button
											type='button'
											disabled={uploading}
											onClick={async () => {
												if (!videoFile) return
												setGeneratingThumb(true)
												try {
													const frameFile = await extractVideoFrame(videoFile)
													setThumbnailFile(frameFile)
													setThumbnailPreview(URL.createObjectURL(frameFile))
													setAutoThumbnail(true)
												} catch {
													// ignore
												} finally {
													setGeneratingThumb(false)
												}
											}}
											style={{
												padding: '7px 14px',
												borderRadius: 8,
												border: '1px solid #2a2a2a',
												background: 'transparent',
												color: '#888',
												fontSize: 12,
												cursor: uploading ? 'not-allowed' : 'pointer',
												fontFamily: 'inherit',
												transition: 'all 0.15s',
											}}
											onMouseEnter={e => {
												e.currentTarget.style.borderColor = '#2a9d8f'
												e.currentTarget.style.color = '#2a9d8f'
											}}
											onMouseLeave={e => {
												e.currentTarget.style.borderColor = '#2a2a2a'
												e.currentTarget.style.color = '#888'
											}}
										>
											↺ Re-generate
										</button>
									)}

									{thumbnailPreview && !uploading && (
										<button
											type='button'
											onClick={() => {
												setThumbnailFile(null)
												setThumbnailPreview('')
												setAutoThumbnail(false)
											}}
											style={{
												padding: '7px 14px',
												borderRadius: 8,
												border: '1px solid #2a2a2a',
												background: 'transparent',
												color: '#555',
												fontSize: 12,
												cursor: 'pointer',
												fontFamily: 'inherit',
												transition: 'all 0.15s',
											}}
											onMouseEnter={e => {
												e.currentTarget.style.borderColor = '#e63946'
												e.currentTarget.style.color = '#e63946'
											}}
											onMouseLeave={e => {
												e.currentTarget.style.borderColor = '#2a2a2a'
												e.currentTarget.style.color = '#555'
											}}
										>
											✕ Remove
										</button>
									)}
								</div>
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
	marginBottom: 0,
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
