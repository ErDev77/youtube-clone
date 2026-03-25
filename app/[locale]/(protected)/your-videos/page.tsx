'use client'

import { useEffect, useState } from 'react'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

type Video = {
	id: string
	title: string
	thumbnail_url: string | null
	video_url: string
	category: string
	views_count: number
	created_at: string
}

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

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [onClose])

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 2000,
				background: 'rgba(0,0,0,0.95)',
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
					maxWidth: 900,
					borderRadius: 12,
					overflow: 'hidden',
					background: '#111',
				}}
			>
				<video
					src={video.video_url}
					controls
					autoPlay
					style={{
						width: '100%',
						maxHeight: '65vh',
						background: '#000',
						display: 'block',
					}}
				/>
				<div
					style={{
						padding: '16px 20px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						gap: 16,
					}}
				>
					<div>
						<h2
							style={{
								fontSize: 17,
								fontWeight: 700,
								color: '#fff',
								margin: '0 0 4px',
							}}
						>
							{video.title}
						</h2>
						<p style={{ fontSize: 13, color: '#666', margin: 0 }}>
							{formatViews(video.views_count)} views · {video.category}
						</p>
					</div>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#666',
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
			</div>
		</div>
	)
}

export default function YourVideosPage() {
	const { user } = useAuthContext()
	const [videos, setVideos] = useState<Video[]>([])
	const [loading, setLoading] = useState(true)
	const [playingVideo, setPlayingVideo] = useState<Video | null>(null)

	useEffect(() => {
		if (!user) return
		fetch(`/api/users/${user.id}/videos`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) setVideos(data.data.items)
			})
			.finally(() => setLoading(false))
	}, [user])

	return (
		<UserLayout>
			<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

			<div style={{ marginBottom: 28 }}>
				<h1
					style={{
						fontSize: 22,
						fontWeight: 800,
						color: '#fff',
						margin: '0 0 4px',
					}}
				>
					Your Videos
				</h1>
				<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
					{videos.length} {videos.length === 1 ? 'video' : 'videos'} uploaded
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
				<div style={{ textAlign: 'center', padding: '80px 20px' }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
					<p style={{ fontSize: 18, color: '#555', marginBottom: 8 }}>
						No videos yet
					</p>
					<p style={{ fontSize: 14, color: '#444' }}>
						Click &quot;Upload&quot; in the header to share your first video.
					</p>
				</div>
			) : (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
						gap: 20,
					}}
				>
					{videos.map(video => (
						<div
							key={video.id}
							onClick={() => setPlayingVideo(video)}
							style={{
								cursor: 'pointer',
								borderRadius: 12,
								overflow: 'hidden',
								background: '#111',
								border: '1px solid #1a1a1a',
								transition: 'border-color 0.15s',
							}}
							onMouseEnter={e =>
								(e.currentTarget.style.borderColor = '#2a2a2a')
							}
							onMouseLeave={e =>
								(e.currentTarget.style.borderColor = '#1a1a1a')
							}
						>
							{/* Thumbnail */}
							<div
								style={{
									position: 'relative',
									paddingBottom: '56.25%',
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
								<div style={{ position: 'absolute', bottom: 8, right: 8 }}>
									<span
										style={{
											background: 'rgba(230,57,70,0.9)',
											color: '#fff',
											fontSize: 10,
											fontWeight: 700,
											padding: '3px 8px',
											borderRadius: 12,
											letterSpacing: '0.5px',
										}}
									>
										{video.category.toUpperCase()}
									</span>
								</div>
							</div>
							{/* Info */}
							<div style={{ padding: '12px 14px' }}>
								<p
									style={{
										fontSize: 14,
										fontWeight: 600,
										color: '#fff',
										margin: '0 0 6px',
										lineHeight: 1.4,
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
									}}
								>
									{video.title}
								</p>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span style={{ fontSize: 12, color: '#555' }}>
										{formatViews(video.views_count)} views
									</span>
									<span style={{ fontSize: 12, color: '#555' }}>
										{timeAgo(video.created_at)}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{playingVideo && (
				<VideoModal
					video={playingVideo}
					onClose={() => setPlayingVideo(null)}
				/>
			)}
		</UserLayout>
	)
}
