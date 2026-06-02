'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import PlaylistPicker from '@/app/_components/video/PlaylistPicker'
import { useAuthContext } from '@/context/AuthContext'

type Channel = {
	id: string
	username: string
	display_name?: string
	avatar_url?: string
	video_count: number
	latest_video_at: string | null
	subscribed_at: string
}

type Video = {
	id: string
	title: string
	thumbnail_url: string | null
	video_url: string
	category: string | null
	video_type: 'normal' | 'shorts' | null
	views_count: number
	likes_count?: number
	created_at: string
	uploader: { id: string; username: string; avatar_url?: string }
}

function avatarColor(id: string) {
	const colors = [
		'#e63946',
		'#2a9d8f',
		'#e76f51',
		'#457b9d',
		'#6a4c93',
		'#f4a261',
	]
	let hash = 0
	for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
	return colors[Math.abs(hash) % colors.length]
}

function fmtViews(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
	const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
	if (seconds < 60) return 'just now'
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago'
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago'
	const days = Math.floor(seconds / 86400)
	if (days < 7) return days + 'd ago'
	if (days < 30) return Math.floor(days / 7) + 'w ago'
	if (days < 365) return Math.floor(days / 30) + 'mo ago'
	return Math.floor(days / 365) + 'y ago'
}

function ChannelAvatar({ channel }: { channel: Channel }) {
	const name = channel.display_name || channel.username
	const initials = name.slice(0, 2).toUpperCase()

	return (
		<Link href={`/en/channel/${channel.id}`} className='sub-channel'>
			<div className='sub-channel-avatar'>
				{channel.avatar_url ? (
					<img src={channel.avatar_url} alt={name} />
				) : (
					<span style={{ background: avatarColor(channel.id) }}>
						{initials}
					</span>
				)}
			</div>
			<strong>{name}</strong>
			<small>@{channel.username}</small>
		</Link>
	)
}

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
		const handleClick = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) onClose()
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [onClose])

	const actions = [
		{
			label: 'Save to Watch Later',
			icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
			onClick: async (event: ReactMouseEvent) => {
				event.preventDefault()
				event.stopPropagation()
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
			onClick: (event: ReactMouseEvent) => {
				event.preventDefault()
				event.stopPropagation()
				onAddToPlaylist()
				onClose()
			},
		},
		{
			label: 'Copy link',
			icon: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
			onClick: (event: ReactMouseEvent) => {
				event.preventDefault()
				event.stopPropagation()
				navigator.clipboard
					?.writeText(`${window.location.origin}/en/watch/${videoId}`)
					.catch(() => {})
				onClose()
			},
		},
	]

	return (
		<div ref={ref} className='video-menu'>
			{actions.map(action => (
				<button key={action.label} onClick={action.onClick}>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='#666'>
						<path d={action.icon} />
					</svg>
					{action.label}
				</button>
			))}
		</div>
	)
}

function VideoCard({ video }: { video: Video }) {
	const [hovered, setHovered] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const [playlistOpen, setPlaylistOpen] = useState(false)
	const initials = video.uploader.username.slice(0, 2).toUpperCase()

	return (
		<>
			<article
				className='video-card'
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<Link href={`/en/watch/${video.id}`} className='video-thumb'>
					{video.thumbnail_url ? (
						<img
							src={video.thumbnail_url}
							alt={video.title}
							style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
						/>
					) : (
						<div className='thumb-empty'>
							<svg width='36' height='36' viewBox='0 0 24 24' fill='#333'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					)}
					{hovered && !menuOpen && (
						<div className='thumb-overlay'>
							<span>
								<svg width='18' height='18' viewBox='0 0 24 24' fill='#fff'>
									<path d='M8 5v14l11-7z' />
								</svg>
							</span>
						</div>
					)}
				</Link>

				<div className='video-meta'>
					<Link
						href={`/en/channel/${video.uploader.id}`}
						className='meta-avatar'
					>
						{video.uploader.avatar_url ? (
							<img src={video.uploader.avatar_url} alt='' />
						) : (
							<span style={{ background: avatarColor(video.uploader.id) }}>
								{initials}
							</span>
						)}
					</Link>

					<div className='meta-text'>
						<Link href={`/en/watch/${video.id}`}>
							<h3>{video.title}</h3>
						</Link>
						<Link href={`/en/channel/${video.uploader.id}`}>
							<p>{video.uploader.username}</p>
						</Link>
						<small>
							{fmtViews(video.views_count)} views {'\u00b7'}{' '}
							{timeAgo(video.created_at)}
						</small>
					</div>

					<div className='meta-actions'>
						<button
							onClick={event => {
								event.preventDefault()
								event.stopPropagation()
								setMenuOpen(value => !value)
							}}
							aria-label='Video actions'
							style={{ opacity: hovered || menuOpen ? 1 : 0 }}
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
						{menuOpen && (
							<KebabMenu
								videoId={video.id}
								onClose={() => setMenuOpen(false)}
								onAddToPlaylist={() => setPlaylistOpen(true)}
							/>
						)}
					</div>
				</div>
			</article>

			{playlistOpen && (
				<PlaylistPicker
					videoId={video.id}
					onClose={() => setPlaylistOpen(false)}
				/>
			)}
		</>
	)
}

function ShortsCard({ video }: { video: Video }) {
	const [hovered, setHovered] = useState(false)

	return (
		<Link
			href='/en/shorts'
			className='short-card'
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div className='short-thumb'>
				{video.thumbnail_url ? (
					<img
						src={video.thumbnail_url}
						alt={video.title}
						style={{ transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
					/>
				) : (
					<div className='thumb-empty'>
						<svg width='24' height='24' viewBox='0 0 24 24' fill='#333'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
				)}
				{hovered && (
					<div className='thumb-overlay short-overlay'>
						<span>
							<svg width='14' height='14' viewBox='0 0 24 24' fill='#fff'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</span>
					</div>
				)}
				<small>{fmtViews(video.views_count)} views</small>
			</div>
			<h3>{video.title}</h3>
			<p>{video.uploader.username}</p>
		</Link>
	)
}

function EmptyState() {
	return (
		<div className='empty-state'>
			<div className='empty-icon'>
				<svg width='32' height='32' viewBox='0 0 24 24' fill='currentColor'>
					<path d='M10 16.5v-9l6 4.5-6 4.5z' />
					<path d='M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4z' />
				</svg>
			</div>
			<p>No subscriptions yet</p>
			<span>Find channels you enjoy and hit Subscribe to see them here.</span>
			<Link href='/en'>Discover videos</Link>
		</div>
	)
}

function SkeletonVideos() {
	const skeleton: CSSProperties = {
		background: '#1e1e1e',
		borderRadius: 6,
		animation: 'pulse 1.6s ease-in-out infinite',
	}

	return (
		<div className='video-grid'>
			<div className='video-grid-inner'>
				{Array.from({ length: 8 }).map((_, index) => (
					<div key={index}>
						<div
							style={{ ...skeleton, paddingBottom: '56.25%', borderRadius: 10 }}
						/>
						<div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
							<div
								style={{
									...skeleton,
									width: 36,
									height: 36,
									borderRadius: '50%',
									flexShrink: 0,
								}}
							/>
							<div style={{ flex: 1 }}>
								<div style={{ ...skeleton, height: 14, marginBottom: 6 }} />
								<div style={{ ...skeleton, height: 12, width: '65%' }} />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

function normalizeVideo(video: Partial<Video>, channel: Channel): Video {
	return {
		id: video.id || '',
		title: video.title || 'Untitled video',
		thumbnail_url: video.thumbnail_url ?? null,
		video_url: video.video_url || '',
		category: video.category ?? null,
		video_type: video.video_type ?? 'normal',
		views_count: video.views_count ?? 0,
		likes_count: video.likes_count ?? 0,
		created_at: video.created_at || new Date().toISOString(),
		uploader: video.uploader || {
			id: channel.id,
			username: channel.username,
			avatar_url: channel.avatar_url,
		},
	}
}

export default function SubscriptionsPage() {
	const { user } = useAuthContext()
	const [channels, setChannels] = useState<Channel[]>([])
	const [videos, setVideos] = useState<Video[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingVideos, setLoadingVideos] = useState(false)

	useEffect(() => {
		if (!user) {
			setLoading(false)
			return
		}

		let cancelled = false

		async function loadSubscriptions() {
			setLoading(true)
			try {
				const response = await fetch('/api/me/subscriptions')
				const payload = await response.json()
				if (!payload.ok || cancelled) return

				const items: Channel[] = payload.data.items
				setChannels(items)
				setLoadingVideos(true)

				const results = await Promise.all(
					items.map(async channel => {
						const res = await fetch(`/api/users/${channel.id}/videos?limit=8`)
						const data = await res.json()
						if (!data.ok) return []
						return data.data.items.map((item: Partial<Video>) =>
							normalizeVideo(item, channel),
						)
					}),
				)

				if (!cancelled) {
					setVideos(
						results
							.flat()
							.filter(video => video.id)
							.sort(
								(a, b) =>
									new Date(b.created_at).getTime() -
									new Date(a.created_at).getTime(),
							)
							.slice(0, 32),
					)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
					setLoadingVideos(false)
				}
			}
		}

		loadSubscriptions()
		return () => {
			cancelled = true
		}
	}, [user])

	const shorts = videos
		.filter(video => video.video_type === 'shorts')
		.slice(0, 8)
	const normalVideos = videos.filter(video => video.video_type !== 'shorts')

	return (
		<UserLayout>
			<style>{`
				@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
				@keyframes spin { to{transform:rotate(360deg)} }
				@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
				@keyframes pop { from{opacity:0;transform:scale(.95) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }

				.sub-header { margin-bottom: 18px; }
				.sub-header h1 { color: #fff; font-size: 24px; font-weight: 800; letter-spacing: 0; margin: 0 0 4px; }
				.sub-header p { color: #666; font-size: 13px; margin: 0; }

				.channel-rail {
					display: flex;
					gap: 18px;
					overflow-x: auto;
					padding: 6px 0 24px;
					margin-bottom: 26px;
					border-bottom: 1px solid #1a1a1a;
					scrollbar-width: none;
				}
				.channel-rail::-webkit-scrollbar { display: none; }
				.sub-channel {
					width: 86px;
					flex: 0 0 86px;
					text-align: center;
					text-decoration: none;
					color: #fff;
				}
				.sub-channel-avatar {
					width: 70px;
					height: 70px;
					margin: 0 auto 8px;
					border-radius: 50%;
					padding: 2px;
					background: linear-gradient(135deg, #e63946, #2a9d8f);
				}
				.sub-channel-avatar img,
				.sub-channel-avatar span {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					border: 3px solid #0b0b0b;
					object-fit: cover;
					display: flex;
					align-items: center;
					justify-content: center;
					color: #fff;
					font-size: 15px;
					font-weight: 800;
				}
				.sub-channel strong,
				.sub-channel small {
					display: block;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				.sub-channel strong { font-size: 13px; font-weight: 700; }
				.sub-channel small { color: #666; font-size: 11px; margin-top: 1px; }

				.section-title {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
					margin-bottom: 14px;
				}
				.section-title h2 { color: #fff; font-size: 17px; font-weight: 800; margin: 0; }
				.section-title span { color: #666; font-size: 12px; }

				.video-grid { container-type: inline-size; margin-bottom: 36px; }
				.video-grid-inner {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 24px 16px;
				}
				@container (max-width: 1270px) { .video-grid-inner { grid-template-columns: repeat(3, 1fr); } }
				@container (max-width: 860px) { .video-grid-inner { grid-template-columns: repeat(2, 1fr); } }

				.video-card { position: relative; min-width: 0; }
				.video-thumb {
					position: relative;
					display: block;
					padding-bottom: 56.25%;
					border-radius: 10px;
					overflow: hidden;
					background: #1a1a1a;
					text-decoration: none;
				}
				.video-thumb img,
				.short-thumb img {
					position: absolute;
					inset: 0;
					width: 100%;
					height: 100%;
					object-fit: cover;
					transition: transform .2s;
				}
				.thumb-empty {
					position: absolute;
					inset: 0;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.thumb-overlay {
					position: absolute;
					inset: 0;
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(0,0,0,.28);
				}
				.thumb-overlay span {
					width: 44px;
					height: 44px;
					border-radius: 50%;
					background: rgba(230,57,70,.9);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.video-meta { display: flex; gap: 10px; margin-top: 10px; align-items: flex-start; }
				.meta-avatar { flex-shrink: 0; text-decoration: none; }
				.meta-avatar img,
				.meta-avatar span {
					width: 36px;
					height: 36px;
					border-radius: 50%;
					object-fit: cover;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 12px;
					font-weight: 700;
					color: #fff;
				}
				.meta-text { flex: 1; min-width: 0; }
				.meta-text a { text-decoration: none; }
				.meta-text h3 {
					color: #fff;
					font-size: 14px;
					font-weight: 650;
					line-height: 1.4;
					margin: 0 0 2px;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
				.meta-text p { color: #999; font-size: 13px; margin: 0 0 1px; }
				.meta-text small { color: #666; font-size: 13px; }
				.meta-actions { position: relative; flex-shrink: 0; }
				.meta-actions > button {
					width: 32px;
					height: 32px;
					border-radius: 50%;
					background: none;
					border: none;
					color: #777;
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: opacity .15s, background .15s;
				}
				.meta-actions > button:hover { background: #2a2a2a; }

				.video-menu {
					position: absolute;
					top: 100%;
					right: 0;
					z-index: 300;
					background: #1c1c1c;
					border: 1px solid #2a2a2a;
					border-radius: 10px;
					min-width: 186px;
					overflow: hidden;
					box-shadow: 0 8px 28px rgba(0,0,0,.7);
					animation: pop .12s ease;
				}
				.video-menu button {
					display: flex;
					align-items: center;
					gap: 10px;
					width: 100%;
					padding: 10px 14px;
					background: none;
					border: none;
					cursor: pointer;
					color: #ccc;
					font-size: 13px;
					font-family: inherit;
					text-align: left;
				}
				.video-menu button:hover { background: #252525; }

				.shorts-shelf { margin: 0 0 36px; }
				.shorts-title {
					display: flex;
					align-items: center;
					gap: 8px;
					color: #fff;
					font-size: 15px;
					font-weight: 800;
					margin-bottom: 12px;
				}
				.shorts-row {
					display: grid;
					grid-template-columns: repeat(6, minmax(0, 1fr));
					gap: 14px;
					align-items: start;
				}
				.short-card { min-width: 0; display: block; text-decoration: none; }
				.short-thumb {
					position: relative;
					width: 100%;
					aspect-ratio: 3 / 5;
					border-radius: 10px;
					overflow: hidden;
					background: #1a1a1a;
				}
				.short-overlay span { width: 36px; height: 36px; }
				.short-thumb small {
					position: absolute;
					bottom: 6px;
					left: 6px;
					background: rgba(0,0,0,.72);
					color: #fff;
					font-size: 10px;
					font-weight: 700;
					padding: 2px 6px;
					border-radius: 5px;
				}
				.short-card h3 {
					color: #ddd;
					font-size: 12px;
					font-weight: 700;
					line-height: 1.35;
					margin: 6px 0 1px;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
				.short-card:hover h3 { color: #fff; }
				.short-card p { color: #666; font-size: 11px; margin: 0; }

				.loader-wrap { display: flex; justify-content: center; padding-top: 80px; }
				.loader {
					width: 32px;
					height: 32px;
					border: 2px solid #222;
					border-top-color: #e63946;
					border-radius: 50%;
					animation: spin .7s linear infinite;
				}
				.empty-state {
					text-align: center;
					padding: 78px 20px;
					border: 1px dashed #222;
					border-radius: 14px;
				}
				.empty-icon {
					width: 62px;
					height: 62px;
					border-radius: 50%;
					background: #151515;
					color: #555;
					display: flex;
					align-items: center;
					justify-content: center;
					margin: 0 auto 16px;
				}
				.empty-state p { color: #777; font-size: 17px; margin: 0 0 6px; }
				.empty-state span { display: block; color: #444; font-size: 13px; }
				.empty-state a {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					margin-top: 22px;
					padding: 9px 18px;
					border-radius: 20px;
					background: #e63946;
					color: #fff;
					font-size: 13px;
					font-weight: 700;
					text-decoration: none;
				}

				@media (max-width: 720px) {
					.channel-rail { gap: 14px; margin-bottom: 22px; }
					.sub-channel { width: 76px; flex-basis: 76px; }
					.sub-channel-avatar { width: 62px; height: 62px; }
					.shorts-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
				}
			`}</style>

			<div className='sub-header'>
				<h1>Subscriptions</h1>
				<p>
					{loading
						? 'Loading subscriptions'
						: `${channels.length} ${channels.length === 1 ? 'channel' : 'channels'}`}
				</p>
			</div>

			{loading ? (
				<>
					<div className='channel-rail'>
						{Array.from({ length: 8 }).map((_, index) => (
							<div key={index} className='sub-channel'>
								<div
									className='sub-channel-avatar'
									style={{ background: '#171717' }}
								>
									<span style={{ background: '#1e1e1e' }} />
								</div>
							</div>
						))}
					</div>
					<SkeletonVideos />
				</>
			) : channels.length === 0 ? (
				<EmptyState />
			) : (
				<div style={{ animation: 'fadeUp .3s ease both' }}>
					<div className='channel-rail'>
						{channels.map(channel => (
							<ChannelAvatar key={channel.id} channel={channel} />
						))}
					</div>

					{shorts.length > 0 && (
						<section className='shorts-shelf'>
							<div className='shorts-title'>
								<svg width='20' height='20' viewBox='0 0 24 24' fill='#e63946'>
									<path d='M17.77 10.32l-1.2-.5L18 9.19C19.38 8.42 19.86 6.68 19.09 5.3c-.77-1.38-2.51-1.86-3.89-1.09l-5.85 3.28-.01.02-1.17.65c-1.38.77-1.86 2.51-1.09 3.89.28.49.68.87 1.14 1.12l1.2.5L8 13.81C6.62 14.58 6.14 16.32 6.91 17.7c.77 1.38 2.51 1.86 3.89 1.09l5.85-3.27.01-.01 1.17-.65c1.38-.77 1.86-2.51 1.09-3.89-.28-.49-.68-.87-1.15-1.14zM13 14.5l-2-1.17 2-1.16 2 1.16-2 1.17z' />
								</svg>
								Shorts
							</div>
							<div className='shorts-row'>
								{shorts.map(video => (
									<ShortsCard key={video.id} video={video} />
								))}
							</div>
						</section>
					)}

					<div className='section-title'>
						<h2>Latest videos</h2>
						<span>
							{loadingVideos ? 'Updating' : `${normalVideos.length} videos`}
						</span>
					</div>

					{normalVideos.length > 0 ? (
						<div className='video-grid'>
							<div className='video-grid-inner'>
								{normalVideos.map(video => (
									<VideoCard key={video.id} video={video} />
								))}
							</div>
						</div>
					) : (
						<div className='empty-state'>
							<p>No recent videos</p>
							<span>
								Your subscribed channels have not uploaded videos yet.
							</span>
						</div>
					)}
				</div>
			)}
		</UserLayout>
	)
}
