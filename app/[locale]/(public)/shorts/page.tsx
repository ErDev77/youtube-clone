'use client'
// app/[locale]/(public)/shorts/page.tsx
// Redirects to /shorts/[first-id] so the URL always includes the video ID.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserLayout from '@/app/_components/layout/UserLayout'

export default function ShortsIndexPage() {
	const router = useRouter()

	useEffect(() => {
		// Fetch the first short and redirect to its ID-based URL
		fetch('/api/videos?video_type=shorts&limit=1')
			.then(r => r.json())
			.then(d => {
				if (d.ok && d.data.items.length > 0) {
					router.replace(`/en/shorts/${d.data.items[0].id}`)
				} else {
					// No shorts yet — stay and show the empty state via [id] page with a dummy
					router.replace('/en/shorts/none')
				}
			})
			.catch(() => {})
	}, [router])

	return (
		<UserLayout>
			<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: 'calc(100vh - 56px)',
					margin: '-32px -24px -64px',
					background: '#0a0a0a',
				}}
			>
				<div
					style={{
						width: 38,
						height: 38,
						border: '3px solid #1a1a1a',
						borderTopColor: '#e63946',
						borderRadius: '50%',
						animation: 'spin 0.8s linear infinite',
					}}
				/>
			</div>
		</UserLayout>
	)
}
