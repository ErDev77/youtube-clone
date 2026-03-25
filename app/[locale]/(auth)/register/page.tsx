'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showPass, setShowPass] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const strength = (() => {
		if (!password) return 0
		let s = 0
		if (password.length >= 8) s++
		if (/[A-Z]/.test(password)) s++
		if (/[0-9]/.test(password)) s++
		if (/[^A-Za-z0-9]/.test(password)) s++
		return s
	})()

	const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
	const strengthColor = ['', '#e63946', '#f4a261', '#2a9d8f', '#57cc99'][
		strength
	]

	// live username validation feedback
	const usernameValid = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/.test(username)
	const usernameHint =
		username.length === 0
			? ''
			: !usernameValid
				? '3–30 chars, letters/numbers/_ or - only'
				: '✓ Looks good'

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError('')

		if (!username.trim()) {
			setError('Please choose a username.')
			return
		}
		if (!usernameValid) {
			setError(
				'Username must be 3–30 characters: letters, numbers, _ or - only.',
			)
			return
		}
		if (password !== confirm) {
			setError('Passwords do not match.')
			return
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters.')
			return
		}

		setLoading(true)
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					username: username.trim().toLowerCase(),
					password,
				}),
			})
			const data = await res.json()
			if (!res.ok) {
				setError(data.error || 'Registration failed.')
			} else {
				window.location.href = '/en'
			}
		} catch {
			setError('Something went wrong. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='auth-root'>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');
				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
				.auth-root {
					min-height: 100vh; background: #0a0a0a;
					display: flex; font-family: 'DM Sans', sans-serif;
					position: relative; overflow: hidden;
				}
				.auth-left {
					width: 52%; position: relative;
					display: flex; flex-direction: column; justify-content: center;
					padding: 60px;
					background: linear-gradient(135deg, #0d0d0d 0%, #111 100%);
					border-right: 1px solid #1a1a1a; overflow: hidden;
				}
				.auth-left::before {
					content: ''; position: absolute; top: -200px; left: -200px;
					width: 600px; height: 600px;
					background: radial-gradient(circle, rgba(255,50,50,0.08) 0%, transparent 70%);
					pointer-events: none;
				}
				.auth-left::after {
					content: ''; position: absolute; bottom: -150px; right: -100px;
					width: 400px; height: 400px;
					background: radial-gradient(circle, rgba(255,80,50,0.06) 0%, transparent 70%);
					pointer-events: none;
				}
				.brand-mark { display: flex; align-items: center; gap: 10px; margin-bottom: 80px; position: relative; z-index: 1; }
				.brand-icon { width: 36px; height: 36px; background: #e63946; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
				.brand-icon svg { width: 18px; height: 18px; fill: white; }
				.brand-name { font-family: 'DM Serif Display', serif; font-size: 22px; color: #fff; letter-spacing: -0.3px; }
				.hero-text { position: relative; z-index: 1; }
				.hero-label { font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: #e63946; margin-bottom: 20px; }
				.hero-heading { font-family: 'DM Serif Display', serif; font-size: 52px; line-height: 1.08; color: #fff; margin-bottom: 24px; }
				.hero-sub { font-size: 15px; color: #666; line-height: 1.7; max-width: 380px; }
				.perks { margin-top: 48px; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 1; }
				.perk { display: flex; align-items: flex-start; gap: 14px; }
				.perk-icon { width: 32px; height: 32px; background: rgba(230,57,70,0.1); border: 1px solid rgba(230,57,70,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
				.perk-icon svg { width: 15px; height: 15px; stroke: #e63946; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
				.perk-title { font-size: 14px; font-weight: 500; color: #ccc; }
				.perk-desc { font-size: 12px; color: #555; margin-top: 2px; }
				.auth-right { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 48px; background: #0a0a0a; }
				.form-card { width: 100%; max-width: 380px; }
				.form-header { margin-bottom: 28px; }
				.form-title { font-family: 'DM Serif Display', serif; font-size: 30px; color: #fff; margin-bottom: 8px; }
				.form-subtitle { font-size: 14px; color: #555; }
				.form-subtitle a { color: #e63946; text-decoration: none; font-weight: 500; }
				.form-subtitle a:hover { text-decoration: underline; }
				.field { margin-bottom: 14px; }
				.field-label { display: block; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; color: #888; margin-bottom: 8px; text-transform: uppercase; }
				.field-wrap { position: relative; }
				.field-input { width: 100%; background: #111; border: 1px solid #222; border-radius: 10px; padding: 13px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none; }
				.field-input::placeholder { color: #333; }
				.field-input:focus { border-color: #e63946; box-shadow: 0 0 0 3px rgba(230,57,70,0.1); }
				.field-input.has-toggle { padding-right: 46px; }
				.field-hint { font-size: 11px; margin-top: 5px; }
				.toggle-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #444; display: flex; align-items: center; justify-content: center; padding: 4px; transition: color 0.15s; }
				.toggle-btn:hover { color: #888; }
				.toggle-btn svg { width: 17px; height: 17px; }
				.strength-wrap { margin-top: 8px; }
				.strength-bars { display: flex; gap: 4px; margin-bottom: 4px; }
				.strength-bar { flex: 1; height: 3px; border-radius: 2px; background: #1e1e1e; transition: background 0.3s; }
				.strength-label { font-size: 11px; color: #555; text-align: right; }
				.error-msg { background: rgba(230,57,70,0.08); border: 1px solid rgba(230,57,70,0.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #e63946; margin-bottom: 16px; }
				.submit-btn { width: 100%; padding: 14px; background: #e63946; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; margin-top: 8px; transition: background 0.2s, transform 0.1s; }
				.submit-btn:hover:not(:disabled) { background: #c62e3b; }
				.submit-btn:active:not(:disabled) { transform: scale(0.985); }
				.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
				.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-right: 8px; }
				@keyframes spin { to { transform: rotate(360deg); } }
				.terms-note { text-align: center; font-size: 12px; color: #333; line-height: 1.6; margin-top: 20px; }
				.terms-note a { color: #555; text-decoration: none; }
				.terms-note a:hover { color: #888; }
				@media (max-width: 768px) { .auth-left { display: none; } .auth-right { padding: 40px 24px; } }
			`}</style>

			{/* Left panel */}
			<div className='auth-left'>
				<div className='brand-mark'>
					<div className='brand-icon'>
						<svg viewBox='0 0 24 24'>
							<path d='M8 5v14l11-7z' />
						</svg>
					</div>
					<span className='brand-name'>ArmTube</span>
				</div>
				<div className='hero-text'>
					<p className='hero-label'>Join ArmTube</p>
					<h1 className='hero-heading'>
						Create.
						<br />
						Share.
						<br />
						Connect.
					</h1>
					<p className='hero-sub'>
						Join thousands of creators and viewers on Armenia&apos;s premier
						video platform.
					</p>
				</div>
				<div className='perks'>
					{[
						{
							icon: (
								<>
									<path d='M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14' />
									<rect x='3' y='6' width='12' height='12' rx='2' />
								</>
							),
							title: 'Upload unlimited videos',
							desc: 'Share your content with the world instantly',
						},
						{
							icon: (
								<>
									<path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' />
									<circle cx='9' cy='7' r='4' />
									<path d='M23 21v-2a4 4 0 00-3-3.87' />
									<path d='M16 3.13a4 4 0 010 7.75' />
								</>
							),
							title: 'Build your community',
							desc: 'Subscribe to channels and connect with creators',
						},
						{
							icon: (
								<>
									<polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
								</>
							),
							title: 'Personalized experience',
							desc: 'Get recommendations based on what you love',
						},
					].map((p, i) => (
						<div key={i} className='perk'>
							<div className='perk-icon'>
								<svg viewBox='0 0 24 24'>{p.icon}</svg>
							</div>
							<div>
								<div className='perk-title'>{p.title}</div>
								<div className='perk-desc'>{p.desc}</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Right form */}
			<div className='auth-right'>
				<div className='form-card'>
					<div className='form-header'>
						<h2 className='form-title'>Create account</h2>
						<p className='form-subtitle'>
							Already have one? <Link href='/en/login'>Sign in</Link>
						</p>
					</div>

					<form onSubmit={handleSubmit} noValidate>
						{error && <div className='error-msg'>{error}</div>}

						{/* Email */}
						<div className='field'>
							<label className='field-label' htmlFor='email'>
								Email
							</label>
							<input
								id='email'
								type='email'
								className='field-input'
								placeholder='you@example.com'
								value={email}
								onChange={e => setEmail(e.target.value)}
								required
								autoComplete='email'
							/>
						</div>

						{/* Username */}
						<div className='field'>
							<label className='field-label' htmlFor='username'>
								Username
							</label>
							<input
								id='username'
								type='text'
								className='field-input'
								placeholder='e.g. cool_creator42'
								value={username}
								onChange={e =>
									setUsername(
										e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, ''),
									)
								}
								required
								autoComplete='username'
								maxLength={30}
							/>
							{usernameHint && (
								<p
									className='field-hint'
									style={{ color: usernameValid ? '#2a9d8f' : '#888' }}
								>
									{usernameHint}
								</p>
							)}
						</div>

						{/* Password */}
						<div className='field'>
							<label className='field-label' htmlFor='password'>
								Password
							</label>
							<div className='field-wrap'>
								<input
									id='password'
									type={showPass ? 'text' : 'password'}
									className='field-input has-toggle'
									placeholder='At least 8 characters'
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
									autoComplete='new-password'
								/>
								<button
									type='button'
									className='toggle-btn'
									onClick={() => setShowPass(v => !v)}
									tabIndex={-1}
								>
									{showPass ? (
										<svg
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
							</div>
							{password && (
								<div className='strength-wrap'>
									<div className='strength-bars'>
										{[1, 2, 3, 4].map(n => (
											<div
												key={n}
												className='strength-bar'
												style={{
													background: strength >= n ? strengthColor : '#1e1e1e',
												}}
											/>
										))}
									</div>
									<div
										className='strength-label'
										style={{ color: strengthColor }}
									>
										{strengthLabel}
									</div>
								</div>
							)}
						</div>

						{/* Confirm password */}
						<div className='field'>
							<label className='field-label' htmlFor='confirm'>
								Confirm password
							</label>
							<div className='field-wrap'>
								<input
									id='confirm'
									type={showConfirm ? 'text' : 'password'}
									className='field-input has-toggle'
									placeholder='••••••••'
									value={confirm}
									onChange={e => setConfirm(e.target.value)}
									required
									autoComplete='new-password'
									style={
										confirm && confirm !== password
											? { borderColor: '#e63946' }
											: {}
									}
								/>
								<button
									type='button'
									className='toggle-btn'
									onClick={() => setShowConfirm(v => !v)}
									tabIndex={-1}
								>
									{showConfirm ? (
										<svg
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
							</div>
						</div>

						<button type='submit' className='submit-btn' disabled={loading}>
							{loading && <span className='spinner' />}
							{loading ? 'Creating account…' : 'Create account'}
						</button>
					</form>

					<p className='terms-note'>
						By creating an account, you agree to our{' '}
						<a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>.
					</p>
				</div>
			</div>
		</div>
	)
}
