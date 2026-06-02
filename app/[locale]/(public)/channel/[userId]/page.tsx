'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'
import PlaylistPicker from '@/app/_components/video/PlaylistPicker'

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
	thumbnail_url?: string | null
	video_url: string
	views_count: number
	likes_count: number
	created_at: string
	duration?: string
	video_type: 'normal' | 'shorts'
	uploader?: { id: string; username: string; avatar_url?: string }
}

type Playlist = {
	id: string
	title: string
	description: string | null
	visibility: 'public' | 'private'
	video_count: number
	cover_thumbnail: string | null
	updated_at: string
}

type Tab = 'videos' | 'shorts' | 'playlists' | 'about'

/* ─── Helpers ─── */
function fmt(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function fmtViews(n: number): string {
	return fmt(n)
}

function timeAgo(iso: string): string {
	const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
	if (s < 60) return 'just now'
	if (s < 3600) return Math.floor(s / 60) + 'm ago'
	if (s < 86400) return Math.floor(s / 3600) + 'h ago'
	const d = Math.floor(s / 86400)
	if (d < 7) return d + 'd ago'
	if (d < 30) return Math.floor(d / 7) + 'w ago'
	if (d < 365) return Math.floor(d / 30) + 'mo ago'
	return Math.floor(d / 365) + 'y ago'
}

function getInitials(name: string): string {
	return name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-US', {
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

/* ─── KebabMenu ─── */
function KebabMenu({
	videoId,
	onClose,
	onAddToPlaylist,
}: {
	videoId: string
	onClose: () => void
	onAddToPlaylist: () => void
}) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const fn = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose()
		}
		document.addEventListener('mousedown', fn)
		return () => document.removeEventListener('mousedown', fn)
	}, [onClose])

	const actions = [
		{
			label: 'Save to Watch Later',
			icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
			onClick: async (e: React.MouseEvent) => {
				e.preventDefault()
				e.stopPropagation()
				await fetch('/api/me/watch-later', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ video_id: videoId }),
				}).catch(() => {})
				onClose()
			},
		},
		{
			label: 'Add to Playlist',
			icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
			onClick: (e: React.MouseEvent) => {
				e.preventDefault()
				e.stopPropagation()
				onAddToPlaylist()
				onClose()
			},
		},
		{
			label: 'Copy link',
			icon: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
			onClick: (e: React.MouseEvent) => {
				e.preventDefault()
				e.stopPropagation()
				navigator.clipboard
					?.writeText(`${window.location.origin}/en/watch/${videoId}`)
					.catch(() => {})
				onClose()
			},
		},
	]

	return (
		<div
			ref={ref}
			style={{
				position: 'absolute',
				top: '100%',
				right: 0,
				zIndex: 300,
				background: '#1c1c1c',
				border: '1px solid #2a2a2a',
				borderRadius: 10,
				minWidth: 186,
				overflow: 'hidden',
				boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
				animation: 'pop .12s ease',
			}}
		>
			{actions.map(a => (
				<button
					key={a.label}
					onClick={a.onClick}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						width: '100%',
						padding: '10px 14px',
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: '#ccc',
						fontSize: 13,
						fontFamily: 'inherit',
						textAlign: 'left',
						transition: 'background .1s',
					}}
					onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
					onMouseLeave={e => (e.currentTarget.style.background = 'none')}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='#555'>
						<path d={a.icon} />
					</svg>
					{a.label}
				</button>
			))}
		</div>
	)
}

/* ─── VideoCard ─── */
function VideoCard({ video, channelUser }: { video: Video; channelUser: User }) {
	const [hovered, setHovered] = useState(false)
	const [menu, setMenu] = useState(false)
	const [playlistOpen, setPlaylistOpen] = useState(false)
	const uploader = video.uploader ?? { id: channelUser.id, username: channelUser.display_name?.trim() || channelUser.username, avatar_url: channelUser.avatar_url }
	const color = colorFromId(uploader.id)
	const initials = uploader.username.slice(0, 2).toUpperCase()

	return (
		<>
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ position: 'relative' }}
		>
			<Link
				href={`/en/watch/${video.id}`}
				style={{ textDecoration: 'none', display: 'block' }}
			>
				<div
					style={{
						position: 'relative',
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
								transform: hovered ? 'scale(1.04)' : 'scale(1)',
								transition: 'transform .2s',
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
					{hovered && !menu && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: 'rgba(0,0,0,.28)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div
								style={{
									width: 44,
									height: 44,
									borderRadius: '50%',
									background: 'rgba(230,57,70,.9)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<svg width='18' height='18' viewBox='0 0 24 24' fill='#fff'>
									<path d='M8 5v14l11-7z' />
								</svg>
							</div>
						</div>
					)}
				</div>
			</Link>

			{/* Info row */}
			<div
				style={{
					display: 'flex',
					gap: 10,
					marginTop: 10,
					alignItems: 'flex-start',
				}}
			>
				<Link
					href={`/en/channel/${uploader.id}`}
					style={{ flexShrink: 0, textDecoration: 'none' }}
				>
					{uploader.avatar_url ? (
						<img
							src={uploader.avatar_url}
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								objectFit: 'cover',
							}}
							alt=''
						/>
					) : (
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: color,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 12,
								fontWeight: 700,
								color: '#fff',
							}}
						>
							{initials}
						</div>
					)}
				</Link>

				<div style={{ flex: 1, minWidth: 0 }}>
					<Link
						href={`/en/watch/${video.id}`}
						style={{ textDecoration: 'none' }}
					>
						<p
							style={{
								fontSize: 14,
								fontWeight: 600,
								color: '#fff',
								lineHeight: 1.4,
								margin: '0 0 2px',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{video.title}
						</p>
					</Link>
					<Link
						href={`/en/channel/${uploader.id}`}
						style={{ textDecoration: 'none' }}
					>
						<p style={{ fontSize: 13, color: '#999', margin: '0 0 1px' }}>
							{uploader.username}
						</p>
					</Link>
					<p style={{ fontSize: 13, color: '#666', margin: 0 }}>
						{fmtViews(video.views_count)} views · {timeAgo(video.created_at)}
					</p>
				</div>

				{/* Kebab */}
				<div style={{ position: 'relative', flexShrink: 0 }}>
					<button
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
							setMenu(v => !v)
						}}
						style={{
							width: 32,
							height: 32,
							borderRadius: '50%',
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#777',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							opacity: hovered || menu ? 1 : 0,
							transition: 'opacity .15s',
						}}
						onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
						onMouseLeave={e => (e.currentTarget.style.background = 'none')}
					>
						<svg
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='currentColor'
						>
							<circle cx='12' cy='5' r='2' />
							<circle cx='12' cy='12' r='2' />
							<circle cx='12' cy='19' r='2' />
						</svg>
					</button>
					{menu && (
						<KebabMenu videoId={video.id} onClose={() => setMenu(false)} onAddToPlaylist={() => setPlaylistOpen(true)} />
					)}
				</div>
			</div>
		</div>

		{playlistOpen && (
		<PlaylistPicker videoId={video.id} onClose={() => setPlaylistOpen(false)} />
		)}	
		</>
	)
}

/* ─── ShortsCard ─── */
function ShortsCard({ video }: { video: Video }) {
	const [hovered, setHovered] = useState(false)

	return (
		<Link
			href={`/en/watch/${video.id}`}
			style={{ textDecoration: 'none', display: 'block', minWidth: 0 }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div
				style={{
					position: 'relative',
					width: '100%',
					aspectRatio: '3 / 5',
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
							transition: 'transform .2s',
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
							background: 'rgba(0,0,0,.3)',
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
								background: 'rgba(230,57,70,.9)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<svg width='14' height='14' viewBox='0 0 24 24' fill='#fff'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					</div>
				)}

				<div
					style={{
						position: 'absolute',
						bottom: 6,
						left: 6,
						background: 'rgba(0,0,0,.72)',
						color: '#fff',
						fontSize: 10,
						fontWeight: 600,
						padding: '2px 6px',
						borderRadius: 5,
					}}
				>
					{fmtViews(video.views_count)} views
				</div>
			</div>

			<p
				style={{
					fontSize: 12,
					fontWeight: 600,
					color: hovered ? '#fff' : '#ddd',
					margin: '6px 0 1px',
					lineHeight: 1.35,
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
					transition: 'color .15s',
				}}
			>
				{video.title}
			</p>
			<p style={{ fontSize: 11, color: '#666', margin: 0 }}>
				{timeAgo(video.created_at)}
			</p>
		</Link>
	)
}

/* ─── PlaylistCard ─── */
function PlaylistCard({ playlist }: { playlist: Playlist }) {
	const [hovered, setHovered] = useState(false)
	return (
		<Link
			href={`/en/playlists/${playlist.id}`}
			style={{ textDecoration: 'none', display: 'block' }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div
				style={{
					position: 'relative',
					width: '100%',
					paddingBottom: '56.25%',
					borderRadius: 10,
					overflow: 'hidden',
					background: '#1a1a1a',
					marginBottom: 10,
				}}
			>
				{playlist.cover_thumbnail ? (
					<img
						src={playlist.cover_thumbnail}
						alt={playlist.title}
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
						<svg
							width='32'
							height='32'
							viewBox='0 0 24 24'
							fill='none'
							stroke='#2a2a2a'
							strokeWidth='1.5'
						>
							<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
						</svg>
					</div>
				)}
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						right: 0,
						background: 'rgba(0,0,0,0.8)',
						backdropFilter: 'blur(4px)',
						padding: '5px 10px',
						display: 'flex',
						alignItems: 'center',
						gap: 5,
					}}
				>
					<svg width='12' height='12' viewBox='0 0 24 24' fill='#fff'>
						<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
					</svg>
					<span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
						{playlist.video_count}{' '}
						{playlist.video_count === 1 ? 'video' : 'videos'}
					</span>
				</div>
				{playlist.visibility === 'private' && (
					<div
						style={{
							position: 'absolute',
							top: 8,
							left: 8,
							background: 'rgba(0,0,0,0.75)',
							borderRadius: 6,
							padding: '3px 8px',
							display: 'flex',
							alignItems: 'center',
							gap: 4,
						}}
					>
						<svg
							width='10'
							height='10'
							viewBox='0 0 24 24'
							fill='none'
							stroke='#aaa'
							strokeWidth='2'
						>
							<rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
							<path d='M7 11V7a5 5 0 0 1 10 0v4' />
						</svg>
						<span style={{ fontSize: 10, fontWeight: 600, color: '#aaa' }}>
							Private
						</span>
					</div>
				)}
			</div>
			<p
				style={{
					fontSize: 14,
					fontWeight: 600,
					color: hovered ? '#e63946' : '#fff',
					margin: '0 0 3px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					transition: 'color 0.15s',
				}}
			>
				{playlist.title}
			</p>
			{playlist.description && (
				<p
					style={{
						fontSize: 12,
						color: '#666',
						margin: '0 0 3px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{playlist.description}
				</p>
			)}
			<p style={{ fontSize: 11, color: '#555', margin: 0 }}>
				Updated {timeAgo(playlist.updated_at)}
			</p>
		</Link>
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
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
			>
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
							<span
								style={{
									marginLeft: 8,
									fontSize: 10,
									color: '#555',
									fontWeight: 400,
									textTransform: 'none',
									letterSpacing: 0,
								}}
							>
								Recommended: 1280×350px
							</span>
						</label>
						<div
							onClick={() => bannerRef.current?.click()}
							style={{
								position: 'relative',
								width: '100%',
								height: 140,
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
									<p style={{ fontSize: 10, margin: '4px 0 0', color: '#444' }}>
										JPG or PNG · Max quality at 1280×350
									</p>
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
	const { user: currentUser } = useAuthContext()
	const [user, setUser] = useState<User | null>(null)
	const [videos, setVideos] = useState<Video[]>([])
	const [playlists, setPlaylists] = useState<Playlist[]>([])
	const [tab, setTab] = useState<Tab>('videos')
	const [loading, setLoading] = useState(true)
	const [playlistsLoading, setPlaylistsLoading] = useState(false)
	const [playlistsLoaded, setPlaylistsLoaded] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [editOpen, setEditOpen] = useState(false)
	const [subscribed, setSubscribed] = useState(false)
	const [subscribersCount, setSubscribersCount] = useState(0)
	const [subLoading, setSubLoading] = useState(false)

	const isOwner = currentUser?.id === params.userId
	const totalViews = videos.reduce((sum, v) => sum + (v.views_count || 0), 0)

	useEffect(() => {
		Promise.all([
			fetch(`/api/users/${params.userId}`).then(r => r.json()),
			fetch(`/api/users/${params.userId}/videos`)
				.then(r => r.json())
				.catch(() => ({ ok: false })),
			fetch(`/api/users/${params.userId}/subscribe`)
				.then(r => r.json())
				.catch(() => null),
		])
			.then(([userData, videoData, subData]) => {
				if (userData.ok) setUser(userData.data.user)
				else setError(userData.error || 'User not found')
				if (videoData.ok && videoData.data?.items)
					setVideos(videoData.data.items)
				if (subData?.ok) {
					setSubscribed(subData.data.subscribed)
					setSubscribersCount(subData.data.subscribers_count)
				}
			})
			.finally(() => setLoading(false))
	}, [params.userId])

	useEffect(() => {
		if (tab !== 'playlists' || playlistsLoaded) return
		setPlaylistsLoading(true)
		const url = isOwner
			? '/api/me/playlists'
			: `/api/users/${params.userId}/playlists`
		fetch(url)
			.then(r => r.json())
			.then(data => {
				if (data.ok) setPlaylists(data.data.items)
			})
			.catch(() => {})
			.finally(() => {
				setPlaylistsLoading(false)
				setPlaylistsLoaded(true)
			})
	}, [tab, playlistsLoaded, isOwner, params.userId])

	async function handleSubscribe() {
		if (!currentUser) {
			window.location.href = '/en/login'
			return
		}
		setSubLoading(true)
		try {
			const res = await fetch(`/api/users/${params.userId}/subscribe`, {
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

	if (loading)
		return (
			<UserLayout>
				<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						height: 300,
					}}
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

	const displayName = user.display_name?.trim() || user.username
	const avatarColor = colorFromId(user.id)
	const tabs: Tab[] = ['videos', 'shorts', 'playlists', 'about']
	const shorts = videos.filter(v => v.video_type === 'shorts')
	const regularVideos = videos.filter(v => v.video_type === 'normal')

	return (
		<UserLayout>
			<style>{`
				@keyframes spin    { to { transform: rotate(360deg) } }
				@keyframes fadeUp  { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
				@keyframes pulse   { 0%,100%{opacity:1}50%{opacity:.45} }
				@keyframes pop     { from{opacity:0;transform:scale(.95) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }

				.ch-video-grid { container-type: inline-size; }
				.ch-video-grid-inner {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 24px 16px;
				}
				@container (max-width: 900px) { .ch-video-grid-inner { grid-template-columns: repeat(3, 1fr); } }
				@container (max-width: 620px) { .ch-video-grid-inner { grid-template-columns: repeat(2, 1fr); } }

				.ch-shorts-grid { container-type: inline-size; }
				.ch-shorts-grid-inner {
					display: grid;
					grid-template-columns: repeat(5, 1fr);
					gap: 16px;
				}
				@container (max-width: 900px) { .ch-shorts-grid-inner { grid-template-columns: repeat(4, 1fr); } }
				@container (max-width: 640px) { .ch-shorts-grid-inner { grid-template-columns: repeat(3, 1fr); } }
			`}</style>

			<div style={{ maxWidth: 1000, margin: '0 auto' }}>
				{/* ── Banner ── */}
				<div
					style={{
						width: '100%',
						paddingBottom: '25%',
						position: 'relative',
						borderRadius: 14,
						overflow: 'hidden',
						background: user.banner_url
							? 'transparent'
							: `linear-gradient(135deg, ${avatarColor}44 0%, #181818 70%)`,
						border: '1px solid #1a1a1a',
					}}
				>
					{user.banner_url && (
						<img
							src={user.banner_url}
							alt='banner'
							style={{
								position: 'absolute',
								inset: 0,
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							}}
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

				{/* ── Profile row ── */}
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-end',
						gap: 18,
						padding: '0 4px',
						marginTop: -40,
						marginBottom: 24,
						position: 'relative',
						zIndex: 2,
						flexWrap: 'wrap',
						animation: 'fadeUp 0.4s ease both',
					}}
				>
					<div
						style={{
							width: 82,
							height: 82,
							borderRadius: '50%',
							flexShrink: 0,
							background: user.avatar_url ? 'transparent' : avatarColor,
							border: '3px solid #0f0f0f',
							overflow: 'hidden',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 30,
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

					<div style={{ flex: 1, minWidth: 160, paddingBottom: 4 }}>
						<h1
							style={{
								fontSize: 20,
								fontWeight: 800,
								color: '#fff',
								letterSpacing: '-0.3px',
								margin: '0 0 2px',
							}}
						>
							{displayName}
						</h1>
						<p style={{ fontSize: 12, color: '#555', margin: '0 0 6px' }}>
							@{user.username}
						</p>
						<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
							<span style={{ fontSize: 13, color: '#888' }}>
								<span style={{ color: '#ccc', fontWeight: 600 }}>
									{fmt(subscribersCount)}
								</span>{' '}
								subscriber{subscribersCount !== 1 ? 's' : ''}
							</span>
							<span
								style={{
									width: 3,
									height: 3,
									borderRadius: '50%',
									background: '#444',
									display: 'inline-block',
								}}
							/>
							<span style={{ fontSize: 13, color: '#888' }}>
								<span style={{ color: '#ccc', fontWeight: 600 }}>
									{videos.length}
								</span>{' '}
								video{videos.length !== 1 ? 's' : ''}
							</span>
						</div>
					</div>

					<div
						style={{ display: 'flex', gap: 8, paddingBottom: 26, flexShrink: 0 }}
					>
						{isOwner ? (
							<>
								<button
									onClick={() => setEditOpen(true)}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 6,
										padding: '8px 14px',
										borderRadius: 24,
										border: '1px solid #2a2a2a',
										background: '#1a1a1a',
										color: '#ccc',
										fontSize: 12,
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
										width='13'
										height='13'
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
								<a
									href='/en/manage-videos'
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 6,
										padding: '8px 14px',
										borderRadius: 24,
										border: '1px solid #2a2a2a',
										background: '#1a1a1a',
										color: '#ccc',
										fontSize: 12,
										fontWeight: 600,
										cursor: 'pointer',
										textDecoration: 'none',
										transition: 'border-color 0.15s, color 0.15s',
									}}
									onMouseEnter={e => {
										e.currentTarget.style.borderColor = '#e63946'
										e.currentTarget.style.color = '#e63946'
									}}
									onMouseLeave={e => {
										e.currentTarget.style.borderColor = '#2a2a2a'
										e.currentTarget.style.color = '#ccc'
									}}
								>
									<svg
										width='13'
										height='13'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' />
									</svg>
									Manage Videos
								</a>
							</>
						) : (
							<button
								onClick={handleSubscribe}
								disabled={subLoading}
								style={{
									padding: '9px 22px',
									borderRadius: 24,
									border: subscribed ? '1px solid #333' : 'none',
									background: subscribed ? '#1a1a1a' : '#fff',
									color: subscribed ? '#ccc' : '#000',
									fontSize: 13,
									fontWeight: 700,
									cursor: subLoading ? 'not-allowed' : 'pointer',
									opacity: subLoading ? 0.7 : 1,
									transition: 'all 0.15s',
								}}
							>
								{subLoading ? '…' : subscribed ? '✓ Subscribed' : 'Subscribe'}
							</button>
						)}
					</div>
				</div>

				{/* ── Tabs ── */}
				<div
					style={{
						display: 'flex',
						borderBottom: '1px solid #1a1a1a',
						marginBottom: 28,
					}}
				>
					{tabs.map(t => (
						<button
							key={t}
							onClick={() => setTab(t)}
							style={{
								padding: '11px 18px',
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

				{/* ── Content ── */}
				<div key={tab} style={{ animation: 'fadeUp 0.25s ease both' }}>

					{/* Videos tab */}
					{tab === 'videos' &&
						(regularVideos.length === 0 ? (
							<div
								style={{
									textAlign: 'center',
									padding: '60px 20px',
									color: '#555',
								}}
							>
								<svg
									width='48'
									height='48'
									viewBox='0 0 24 24'
									fill='none'
									stroke='#333'
									strokeWidth='1.5'
									style={{ margin: '0 auto 14px', display: 'block' }}
								>
									<rect x='2' y='3' width='20' height='14' rx='2' />
									<path d='M8 21h8M12 17v4' />
								</svg>
								<p style={{ fontSize: 15, color: '#666', marginBottom: 4 }}>
									No videos yet
								</p>
								{isOwner && (
									<p style={{ fontSize: 13, color: '#444' }}>
										Upload your first video using the Upload button in the header
									</p>
								)}
							</div>
						) : (
							<div className='ch-video-grid'>
								<div className='ch-video-grid-inner'>
									{regularVideos.map(v => (
										<VideoCard key={v.id} video={v} channelUser={user} />
									))}
								</div>
							</div>
						))}

					{/* Shorts tab */}
					{tab === 'shorts' &&
						(shorts.length === 0 ? (
							<div style={{ textAlign: 'center', padding: '60px 20px' }}>
								<p style={{ fontSize: 15, color: '#666' }}>No shorts yet</p>
							</div>
						) : (
							<div className='ch-shorts-grid'>
								<div className='ch-shorts-grid-inner'>
									{shorts.map(v => (
										<ShortsCard key={v.id} video={v} />
									))}
								</div>
							</div>
						))}

					{/* Playlists tab */}
					{tab === 'playlists' &&
						(playlistsLoading ? (
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
									gap: 20,
								}}
							>
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i}>
										<div
											style={{
												paddingBottom: '56.25%',
												background: '#1a1a1a',
												borderRadius: 10,
												marginBottom: 10,
												animation: 'pulse 1.6s ease-in-out infinite',
											}}
										/>
										<div
											style={{
												height: 14,
												background: '#1a1a1a',
												borderRadius: 4,
												marginBottom: 6,
												animation: 'pulse 1.6s ease-in-out infinite',
											}}
										/>
										<div
											style={{
												height: 11,
												background: '#1a1a1a',
												borderRadius: 4,
												width: '55%',
												animation: 'pulse 1.6s ease-in-out infinite',
											}}
										/>
									</div>
								))}
							</div>
						) : playlists.length === 0 ? (
							<div style={{ textAlign: 'center', padding: '60px 20px' }}>
								<div style={{ fontSize: 40, marginBottom: 14 }}>🎵</div>
								<p style={{ fontSize: 15, color: '#666', marginBottom: 4 }}>
									{isOwner ? 'No playlists yet' : 'No public playlists'}
								</p>
								{isOwner && (
									<>
										<p
											style={{ fontSize: 13, color: '#444', marginBottom: 16 }}
										>
											Create your first playlist to organise your videos.
										</p>
										<a
											href='/en/playlists'
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 6,
												padding: '9px 20px',
												borderRadius: 24,
												background: '#e63946',
												color: '#fff',
												fontSize: 13,
												fontWeight: 600,
												textDecoration: 'none',
											}}
										>
											Go to Playlists
										</a>
									</>
								)}
							</div>
						) : (
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
									gap: 24,
								}}
							>
								{playlists.map(pl => (
									<PlaylistCard key={pl.id} playlist={pl} />
								))}
							</div>
						))}

					{/* About tab */}
					{tab === 'about' && (
						<div style={{ maxWidth: 480 }}>
							<div style={{ marginBottom: 28 }}>
								<h3
									style={{
										fontSize: 11,
										fontWeight: 700,
										color: '#555',
										letterSpacing: '1.2px',
										textTransform: 'uppercase',
										marginBottom: 12,
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
									{user.bio ? (
										user.bio
									) : (
										<span style={{ color: '#444', fontStyle: 'italic' }}>
											No bio yet.
										</span>
									)}
								</p>
							</div>
							<div>
								<h3
									style={{
										fontSize: 11,
										fontWeight: 700,
										color: '#555',
										letterSpacing: '1.2px',
										textTransform: 'uppercase',
										marginBottom: 12,
									}}
								>
									Details
								</h3>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
								>
									{[
										['Videos', String(videos.length)],
										['Subscribers', fmt(subscribersCount)],
										['Total views', fmt(totalViews)],
										['Joined', formatDate(user.created_at)],
									].map(([label, value]) => (
										<div
											key={label}
											style={{
												display: 'flex',
												gap: 16,
												alignItems: 'baseline',
											}}
										>
											<span
												style={{
													fontSize: 13,
													color: '#444',
													width: 90,
													flexShrink: 0,
												}}
											>
												{label}
											</span>
											<span style={{ fontSize: 14, color: '#ccc' }}>
												{value}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
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