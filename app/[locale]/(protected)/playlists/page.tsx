'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

/* ─── Types ─── */
type Playlist = {
	id: string
	title: string
	description: string | null
	visibility: 'public' | 'private'
	video_count: number
	cover_thumbnail: string | null
	created_at: string
	updated_at: string
}

/* ─── Helpers ─── */
function timeAgo(iso: string) {
	const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
	if (d < 1) return 'today'
	if (d < 7) return `${d}d ago`
	if (d < 30) return `${Math.floor(d / 7)}w ago`
	if (d < 365) return `${Math.floor(d / 30)}mo ago`
	return `${Math.floor(d / 365)}y ago`
}

/* ─── Create / Edit Modal ─── */
function PlaylistModal({
	initial,
	onClose,
	onSave,
}: {
	initial?: Playlist
	onClose: () => void
	onSave: (p: Playlist) => void
}) {
	const [title, setTitle] = useState(initial?.title ?? '')
	const [description, setDescription] = useState(initial?.description ?? '')
	const [visibility, setVisibility] = useState<'public' | 'private'>(
		initial?.visibility ?? 'public',
	)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	const isEdit = !!initial

	async function handleSave() {
		if (!title.trim()) return setError('Title is required.')
		setSaving(true)
		setError('')
		try {
			const url = isEdit ? `/api/playlists/${initial!.id}` : '/api/me/playlists'
			const method = isEdit ? 'PATCH' : 'POST'
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || null,
					visibility,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed')
			onSave(data.data.playlist)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Something went wrong')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				background: 'rgba(0,0,0,0.82)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
				backdropFilter: 'blur(4px)',
			}}
			onClick={e => e.target === e.currentTarget && !saving && onClose()}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 480,
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
						padding: '20px 24px',
						borderBottom: '1px solid #1e1e1e',
					}}
				>
					<h2
						style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}
					>
						{isEdit ? 'Edit Playlist' : 'New Playlist'}
					</h2>
					<button onClick={onClose} disabled={saving} style={iconBtnStyle}>
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

				<div style={{ padding: 24 }}>
					{/* Title */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>
							Title <span style={{ color: '#e63946' }}>*</span>
						</label>
						<input
							value={title}
							onChange={e => setTitle(e.target.value)}
							maxLength={100}
							placeholder='e.g. My Favourite Music'
							disabled={saving}
							style={inputStyle}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
							autoFocus
						/>
						<p style={charStyle}>{title.length}/100</p>
					</div>

					{/* Description */}
					<div style={{ marginBottom: 16 }}>
						<label style={labelStyle}>
							Description{' '}
							<span
								style={{
									color: '#555',
									fontWeight: 400,
									textTransform: 'none',
									letterSpacing: 0,
								}}
							>
								optional
							</span>
						</label>
						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							maxLength={500}
							rows={3}
							placeholder='What is this playlist about?'
							disabled={saving}
							style={{ ...inputStyle, resize: 'none' }}
							onFocus={e => (e.currentTarget.style.borderColor = '#e63946')}
							onBlur={e => (e.currentTarget.style.borderColor = '#222')}
						/>
						<p style={charStyle}>{description.length}/500</p>
					</div>

					{/* Visibility */}
					<div style={{ marginBottom: 24 }}>
						<label style={labelStyle}>Visibility</label>
						<div style={{ display: 'flex', gap: 10 }}>
							{(['public', 'private'] as const).map(v => (
								<button
									key={v}
									type='button'
									onClick={() => setVisibility(v)}
									disabled={saving}
									style={{
										flex: 1,
										padding: '10px 14px',
										borderRadius: 10,
										border: `2px solid ${visibility === v ? '#e63946' : '#222'}`,
										background:
											visibility === v ? 'rgba(230,57,70,0.1)' : 'transparent',
										color: visibility === v ? '#e63946' : '#666',
										fontSize: 13,
										fontWeight: visibility === v ? 600 : 400,
										cursor: saving ? 'not-allowed' : 'pointer',
										fontFamily: 'inherit',
										transition: 'all 0.15s',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 7,
									}}
								>
									{v === 'public' ? (
										<svg
											width='14'
											height='14'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
										>
											<circle cx='12' cy='12' r='10' />
											<line x1='2' y1='12' x2='22' y2='12' />
											<path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
										</svg>
									) : (
										<svg
											width='14'
											height='14'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
										>
											<rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
											<path d='M7 11V7a5 5 0 0 1 10 0v4' />
										</svg>
									)}
									{v.charAt(0).toUpperCase() + v.slice(1)}
								</button>
							))}
						</div>
						<p style={{ fontSize: 11, color: '#444', marginTop: 6 }}>
							{visibility === 'private'
								? 'Only you can see this playlist.'
								: 'Anyone can view this playlist.'}
						</p>
					</div>

					{error && (
						<div
							style={{
								background: 'rgba(230,57,70,0.08)',
								border: '1px solid rgba(230,57,70,0.25)',
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
						<button onClick={onClose} disabled={saving} style={cancelBtnStyle}>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={saving || !title.trim()}
							style={{
								...cancelBtnStyle,
								background: saving || !title.trim() ? '#333' : '#e63946',
								border: 'none',
								color: '#fff',
								fontWeight: 600,
								opacity: saving || !title.trim() ? 0.6 : 1,
								cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 8,
							}}
						>
							{saving && <Spinner />}
							{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Playlist'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

/* ─── Delete Confirm Modal ─── */
function DeleteModal({
	playlist,
	onCancel,
	onConfirm,
	deleting,
}: {
	playlist: Playlist
	onCancel: () => void
	onConfirm: () => void
	deleting: boolean
}) {
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				background: 'rgba(0,0,0,0.82)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 20,
				backdropFilter: 'blur(4px)',
			}}
			onClick={e => e.target === e.currentTarget && onCancel()}
		>
			<div
				style={{
					width: '100%',
					maxWidth: 400,
					background: '#111',
					border: '1px solid #2a2a2a',
					borderRadius: 16,
					padding: 28,
				}}
			>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: '50%',
						background: 'rgba(230,57,70,0.12)',
						border: '1px solid rgba(230,57,70,0.25)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 16,
					}}
				>
					<svg
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#e63946'
						strokeWidth='2'
					>
						<polyline points='3 6 5 6 21 6' />
						<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
						<path d='M10 11v6M14 11v6' />
						<path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
					</svg>
				</div>
				<h2
					style={{
						fontSize: 17,
						fontWeight: 700,
						color: '#fff',
						margin: '0 0 8px',
					}}
				>
					Delete playlist?
				</h2>
				<p
					style={{
						fontSize: 13,
						color: '#666',
						margin: '0 0 8px',
						lineHeight: 1.6,
					}}
				>
					You&apos;re about to permanently delete:
				</p>
				<p
					style={{
						fontSize: 13,
						fontWeight: 600,
						color: '#ccc',
						background: '#1a1a1a',
						borderRadius: 8,
						padding: '8px 12px',
						margin: '0 0 12px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{playlist.title}
				</p>
				<p style={{ fontSize: 12, color: '#555', margin: '0 0 24px' }}>
					The playlist will be deleted. Videos inside won&apos;t be affected.
				</p>
				<div style={{ display: 'flex', gap: 10 }}>
					<button onClick={onCancel} disabled={deleting} style={cancelBtnStyle}>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={deleting}
						style={{
							...cancelBtnStyle,
							flex: 1,
							background: deleting ? '#5a1a1e' : '#e63946',
							border: 'none',
							color: '#fff',
							fontWeight: 600,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 8,
						}}
					>
						{deleting && <Spinner />}
						{deleting ? 'Deleting…' : 'Yes, delete it'}
					</button>
				</div>
			</div>
		</div>
	)
}

/* ─── Playlist Card ─── */
function PlaylistCard({
	playlist,
	onEdit,
	onDelete,
}: {
	playlist: Playlist
	onEdit: () => void
	onDelete: () => void
}) {
	const [menuOpen, setMenuOpen] = useState(false)

	return (
		<div style={{ position: 'relative' }}>
			<Link
				href={`/en/playlists/${playlist.id}`}
				style={{ textDecoration: 'none', display: 'block' }}
			>
				{/* Thumbnail stack */}
				<div
					style={{
						position: 'relative',
						width: '100%',
						paddingBottom: '56.25%',
						borderRadius: 12,
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
							}}
						/>
					) : (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
							}}
						>
							<svg
								width='36'
								height='36'
								viewBox='0 0 24 24'
								fill='none'
								stroke='#333'
								strokeWidth='1.5'
							>
								<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
							</svg>
						</div>
					)}
					{/* Video count badge */}
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							right: 0,
							background: 'rgba(0,0,0,0.82)',
							backdropFilter: 'blur(4px)',
							padding: '6px 10px',
							display: 'flex',
							alignItems: 'center',
							gap: 5,
						}}
					>
						<svg width='13' height='13' viewBox='0 0 24 24' fill='#fff'>
							<path d='M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z' />
						</svg>
						<span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
							{playlist.video_count}{' '}
							{playlist.video_count === 1 ? 'video' : 'videos'}
						</span>
					</div>
					{/* Lock badge for private */}
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
								width='11'
								height='11'
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
						color: '#fff',
						margin: '0 0 3px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
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

			{/* Kebab menu */}
			<div style={{ position: 'absolute', top: 8, right: 8 }}>
				<button
					onClick={e => {
						e.preventDefault()
						setMenuOpen(v => !v)
					}}
					style={{
						width: 32,
						height: 32,
						borderRadius: '50%',
						background: menuOpen ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
						border: 'none',
						cursor: 'pointer',
						color: '#fff',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backdropFilter: 'blur(4px)',
					}}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
						<circle cx='12' cy='5' r='2' />
						<circle cx='12' cy='12' r='2' />
						<circle cx='12' cy='19' r='2' />
					</svg>
				</button>
				{menuOpen && (
					<div
						style={{
							position: 'absolute',
							top: '110%',
							right: 0,
							zIndex: 300,
							background: '#1c1c1c',
							border: '1px solid #2a2a2a',
							borderRadius: 10,
							minWidth: 150,
							overflow: 'hidden',
							boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
						}}
						onMouseLeave={() => setMenuOpen(false)}
					>
						{[
							{
								label: 'Edit',
								icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
								action: () => {
									setMenuOpen(false)
									onEdit()
								},
							},
							{
								label: 'Delete',
								icon: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
								color: '#e63946',
								action: () => {
									setMenuOpen(false)
									onDelete()
								},
							},
						].map(item => (
							<button
								key={item.label}
								onClick={e => {
									e.preventDefault()
									item.action()
								}}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									width: '100%',
									padding: '10px 14px',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: item.color || '#ccc',
									fontSize: 13,
									fontFamily: 'inherit',
									textAlign: 'left',
								}}
								onMouseEnter={e =>
									(e.currentTarget.style.background = '#252525')
								}
								onMouseLeave={e => (e.currentTarget.style.background = 'none')}
							>
								<svg
									width='14'
									height='14'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
								>
									<path d={item.icon} />
								</svg>
								{item.label}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

/* ─── Spinner ─── */
function Spinner() {
	return (
		<span
			style={{
				width: 13,
				height: 13,
				border: '2px solid rgba(255,255,255,0.25)',
				borderTopColor: '#fff',
				borderRadius: '50%',
				display: 'inline-block',
				animation: 'spin 0.7s linear infinite',
				flexShrink: 0,
			}}
		/>
	)
}

/* ─── Toast ─── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
	return (
		<div
			style={{
				position: 'fixed',
				bottom: 28,
				right: 28,
				zIndex: 9999,
				background: type === 'success' ? '#1a3a2a' : '#3a1a1e',
				border: `1px solid ${type === 'success' ? '#2a9d6a' : '#e63946'}`,
				color: type === 'success' ? '#57cc99' : '#e63946',
				borderRadius: 10,
				padding: '12px 18px',
				fontSize: 13,
				fontWeight: 500,
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				animation: 'toastIn 0.25s ease',
				boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
			}}
		>
			{type === 'success' ? '✓' : '✕'} {msg}
		</div>
	)
}

/* ─── Main Page ─── */
export default function PlaylistsPage() {
	const { user } = useAuthContext()
	const [playlists, setPlaylists] = useState<Playlist[]>([])
	const [loading, setLoading] = useState(true)
	const [createOpen, setCreateOpen] = useState(false)
	const [editTarget, setEditTarget] = useState<Playlist | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [toast, setToast] = useState<{
		msg: string
		type: 'success' | 'error'
	} | null>(null)

	useEffect(() => {
		if (!user) return
		fetch('/api/me/playlists')
			.then(r => r.json())
			.then(data => {
				if (data.ok) setPlaylists(data.data.items)
			})
			.finally(() => setLoading(false))
	}, [user])

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		setToast({ msg, type })
		setTimeout(() => setToast(null), 3000)
	}

	function handleCreated(p: Playlist) {
		setPlaylists(prev => [
			{ ...p, video_count: 0, cover_thumbnail: null },
			...prev,
		])
		setCreateOpen(false)
		showToast('Playlist created!')
	}

	function handleEdited(p: Playlist) {
		setPlaylists(prev =>
			prev.map(pl => (pl.id === p.id ? { ...pl, ...p } : pl)),
		)
		setEditTarget(null)
		showToast('Playlist updated!')
	}

	async function handleDelete() {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			const res = await fetch(`/api/playlists/${deleteTarget.id}`, {
				method: 'DELETE',
			})
			if (!res.ok) throw new Error('Failed')
			setPlaylists(prev => prev.filter(p => p.id !== deleteTarget.id))
			showToast('Playlist deleted.')
		} catch {
			showToast('Failed to delete playlist.', 'error')
		} finally {
			setDeleting(false)
			setDeleteTarget(null)
		}
	}

	return (
		<UserLayout>
			<style>{`
				@keyframes spin { to { transform: rotate(360deg) } }
				@keyframes toastIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
				@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.45} }
			`}</style>

			{toast && <Toast msg={toast.msg} type={toast.type} />}

			{/* Header */}
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					marginBottom: 32,
					gap: 16,
					flexWrap: 'wrap',
				}}
			>
				<div>
					<h1
						style={{
							fontSize: 24,
							fontWeight: 800,
							color: '#fff',
							margin: '0 0 4px',
							letterSpacing: '-0.4px',
						}}
					>
						Playlists
					</h1>
					<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
						{loading
							? '…'
							: `${playlists.length} ${playlists.length === 1 ? 'playlist' : 'playlists'}`}
					</p>
				</div>
				<button
					onClick={() => setCreateOpen(true)}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						padding: '10px 20px',
						borderRadius: 24,
						background: '#e63946',
						border: 'none',
						color: '#fff',
						fontSize: 13,
						fontWeight: 600,
						cursor: 'pointer',
						fontFamily: 'inherit',
						transition: 'background 0.15s',
					}}
					onMouseEnter={e => (e.currentTarget.style.background = '#c62e3b')}
					onMouseLeave={e => (e.currentTarget.style.background = '#e63946')}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
						<path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
					</svg>
					New Playlist
				</button>
			</div>

			{/* Grid */}
			{loading ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
						gap: 24,
					}}
				>
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i}>
							<div
								style={{
									paddingBottom: '56.25%',
									borderRadius: 12,
									background: '#1a1a1a',
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
				<div
					style={{
						textAlign: 'center',
						padding: '80px 20px',
						border: '1px dashed #222',
						borderRadius: 16,
					}}
				>
					<div style={{ fontSize: 52, marginBottom: 16 }}>🎵</div>
					<p style={{ fontSize: 17, color: '#555', marginBottom: 6 }}>
						No playlists yet
					</p>
					<p style={{ fontSize: 13, color: '#444', marginBottom: 20 }}>
						Create your first playlist to organise your favourite videos.
					</p>
					<button
						onClick={() => setCreateOpen(true)}
						style={{
							padding: '10px 24px',
							borderRadius: 24,
							background: '#e63946',
							border: 'none',
							color: '#fff',
							fontSize: 13,
							fontWeight: 600,
							cursor: 'pointer',
							fontFamily: 'inherit',
						}}
					>
						Create a playlist
					</button>
				</div>
			) : (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
						gap: 28,
					}}
				>
					{playlists.map(pl => (
						<PlaylistCard
							key={pl.id}
							playlist={pl}
							onEdit={() => setEditTarget(pl)}
							onDelete={() => setDeleteTarget(pl)}
						/>
					))}
				</div>
			)}

			{/* Modals */}
			{createOpen && (
				<PlaylistModal
					onClose={() => setCreateOpen(false)}
					onSave={handleCreated}
				/>
			)}
			{editTarget && (
				<PlaylistModal
					initial={editTarget}
					onClose={() => setEditTarget(null)}
					onSave={handleEdited}
				/>
			)}
			{deleteTarget && (
				<DeleteModal
					playlist={deleteTarget}
					onCancel={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
					deleting={deleting}
				/>
			)}
		</UserLayout>
	)
}

/* ─── Shared styles ─── */
const labelStyle: React.CSSProperties = {
	display: 'block',
	fontSize: 11,
	fontWeight: 700,
	color: '#555',
	textTransform: 'uppercase',
	letterSpacing: '1px',
	marginBottom: 8,
}
const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '11px 14px',
	background: '#0d0d0d',
	border: '1px solid #222',
	borderRadius: 10,
	color: '#fff',
	fontSize: 14,
	outline: 'none',
	fontFamily: 'inherit',
	boxSizing: 'border-box',
	transition: 'border-color 0.15s',
}
const charStyle: React.CSSProperties = {
	textAlign: 'right',
	fontSize: 11,
	color: '#444',
	marginTop: 4,
}
const cancelBtnStyle: React.CSSProperties = {
	padding: '10px 20px',
	borderRadius: 10,
	border: '1px solid #2a2a2a',
	background: 'transparent',
	color: '#888',
	fontSize: 13,
	cursor: 'pointer',
	fontFamily: 'inherit',
	transition: 'all 0.15s',
}
const iconBtnStyle: React.CSSProperties = {
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	color: '#555',
	display: 'flex',
	padding: 4,
	borderRadius: 6,
}
