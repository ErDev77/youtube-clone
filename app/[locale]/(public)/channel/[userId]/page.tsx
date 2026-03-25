'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import UserLayout from '@/app/_components/layout/UserLayout'

/* ─── Types ─── */
type User = {
	id: string
	email: string
	username: string
	display_name?: string
	bio?: string
	avatar_url?: string
	banner_url?: string
	created_at: string
}

type Video = {
	id: string
	title: string
	thumbnail_url?: string
	views_count: number
	created_at: string
	duration?: string
}

type Tab = 'videos' | 'about'

/* ─── Helpers ─── */
function formatViews(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const d = Math.floor(diff / 86400000)
	if (d < 1) return 'today'
	if (d < 7) return `${d}d ago`
	if (d < 30) return `${Math.floor(d / 7)}w ago`
	if (d < 365) return `${Math.floor(d / 30)}mo ago`
	return `${Math.floor(d / 365)}y ago`
}

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string): string {
	const date = new Date(iso)
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

function colorFromId(id: string): string {
	const colors = [
		'#e63946',
		'#2a9d8f',
		'#e76f51',
		'#457b9d',
		'#6a4c93',
		'#f4a261',
	]
	let hash = 0
	for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0
	return colors[Math.abs(hash) % colors.length]
}

/* ─── ImageKit upload helper ─── */
async function uploadToImageKit(file: File, folder: string): Promise<string> {
	const authRes = await fetch('/api/imagekit-auth')
	if (!authRes.ok) throw new Error('Auth failed')
	const { token, expire, signature } = await authRes.json()

	const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? ''
	const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? ''

	const form = new FormData()
	form.append('file', file)
	form.append('fileName', `${Date.now()}-${file.name}`)
	form.append('folder', folder)
	form.append('publicKey', publicKey)
	form.append('signature', signature)
	form.append('expire', String(expire))
	form.append('token', token)

	const uploadRes = await fetch(`${urlEndpoint}/api/v1/files/upload`, {
		method: 'POST',
		body: form,
	})
	if (!uploadRes.ok) throw new Error('Upload failed')
	const data = await uploadRes.json()
	return data.url as string
}

/* ─── VideoCard ─── */
function VideoCard({ video }: { video: Video }) {
	const [hovered, setHovered] = useState(false)
	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ cursor: 'pointer' }}
		>
			<div
				style={{
					position: 'relative',
					width: '100%',
					paddingBottom: '56.25%',
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
							transform: hovered ? 'scale(1.05)' : 'scale(1)',
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
						<svg width='36' height='36' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}
				{video.duration && (
					<span
						style={{
							position: 'absolute',
							bottom: 6,
							right: 6,
							background: 'rgba(0,0,0,0.85)',
							color: '#fff',
							fontSize: 11,
							fontWeight: 700,
							padding: '2px 6px',
							borderRadius: 4,
						}}
					>
						{video.duration}
					</span>
				)}
			</div>
			<div style={{ marginTop: 10 }}>
				<p
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: '#fff',
						lineHeight: 1.4,
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						marginBottom: 4,
					}}
				>
					{video.title}
				</p>
				<p style={{ fontSize: 12, color: '#888' }}>
					{formatViews(video.views_count)} views · {timeAgo(video.created_at)}
				</p>
			</div>
		</div>
	)
}

/* ─── VideoGrid ─── */
function VideoGrid({ videos, isOwner }: { videos: Video[]; isOwner: boolean }) {
	if (videos.length === 0) {
		return (
			<div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
				<svg
					width='56'
					height='56'
					viewBox='0 0 24 24'
					fill='none'
					stroke='#333'
					strokeWidth='1.5'
					style={{ margin: '0 auto 16px', display: 'block' }}
				>
					<rect x='2' y='3' width='20' height='14' rx='2' />
					<path d='M8 21h8M12 17v4' />
				</svg>
				<p style={{ fontSize: 15, color: '#666', marginBottom: 6 }}>
					No videos yet
				</p>
				{isOwner && (
					<p style={{ fontSize: 13, color: '#444' }}>
						Upload your first video to get started
					</p>
				)}
			</div>
		)
	}
	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
				gap: 20,
			}}
		>
			{videos.map(v => (
				<VideoCard key={v.id} video={v} />
			))}
		</div>
	)
}

/* ─── EditModal ─── */
function EditModal({
	user,
	onClose,
	onSave,
}: {
	user: User
	onClose: () => void
	onSave: (updated: Partial<User>) => void
}) {
	const [displayName, setDisplayName] = useState(
		user.display_name || user.username,
	)
	const [bio, setBio] = useState(user.bio || '')
	const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || '')
	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [bannerPreview, setBannerPreview] = useState(user.banner_url || '')
	const [bannerFile, setBannerFile] = useState<File | null>(null)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const avatarRef = useRef<HTMLInputElement>(null)
	const bannerRef = useRef<HTMLInputElement>(null)

	function handleImageSelect(
		e: React.ChangeEvent<HTMLInputElement>,
		type: 'avatar' | 'banner',
	) {
		const file = e.target.files?.[0]
		if (!file) return
		const url = URL.createObjectURL(file)
		if (type === 'avatar') {
			setAvatarFile(file)
			setAvatarPreview(url)
		} else {
			setBannerFile(file)
			setBannerPreview(url)
		}
	}

	async function handleSave() {
		setSaving(true)
		setError('')
		try {
			let finalAvatarUrl = user.avatar_url
			let finalBannerUrl = user.banner_url
			if (avatarFile)
				finalAvatarUrl = await uploadToImageKit(avatarFile, '/avatars')
			if (bannerFile)
				finalBannerUrl = await uploadToImageKit(bannerFile, '/banners')

			const updates: Partial<User> = {
				display_name: displayName,
				bio,
				avatar_url: finalAvatarUrl,
				banner_url: finalBannerUrl,
			}
			const res = await fetch('/api/me/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
			})
			if (!res.ok) throw new Error('Failed to save profile')
			onSave(updates)
			onClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setSaving(false)
		}
	}

	const fieldStyle: React.CSSProperties = {
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

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				background: 'rgba(0,0,0,0.8)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
			}}
			onClick={e => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 520,
					background: '#111',
					borderRadius: 16,
					border: '1px solid #222',
					overflow: 'hidden',
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
					}}
				>
					<h2
						style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}
					>
						Edit Profile
					</h2>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#666',
							display: 'flex',
							padding: 4,
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

				<div style={{ padding: 24 }}>
					{/* Banner */}
					<div style={{ marginBottom: 24 }}>
						<label
							style={{
								fontSize: 12,
								fontWeight: 600,
								color: '#888',
								letterSpacing: '0.5px',
								textTransform: 'uppercase',
								marginBottom: 8,
								display: 'block',
							}}
						>
							Channel Banner
						</label>
						<div
							onClick={() => bannerRef.current?.click()}
							style={{
								position: 'relative',
								width: '100%',
								height: 100,
								borderRadius: 10,
								overflow: 'hidden',
								background: bannerPreview ? 'transparent' : '#1a1a1a',
								border: '2px dashed #2a2a2a',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{bannerPreview ? (
								<img
									src={bannerPreview}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										position: 'absolute',
										inset: 0,
									}}
									alt='banner'
								/>
							) : (
								<div style={{ textAlign: 'center', color: '#555' }}>
									<svg
										width='22'
										height='22'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='1.5'
										style={{ display: 'block', margin: '0 auto 6px' }}
									>
										<rect x='3' y='3' width='18' height='18' rx='2' />
										<circle cx='8.5' cy='8.5' r='1.5' />
										<path d='M21 15l-5-5L5 21' />
									</svg>
									<p style={{ fontSize: 12, margin: 0 }}>Upload banner</p>
								</div>
							)}
						</div>
						<input
							ref={bannerRef}
							type='file'
							accept='image/*'
							style={{ display: 'none' }}
							onChange={e => handleImageSelect(e, 'banner')}
						/>
					</div>

					{/* Avatar */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 16,
							marginBottom: 24,
						}}
					>
						<div
							onClick={() => avatarRef.current?.click()}
							style={{
								width: 76,
								height: 76,
								borderRadius: '50%',
								flexShrink: 0,
								background: avatarPreview
									? 'transparent'
									: colorFromId(user.id),
								border: '2px solid #2a2a2a',
								overflow: 'hidden',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 26,
								fontWeight: 700,
								color: '#fff',
								position: 'relative',
							}}
						>
							{avatarPreview ? (
								<img
									src={avatarPreview}
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									alt='avatar'
								/>
							) : (
								getInitials(user.display_name || user.username)
							)}
							<div
								style={{
									position: 'absolute',
									inset: 0,
									background: 'rgba(0,0,0,0.5)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: '50%',
								}}
							>
								<svg
									width='18'
									height='18'
									viewBox='0 0 24 24'
									fill='none'
									stroke='#fff'
									strokeWidth='2'
								>
									<path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
									<circle cx='12' cy='13' r='4' />
								</svg>
							</div>
						</div>
						<div>
							<p
								style={{
									fontSize: 14,
									fontWeight: 600,
									color: '#fff',
									margin: '0 0 2px',
								}}
							>
								Profile Photo
							</p>
							<p style={{ fontSize: 12, color: '#555', margin: 0 }}>
								JPG, PNG · Click to upload
							</p>
						</div>
						<input
							ref={avatarRef}
							type='file'
							accept='image/*'
							style={{ display: 'none' }}
							onChange={e => handleImageSelect(e, 'avatar')}
						/>
					</div>

					{/* Display Name */}
					<div style={{ marginBottom: 16 }}>
						<label
							style={{
								fontSize: 12,
								fontWeight: 600,
								color: '#888',
								letterSpacing: '0.5px',
								textTransform: 'uppercase',
								marginBottom: 8,
								display: 'block',
							}}
						>
							Display Name
						</label>
						<input
							value={displayName}
							onChange={e => setDisplayName(e.target.value)}
							maxLength={50}
							style={fieldStyle}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
					</div>

					{/* Bio */}
					<div style={{ marginBottom: 24 }}>
						<label
							style={{
								fontSize: 12,
								fontWeight: 600,
								color: '#888',
								letterSpacing: '0.5px',
								textTransform: 'uppercase',
								marginBottom: 8,
								display: 'block',
							}}
						>
							Bio
						</label>
						<textarea
							value={bio}
							onChange={e => setBio(e.target.value)}
							maxLength={300}
							rows={3}
							style={{ ...fieldStyle, resize: 'none' }}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
						<p
							style={{
								textAlign: 'right',
								fontSize: 11,
								color: '#555',
								marginTop: 4,
							}}
						>
							{bio.length}/300
						</p>
					</div>

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

					<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
						<button
							onClick={onClose}
							style={{
								padding: '10px 20px',
								borderRadius: 10,
								border: '1px solid #2a2a2a',
								background: 'none',
								color: '#888',
								fontSize: 14,
								cursor: 'pointer',
							}}
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={saving}
							style={{
								padding: '10px 24px',
								borderRadius: 10,
								border: 'none',
								background: saving ? '#8a2530' : '#e63946',
								color: '#fff',
								fontSize: 14,
								fontWeight: 600,
								cursor: saving ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 8,
							}}
						>
							{saving && (
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
							{saving ? 'Saving…' : 'Save Changes'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

/* ─── Main Page ─── */
export default function ChannelPage() {
	const params = useParams<{ userId: string }>()
	const [user, setUser] = useState<User | null>(null)
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [videos, setVideos] = useState<Video[]>([])
	const [tab, setTab] = useState<Tab>('videos')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editOpen, setEditOpen] = useState(false)
	const [subscribed, setSubscribed] = useState(false)

	useEffect(() => {
		fetch('/api/me')
			.then(r => r.json())
			.then(d => {
				if (d.ok) setCurrentUser(d.data.user)
			})
			.catch(() => {})
	}, [])

	useEffect(() => {
		Promise.all([
			fetch(`/api/users/${params.userId}`).then(r => r.json()),
			fetch(`/api/users/${params.userId}/videos`)
				.then(r => r.json())
				.catch(() => ({ ok: false })),
		])
			.then(([userData, videoData]) => {
				if (userData.ok) setUser(userData.data.user)
				else setError(userData.error || 'User not found')
				if (videoData.ok && videoData.data?.items)
					setVideos(videoData.data.items)
			})
			.finally(() => setLoading(false))
	}, [params.userId])

	if (loading)
		return (
			<UserLayout>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						height: 300,
					}}
				>
					<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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

	if (error || !user)
		return (
			<UserLayout>
				<div style={{ textAlign: 'center', padding: '80px 20px' }}>
					<p style={{ fontSize: 18, color: '#555' }}>
						{error || 'User not found'}
					</p>
				</div>
			</UserLayout>
		)

	const isOwner = currentUser?.id === user.id
	const displayName = user.display_name?.trim() || user.username
	const avatarColor = colorFromId(user.id)

	return (
		<UserLayout>
			<style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

			{/* Banner */}
			<div
				style={{
					width: '100%',
					height: 200,
					borderRadius: 16,
					overflow: 'hidden',
					background: user.banner_url
						? 'transparent'
						: `linear-gradient(135deg, ${avatarColor}33 0%, #111 60%)`,
					position: 'relative',
					border: '1px solid #1a1a1a',
				}}
			>
				{user.banner_url && (
					<img
						src={user.banner_url}
						alt='banner'
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				)}
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						height: 80,
						background: 'linear-gradient(to top, #0f0f0f, transparent)',
					}}
				/>
			</div>

			{/* Profile row */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-end',
					gap: 20,
					padding: '0 4px',
					marginTop: -44,
					marginBottom: 28,
					position: 'relative',
					zIndex: 2,
					flexWrap: 'wrap',
					animation: 'fadeUp 0.4s ease both',
				}}
			>
				{/* Avatar */}
				<div
					style={{
						width: 88,
						height: 88,
						borderRadius: '50%',
						flexShrink: 0,
						background: user.avatar_url ? 'transparent' : avatarColor,
						border: '3px solid #0f0f0f',
						overflow: 'hidden',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 32,
						fontWeight: 800,
						color: '#fff',
						boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
					}}
				>
					{user.avatar_url ? (
						<img
							src={user.avatar_url}
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
							alt={displayName}
						/>
					) : (
						getInitials(displayName)
					)}
				</div>

				{/* Text */}
				<div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
					<h1
						style={{
							fontSize: 22,
							fontWeight: 800,
							color: '#fff',
							letterSpacing: '-0.3px',
							margin: '0 0 2px',
						}}
					>
						{displayName}
					</h1>
					<p style={{ fontSize: 13, color: '#555', margin: '0 0 6px' }}>
						@{user.username}
					</p>
					<p style={{ fontSize: 12, color: '#444', marginTop: 6 }}>
						{videos.length} {videos.length === 1 ? 'video' : 'videos'}
					</p>
				</div>

				{/* Buttons */}
				<div
					style={{ display: 'flex', gap: 8, paddingBottom: 4, flexShrink: 0 }}
				>
					{isOwner ? (
						<>
							<button
								onClick={() => setEditOpen(true)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									padding: '9px 16px',
									borderRadius: 24,
									border: '1px solid #2a2a2a',
									background: '#1a1a1a',
									color: '#ccc',
									fontSize: 13,
									fontWeight: 600,
									cursor: 'pointer',
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
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
								>
									<path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
									<path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
								</svg>
								Edit Profile
							</button>
							<button
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 6,
									padding: '9px 16px',
									borderRadius: 24,
									border: 'none',
									background: '#e63946',
									color: '#fff',
									fontSize: 13,
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
								>
									<line x1='12' y1='5' x2='12' y2='19' />
									<line x1='5' y1='12' x2='19' y2='12' />
								</svg>
								Upload
							</button>
						</>
					) : (
						<button
							onClick={() => setSubscribed(s => !s)}
							style={
								{
									padding: '10px 24px',
									borderRadius: 24,
									border: 'none',
									background: subscribed ? '#1a1a1a' : '#fff',
									color: subscribed ? '#ccc' : '#000',
									fontSize: 13,
									fontWeight: 700,
									cursor: 'pointer',
									border: subscribed ? '1px solid #333' : 'none',
								} as React.CSSProperties
							}
						>
							{subscribed ? 'Subscribed' : 'Subscribe'}
						</button>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid #1a1a1a',
					marginBottom: 28,
				}}
			>
				{(['videos', 'about'] as Tab[]).map(t => (
					<button
						key={t}
						onClick={() => setTab(t)}
						style={{
							padding: '12px 20px',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: tab === t ? '#fff' : '#555',
							fontSize: 13,
							fontWeight: tab === t ? 700 : 400,
							letterSpacing: '0.3px',
							borderBottom:
								tab === t ? '2px solid #e63946' : '2px solid transparent',
							textTransform: 'capitalize',
							transition: 'color 0.15s',
						}}
					>
						{t}
					</button>
				))}
			</div>

			{/* Content */}
			<div key={tab} style={{ animation: 'fadeUp 0.25s ease both' }}>
				{tab === 'videos' && <VideoGrid videos={videos} isOwner={isOwner} />}
				{tab === 'about' && (
					<div style={{ maxWidth: 560 }}>
						<div style={{ marginBottom: 32 }}>
							<h3
								style={{
									fontSize: 12,
									fontWeight: 700,
									color: '#555',
									letterSpacing: '1px',
									textTransform: 'uppercase',
									marginBottom: 14,
								}}
							>
								About
							</h3>
							<p
								style={{
									fontSize: 15,
									color: '#ccc',
									lineHeight: 1.7,
									margin: 0,
								}}
							>
								{user.bio || <span style={{ color: '#444' }}>No bio yet.</span>}
							</p>
						</div>
						<div>
							<h3
								style={{
									fontSize: 12,
									fontWeight: 700,
									color: '#555',
									letterSpacing: '1px',
									textTransform: 'uppercase',
									marginBottom: 14,
								}}
							>
								Details
							</h3>
							<div
								style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
							>
								{[
									['Videos', String(videos.length)],
									['Registration date', formatDate(user.created_at)],
								].map(([label, value]) => (
									<div
										key={label}
										style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}
									>
										<span
											style={{
												fontSize: 13,
												color: '#444',
												width: 80,
												flexShrink: 0,
											}}
										>
											{label}
										</span>
										<span style={{ fontSize: 14, color: '#ccc' }}>{value}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>

			{editOpen && (
				<EditModal
					user={user}
					onClose={() => setEditOpen(false)}
					onSave={updates =>
						setUser(prev => (prev ? { ...prev, ...updates } : prev))
					}
				/>
			)}
		</UserLayout>
	)
}
