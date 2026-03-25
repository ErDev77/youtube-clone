'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
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
	views_count: number
	created_at: string
	category: string
}

function colorFromId(id: string) {
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

/* ─── Video Modal ─── */
function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
	useEffect(() => {
		fetch(`/api/videos/${video.id}/view`, { method: 'POST' }).catch(() => {})
		const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [video.id, onClose])

	return (
		<div
			className='fixed inset-0 z-[2000] flex items-center justify-center p-5'
			style={{ background: 'rgba(0,0,0,0.95)' }}
			onClick={e => e.target === e.currentTarget && onClose()}
		>
			<div className='w-full max-w-[900px] rounded-xl overflow-hidden bg-[#111]'>
				<video
					src={video.video_url}
					controls
					autoPlay
					className='w-full block bg-black'
					style={{ maxHeight: '65vh' }}
				/>
				<div className='flex items-start justify-between gap-4 p-4'>
					<div>
						<h2 className='text-[17px] font-bold text-white mb-1'>
							{video.title}
						</h2>
						<p className='text-[13px] text-[#666]'>
							{fmt(video.views_count)} views
						</p>
					</div>
					<button
						onClick={onClose}
						className='bg-transparent border-none cursor-pointer text-[#666] p-1 shrink-0'
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

/* ─── Channel Card ─── */
function ChannelCard({ channel }: { channel: Channel }) {
	const name = channel.display_name || channel.username
	const color = colorFromId(channel.id)
	const initials = name.slice(0, 2).toUpperCase()
	const [videos, setVideos] = useState<Video[]>([])
	const [loadingVideos, setLoadingVideos] = useState(false)
	const [expanded, setExpanded] = useState(false)
	const [playingVideo, setPlayingVideo] = useState<Video | null>(null)

	async function loadVideos() {
		if (videos.length > 0) {
			setExpanded(v => !v)
			return
		}
		setLoadingVideos(true)
		try {
			const res = await fetch(`/api/users/${channel.id}/videos?limit=4`)
			const data = await res.json()
			if (data.ok) setVideos(data.data.items.slice(0, 4))
			setExpanded(true)
		} finally {
			setLoadingVideos(false)
		}
	}

	return (
		<div className='bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden transition-colors hover:border-[#222]'>
			{/* Channel header */}
			<div className='flex items-center gap-3 p-4 border-b border-[#1a1a1a]'>
				<Link href={`/en/channel/${channel.id}`} className='shrink-0'>
					{channel.avatar_url ? (
						<img
							src={channel.avatar_url}
							alt={name}
							className='w-11 h-11 rounded-full object-cover ring-2 ring-[#1a1a1a]'
						/>
					) : (
						<div
							className='w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#1a1a1a]'
							style={{ background: color }}
						>
							{initials}
						</div>
					)}
				</Link>
				<div className='flex-1 min-w-0'>
					<Link href={`/en/channel/${channel.id}`} className='no-underline'>
						<p className='text-[14px] font-semibold text-white truncate hover:text-[#e63946] transition-colors'>
							{name}
						</p>
					</Link>
					<p className='text-[12px] text-[#555]'>
						@{channel.username} · {channel.video_count}{' '}
						{channel.video_count === 1 ? 'video' : 'videos'}
						{channel.latest_video_at && (
							<> · last upload {timeAgo(channel.latest_video_at)}</>
						)}
					</p>
				</div>
				<div className='flex items-center gap-2 shrink-0'>
					<Link
						href={`/en/channel/${channel.id}`}
						className='px-4 py-1.5 rounded-full border border-[#2a2a2a] bg-transparent text-[#888] text-[12px] font-semibold no-underline transition-all hover:border-[#e63946] hover:text-[#e63946]'
					>
						View channel
					</Link>
					{channel.video_count > 0 && (
						<button
							onClick={loadVideos}
							disabled={loadingVideos}
							className='px-4 py-1.5 rounded-full border-none bg-[#1a1a1a] text-[#888] text-[12px] font-semibold cursor-pointer transition-all hover:bg-[#222] hover:text-white flex items-center gap-1.5'
							style={{ fontFamily: 'inherit' }}
						>
							{loadingVideos ? (
								<span
									className='w-3 h-3 rounded-full border-2 border-[#333] border-t-[#888] inline-block'
									style={{ animation: 'spin 0.7s linear infinite' }}
								/>
							) : (
								<svg
									width='13'
									height='13'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path
										d={
											expanded
												? 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z'
												: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'
										}
									/>
								</svg>
							)}
							{expanded ? 'Hide' : 'Latest videos'}
						</button>
					)}
				</div>
			</div>

			{/* Latest videos grid */}
			{expanded && videos.length > 0 && (
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-0 p-3 gap-3'>
					{videos.map(video => (
						<div
							key={video.id}
							onClick={() => setPlayingVideo(video)}
							className='cursor-pointer group'
						>
							<div
								className='relative w-full rounded-lg overflow-hidden bg-[#1a1a1a]'
								style={{ paddingBottom: '56.25%' }}
							>
								{video.thumbnail_url ? (
									<img
										src={video.thumbnail_url}
										alt={video.title}
										className='absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105'
									/>
								) : (
									<div className='absolute inset-0 flex items-center justify-center'>
										<svg width='24' height='24' viewBox='0 0 24 24' fill='#333'>
											<path d='M8 5v14l11-7z' />
										</svg>
									</div>
								)}
								<div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center'>
									<div className='w-10 h-10 rounded-full bg-[rgba(230,57,70,0.9)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
										<svg
											width='16'
											height='16'
											viewBox='0 0 24 24'
											fill='white'
										>
											<path d='M8 5v14l11-7z' />
										</svg>
									</div>
								</div>
							</div>
							<p className='mt-1.5 text-[12px] font-medium text-[#ccc] line-clamp-2 leading-snug'>
								{video.title}
							</p>
							<p className='text-[11px] text-[#555] mt-0.5'>
								{fmt(video.views_count)} views · {timeAgo(video.created_at)}
							</p>
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
		</div>
	)
}

/* ─── Main Page ─── */
export default function SubscriptionsPage() {
	const { user } = useAuthContext()
	const [channels, setChannels] = useState<Channel[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!user) return
		fetch('/api/me/subscriptions')
			.then(r => r.json())
			.then(data => {
				if (data.ok) setChannels(data.data.items)
			})
			.finally(() => setLoading(false))
	}, [user])

	return (
		<UserLayout>
			<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

			{/* Header */}
			<div className='mb-8'>
				<h1 className='text-[24px] font-extrabold text-white tracking-tight mb-1'>
					Subscriptions
				</h1>
				<p className='text-[13px] text-[#555]'>
					{loading
						? '…'
						: `${channels.length} ${channels.length === 1 ? 'channel' : 'channels'}`}
				</p>
			</div>

			{loading ? (
				<div className='flex justify-center pt-20'>
					<div
						className='w-8 h-8 rounded-full border-2 border-[#222] border-t-[#e63946]'
						style={{ animation: 'spin 0.7s linear infinite' }}
					/>
				</div>
			) : channels.length === 0 ? (
				<div className='text-center py-20 border border-dashed border-[#222] rounded-2xl'>
					<div className='text-5xl mb-4'>📺</div>
					<p className='text-[17px] text-[#555] mb-2'>No subscriptions yet</p>
					<p className='text-[13px] text-[#444]'>
						Find channels you enjoy and hit Subscribe to see them here.
					</p>
					<Link
						href='/en'
						className='inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-[#e63946] text-white text-[13px] font-semibold no-underline hover:bg-[#c62e3b] transition-colors'
					>
						Discover videos
					</Link>
				</div>
			) : (
				<div className='flex flex-col gap-4'>
					{channels.map(channel => (
						<ChannelCard key={channel.id} channel={channel} />
					))}
				</div>
			)}
		</UserLayout>
	)
}
