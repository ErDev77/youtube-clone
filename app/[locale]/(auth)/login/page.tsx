'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showPass, setShowPass] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await res.json()
			if (!res.ok) {
				setError(data.error || 'Invalid credentials')
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
					min-height: 100vh;
					background: #0a0a0a;
					display: flex;
					font-family: 'DM Sans', sans-serif;
					position: relative;
					overflow: hidden;
				}

				/* Left decorative panel */
				.auth-left {
					width: 52%;
					position: relative;
					display: flex;
					flex-direction: column;
					justify-content: center;
					padding: 60px;
					background: linear-gradient(135deg, #0d0d0d 0%, #111 100%);
					border-right: 1px solid #1a1a1a;
					overflow: hidden;
				}

				.auth-left::before {
					content: '';
					position: absolute;
					top: -200px; left: -200px;
					width: 600px; height: 600px;
					background: radial-gradient(circle, rgba(255,50,50,0.08) 0%, transparent 70%);
					pointer-events: none;
				}

				.auth-left::after {
					content: '';
					position: absolute;
					bottom: -150px; right: -100px;
					width: 400px; height: 400px;
					background: radial-gradient(circle, rgba(255,80,50,0.06) 0%, transparent 70%);
					pointer-events: none;
				}

				.brand-mark {
					display: flex;
					align-items: center;
					gap: 10px;
					margin-bottom: 80px;
					position: relative;
					z-index: 1;
				}

				.brand-icon {
					width: 36px; height: 36px;
					background: #e63946;
					border-radius: 8px;
					display: flex; align-items: center; justify-content: center;
				}

				.brand-icon svg { width: 18px; height: 18px; fill: white; }

				.brand-name {
					font-family: 'DM Serif Display', serif;
					font-size: 22px;
					color: #fff;
					letter-spacing: -0.3px;
				}

				.hero-text {
					position: relative;
					z-index: 1;
				}

				.hero-label {
					font-size: 11px;
					font-weight: 500;
					letter-spacing: 2.5px;
					text-transform: uppercase;
					color: #e63946;
					margin-bottom: 20px;
				}

				.hero-heading {
					font-family: 'DM Serif Display', serif;
					font-size: 52px;
					line-height: 1.08;
					color: #fff;
					margin-bottom: 24px;
				}

				.hero-sub {
					font-size: 15px;
					color: #666;
					line-height: 1.7;
					max-width: 380px;
				}

				/* Decorative grid */
				.deco-grid {
					position: absolute;
					bottom: 60px; left: 60px;
					display: grid;
					grid-template-columns: repeat(8, 1fr);
					gap: 8px;
					opacity: 0.15;
				}

				.deco-dot {
					width: 3px; height: 3px;
					border-radius: 50%;
					background: #666;
				}

				/* Right form panel */
				.auth-right {
					flex: 1;
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					padding: 60px 48px;
					background: #0a0a0a;
				}

				.form-card {
					width: 100%;
					max-width: 380px;
				}

				.form-header {
					margin-bottom: 36px;
				}

				.form-title {
					font-family: 'DM Serif Display', serif;
					font-size: 30px;
					color: #fff;
					margin-bottom: 8px;
				}

				.form-subtitle {
					font-size: 14px;
					color: #555;
				}

				.form-subtitle a {
					color: #e63946;
					text-decoration: none;
					font-weight: 500;
				}

				.form-subtitle a:hover { text-decoration: underline; }

				/* Fields */
				.field {
					margin-bottom: 16px;
				}

				.field-label {
					display: block;
					font-size: 12px;
					font-weight: 500;
					letter-spacing: 0.5px;
					color: #888;
					margin-bottom: 8px;
					text-transform: uppercase;
				}

				.field-wrap {
					position: relative;
				}

				.field-input {
					width: 100%;
					background: #111;
					border: 1px solid #222;
					border-radius: 10px;
					padding: 13px 16px;
					font-size: 14px;
					font-family: 'DM Sans', sans-serif;
					color: #fff;
					outline: none;
					transition: border-color 0.2s, box-shadow 0.2s;
					-webkit-appearance: none;
				}

				.field-input::placeholder { color: #333; }

				.field-input:focus {
					border-color: #e63946;
					box-shadow: 0 0 0 3px rgba(230,57,70,0.1);
				}

				.field-input.has-toggle { padding-right: 46px; }

				.toggle-btn {
					position: absolute;
					right: 14px; top: 50%;
					transform: translateY(-50%);
					background: none;
					border: none;
					cursor: pointer;
					color: #444;
					display: flex; align-items: center; justify-content: center;
					padding: 4px;
					transition: color 0.15s;
				}
				.toggle-btn:hover { color: #888; }
				.toggle-btn svg { width: 17px; height: 17px; }

				/* Error */
				.error-msg {
					background: rgba(230,57,70,0.08);
					border: 1px solid rgba(230,57,70,0.25);
					border-radius: 8px;
					padding: 10px 14px;
					font-size: 13px;
					color: #e63946;
					margin-bottom: 20px;
				}

				/* Submit */
				.submit-btn {
					width: 100%;
					padding: 14px;
					background: #e63946;
					color: #fff;
					font-family: 'DM Sans', sans-serif;
					font-size: 15px;
					font-weight: 600;
					border: none;
					border-radius: 10px;
					cursor: pointer;
					margin-top: 8px;
					transition: background 0.2s, transform 0.1s;
					position: relative;
					overflow: hidden;
				}

				.submit-btn:hover:not(:disabled) { background: #c62e3b; }
				.submit-btn:active:not(:disabled) { transform: scale(0.985); }
				.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

				.spinner {
					display: inline-block;
					width: 16px; height: 16px;
					border: 2px solid rgba(255,255,255,0.3);
					border-top-color: #fff;
					border-radius: 50%;
					animation: spin 0.7s linear infinite;
					vertical-align: middle;
					margin-right: 8px;
				}

				@keyframes spin { to { transform: rotate(360deg); } }

				.divider {
					display: flex;
					align-items: center;
					gap: 12px;
					margin: 24px 0;
				}

				.divider-line {
					flex: 1;
					height: 1px;
					background: #1c1c1c;
				}

				.divider-text {
					font-size: 12px;
					color: #444;
				}

				.forgot-link {
					display: block;
					text-align: right;
					font-size: 12px;
					color: #555;
					text-decoration: none;
					margin-top: 6px;
					transition: color 0.15s;
				}
				.forgot-link:hover { color: #e63946; }

				@media (max-width: 768px) {
					.auth-left { display: none; }
					.auth-right { padding: 40px 24px; }
				}
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
					<p className='hero-label'>Welcome back</p>
					<h1 className='hero-heading'>
						Your stage
						<br />
						awaits you.
					</h1>
					<p className='hero-sub'>
						Sign in to access your videos, playlists, subscriptions, and watch
						history all in one place.
					</p>
				</div>

				<div className='deco-grid'>
					{Array.from({ length: 48 }).map((_, i) => (
						<div key={i} className='deco-dot' />
					))}
				</div>
			</div>

			{/* Right form */}
			<div className='auth-right'>
				<div className='form-card'>
					<div className='form-header'>
						<h2 className='form-title'>Sign in</h2>
						<p className='form-subtitle'>
							No account? <Link href='/en/register'>Create one for free</Link>
						</p>
					</div>

					<form onSubmit={handleSubmit} noValidate>
						{error && <div className='error-msg'>{error}</div>}

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

						<div className='field'>
							<label className='field-label' htmlFor='password'>
								Password
							</label>
							<div className='field-wrap'>
								<input
									id='password'
									type={showPass ? 'text' : 'password'}
									className='field-input has-toggle'
									placeholder='••••••••'
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
									autoComplete='current-password'
								/>
								<button
									type='button'
									className='toggle-btn'
									onClick={() => setShowPass(v => !v)}
									tabIndex={-1}
									aria-label={showPass ? 'Hide password' : 'Show password'}
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
							<a href='#' className='forgot-link'>
								Forgot password?
							</a>
						</div>

						<button type='submit' className='submit-btn' disabled={loading}>
							{loading && <span className='spinner' />}
							{loading ? 'Signing in…' : 'Sign in'}
						</button>
					</form>

					<div className='divider'>
						<div className='divider-line' />
						<span className='divider-text'>or continue with</span>
						<div className='divider-line' />
					</div>

					<p
						style={{
							textAlign: 'center',
							fontSize: 12,
							color: '#333',
							lineHeight: 1.6,
						}}
					>
						By signing in, you agree to our{' '}
						<a href='#' style={{ color: '#555', textDecoration: 'none' }}>
							Terms
						</a>{' '}
						and{' '}
						<a href='#' style={{ color: '#555', textDecoration: 'none' }}>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	)
}
