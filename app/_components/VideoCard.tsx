'use client'

import { useState } from 'react'

interface VideoCardProps {
	thumbnail: string
	title: string
	channel: string
	channelAvatar: string
	channelColor: string
	views: string
	uploadedAt: string
	duration: string
}

export default function VideoCard({
	thumbnail,
	title,
	channel,
	channelAvatar,
	channelColor,
	views,
	uploadedAt,
	duration,
}: VideoCardProps) {
	const [hovered, setHovered] = useState(false)

	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className='cursor-pointer w-full group'
		>
			{/* Thumbnail */}
			<div
				className='relative w-full rounded-xl overflow-hidden bg-[#1a1a1a]'
				style={{ paddingBottom: '56.25%' }}
			>
				<img
					src={thumbnail}
					alt={title}
					className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${hovered ? 'scale-105' : 'scale-100'}`}
				/>
				<span className='absolute bottom-1 right-1 bg-black/90 text-white text-[11px] font-bold px-1.5 py-0.5 rounded'>
					{duration}
				</span>
			</div>

			{/* Info */}
			<div className='flex gap-2 mt-2.5 items-start'>
				<div
					className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-xs text-white ${channelColor}`}
				>
					{channelAvatar}
				</div>
				<div className='flex-1 min-w-0'>
					<p className='text-[13px] font-semibold text-white leading-snug line-clamp-2 mb-0.5'>
						{title}
					</p>
					<p className='text-[12px] text-[#aaa] hover:text-white transition-colors'>
						{channel}
					</p>
					<p className='text-[12px] text-[#aaa]'>
						{views} · {uploadedAt}
					</p>
				</div>
				<button
					className={`shrink-0 mt-0.5 p-1 rounded-full hover:bg-white/10 transition-all text-[#aaa] cursor-pointer bg-transparent border-none ${hovered ? 'opacity-100' : 'opacity-0'}`}
				>
					<svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' />
					</svg>
				</button>
			</div>
		</div>
	)
}
