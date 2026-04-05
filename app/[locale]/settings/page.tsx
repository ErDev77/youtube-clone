'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import UserLayout from '@/app/_components/layout/UserLayout'
import { useAuthContext } from '@/context/AuthContext'

/* ─── Types ─── */
type Section = 'account' | 'security' | 'appearance' | 'privacy' | 'danger'

/* ─── Helpers ─── */
function passwordStrength(pw: string): {
	score: number
	label: string
	color: string
} {
	if (!pw) return { score: 0, label: '', color: '' }
	let s = 0
	if (pw.length >= 8) s++
	if (/[A-Z]/.test(pw)) s++
	if (/[0-9]/.test(pw)) s++
	if (/[^A-Za-z0-9]/.test(pw)) s++
	const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
	const colors = ['', '#e63946', '#f4a261', '#2a9d8f', '#57cc99']
	return { score: s, label: labels[s], color: colors[s] }
}

function Spinner({
	size = 14,
	color = '#fff',
}: {
	size?: number
	color?: string
}) {
	return (
		<span
			style={{
				width: size,
				height: size,
				border: `2px solid rgba(255,255,255,0.2)`,
				borderTopColor: color,
				borderRadius: '50%',
				display: 'inline-block',
				animation: 'spin 0.7s linear infinite',
				flexShrink: 0,
			}}
		/>
	)
}

function Toast({
	msg,
	type,
	onDone,
}: {
	msg: string
	type: 'success' | 'error'
	onDone: () => void
}) {
	useEffect(() => {
		const t = setTimeout(onDone, 3500)
		return () => clearTimeout(t)
	}, [onDone])

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 28,
				right: 28,
				zIndex: 9999,
				background: type === 'success' ? '#1a3a2a' : '#3a1a1e',
				border: `1px solid ${type === 'success' ? '#2a9d6a' : '#e63946'}`,
				color: type === 'success' ? '#57cc99' : '#ff6b7a',
				borderRadius: 12,
				padding: '13px 20px',
				fontSize: 13,
				fontWeight: 600,
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				animation: 'toastIn 0.25s ease',
				boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
			}}
		>
			<span
				style={{
					width: 20,
					height: 20,
					borderRadius: '50%',
					background:
						type === 'success' ? 'rgba(87,204,153,0.2)' : 'rgba(230,57,70,0.2)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
				}}
			>
				{type === 'success' ? '✓' : '✕'}
			</span>
			{msg}
		</div>
	)
}

function Card({
	children,
	style,
}: {
	children: React.ReactNode
	style?: React.CSSProperties
}) {
	return (
		<div
			style={{
				background: '#0d0d0d',
				border: '1px solid #1a1a1a',
				borderRadius: 16,
				overflow: 'hidden',
				...style,
			}}
		>
			{children}
		</div>
	)
}

function CardHeader({
	icon,
	title,
	desc,
}: {
	icon: React.ReactNode
	title: string
	desc: string
}) {
	return (
		<div
			style={{
				padding: '20px 24px 18px',
				borderBottom: '1px solid #141414',
				display: 'flex',
				alignItems: 'flex-start',
				gap: 14,
			}}
		>
			<div
				style={{
					width: 38,
					height: 38,
					borderRadius: 10,
					background: 'rgba(230,57,70,0.1)',
					border: '1px solid rgba(230,57,70,0.18)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
					color: '#e63946',
				}}
			>
				{icon}
			</div>
			<div>
				<p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
					{title}
				</p>
				<p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>{desc}</p>
			</div>
		</div>
	)
}

function Field({
	label,
	id,
	type = 'text',
	value,
	onChange,
	placeholder,
	hint,
	disabled,
	maxLength,
	rightSlot,
	autoComplete,
}: {
	label: string
	id: string
	type?: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	hint?: string
	disabled?: boolean
	maxLength?: number
	rightSlot?: React.ReactNode
	autoComplete?: string
}) {
	const [focused, setFocused] = useState(false)
	return (
		<div>
			<label
				htmlFor={id}
				style={{
					display: 'block',
					fontSize: 11,
					fontWeight: 700,
					color: '#666',
					textTransform: 'uppercase',
					letterSpacing: '1px',
					marginBottom: 7,
				}}
			>
				{label}
			</label>
			<div style={{ position: 'relative' }}>
				<input
					id={id}
					type={type}
					value={value}
					autoComplete={autoComplete}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					maxLength={maxLength}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					style={{
						width: '100%',
						padding: rightSlot ? '12px 46px 12px 14px' : '12px 14px',
						background: disabled ? '#0a0a0a' : '#111',
						border: `1px solid ${focused ? '#e63946' : '#1e1e1e'}`,
						borderRadius: 10,
						color: disabled ? '#444' : '#fff',
						fontSize: 14,
						outline: 'none',
						fontFamily: 'inherit',
						boxSizing: 'border-box',
						transition: 'border-color 0.2s, box-shadow 0.2s',
						boxShadow: focused ? '0 0 0 3px rgba(230,57,70,0.08)' : 'none',
					}}
				/>
				{rightSlot && (
					<div
						style={{
							position: 'absolute',
							right: 12,
							top: '50%',
							transform: 'translateY(-50%)',
						}}
					>
						{rightSlot}
					</div>
				)}
			</div>
			{hint && (
				<p
					style={{ fontSize: 11, color: '#444', marginTop: 5, lineHeight: 1.5 }}
				>
					{hint}
				</p>
			)}
		</div>
	)
}

function PasswordField({
	label,
	id,
	value,
	onChange,
	placeholder,
	hint,
	disabled,
	autoComplete,
}: {
	label: string
	id: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	hint?: string
	disabled?: boolean
	autoComplete?: string
}) {
	const [show, setShow] = useState(false)
	return (
		<Field
			label={label}
			id={id}
			type={show ? 'text' : 'password'}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			hint={hint}
			disabled={disabled}
			autoComplete={autoComplete}
			rightSlot={
				<button
					type='button'
					onClick={() => setShow(v => !v)}
					tabIndex={-1}
					style={{
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: '#444',
						display: 'flex',
						padding: 2,
						transition: 'color 0.15s',
					}}
					onMouseEnter={e => (e.currentTarget.style.color = '#888')}
					onMouseLeave={e => (e.currentTarget.style.color = '#444')}
				>
					{show ? (
						<svg
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94' />
							<path d='M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19' />
							<line x1='1' y1='1' x2='23' y2='23' />
						</svg>
					) : (
						<svg
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
							<circle cx='12' cy='12' r='3' />
						</svg>
					)}
				</button>
			}
		/>
	)
}

function SubmitBtn({
	loading,
	label,
	loadingLabel,
	disabled,
}: {
	loading: boolean
	label: string
	loadingLabel?: string
	disabled?: boolean
}) {
	return (
		<button
			type='submit'
			disabled={loading || disabled}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				padding: '11px 22px',
				borderRadius: 10,
				border: 'none',
				background: loading || disabled ? '#2a2a2a' : '#e63946',
				color: loading || disabled ? '#555' : '#fff',
				fontSize: 13,
				fontWeight: 700,
				cursor: loading || disabled ? 'not-allowed' : 'pointer',
				fontFamily: 'inherit',
				transition: 'background 0.15s, transform 0.1s',
			}}
			onMouseEnter={e => {
				if (!loading && !disabled) e.currentTarget.style.background = '#c62e3b'
			}}
			onMouseLeave={e => {
				if (!loading && !disabled) e.currentTarget.style.background = '#e63946'
			}}
		>
			{loading && <Spinner size={13} />}
			{loading ? loadingLabel || 'Saving…' : label}
		</button>
	)
}

function NavItem({
	id,
	label,
	icon,
	active,
	onClick,
	danger,
}: {
	id: Section
	label: string
	icon: React.ReactNode
	active: boolean
	onClick: () => void
	danger?: boolean
}) {
	return (
		<button
			onClick={onClick}
			style={{
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				gap: 11,
				padding: '10px 14px',
				borderRadius: 10,
				background: active
					? danger
						? 'rgba(230,57,70,0.1)'
						: 'rgba(255,255,255,0.05)'
					: 'transparent',
				border: 'none',
				cursor: 'pointer',
				color: active
					? danger
						? '#e63946'
						: '#fff'
					: danger
						? '#e63946'
						: '#666',
				fontSize: 13,
				fontWeight: active ? 600 : 400,
				fontFamily: 'inherit',
				textAlign: 'left',
				transition: 'all 0.15s',
				position: 'relative',
			}}
			onMouseEnter={e => {
				if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
			}}
			onMouseLeave={e => {
				if (!active) e.currentTarget.style.background = 'transparent'
			}}
		>
			{active && !danger && (
				<span
					style={{
						position: 'absolute',
						left: 0,
						top: '50%',
						transform: 'translateY(-50%)',
						width: 3,
						height: 16,
						background: '#e63946',
						borderRadius: '0 2px 2px 0',
					}}
				/>
			)}
			<span
				style={{
					color: active
						? danger
							? '#e63946'
							: '#e63946'
						: danger
							? '#e63946'
							: '#555',
					display: 'flex',
					opacity: danger ? 1 : undefined,
				}}
			>
				{icon}
			</span>
			{label}
		</button>
	)
}

export default function SettingsPage() {
	const router = useRouter()
	const { user, logout } = useAuthContext()
	const [section, setSection] = useState<Section>('account')
	const [toast, setToast] = useState<{
		msg: string
		type: 'success' | 'error'
	} | null>(null)

	const [currentEmail, setCurrentEmail] = useState('')
	const [currentUsername, setCurrentUsername] = useState('')

	const [newEmail, setNewEmail] = useState('')
	const [emailPassword, setEmailPassword] = useState('')
	const [emailLoading, setEmailLoading] = useState(false)
	const [emailError, setEmailError] = useState('')

	const [newUsername, setNewUsername] = useState('')
	const [usernameLoading, setUsernameLoading] = useState(false)
	const [usernameError, setUsernameError] = useState('')

	const [currentPw, setCurrentPw] = useState('')
	const [newPw, setNewPw] = useState('')
	const [confirmPw, setConfirmPw] = useState('')
	const [pwLoading, setPwLoading] = useState(false)
	const [pwError, setPwError] = useState('')

	const [deletePassword, setDeletePassword] = useState('')
	const [deleteConfirmText, setDeleteConfirmText] = useState('')
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [deleteError, setDeleteError] = useState('')

	const [compactMode, setCompactMode] = useState(false)
	const [autoplay, setAutoplay] = useState(true)
	const [defaultQuality, setDefaultQuality] = useState('Auto')

	const [showLiked, setShowLiked] = useState(false)
	const [showSubscriptions, setShowSubscriptions] = useState(false)

	const pwStrength = passwordStrength(newPw)

	useEffect(() => {
		if (!user) return
		fetch('/api/me')
			.then(r => r.json())
			.then(d => {
				if (d.ok) {
					setCurrentEmail(d.data.user.email || '')
					setCurrentUsername(d.data.user.username || '')
				}
			})
	}, [user])

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		setToast({ msg, type })
	}

	async function handleEmailChange(e: React.FormEvent) {
		e.preventDefault()
		setEmailError('')
		if (!newEmail.trim()) return setEmailError('Please enter a new email.')
		if (newEmail.trim() === currentEmail)
			return setEmailError('This is already your current email.')
		if (!emailPassword)
			return setEmailError('Please enter your current password.')
		setEmailLoading(true)
		try {
			const res = await fetch('/api/me/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'change_email',
					email: newEmail.trim(),
					current_password: emailPassword,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error)
			setCurrentEmail(newEmail.trim().toLowerCase())
			setNewEmail('')
			setEmailPassword('')
			showToast('Email updated successfully')
		} catch (err) {
			setEmailError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setEmailLoading(false)
		}
	}

	async function handleUsernameChange(e: React.FormEvent) {
		e.preventDefault()
		setUsernameError('')
		if (!newUsername.trim())
			return setUsernameError('Please enter a new username.')
		if (newUsername.trim().toLowerCase() === currentUsername)
			return setUsernameError('This is already your current username.')
		setUsernameLoading(true)
		try {
			const res = await fetch('/api/me/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'change_username',
					username: newUsername.trim(),
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error)
			setCurrentUsername(data.data.username)
			setNewUsername('')
			showToast('Username updated successfully')
		} catch (err) {
			setUsernameError(
				err instanceof Error ? err.message : 'Something went wrong',
			)
		} finally {
			setUsernameLoading(false)
		}
	}

	async function handlePasswordChange(e: React.FormEvent) {
		e.preventDefault()
		setPwError('')
		if (!currentPw) return setPwError('Please enter your current password.')
		if (!newPw) return setPwError('Please enter a new password.')
		if (newPw.length < 8)
			return setPwError('New password must be at least 8 characters.')
		if (newPw !== confirmPw) return setPwError('Passwords do not match.')
		if (newPw === currentPw)
			return setPwError('New password must be different from current password.')
		setPwLoading(true)
		try {
			const res = await fetch('/api/me/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'change_password',
					current_password: currentPw,
					new_password: newPw,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error)
			setCurrentPw('')
			setNewPw('')
			setConfirmPw('')
			showToast('Password changed successfully')
		} catch (err) {
			setPwError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setPwLoading(false)
		}
	}

	async function handleDeleteAccount(e: React.FormEvent) {
		e.preventDefault()
		setDeleteError('')
		if (deleteConfirmText !== 'DELETE')
			return setDeleteError('Please type DELETE to confirm.')
		if (!deletePassword) return setDeleteError('Please enter your password.')
		setDeleteLoading(true)
		try {
			const res = await fetch('/api/me/settings', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ current_password: deletePassword }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error)
			await logout()
			router.push('/en')
		} catch (err) {
			setDeleteError(
				err instanceof Error ? err.message : 'Something went wrong',
			)
			setDeleteLoading(false)
		}
	}

	const navSections: {
		id: Section
		label: string
		icon: React.ReactNode
		danger?: boolean
	}[] = [
		{
			id: 'account',
			label: 'Account',
			icon: (
				<svg
					width='16'
					height='16'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
				>
					<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
					<circle cx='12' cy='7' r='4' />
				</svg>
			),
		},
		{
			id: 'security',
			label: 'Security',
			icon: (
				<svg
					width='16'
					height='16'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
				>
					<rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
					<path d='M7 11V7a5 5 0 0 1 10 0v4' />
				</svg>
			),
		},
		{
			id: 'appearance',
			label: 'Appearance',
			icon: (
				<svg
					width='16'
					height='16'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
				>
					<circle cx='12' cy='12' r='3' />
					<path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83' />
				</svg>
			),
		},
		{
			id: 'privacy',
			label: 'Privacy',
			icon: (
				<svg
					width='16'
					height='16'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
				>
					<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
					<circle cx='12' cy='12' r='3' />
				</svg>
			),
		},
		{
			id: 'danger',
			label: 'Delete Account',
			icon: (
				<svg
					width='16'
					height='16'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
				>
					<polyline points='3 6 5 6 21 6' />
					<path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
					<path d='M10 11v6M14 11v6' />
					<path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
				</svg>
			),
			danger: true,
		},
	]

	function Toggle({
		checked,
		onChange,
		label,
		desc,
	}: {
		checked: boolean
		onChange: (v: boolean) => void
		label: string
		desc?: string
	}) {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '14px 0',
					borderBottom: '1px solid #0f0f0f',
				}}
			>
				<div>
					<p
						style={{ fontSize: 14, fontWeight: 500, color: '#ddd', margin: 0 }}
					>
						{label}
					</p>
					{desc && (
						<p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>
							{desc}
						</p>
					)}
				</div>
				<button
					type='button'
					onClick={() => onChange(!checked)}
					style={{
						width: 44,
						height: 24,
						borderRadius: 12,
						border: 'none',
						background: checked ? '#e63946' : '#222',
						cursor: 'pointer',
						position: 'relative',
						flexShrink: 0,
						transition: 'background 0.2s',
					}}
				>
					<span
						style={{
							position: 'absolute',
							top: 3,
							left: checked ? 23 : 3,
							width: 18,
							height: 18,
							borderRadius: '50%',
							background: '#fff',
							transition: 'left 0.2s',
							boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
						}}
					/>
				</button>
			</div>
		)
	}

	function ErrorBox({ msg }: { msg: string }) {
		return msg ? (
			<div
				style={{
					background: 'rgba(230,57,70,0.08)',
					border: '1px solid rgba(230,57,70,0.25)',
					borderRadius: 9,
					padding: '10px 14px',
					fontSize: 13,
					color: '#e63946',
					display: 'flex',
					alignItems: 'flex-start',
					gap: 8,
				}}
			>
				<svg
					width='14'
					height='14'
					viewBox='0 0 24 24'
					fill='#e63946'
					style={{ flexShrink: 0, marginTop: 1 }}
				>
					<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
				</svg>
				{msg}
			</div>
		) : null
	}

	const canDelete =
		deleteConfirmText === 'DELETE' && !!deletePassword && !deleteLoading

	return (
		<UserLayout>
			<style>{`
				@keyframes spin    { to { transform: rotate(360deg) } }
				@keyframes toastIn { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
				@keyframes fadeUp  { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
			`}</style>

			{toast && (
				<Toast
					msg={toast.msg}
					type={toast.type}
					onDone={() => setToast(null)}
				/>
			)}

			<div style={{ marginBottom: 32 }}>
				<h1
					style={{
						fontSize: 24,
						fontWeight: 800,
						color: '#fff',
						margin: '0 0 4px',
						letterSpacing: '-0.4px',
					}}
				>
					Settings
				</h1>
				<p style={{ fontSize: 13, color: '#555', margin: 0 }}>
					Manage your account preferences
				</p>
			</div>

			<div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
				{/* Sidebar */}
				<div style={{ width: 200, flexShrink: 0, position: 'sticky', top: 76 }}>
					<div
						style={{
							background: '#0d0d0d',
							border: '1px solid #1a1a1a',
							borderRadius: 14,
							padding: 8,
							display: 'flex',
							flexDirection: 'column',
							gap: 2,
						}}
					>
						{navSections.map(s => (
							<NavItem
								key={s.id}
								id={s.id}
								label={s.label}
								icon={s.icon}
								active={section === s.id}
								onClick={() => setSection(s.id)}
								danger={s.danger}
							/>
						))}
					</div>

					<div
						style={{
							marginTop: 16,
							padding: '14px 16px',
							background: '#0d0d0d',
							border: '1px solid #1a1a1a',
							borderRadius: 14,
						}}
					>
						<p
							style={{
								fontSize: 10,
								fontWeight: 700,
								color: '#444',
								textTransform: 'uppercase',
								letterSpacing: '1px',
								margin: '0 0 8px',
							}}
						>
							Signed in as
						</p>
						<p
							style={{
								fontSize: 13,
								fontWeight: 600,
								color: '#ccc',
								margin: '0 0 1px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							@{currentUsername || '…'}
						</p>
						<p
							style={{
								fontSize: 11,
								color: '#555',
								margin: 0,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{currentEmail || '…'}
						</p>
					</div>
				</div>

				{/* Content */}
				<div
					style={{
						flex: 1,
						minWidth: 0,
						display: 'flex',
						flexDirection: 'column',
						gap: 20,
						animation: 'fadeUp 0.2s ease both',
					}}
					key={section}
				>
					{/* ACCOUNT */}
					{section === 'account' && (
						<>
							<Card>
								<CardHeader
									icon={
										<svg
											width='18'
											height='18'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
										>
											<path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
											<polyline points='22,6 12,13 2,6' />
										</svg>
									}
									title='Email Address'
									desc='Change the email associated with your account'
								/>
								<form
									onSubmit={handleEmailChange}
									style={{
										padding: '20px 24px',
										display: 'flex',
										flexDirection: 'column',
										gap: 14,
									}}
								>
									<Field
										label='Current email'
										id='current-email'
										value={currentEmail}
										onChange={() => {}}
										disabled
										hint='This is your current email address'
									/>
									<Field
										label='New email'
										id='new-email'
										type='email'
										value={newEmail}
										onChange={setNewEmail}
										placeholder='new@example.com'
										autoComplete='email'
									/>
									<PasswordField
										label='Confirm with password'
										id='email-pw'
										value={emailPassword}
										onChange={setEmailPassword}
										placeholder='Your current password'
										autoComplete='current-password'
									/>
									<ErrorBox msg={emailError} />
									<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
										<SubmitBtn
											loading={emailLoading}
											label='Update Email'
											loadingLabel='Updating…'
											disabled={!newEmail || !emailPassword}
										/>
									</div>
								</form>
							</Card>

							<Card>
								<CardHeader
									icon={
										<svg
											width='18'
											height='18'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
										>
											<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
											<circle cx='12' cy='7' r='4' />
										</svg>
									}
									title='Username'
									desc='Change your public username (affects your channel URL)'
								/>
								<form
									onSubmit={handleUsernameChange}
									style={{
										padding: '20px 24px',
										display: 'flex',
										flexDirection: 'column',
										gap: 14,
									}}
								>
									<Field
										label='Current username'
										id='current-username'
										value={`@${currentUsername}`}
										onChange={() => {}}
										disabled
									/>
									<Field
										label='New username'
										id='new-username'
										value={newUsername}
										onChange={v =>
											setNewUsername(
												v.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''),
											)
										}
										placeholder='e.g. cool_creator42'
										maxLength={30}
										hint='3–30 characters: letters, numbers, _ or - only'
										autoComplete='username'
									/>
									<ErrorBox msg={usernameError} />
									<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
										<SubmitBtn
											loading={usernameLoading}
											label='Update Username'
											disabled={!newUsername || newUsername.length < 3}
										/>
									</div>
								</form>
							</Card>
						</>
					)}

					{/* SECURITY */}
					{section === 'security' && (
						<Card>
							<CardHeader
								icon={
									<svg
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
										<path d='M7 11V7a5 5 0 0 1 10 0v4' />
									</svg>
								}
								title='Change Password'
								desc='Use a strong, unique password to keep your account secure'
							/>
							<form
								onSubmit={handlePasswordChange}
								style={{
									padding: '20px 24px',
									display: 'flex',
									flexDirection: 'column',
									gap: 14,
								}}
							>
								<PasswordField
									label='Current password'
									id='current-pw'
									value={currentPw}
									onChange={setCurrentPw}
									placeholder='Your current password'
									autoComplete='current-password'
								/>
								<div>
									<PasswordField
										label='New password'
										id='new-pw'
										value={newPw}
										onChange={setNewPw}
										placeholder='At least 8 characters'
										autoComplete='new-password'
									/>
									{newPw && (
										<div style={{ marginTop: 8 }}>
											<div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
												{[1, 2, 3, 4].map(n => (
													<div
														key={n}
														style={{
															flex: 1,
															height: 3,
															borderRadius: 2,
															background:
																pwStrength.score >= n
																	? pwStrength.color
																	: '#1e1e1e',
															transition: 'background 0.3s',
														}}
													/>
												))}
											</div>
											<p
												style={{
													fontSize: 11,
													color: pwStrength.color,
													margin: 0,
													textAlign: 'right',
												}}
											>
												{pwStrength.label}
											</p>
										</div>
									)}
								</div>
								<PasswordField
									label='Confirm new password'
									id='confirm-pw'
									value={confirmPw}
									onChange={setConfirmPw}
									placeholder='Re-enter new password'
									autoComplete='new-password'
								/>
								{confirmPw && confirmPw !== newPw && (
									<p
										style={{
											fontSize: 12,
											color: '#e63946',
											margin: '-6px 0 0',
										}}
									>
										Passwords do not match
									</p>
								)}
								<div
									style={{
										background: '#111',
										border: '1px solid #1a1a1a',
										borderRadius: 10,
										padding: '12px 16px',
									}}
								>
									<p
										style={{
											fontSize: 11,
											fontWeight: 700,
											color: '#555',
											textTransform: 'uppercase',
											letterSpacing: '0.8px',
											margin: '0 0 8px',
										}}
									>
										Tips for a strong password
									</p>
									{[
										['8+ characters', newPw.length >= 8],
										['Uppercase letter', /[A-Z]/.test(newPw)],
										['Number', /[0-9]/.test(newPw)],
										['Special character (!@#$…)', /[^A-Za-z0-9]/.test(newPw)],
									].map(([tip, met]) => (
										<div
											key={String(tip)}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												marginBottom: 4,
											}}
										>
											<span
												style={{
													fontSize: 11,
													color: met ? '#57cc99' : '#333',
												}}
											>
												{met ? '✓' : '○'}
											</span>
											<span
												style={{
													fontSize: 12,
													color: met ? '#57cc99' : '#444',
												}}
											>
												{String(tip)}
											</span>
										</div>
									))}
								</div>
								<ErrorBox msg={pwError} />
								<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
									<SubmitBtn
										loading={pwLoading}
										label='Change Password'
										disabled={
											!currentPw || !newPw || !confirmPw || newPw !== confirmPw
										}
									/>
								</div>
							</form>
						</Card>
					)}

					{/* APPEARANCE */}
					{section === 'appearance' && (
						<Card>
							<CardHeader
								icon={
									<svg
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<circle cx='12' cy='12' r='3' />
										<path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83' />
									</svg>
								}
								title='Appearance & Playback'
								desc='Customize how ArmTube looks and behaves'
							/>
							<div style={{ padding: '8px 24px 20px' }}>
								<Toggle
									checked={autoplay}
									onChange={setAutoplay}
									label='Autoplay next video'
									desc='Automatically play the next video in queue'
								/>
								<Toggle
									checked={compactMode}
									onChange={setCompactMode}
									label='Compact layout'
									desc='Show smaller video cards in the feed'
								/>
								<div
									style={{
										padding: '14px 0',
										borderBottom: '1px solid #0f0f0f',
									}}
								>
									<label
										style={{
											display: 'block',
											fontSize: 14,
											fontWeight: 500,
											color: '#ddd',
											margin: '0 0 10px',
										}}
									>
										Default video quality
									</label>
									<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
										{['Auto', '1080p', '720p', '480p', '360p'].map(q => (
											<button
												key={q}
												type='button'
												onClick={() => setDefaultQuality(q)}
												style={{
													padding: '7px 14px',
													borderRadius: 20,
													border: `1px solid ${defaultQuality === q ? '#e63946' : '#222'}`,
													background:
														defaultQuality === q
															? 'rgba(230,57,70,0.1)'
															: 'transparent',
													color: defaultQuality === q ? '#e63946' : '#666',
													fontSize: 12,
													cursor: 'pointer',
													fontFamily: 'inherit',
													fontWeight: defaultQuality === q ? 600 : 400,
													transition: 'all 0.15s',
												}}
											>
												{q}
											</button>
										))}
									</div>
								</div>
								<div
									style={{
										display: 'flex',
										justifyContent: 'flex-end',
										paddingTop: 16,
									}}
								>
									<SubmitBtn
										loading={false}
										label='Save Preferences'
										disabled={false}
									/>
								</div>
							</div>
						</Card>
					)}

					{/* PRIVACY */}
					{section === 'privacy' && (
						<Card>
							<CardHeader
								icon={
									<svg
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
									>
										<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
										<circle cx='12' cy='12' r='3' />
									</svg>
								}
								title='Privacy'
								desc='Control what others can see on your profile'
							/>
							<div style={{ padding: '8px 24px 20px' }}>
								<Toggle
									checked={showLiked}
									onChange={setShowLiked}
									label='Show liked videos publicly'
									desc='Others can see the videos you have liked'
								/>
								<Toggle
									checked={showSubscriptions}
									onChange={setShowSubscriptions}
									label='Show subscriptions publicly'
									desc='Others can see the channels you are subscribed to'
								/>
								<div
									style={{
										display: 'flex',
										justifyContent: 'flex-end',
										paddingTop: 16,
									}}
								>
									<SubmitBtn loading={false} label='Save Privacy Settings' />
								</div>
							</div>
						</Card>
					)}

					{/* DANGER ZONE */}
					{section === 'danger' && (
						<Card style={{ border: '1px solid rgba(230,57,70,0.25)' }}>
							<div
								style={{
									padding: '20px 24px 18px',
									borderBottom: '1px solid rgba(230,57,70,0.12)',
									display: 'flex',
									alignItems: 'flex-start',
									gap: 14,
								}}
							>
								<div
									style={{
										width: 38,
										height: 38,
										borderRadius: 10,
										background: 'rgba(230,57,70,0.12)',
										border: '1px solid rgba(230,57,70,0.25)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
										color: '#e63946',
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
										<path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
										<line x1='12' y1='9' x2='12' y2='13' />
										<line x1='12' y1='17' x2='12.01' y2='17' />
									</svg>
								</div>
								<div>
									<p
										style={{
											fontSize: 15,
											fontWeight: 700,
											color: '#e63946',
											margin: 0,
										}}
									>
										Danger Zone
									</p>
									<p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>
										This action is permanent and cannot be undone
									</p>
								</div>
							</div>

							<div style={{ padding: '20px 24px' }}>
								<div
									style={{
										background: 'rgba(230,57,70,0.06)',
										border: '1px solid rgba(230,57,70,0.15)',
										borderRadius: 10,
										padding: '14px 18px',
										marginBottom: 20,
									}}
								>
									<p
										style={{
											fontSize: 13,
											fontWeight: 600,
											color: '#e63946',
											margin: '0 0 6px',
										}}
									>
										⚠ Deleting your account will permanently:
									</p>
									<ul style={{ margin: 0, paddingLeft: 18 }}>
										{[
											'Remove all your videos and playlists',
											'Delete all your comments and likes',
											'Cancel all subscriptions',
											'Erase your watch history',
										].map(item => (
											<li
												key={item}
												style={{
													fontSize: 13,
													color: '#888',
													marginBottom: 3,
													lineHeight: 1.6,
												}}
											>
												{item}
											</li>
										))}
									</ul>
								</div>

								<form
									onSubmit={handleDeleteAccount}
									style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
								>
									<PasswordField
										label='Confirm your password'
										id='delete-pw'
										value={deletePassword}
										onChange={setDeletePassword}
										placeholder='Enter your password'
										autoComplete='current-password'
									/>
									<div>
										<label
											htmlFor='delete-confirm'
											style={{
												display: 'block',
												fontSize: 11,
												fontWeight: 700,
												color: '#666',
												textTransform: 'uppercase',
												letterSpacing: '1px',
												marginBottom: 7,
											}}
										>
											Type{' '}
											<span
												style={{ color: '#e63946', fontFamily: 'monospace' }}
											>
												DELETE
											</span>{' '}
											to confirm
										</label>
										<input
											id='delete-confirm'
											type='text'
											value={deleteConfirmText}
											onChange={e => setDeleteConfirmText(e.target.value)}
											placeholder='DELETE'
											style={{
												width: '100%',
												padding: '12px 14px',
												background: '#111',
												border: `1px solid ${deleteConfirmText === 'DELETE' ? '#e63946' : '#1e1e1e'}`,
												borderRadius: 10,
												color: '#fff',
												fontSize: 14,
												outline: 'none',
												fontFamily: 'monospace',
												boxSizing: 'border-box',
												transition: 'border-color 0.2s',
											}}
										/>
									</div>
									<ErrorBox msg={deleteError} />
									<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
										<button
											type='submit'
											disabled={!canDelete}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												padding: '11px 22px',
												borderRadius: 10,
												border: canDelete
													? '1px solid rgba(230,57,70,0.4)'
													: '1px solid transparent',
												background: canDelete
													? 'rgba(230,57,70,0.15)'
													: '#2a2a2a',
												color: canDelete ? '#e63946' : '#555',
												fontSize: 13,
												fontWeight: 700,
												cursor: canDelete ? 'pointer' : 'not-allowed',
												fontFamily: 'inherit',
												transition: 'all 0.15s',
											}}
											onMouseEnter={e => {
												if (canDelete) {
													e.currentTarget.style.background = '#e63946'
													e.currentTarget.style.color = '#fff'
												}
											}}
											onMouseLeave={e => {
												if (canDelete) {
													e.currentTarget.style.background =
														'rgba(230,57,70,0.15)'
													e.currentTarget.style.color = '#e63946'
												}
											}}
										>
											{deleteLoading && <Spinner size={13} color='#e63946' />}
											{deleteLoading
												? 'Deleting account…'
												: 'Permanently delete my account'}
										</button>
									</div>
								</form>
							</div>
						</Card>
					)}
				</div>
			</div>
		</UserLayout>
	)
}
