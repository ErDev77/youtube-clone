'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

/* ─── Types ─── */
type CommentUser = {
	user_id: string
	username: string
	display_name: string | null
	avatar_url: string | null
}

type Comment = CommentUser & {
	id: string
	content: string
	created_at: string
	likes_count: number
	dislikes_count: number
	is_liked: boolean
	is_disliked: boolean
	reply_count: number
	parent_comment_id: string | null
}

/* ─── Helpers ─── */
function fmt(n: number) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
	return String(n)
}

function timeAgo(iso: string) {
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

function colorFromId(id: string) {
	const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
	let h = 0
	for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
	return c[Math.abs(h) % c.length]
}

/* ─── Avatar ─── */
function Avatar({
	user_id,
	username,
	display_name,
	avatar_url,
	size = 38,
}: CommentUser & { size?: number }) {
	const name = display_name || username
	if (avatar_url)
		return (
			<img
				src={avatar_url}
				alt={name}
				style={{
					display: 'block',
					width: size,
					height: size,
					minWidth: size,
					minHeight: size,
					maxWidth: size,
					maxHeight: size,
					borderRadius: '50%',
					objectFit: 'cover',
					flexShrink: 0,
				}}
			/>
		)
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				background: colorFromId(user_id),
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: size * 0.38,
				fontWeight: 700,
				color: '#fff',
				flexShrink: 0,
			}}
		>
			{name.slice(0, 2).toUpperCase()}
		</div>
	)
}

/* ─── CommentInput ─── */
function CommentInput({
	currentUser,
	placeholder = 'Add a comment…',
	autoFocus = false,
	onSubmit,
	onCancel,
	size = 'normal',
}: {
	currentUser: { id: string; username: string } | null | undefined
	placeholder?: string
	autoFocus?: boolean
	onSubmit: (text: string) => Promise<void>
	onCancel?: () => void
	size?: 'normal' | 'small'
}) {
	const [text, setText] = useState('')
	const [focused, setFocused] = useState(autoFocus)
	const [submitting, setSubmitting] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus()
		}
	}, [autoFocus])

	async function handleSubmit() {
		if (!text.trim() || submitting) return
		setSubmitting(true)
		await onSubmit(text.trim())
		setText('')
		setFocused(false)
		setSubmitting(false)
	}

	const isSmall = size === 'small'

	return (
		<div style={{ display: 'flex', gap: isSmall ? 10 : 14 }}>
			{currentUser && (
				<Avatar
					user_id={currentUser.id}
					username={currentUser.username}
					display_name={null}
					avatar_url={null}
					size={isSmall ? 30 : 38}
				/>
			)}
			<div style={{ flex: 1 }}>
				<textarea
					ref={textareaRef}
					placeholder={placeholder}
					value={text}
					onChange={e => setText(e.target.value)}
					onFocus={() => setFocused(true)}
					rows={focused ? 3 : 1}
					style={{
						width: '100%',
						background: 'transparent',
						border: 'none',
						borderBottom: `2px solid ${focused ? '#e63946' : '#2a2a2a'}`,
						outline: 'none',
						color: '#fff',
						fontSize: isSmall ? 13 : 14,
						fontFamily: 'inherit',
						resize: 'none',
						lineHeight: 1.65,
						padding: '6px 0',
						transition: 'border-color 0.2s',
						boxSizing: 'border-box',
					}}
					onKeyDown={e => {
						if (e.key === 'Escape' && onCancel) {
							setText('')
							setFocused(false)
							onCancel()
						}
					}}
				/>
				{focused && (
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							gap: 8,
							marginTop: 8,
						}}
					>
						<button
							onClick={() => {
								setText('')
								setFocused(false)
								onCancel?.()
							}}
							style={{
								padding: '7px 16px',
								borderRadius: 20,
								border: 'none',
								background: 'none',
								color: '#aaa',
								fontSize: 13,
								cursor: 'pointer',
								fontFamily: 'inherit',
							}}
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={!text.trim() || submitting}
							style={{
								padding: '7px 16px',
								borderRadius: 20,
								border: 'none',
								background: text.trim() ? '#e63946' : '#2a2a2a',
								color: text.trim() ? '#fff' : '#666',
								fontSize: 13,
								fontWeight: 600,
								cursor: text.trim() ? 'pointer' : 'not-allowed',
								fontFamily: 'inherit',
								transition: 'all 0.15s',
								display: 'flex',
								alignItems: 'center',
								gap: 6,
							}}
						>
							{submitting && (
								<span
									style={{
										width: 12,
										height: 12,
										border: '2px solid rgba(255,255,255,0.3)',
										borderTopColor: '#fff',
										borderRadius: '50%',
										display: 'inline-block',
										animation: 'spin 0.7s linear infinite',
									}}
								/>
							)}
							{submitting ? 'Posting…' : 'Comment'}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

/* ─── Reaction Buttons (like/dislike) ─── */
function ReactionButtons({
	commentId,
	likesCount: initialLikes,
	dislikesCount: initialDislikes,
	isLiked: initialLiked,
	isDisliked: initialDisliked,
	currentUserId,
}: {
	commentId: string
	likesCount: number
	dislikesCount: number
	isLiked: boolean
	isDisliked: boolean
	currentUserId: string | null
}) {
	const [liked, setLiked] = useState(initialLiked)
	const [disliked, setDisliked] = useState(initialDisliked)
	const [likes, setLikes] = useState(initialLikes)
	const [dislikes, setDislikes] = useState(initialDislikes)
	const [loading, setLoading] = useState(false)

	async function react(action: 'like' | 'dislike') {
		if (!currentUserId) {
			window.location.href = '/en/login'
			return
		}
		if (loading) return

		const wasLiked = liked
		const wasDisliked = disliked
		if (action === 'like') {
			const newLiked = !liked
			setLiked(newLiked)
			setLikes(v => (newLiked ? v + 1 : v - 1))
			if (wasDisliked) {
				setDisliked(false)
				setDislikes(v => v - 1)
			}
		} else {
			const newDisliked = !disliked
			setDisliked(newDisliked)
			setDislikes(v => (newDisliked ? v + 1 : v - 1))
			if (wasLiked) {
				setLiked(false)
				setLikes(v => v - 1)
			}
		}

		setLoading(true)
		try {
			const res = await fetch(`/api/comments/${commentId}/like`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			})
			const data = await res.json()
			if (data.ok) {
				setLiked(data.data.liked)
				setDisliked(data.data.disliked)
				setLikes(data.data.likes_count)
				setDislikes(data.data.dislikes_count)
			} else {
				setLiked(wasLiked)
				setDisliked(wasDisliked)
				setLikes(initialLikes)
				setDislikes(initialDislikes)
			}
		} catch {
			setLiked(wasLiked)
			setDisliked(wasDisliked)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
			<button
				onClick={() => react('like')}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 5,
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					color: liked ? '#e63946' : '#666',
					fontSize: 12,
					fontFamily: 'inherit',
					padding: '4px 8px',
					borderRadius: 20,
					transition: 'all 0.15s',
				}}
				onMouseEnter={e => {
					if (!liked) e.currentTarget.style.color = '#ccc'
				}}
				onMouseLeave={e => {
					if (!liked) e.currentTarget.style.color = '#666'
				}}
			>
				<svg
					width='14'
					height='14'
					viewBox='0 0 24 24'
					fill={liked ? 'currentColor' : 'none'}
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<path d='M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z' />
					<path d='M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3' />
				</svg>
				{likes > 0 && <span>{fmt(likes)}</span>}
			</button>

			<button
				onClick={() => react('dislike')}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 5,
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					color: disliked ? '#8888ff' : '#666',
					fontSize: 12,
					fontFamily: 'inherit',
					padding: '4px 8px',
					borderRadius: 20,
					transition: 'all 0.15s',
				}}
				onMouseEnter={e => {
					if (!disliked) e.currentTarget.style.color = '#ccc'
				}}
				onMouseLeave={e => {
					if (!disliked) e.currentTarget.style.color = '#666'
				}}
			>
				<svg
					width='14'
					height='14'
					viewBox='0 0 24 24'
					fill={disliked ? 'currentColor' : 'none'}
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<path d='M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z' />
					<path d='M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17' />
				</svg>
				{dislikes > 0 && <span>{fmt(dislikes)}</span>}
			</button>
		</div>
	)
}

/* ─── Shared inline-action button style ─── */
function actionBtn(active = false, danger = false): React.CSSProperties {
	return {
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		color: danger ? '#e63946' : active ? '#e63946' : '#666',
		fontSize: 12,
		fontWeight: 600,
		fontFamily: 'inherit',
		padding: '4px 8px',
		borderRadius: 20,
		transition: 'color 0.15s',
	}
}

/* ─── Inline edit textarea + save/cancel ─── */
function InlineEdit({
	initialText,
	fontSize,
	onSave,
	onCancel,
}: {
	initialText: string
	fontSize: number
	onSave: (text: string) => Promise<void>
	onCancel: () => void
}) {
	const [text, setText] = useState(initialText)
	const [saving, setSaving] = useState(false)
	const ref = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		ref.current?.focus()
		const len = initialText.length
		ref.current?.setSelectionRange(len, len)
	}, [])

	async function handleSave() {
		if (!text.trim() || saving) return
		setSaving(true)
		await onSave(text.trim())
		setSaving(false)
	}

	return (
		<div style={{ marginBottom: 8 }}>
			<textarea
				ref={ref}
				value={text}
				onChange={e => setText(e.target.value)}
				rows={3}
				style={{
					width: '100%',
					background: 'transparent',
					border: 'none',
					borderBottom: '2px solid #e63946',
					outline: 'none',
					color: '#fff',
					fontSize,
					fontFamily: 'inherit',
					resize: 'none',
					lineHeight: 1.65,
					padding: '6px 0',
					boxSizing: 'border-box',
				}}
				onKeyDown={e => {
					if (e.key === 'Escape') onCancel()
				}}
			/>
			<div
				style={{
					display: 'flex',
					justifyContent: 'flex-end',
					gap: 8,
					marginTop: 6,
				}}
			>
				<button onClick={onCancel} style={actionBtn()}>
					Cancel
				</button>
				<button
					onClick={handleSave}
					disabled={!text.trim() || saving}
					style={{
						padding: '6px 14px',
						borderRadius: 20,
						border: 'none',
						background: text.trim() ? '#e63946' : '#2a2a2a',
						color: text.trim() ? '#fff' : '#666',
						fontSize: 12,
						fontWeight: 600,
						cursor: text.trim() ? 'pointer' : 'not-allowed',
						fontFamily: 'inherit',
					}}
				>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		</div>
	)
}

/* ─── RepliesSection ─── */
function RepliesSection({
	commentId,
	replyCount,
	currentUser,
	videoId,
	onReplyPosted,
	onReplyDeleted,
}: {
	commentId: string
	replyCount: number
	currentUser: { id: string; username: string } | null | undefined
	videoId: string
	onReplyPosted: () => void
	onReplyDeleted?: () => void
}) {
	const [expanded, setExpanded] = useState(false)
	const [replies, setReplies] = useState<Comment[]>([])
	const [loading, setLoading] = useState(false)
	const [showReplyInput, setShowReplyInput] = useState(false)
	const [activeReplyId, setActiveReplyId] = useState<string | null>(null)

	async function loadReplies() {
		if (loading) return
		setLoading(true)
		try {
			const res = await fetch(`/api/comments/${commentId}/replies`)
			const data = await res.json()
			if (data.ok) setReplies(data.data.items)
		} finally {
			setLoading(false)
		}
	}

	function toggleExpand() {
		if (!expanded) {
			setExpanded(true)
			loadReplies()
		} else {
			setExpanded(false)
		}
	}

	async function submitReply(text: string) {
		const res = await fetch('/api/comments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				video_id: videoId,
				content: text,
				parent_comment_id: commentId,
			}),
		})
		const data = await res.json()
		if (data.ok) {
			setReplies(prev => [...prev, data.data.comment])
			setShowReplyInput(false)
			setExpanded(true)
			onReplyPosted()
		}
	}

	async function submitReplyTo(username: string, text: string) {
		const res = await fetch('/api/comments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				video_id: videoId,
				content: `@${username} ${text}`,
				parent_comment_id: commentId,
			}),
		})
		const data = await res.json()
		if (data.ok) {
			setReplies(prev => [
				...prev,
				{
					...data.data.comment,
					likes_count: 0,
					dislikes_count: 0,
					is_liked: false,
					is_disliked: false,
					reply_count: 0,
				},
			])
			setActiveReplyId(null)
			setExpanded(true)
			onReplyPosted()
		}
	}

	const totalReplies = replies.length || replyCount

	return (
		<div style={{ marginTop: 8 }}>
			{/* Reply button for main comment */}
			{currentUser && (
				<button
					onClick={() => setShowReplyInput(v => !v)}
					style={actionBtn(showReplyInput)}
					onMouseEnter={e => {
						if (!showReplyInput) e.currentTarget.style.color = '#ccc'
					}}
					onMouseLeave={e => {
						if (!showReplyInput) e.currentTarget.style.color = '#666'
					}}
				>
					↩ Reply
				</button>
			)}

			{/* Reply input for main comment */}
			{showReplyInput && currentUser && (
				<div style={{ marginTop: 12, marginLeft: 40 }}>
					<CommentInput
						currentUser={currentUser}
						placeholder='Reply to this comment…'
						autoFocus
						onSubmit={submitReply}
						onCancel={() => setShowReplyInput(false)}
						size='small'
					/>
				</div>
			)}

			{/* Show/hide replies toggle */}
			{totalReplies > 0 && (
				<button
					onClick={toggleExpand}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: '#e63946',
						fontSize: 13,
						fontWeight: 700,
						fontFamily: 'inherit',
						padding: '6px 8px',
						borderRadius: 20,
						marginTop: 4,
						transition: 'background 0.15s',
					}}
					onMouseEnter={e =>
						(e.currentTarget.style.background = 'rgba(230,57,70,0.08)')
					}
					onMouseLeave={e => (e.currentTarget.style.background = 'none')}
				>
					<svg
						width='14'
						height='14'
						viewBox='0 0 24 24'
						fill='currentColor'
						style={{
							transition: 'transform 0.2s',
							transform: expanded ? 'rotate(180deg)' : 'none',
						}}
					>
						<path d='M7 10l5 5 5-5z' />
					</svg>
					{expanded
						? 'Hide'
						: `${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`}
				</button>
			)}

			{/* Replies list */}
			{expanded && (
				<div
					style={{
						marginTop: 8,
						paddingLeft: 20,
						borderLeft: '2px solid #1e1e1e',
						display: 'flex',
						flexDirection: 'column',
						gap: 16,
					}}
				>
					{loading ? (
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<span
								style={{
									width: 16,
									height: 16,
									border: '2px solid #222',
									borderTopColor: '#e63946',
									borderRadius: '50%',
									display: 'inline-block',
									animation: 'spin 0.7s linear infinite',
									flexShrink: 0,
								}}
							/>
							<span style={{ fontSize: 12, color: '#555' }}>
								Loading replies…
							</span>
						</div>
					) : (
						replies.map(reply => (
							<div key={reply.id}>
								<ReplyItem
									reply={reply}
									currentUserId={currentUser?.id ?? null}
									isOwner={currentUser?.id === reply.user_id}
									isReplyActive={activeReplyId === reply.id}
									onReplyClick={() =>
										setActiveReplyId(
											activeReplyId === reply.id ? null : reply.id,
										)
									}
									onDeleted={() => {
										setReplies(prev => prev.filter(r => r.id !== reply.id))
										onReplyDeleted?.()
									}}
									onEdited={content =>
										setReplies(prev =>
											prev.map(r =>
												r.id === reply.id ? { ...r, content } : r,
											),
										)
									}
								/>
								{activeReplyId === reply.id && currentUser && (
									<div style={{ marginLeft: 40, marginTop: 12 }}>
										<CommentInput
											currentUser={currentUser}
											placeholder={`Reply to @${reply.username}…`}
											autoFocus
											onSubmit={text => submitReplyTo(reply.username, text)}
											onCancel={() => setActiveReplyId(null)}
											size='small'
										/>
									</div>
								)}
							</div>
						))
					)}
				</div>
			)}
		</div>
	)
}

/* ─── ReplyItem ─── */
function ReplyItem({
	reply,
	currentUserId,
	isOwner,
	isReplyActive,
	onReplyClick,
	onDeleted,
	onEdited,
}: {
	reply: Comment
	currentUserId: string | null
	isOwner: boolean
	isReplyActive: boolean
	onReplyClick: () => void
	onDeleted: () => void
	onEdited: (content: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const [content, setContent] = useState(reply.content)
	const [deleting, setDeleting] = useState(false)
	const name = reply.display_name || reply.username

	async function saveEdit(text: string) {
		const res = await fetch(`/api/comments/${reply.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: text }),
		})
		const data = await res.json()
		if (data.ok) {
			setContent(data.data.content)
			onEdited(data.data.content)
		}
		setEditing(false)
	}

	async function deleteReply() {
		if (deleting) return
		setDeleting(true)
		const res = await fetch(`/api/comments/${reply.id}`, { method: 'DELETE' })
		const data = await res.json()
		if (data.ok) {
			onDeleted()
		} else {
			setDeleting(false)
		}
	}

	return (
		<div style={{ display: 'flex', gap: 10 }}>
			<Link
				href={`/en/channel/${reply.user_id}`}
				style={{ flexShrink: 0, textDecoration: 'none' }}
			>
				<Avatar
					user_id={reply.user_id}
					username={reply.username}
					display_name={reply.display_name}
					avatar_url={reply.avatar_url}
					size={30}
				/>
			</Link>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: 8,
						marginBottom: 4,
					}}
				>
					<Link
						href={`/en/channel/${reply.user_id}`}
						style={{ textDecoration: 'none' }}
					>
						<span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
							{name}
						</span>
					</Link>
					<span style={{ fontSize: 11, color: '#555' }}>
						{timeAgo(reply.created_at)}
					</span>
				</div>

				{editing ? (
					<InlineEdit
						initialText={content}
						fontSize={13}
						onSave={saveEdit}
						onCancel={() => setEditing(false)}
					/>
				) : (
					<p
						style={{
							fontSize: 13,
							color: '#ccc',
							lineHeight: 1.65,
							margin: '0 0 6px',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}
					>
						{content}
					</p>
				)}

				{!editing && (
					<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
						<ReactionButtons
							commentId={reply.id}
							likesCount={reply.likes_count}
							dislikesCount={reply.dislikes_count ?? 0}
							isLiked={reply.is_liked ?? false}
							isDisliked={reply.is_disliked ?? false}
							currentUserId={currentUserId}
						/>
						{currentUserId && (
							<button
								onClick={onReplyClick}
								style={actionBtn(isReplyActive)}
								onMouseEnter={e => {
									if (!isReplyActive) e.currentTarget.style.color = '#ccc'
								}}
								onMouseLeave={e => {
									if (!isReplyActive) e.currentTarget.style.color = '#666'
								}}
							>
								↩ Reply
							</button>
						)}
						{isOwner && (
							<>
								<button
									onClick={() => setEditing(true)}
									style={actionBtn()}
									onMouseEnter={e => (e.currentTarget.style.color = '#ccc')}
									onMouseLeave={e => (e.currentTarget.style.color = '#666')}
								>
									Edit
								</button>
								<button
									onClick={deleteReply}
									disabled={deleting}
									style={actionBtn(false, true)}
									onMouseEnter={e =>
										(e.currentTarget.style.color = '#ff6b76')
									}
									onMouseLeave={e => (e.currentTarget.style.color = '#e63946')}
								>
									{deleting ? '…' : 'Delete'}
								</button>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

/* ─── CommentItem ─── */
function CommentItem({
	comment,
	currentUser,
	videoId,
	onCountChange,
	onDeleted,
	onEdited,
}: {
	comment: Comment
	currentUser: { id: string; username: string } | null | undefined
	videoId: string
	onCountChange: (delta: number) => void
	onDeleted: () => void
	onEdited: (content: string) => void
}) {
	const [editing, setEditing] = useState(false)
	const [content, setContent] = useState(comment.content)
	const [deleting, setDeleting] = useState(false)
	const isOwner = currentUser?.id === comment.user_id
	const name = comment.display_name || comment.username

	async function saveEdit(text: string) {
		const res = await fetch(`/api/comments/${comment.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: text }),
		})
		const data = await res.json()
		if (data.ok) {
			setContent(data.data.content)
			onEdited(data.data.content)
		}
		setEditing(false)
	}

	async function deleteComment() {
		if (deleting) return
		setDeleting(true)
		const res = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
		const data = await res.json()
		if (data.ok) {
			onDeleted()
		} else {
			setDeleting(false)
		}
	}

	return (
		<div style={{ display: 'flex', gap: 12, paddingBottom: 22 }}>
			<Link
				href={`/en/channel/${comment.user_id}`}
				style={{ flexShrink: 0, textDecoration: 'none' }}
			>
				<Avatar
					user_id={comment.user_id}
					username={comment.username}
					display_name={comment.display_name}
					avatar_url={comment.avatar_url}
					size={38}
				/>
			</Link>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: 8,
						marginBottom: 5,
					}}
				>
					<Link
						href={`/en/channel/${comment.user_id}`}
						style={{ textDecoration: 'none' }}
					>
						<span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
							{name}
						</span>
					</Link>
					<span style={{ fontSize: 11, color: '#555' }}>
						{timeAgo(comment.created_at)}
					</span>
				</div>

				{editing ? (
					<InlineEdit
						initialText={content}
						fontSize={14}
						onSave={saveEdit}
						onCancel={() => setEditing(false)}
					/>
				) : (
					<p
						style={{
							fontSize: 14,
							color: '#ccc',
							lineHeight: 1.65,
							margin: '0 0 8px',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}
					>
						{content}
					</p>
				)}

				{!editing && (
					<>
						<div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
							<ReactionButtons
								commentId={comment.id}
								likesCount={comment.likes_count}
								dislikesCount={comment.dislikes_count ?? 0}
								isLiked={comment.is_liked ?? false}
								isDisliked={comment.is_disliked ?? false}
								currentUserId={currentUser?.id ?? null}
							/>
							{isOwner && (
								<>
									<button
										onClick={() => setEditing(true)}
										style={actionBtn()}
										onMouseEnter={e =>
											(e.currentTarget.style.color = '#ccc')
										}
										onMouseLeave={e =>
											(e.currentTarget.style.color = '#666')
										}
									>
										Edit
									</button>
									<button
										onClick={deleteComment}
										disabled={deleting}
										style={actionBtn(false, true)}
										onMouseEnter={e =>
											(e.currentTarget.style.color = '#ff6b76')
										}
										onMouseLeave={e =>
											(e.currentTarget.style.color = '#e63946')
										}
									>
										{deleting ? '…' : 'Delete'}
									</button>
								</>
							)}
						</div>

						<RepliesSection
							commentId={comment.id}
							replyCount={comment.reply_count ?? 0}
							currentUser={currentUser}
							videoId={videoId}
							onReplyPosted={() => onCountChange(1)}
							onReplyDeleted={() => onCountChange(-1)}
						/>
					</>
				)}
			</div>
		</div>
	)
}

/* ─── Main CommentsSection ─── */
export default function CommentsSection({
	videoId,
	currentUser,
}: {
	videoId: string
	currentUser?: { id: string; username: string } | null
}) {
	const [comments, setComments] = useState<Comment[]>([])
	const [loading, setLoading] = useState(true)
	const [count, setCount] = useState(0)

	useEffect(() => {
		fetch(`/api/videos/${videoId}/comments`)
			.then(r => r.json())
			.then(data => {
				if (data.ok) {
					setComments(data.data.items)
					setCount(data.data.total ?? data.data.items.length)
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [videoId])

	async function submitComment(text: string) {
		const res = await fetch('/api/comments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ video_id: videoId, content: text }),
		})
		const data = await res.json()
		if (data.ok) {
			const newComment: Comment = {
				...data.data.comment,
				likes_count: 0,
				dislikes_count: 0,
				is_liked: false,
				is_disliked: false,
				reply_count: 0,
			}
			setComments(prev => [newComment, ...prev])
			setCount(v => v + 1)
		}
	}

	return (
		<div style={{ marginTop: 28 }}>
			<style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }`}</style>

			<h3
				style={{
					fontSize: 17,
					fontWeight: 700,
					color: '#fff',
					margin: '0 0 22px',
				}}
			>
				{count > 0 ? `${fmt(count)} Comments` : 'Comments'}
			</h3>

			{currentUser ? (
				<div style={{ marginBottom: 28 }}>
					<CommentInput currentUser={currentUser} onSubmit={submitComment} />
				</div>
			) : (
				<div
					style={{
						marginBottom: 24,
						padding: '14px 18px',
						background: '#111',
						borderRadius: 12,
						border: '1px solid #1e1e1e',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<svg
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#555'
						strokeWidth='2'
					>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
					<span style={{ fontSize: 13, color: '#666' }}>
						<a
							href='/en/login'
							style={{
								color: '#e63946',
								textDecoration: 'none',
								fontWeight: 600,
							}}
						>
							Sign in
						</a>{' '}
						to leave a comment
					</span>
				</div>
			)}

			{loading ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
					{[1, 2, 3].map(i => (
						<div key={i} style={{ display: 'flex', gap: 12 }}>
							<div
								style={{
									width: 38,
									height: 38,
									borderRadius: '50%',
									background: '#1e1e1e',
									flexShrink: 0,
									animation: 'pulse 1.6s ease-in-out infinite',
								}}
							/>
							<div style={{ flex: 1 }}>
								<div
									style={{
										height: 12,
										background: '#1e1e1e',
										borderRadius: 4,
										width: '25%',
										marginBottom: 8,
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
								<div
									style={{
										height: 12,
										background: '#1e1e1e',
										borderRadius: 4,
										width: '75%',
										animation: 'pulse 1.6s ease-in-out infinite',
									}}
								/>
							</div>
						</div>
					))}
				</div>
			) : comments.length === 0 ? (
				<div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
					<svg
						width='40'
						height='40'
						viewBox='0 0 24 24'
						fill='none'
						stroke='#2a2a2a'
						strokeWidth='1.5'
						style={{ display: 'block', margin: '0 auto 12px' }}
					>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
					<p style={{ fontSize: 14, color: '#555' }}>
						No comments yet. Be the first!
					</p>
				</div>
			) : (
				<div>
					{comments.map(comment => (
						<CommentItem
							key={comment.id}
							comment={comment}
							currentUser={currentUser}
							videoId={videoId}
							onCountChange={delta => setCount(v => v + delta)}
							onDeleted={() => {
								setComments(prev => prev.filter(c => c.id !== comment.id))
								setCount(v => Math.max(0, v - 1))
							}}
							onEdited={content =>
								setComments(prev =>
									prev.map(c =>
										c.id === comment.id ? { ...c, content } : c,
									),
								)
							}
						/>
					))}
				</div>
			)}
		</div>
	)
}
