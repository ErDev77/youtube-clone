'use client'

import { useEffect, useState } from 'react'

type Playlist = {
	id: string
	title: string
	video_count: number
	cover_thumbnail: string | null
	visibility: 'public' | 'private'
}

interface PlaylistPickerProps {
	videoId: string
	onClose: () => void
}

function Spinner() {
	return (
		<span
			style={{
				width: 13,
				height: 13,
				border: '2px solid rgba(255,255,255,0.2)',
				borderTopColor: '#fff',
				borderRadius: '50%',
				display: 'inline-block',
				animation: 'spin 0.7s linear infinite',
				flexShrink: 0,
			}}
		/>
	)
}

export default function PlaylistPicker({
	videoId,
	onClose,
}: PlaylistPickerProps) {
	const [playlists, setPlaylists] = useState<Playlist[]>([])
	const [loading, setLoading] = useState(true)
	const [adding, setAdding] = useState<string | null>(null)
	const [added, setAdded] = useState<Set<string>>(new Set())
	const [error, setError] = useState('')

	// Create new playlist inline
	const [showCreate, setShowCreate] = useState(false)
	const [newTitle, setNewTitle] = useState('')
	const [newVisibility, setNewVisibility] = useState<'public' | 'private'>(
		'public',
	)
	const [creating, setCreating] = useState(false)

	useEffect(() => {
		fetch('/api/me/playlists')
			.then(r => r.json())
			.then(data => {
				if (data.ok) setPlaylists(data.data.items)
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [])

	async function togglePlaylist(playlistId: string) {
		if (adding) return
		setAdding(playlistId)
		setError('')

		if (added.has(playlistId)) {
			// Remove
			try {
				const res = await fetch(`/api/playlists/${playlistId}/videos`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ video_id: videoId }),
				})
				if (!res.ok) throw new Error()
				setAdded(prev => {
					const s = new Set(prev)
					s.delete(playlistId)
					return s
				})
				setPlaylists(prev =>
					prev.map(p =>
						p.id === playlistId ? { ...p, video_count: p.video_count - 1 } : p,
					),
				)
			} catch {
				setError('Failed to remove from playlist.')
			}
		} else {
			// Add
			try {
				const res = await fetch(`/api/playlists/${playlistId}/videos`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ video_id: videoId }),
				})
				const data = await res.json()
				if (!res.ok) throw new Error(data.error)
				setAdded(prev => new Set([...prev, playlistId]))
				setPlaylists(prev =>
					prev.map(p =>
						p.id === playlistId
							? { ...p, video_count: data.data.video_count }
							: p,
					),
				)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to add to playlist.')
			}
		}
		setAdding(null)
	}

	async function handleCreate() {
		if (!newTitle.trim()) return
		setCreating(true)
		setError('')
		try {
			const res = await fetch('/api/me/playlists', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle.trim(),
					visibility: newVisibility,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error)
			const newPl = {
				...data.data.playlist,
				video_count: 0,
				cover_thumbnail: null,
			}
			setPlaylists(prev => [newPl, ...prev])
			setNewTitle('')
			setShowCreate(false)
			// Auto-add the video to the newly created playlist
			await togglePlaylist(newPl.id)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to create playlist.')
		} finally {
			setCreating(false)
		}
	}

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 2000,
				background: 'rgba(0,0,0,0.85)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
				backdropFilter: 'blur(4px)',
			}}
			onClick={e => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 420,
					background: '#111',
					border: '1px solid #222',
					borderRadius: 16,
					overflow: 'hidden',
				}}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '18px 20px',
						borderBottom: '1px solid #1e1e1e',
					}}
				>
					<h2
						style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}
					>
						Save to playlist
					</h2>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: '#555',
							display: 'flex',
							padding: 4,
						}}
					>
						<svg
							width='18'
							height='18'
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

				{/* Playlist list */}
				<div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 0' }}>
					{loading ? (
						<div
							style={{ display: 'flex', justifyContent: 'center', padding: 32 }}
						>
							<Spinner />
						</div>
					) : playlists.length === 0 && !showCreate ? (
						<p
							style={{
								fontSize: 13,
								color: '#555',
								textAlign: 'center',
								padding: '24px 20px',
							}}
						>
							You have no playlists yet.
						</p>
					) : (
						playlists.map(pl => {
							const isAdded = added.has(pl.id)
							const isAdding = adding === pl.id
							return (
								<button
									key={pl.id}
									onClick={() => togglePlaylist(pl.id)}
									disabled={!!adding}
									style={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										gap: 12,
										padding: '10px 20px',
										background: 'none',
										border: 'none',
										cursor: adding ? 'not-allowed' : 'pointer',
										textAlign: 'left',
										fontFamily: 'inherit',
										transition: 'background 0.1s',
									}}
									onMouseEnter={e =>
										(e.currentTarget.style.background = '#161616')
									}
									onMouseLeave={e =>
										(e.currentTarget.style.background = 'none')
									}
								>
									{/* Checkbox */}
									<div
										style={{
											width: 20,
											height: 20,
											borderRadius: 4,
											flexShrink: 0,
											border: `2px solid ${isAdded ? '#e63946' : '#333'}`,
											background: isAdded ? '#e63946' : 'transparent',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											transition: 'all 0.15s',
										}}
									>
										{isAdding ? (
											<Spinner />
										) : (
											isAdded && (
												<svg
													width='12'
													height='12'
													viewBox='0 0 24 24'
													fill='white'
												>
													<path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
												</svg>
											)
										)}
									</div>

									{/* Thumbnail */}
									<div
										style={{
											width: 48,
											height: 28,
											borderRadius: 4,
											overflow: 'hidden',
											background: '#1a1a1a',
											flexShrink: 0,
										}}
									>
										{pl.cover_thumbnail ? (
											<img
												src={pl.cover_thumbnail}
												alt=''
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
												}}
											/>
										) : (
											<div
												style={{
													width: '100%',
													height: '100%',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												<svg
													width='14'
													height='14'
													viewBox='0 0 24 24'
													fill='#333'
												>
													<path d='M8 5v14l11-7z' />
												</svg>
											</div>
										)}
									</div>

									{/* Info */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<p
											style={{
												fontSize: 13,
												fontWeight: 600,
												color: '#fff',
												margin: '0 0 1px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{pl.title}
										</p>
										<p style={{ fontSize: 11, color: '#666', margin: 0 }}>
											{pl.video_count}{' '}
											{pl.video_count === 1 ? 'video' : 'videos'}
											{pl.visibility === 'private' && ' · 🔒 Private'}
										</p>
									</div>
								</button>
							)
						})
					)}
				</div>

				{/* Error */}
				{error && (
					<div
						style={{ padding: '0 20px 8px', fontSize: 12, color: '#e63946' }}
					>
						{error}
					</div>
				)}

				{/* Create new playlist inline */}
				{showCreate ? (
					<div
						style={{
							padding: '12px 20px 20px',
							borderTop: '1px solid #1e1e1e',
						}}
					>
						<input
							value={newTitle}
							onChange={e => setNewTitle(e.target.value)}
							placeholder='Playlist name'
							maxLength={100}
							autoFocus
							style={{
								width: '100%',
								padding: '10px 12px',
								background: '#0d0d0d',
								border: '1px solid #333',
								borderRadius: 8,
								color: '#fff',
								fontSize: 13,
								outline: 'none',
								fontFamily: 'inherit',
								boxSizing: 'border-box',
								marginBottom: 10,
							}}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#333')}
							onKeyDown={e => {
								if (e.key === 'Enter') handleCreate()
							}}
						/>
						<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
							{(['public', 'private'] as const).map(v => (
								<button
									key={v}
									onClick={() => setNewVisibility(v)}
									style={{
										flex: 1,
										padding: '7px 10px',
										borderRadius: 8,
										border: `1px solid ${newVisibility === v ? '#e63946' : '#222'}`,
										background:
											newVisibility === v
												? 'rgba(230,57,70,0.1)'
												: 'transparent',
										color: newVisibility === v ? '#e63946' : '#666',
										fontSize: 12,
										cursor: 'pointer',
										fontFamily: 'inherit',
									}}
								>
									{v === 'private' ? '🔒 ' : '🌐 '}
									{v.charAt(0).toUpperCase() + v.slice(1)}
								</button>
							))}
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<button
								onClick={() => {
									setShowCreate(false)
									setNewTitle('')
								}}
								style={{
									flex: 1,
									padding: '9px',
									borderRadius: 8,
									border: '1px solid #222',
									background: 'transparent',
									color: '#888',
									fontSize: 13,
									cursor: 'pointer',
									fontFamily: 'inherit',
								}}
							>
								Cancel
							</button>
							<button
								onClick={handleCreate}
								disabled={creating || !newTitle.trim()}
								style={{
									flex: 1,
									padding: '9px',
									borderRadius: 8,
									background: creating || !newTitle.trim() ? '#333' : '#e63946',
									border: 'none',
									color: '#fff',
									fontSize: 13,
									fontWeight: 600,
									cursor:
										creating || !newTitle.trim() ? 'not-allowed' : 'pointer',
									fontFamily: 'inherit',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 6,
								}}
							>
								{creating && <Spinner />}
								{creating ? 'Creating…' : 'Create & Add'}
							</button>
						</div>
					</div>
				) : (
					<div style={{ padding: '12px 20px', borderTop: '1px solid #1e1e1e' }}>
						<button
							onClick={() => setShowCreate(true)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								width: '100%',
								padding: '10px 0',
								background: 'none',
								border: 'none',
								color: '#888',
								fontSize: 13,
								cursor: 'pointer',
								fontFamily: 'inherit',
								textAlign: 'left',
								transition: 'color 0.15s',
							}}
							onMouseEnter={e => (e.currentTarget.style.color = '#e63946')}
							onMouseLeave={e => (e.currentTarget.style.color = '#888')}
						>
							<svg
								width='18'
								height='18'
								viewBox='0 0 24 24'
								fill='currentColor'
							>
								<path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
							</svg>
							Create new playlist
						</button>
					</div>
				)}
			</div>
			<style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
		</div>
	)
}
