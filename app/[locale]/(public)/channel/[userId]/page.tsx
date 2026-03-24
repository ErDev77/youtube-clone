'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import UserLayout from '@/app/_components/layout/UserLayout'

type User = {
	id: string
	email: string
	username: string
}

type MeResponse = {
	ok: boolean
	data?: { user: User }
	error?: string
}

export default function ChannelPage() {
	const params = useParams<{ userId: string }>()
	const [user, setUser] = useState<User | null>(null)
	const [currentUser, setCurrentUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// Получаем текущего залогиненного пользователя
		fetch('/api/me')
			.then(res => res.json())
			.then((data: MeResponse) => {
				if (data.ok && data.data) {
					setCurrentUser(data.data.user)
				}
			})
			.catch(() => {})
	}, [])

	useEffect(() => {
		// Получаем данные юзера по userId
		fetch(`/api/users/${params.userId}`)
			.then(res => res.json())
			.then((data: MeResponse) => {
				if (data.ok && data.data) {
					setUser(data.data.user)
				} else {
					setError(data.error || 'User not found')
				}
			})
			.finally(() => setLoading(false))
	}, [params.userId])

	if (loading) return <p>Loading...</p>
	if (error) return <p>{error}</p>
	if (!user) return <p>No user data</p>

	const isOwner = currentUser?.id === user.id

	return (
		<UserLayout>
			<div className='p-6'>
				<div className='flex items-center gap-4 mb-6'>
					<div className='w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold'>
						{user.username[0].toUpperCase()}
					</div>
					<div>
						<h1 className='text-2xl font-bold'>{user.username}</h1>
						<p className='text-gray-400'>{user.email}</p>
					</div>

					{isOwner && (
						<button className='ml-auto px-4 py-2 bg-blue-600 text-white rounded'>
							Edit Profile
						</button>
					)}
				</div>

				{/* Тут можно добавить вкладки: history, liked, playlists, subscriptions, watch-later */}
			</div>
		</UserLayout>
	)
}
