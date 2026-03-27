'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface VideoPlayerProps {
	src: string
	poster?: string | null
	title?: string
	onTimeUpdate?: (currentTime: number, duration: number) => void
}

const QUALITY_LEVELS = [
	'Auto',
	'1080p',
	'720p',
	'480p',
	'360p',
	'240p',
] as const
type Quality = (typeof QUALITY_LEVELS)[number]

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
type Speed = (typeof SPEEDS)[number]

/* ─────────────────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────────────────── */

function formatTime(s: number): string {
	if (!isFinite(s) || isNaN(s)) return '0:00'
	const h = Math.floor(s / 3600)
	const m = Math.floor((s % 3600) / 60)
	const sec = Math.floor(s % 60)
	if (h > 0)
		return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
	return `${m}:${String(sec).padStart(2, '0')}`
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG ICONS (inline for zero dependency)
───────────────────────────────────────────────────────────────────────────── */

const PlayIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='24' height='24'>
		<path d='M8 5v14l11-7z' />
	</svg>
)
const PauseIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='24' height='24'>
		<path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
	</svg>
)
const VolumeHighIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' />
	</svg>
)
const VolumeLowIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z' />
	</svg>
)
const VolumeOffIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z' />
	</svg>
)
const FullscreenIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z' />
	</svg>
)
const ExitFullscreenIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z' />
	</svg>
)
const TheaterIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z' />
	</svg>
)
const SettingsIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z' />
	</svg>
)
const PipIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='20' height='20'>
		<path d='M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.99 2 1.99h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z' />
	</svg>
)
const ReplayIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='22' height='22'>
		<path d='M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' />
	</svg>
)
const Skip10Icon = ({ dir }: { dir: 'back' | 'forward' }) => (
	<svg viewBox='0 0 24 24' fill='currentColor' width='22' height='22'>
		{dir === 'back' ? (
			<path d='M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11H10v-3.26L9 13.14v-.87l1.85-.66h.05V16zm4.28-1.44c0 .93-.17 1.61-.52 2.05-.35.44-.87.66-1.58.66s-1.23-.22-1.58-.66c-.35-.43-.52-1.1-.52-2.02v-1.07c0-.93.17-1.61.52-2.05.35-.44.88-.66 1.58-.66s1.23.22 1.58.65c.35.43.52 1.1.52 2.03v1.07zm-.92-1.2c0-.58-.07-1-.2-1.26-.13-.26-.34-.39-.64-.39s-.49.13-.62.38-.2.66-.2 1.22v1.31c0 .58.07 1.01.2 1.28s.34.4.64.4.49-.13.62-.39.2-.69.2-1.25v-1.3z' />
		) : (
			<path d='M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8zm-1.1 11H10v-3.26L9 13.14v-.87l1.85-.66h.05V16zm4.28-1.44c0 .93-.17 1.61-.52 2.05-.35.44-.87.66-1.58.66s-1.23-.22-1.58-.66c-.35-.43-.52-1.1-.52-2.02v-1.07c0-.93.17-1.61.52-2.05.35-.44.88-.66 1.58-.66s1.23.22 1.58.65c.35.43.52 1.1.52 2.03v1.07zm-.92-1.2c0-.58-.07-1-.2-1.26-.13-.26-.34-.39-.64-.39s-.49.13-.62.38-.2.66-.2 1.22v1.31c0 .58.07 1.01.2 1.28s.34.4.64.4.49-.13.62-.39.2-.69.2-1.25v-1.3z' />
		)}
	</svg>
)

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function VideoPlayer({
	src,
	poster,
	title,
	onTimeUpdate,
}: VideoPlayerProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const videoRef = useRef<HTMLVideoElement>(null)
	const progressRef = useRef<HTMLDivElement>(null)
	const volumeRef = useRef<HTMLDivElement>(null)
	const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	// Playback state
	const [playing, setPlaying] = useState(false)
	const [ended, setEnded] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [buffered, setBuffered] = useState(0)
	const [volume, setVolume] = useState(1)
	const [muted, setMuted] = useState(false)
	const [playbackSpeed, setPlaybackSpeed] = useState<Speed>(1)

	// UI state
	const [controlsVisible, setControlsVisible] = useState(true)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isTheater, setIsTheater] = useState(false)
	const [isPip, setIsPip] = useState(false)
	const [quality, setQuality] = useState<Quality>('Auto')

	// Panel state
	const [showSettings, setShowSettings] = useState(false)
	const [settingsPanel, setSettingsPanel] = useState<
		'main' | 'speed' | 'quality'
	>('main')
	const [showVolumeSlider, setShowVolumeSlider] = useState(false)

	// Seeking
	const [seeking, setSeeking] = useState(false)
	const [hoverTime, setHoverTime] = useState<number | null>(null)
	const [hoverX, setHoverX] = useState(0)

	// Flash overlay for keyboard actions
	const [flashLabel, setFlashLabel] = useState('')
	const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	function flash(label: string) {
		setFlashLabel(label)
		clearTimeout(flashTimer.current)
		flashTimer.current = setTimeout(() => setFlashLabel(''), 700)
	}

	/* ── Controls auto-hide ── */
	const showControls = useCallback(() => {
		setControlsVisible(true)
		clearTimeout(hideControlsTimer.current)
		hideControlsTimer.current = setTimeout(() => {
			if (!showSettings) setControlsVisible(false)
		}, 3000)
	}, [showSettings])

	/* ── Video event handlers ── */
	useEffect(() => {
		const vid = videoRef.current
		if (!vid) return

		const onPlay = () => {
			setPlaying(true)
			setEnded(false)
		}
		const onPause = () => setPlaying(false)
		const onEnded = () => {
			setPlaying(false)
			setEnded(true)
		}
		const onTimeUpdate = () => {
			setCurrentTime(vid.currentTime)
			if (vid.buffered.length > 0)
				setBuffered(vid.buffered.end(vid.buffered.length - 1))
		}
		const onDurationChange = () => setDuration(vid.duration)
		const onVolumeChange = () => {
			setVolume(vid.volume)
			setMuted(vid.muted)
		}
		const onFullscreenChange = () =>
			setIsFullscreen(!!document.fullscreenElement)
		const onPipEnter = () => setIsPip(true)
		const onPipExit = () => setIsPip(false)

		vid.addEventListener('play', onPlay)
		vid.addEventListener('pause', onPause)
		vid.addEventListener('ended', onEnded)
		vid.addEventListener('timeupdate', onTimeUpdate)
		vid.addEventListener('durationchange', onDurationChange)
		vid.addEventListener('volumechange', onVolumeChange)
		vid.addEventListener('enterpictureinpicture', onPipEnter)
		vid.addEventListener('leavepictureinpicture', onPipExit)
		document.addEventListener('fullscreenchange', onFullscreenChange)

		return () => {
			vid.removeEventListener('play', onPlay)
			vid.removeEventListener('pause', onPause)
			vid.removeEventListener('ended', onEnded)
			vid.removeEventListener('timeupdate', onTimeUpdate)
			vid.removeEventListener('durationchange', onDurationChange)
			vid.removeEventListener('volumechange', onVolumeChange)
			vid.removeEventListener('enterpictureinpicture', onPipEnter)
			vid.removeEventListener('leavepictureinpicture', onPipExit)
			document.removeEventListener('fullscreenchange', onFullscreenChange)
		}
	}, [])

	/* ── Keyboard shortcuts ── */
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			// Don't fire if user is typing
			const tag = (e.target as HTMLElement).tagName
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

			const vid = videoRef.current
			if (!vid) return

			switch (e.key) {
				case ' ':
				case 'k':
					e.preventDefault()
					if (vid.paused) {
						vid.play()
						flash('▶')
					} else {
						vid.pause()
						flash('⏸')
					}
					break
				case 'ArrowRight':
					e.preventDefault()
					vid.currentTime = Math.min(vid.currentTime + 10, vid.duration)
					flash('+10s')
					break
				case 'ArrowLeft':
					e.preventDefault()
					vid.currentTime = Math.max(vid.currentTime - 10, 0)
					flash('-10s')
					break
				case 'ArrowUp':
					e.preventDefault()
					vid.volume = Math.min(vid.volume + 0.1, 1)
					flash(`🔊 ${Math.round(vid.volume * 100)}%`)
					break
				case 'ArrowDown':
					e.preventDefault()
					vid.volume = Math.max(vid.volume - 0.1, 0)
					flash(`🔉 ${Math.round(vid.volume * 100)}%`)
					break
				case 'm':
					vid.muted = !vid.muted
					flash(vid.muted ? '🔇' : '🔊')
					break
				case 'f':
					toggleFullscreen()
					break
				case 't':
					setIsTheater(v => !v)
					break
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [])

	/* ── Playback speed ── */
	useEffect(() => {
		const vid = videoRef.current
		if (vid) vid.playbackRate = playbackSpeed
	}, [playbackSpeed])

	/* ── Play/Pause ── */
	function togglePlay() {
		const vid = videoRef.current
		if (!vid) return
		if (ended) {
			vid.currentTime = 0
			vid.play()
			return
		}
		if (vid.paused) vid.play()
		else vid.pause()
	}

	/* ── Volume ── */
	function handleVolumeClick(e: React.MouseEvent<HTMLDivElement>) {
		const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
		const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
		const vid = videoRef.current
		if (!vid) return
		vid.volume = ratio
		vid.muted = ratio === 0
	}

	function toggleMute() {
		const vid = videoRef.current
		if (!vid) return
		vid.muted = !vid.muted
	}

	/* ── Progress bar ── */
	function getProgressRatio(e: React.MouseEvent<HTMLDivElement>): number {
		const rect = progressRef.current!.getBoundingClientRect()
		return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
	}

	function onProgressMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const ratio = getProgressRatio(e)
		setHoverTime(ratio * duration)
		setHoverX(e.clientX - progressRef.current!.getBoundingClientRect().left)
		if (seeking) {
			const vid = videoRef.current
			if (vid) vid.currentTime = ratio * duration
		}
	}

	function onProgressMouseDown(e: React.MouseEvent<HTMLDivElement>) {
		setSeeking(true)
		const ratio = getProgressRatio(e)
		const vid = videoRef.current
		if (vid) vid.currentTime = ratio * duration
	}

	function onProgressMouseUp() {
		setSeeking(false)
	}

	function onProgressMouseLeave() {
		setHoverTime(null)
		if (seeking) setSeeking(false)
	}

	/* ── Fullscreen ── */
	function toggleFullscreen() {
		const el = containerRef.current
		if (!el) return
		if (!document.fullscreenElement) el.requestFullscreen?.()
		else document.exitFullscreen?.()
	}

	/* ── Picture-in-Picture ── */
	async function togglePip() {
		const vid = videoRef.current
		if (!vid) return
		try {
			if (document.pictureInPictureElement)
				await document.exitPictureInPicture()
			else await vid.requestPictureInPicture()
		} catch {}
	}

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0
	const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0
	const effectiveVolume = muted ? 0 : volume

	/* ── Theater mode class is applied to the container ── */
	const containerStyle: React.CSSProperties = {
		position: 'relative',
		width: '100%',
		background: '#000',
		borderRadius: isFullscreen ? 0 : 12,
		overflow: 'hidden',
		aspectRatio: isTheater ? undefined : '16 / 9',
		height: isTheater && !isFullscreen ? '70vh' : undefined,
		boxShadow: isFullscreen ? 'none' : '0 4px 40px rgba(0,0,0,0.7)',
		userSelect: 'none',
		cursor: controlsVisible ? 'default' : 'none',
	}

	return (
		<>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

        .vp-root * { box-sizing: border-box; }

        .vp-controls-gradient {
          background: linear-gradient(to top,
            rgba(0,0,0,0.92) 0%,
            rgba(0,0,0,0.5) 40%,
            transparent 100%
          );
        }

        .vp-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .vp-btn:hover { background: rgba(255,255,255,0.12); transform: scale(1.08); }
        .vp-btn:active { transform: scale(0.95); }

        .vp-progress-root {
          position: relative;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.18);
          cursor: pointer;
          transition: height 0.15s;
          flex: 1;
        }
        .vp-progress-root:hover { height: 6px; }

        .vp-progress-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #e63946;
          pointer-events: none;
          transition: transform 0.15s;
          z-index: 2;
        }
        .vp-progress-root:hover .vp-progress-thumb { transform: translate(-50%, -50%) scale(1); }

        .vp-volume-bar {
          position: relative;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.2);
          cursor: pointer;
          width: 80px;
          transition: height 0.15s;
        }
        .vp-volume-bar:hover { height: 6px; }

        .vp-settings-panel {
          position: absolute;
          bottom: 60px;
          right: 8px;
          background: rgba(16,16,16,0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          min-width: 220px;
          overflow: hidden;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          z-index: 100;
          animation: vp-popup 0.15s ease;
        }

        .vp-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          font-size: 13px;
          color: #ddd;
          cursor: pointer;
          transition: background 0.1s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Mono', monospace;
        }
        .vp-menu-item:hover { background: rgba(255,255,255,0.06); }
        .vp-menu-item.active { color: #e63946; }

        .vp-menu-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px 8px;
          font-size: 11px;
          font-weight: 600;
          color: #555;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-family: 'DM Mono', monospace;
        }

        .vp-time {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .vp-hover-time {
          position: absolute;
          bottom: calc(100% + 8px);
          transform: translateX(-50%);
          background: rgba(0,0,0,0.85);
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 7px;
          border-radius: 4px;
          pointer-events: none;
          white-space: nowrap;
        }

        .vp-flash {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.6);
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 20px;
          font-weight: 600;
          padding: 12px 22px;
          border-radius: 10px;
          pointer-events: none;
          z-index: 50;
          backdrop-filter: blur(4px);
          animation: vp-flash-anim 0.7s ease forwards;
        }

        @keyframes vp-popup {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vp-flash-anim {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          60%  { opacity: 1; transform: translate(-50%,-50%) scale(1.05); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(0.95); }
        }
        @keyframes vp-spin { to { transform: rotate(360deg); } }

        .vp-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(230,57,70,0.2);
          color: #e63946;
          border: 1px solid rgba(230,57,70,0.3);
        }
      `}</style>

			<div
				ref={containerRef}
				className='vp-root'
				style={containerStyle}
				onMouseMove={showControls}
				onMouseLeave={() => {
					if (playing && !showSettings) setControlsVisible(false)
				}}
				onClick={e => {
					// Click on container (not controls) toggles play
					if ((e.target as HTMLElement).closest('[data-controls]')) return
					togglePlay()
				}}
			>
				{/* VIDEO ELEMENT */}
				<video
					ref={videoRef}
					src={src}
					poster={poster || undefined}
					preload='metadata'
					style={{
						width: '100%',
						height: '100%',
						display: 'block',
						background: '#000',
					}}
				/>

				{/* FLASH LABEL */}
				{flashLabel && (
					<div key={flashLabel + Date.now()} className='vp-flash'>
						{flashLabel}
					</div>
				)}

				{/* BIG CENTER PLAY BUTTON (shown when paused + not ended) */}
				{!playing && !ended && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							pointerEvents: 'none',
						}}
					>
						<div
							style={{
								width: 72,
								height: 72,
								borderRadius: '50%',
								background: 'rgba(230,57,70,0.92)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 4px 24px rgba(230,57,70,0.5)',
								transition: 'transform 0.15s',
							}}
						>
							<svg
								viewBox='0 0 24 24'
								fill='#fff'
								width='34'
								height='34'
								style={{ marginLeft: 4 }}
							>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					</div>
				)}

				{/* REPLAY BUTTON */}
				{ended && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'rgba(0,0,0,0.5)',
						}}
					>
						<button
							onClick={e => {
								e.stopPropagation()
								const v = videoRef.current
								if (v) {
									v.currentTime = 0
									v.play()
								}
							}}
							style={{
								width: 80,
								height: 80,
								borderRadius: '50%',
								background: 'rgba(230,57,70,0.92)',
								border: 'none',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 4px 32px rgba(230,57,70,0.5)',
								transition: 'transform 0.15s, box-shadow 0.15s',
								color: '#fff',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.transform = 'scale(1.08)'
								e.currentTarget.style.boxShadow =
									'0 6px 40px rgba(230,57,70,0.7)'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.transform = 'scale(1)'
								e.currentTarget.style.boxShadow =
									'0 4px 32px rgba(230,57,70,0.5)'
							}}
						>
							<ReplayIcon />
						</button>
					</div>
				)}

				{/* CONTROLS OVERLAY */}
				<div
					data-controls
					className='vp-controls-gradient'
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						padding: '48px 16px 14px',
						opacity: controlsVisible || !playing ? 1 : 0,
						transition: 'opacity 0.3s ease',
						pointerEvents: controlsVisible || !playing ? 'all' : 'none',
					}}
					onClick={e => e.stopPropagation()}
				>
					{/* ── PROGRESS BAR ── */}
					<div
						ref={progressRef}
						className='vp-progress-root'
						style={{ marginBottom: 10 }}
						onMouseDown={onProgressMouseDown}
						onMouseMove={onProgressMouseMove}
						onMouseUp={onProgressMouseUp}
						onMouseLeave={onProgressMouseLeave}
					>
						{/* Buffered */}
						<div
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								bottom: 0,
								width: `${bufferedPct}%`,
								background: 'rgba(255,255,255,0.25)',
								borderRadius: 2,
								pointerEvents: 'none',
							}}
						/>
						{/* Played */}
						<div
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								bottom: 0,
								width: `${progress}%`,
								background: 'linear-gradient(90deg, #e63946, #ff6b7a)',
								borderRadius: 2,
								pointerEvents: 'none',
								boxShadow: '0 0 8px rgba(230,57,70,0.6)',
							}}
						/>
						{/* Thumb */}
						<div
							className='vp-progress-thumb'
							style={{ left: `${progress}%` }}
						/>
						{/* Hover time tooltip */}
						{hoverTime !== null && (
							<div className='vp-hover-time' style={{ left: hoverX }}>
								{formatTime(hoverTime)}
							</div>
						)}
					</div>

					{/* ── BOTTOM CONTROLS ROW ── */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
						{/* Play/Pause */}
						<button
							className='vp-btn'
							onClick={togglePlay}
							title={playing ? 'Pause (k)' : 'Play (k)'}
						>
							{playing ? <PauseIcon /> : <PlayIcon />}
						</button>

						{/* Skip -10 */}
						<button
							className='vp-btn'
							onClick={() => {
								const v = videoRef.current
								if (v) {
									v.currentTime = Math.max(0, v.currentTime - 10)
									flash('-10s')
								}
							}}
							title='Back 10s (←)'
						>
							<Skip10Icon dir='back' />
						</button>

						{/* Skip +10 */}
						<button
							className='vp-btn'
							onClick={() => {
								const v = videoRef.current
								if (v) {
									v.currentTime = Math.min(v.duration, v.currentTime + 10)
									flash('+10s')
								}
							}}
							title='Forward 10s (→)'
						>
							<Skip10Icon dir='forward' />
						</button>

						{/* Volume group */}
						<div
							style={{ display: 'flex', alignItems: 'center', gap: 6 }}
							onMouseEnter={() => setShowVolumeSlider(true)}
							onMouseLeave={() => setShowVolumeSlider(false)}
						>
							<button className='vp-btn' onClick={toggleMute} title='Mute (m)'>
								{effectiveVolume === 0 ? (
									<VolumeOffIcon />
								) : effectiveVolume < 0.5 ? (
									<VolumeLowIcon />
								) : (
									<VolumeHighIcon />
								)}
							</button>
							<div
								style={{
									overflow: 'hidden',
									width: showVolumeSlider ? 84 : 0,
									transition: 'width 0.2s ease',
									display: 'flex',
									alignItems: 'center',
								}}
							>
								<div
									ref={volumeRef}
									className='vp-volume-bar'
									onClick={handleVolumeClick}
									title='Volume'
								>
									<div
										style={{
											position: 'absolute',
											left: 0,
											top: 0,
											bottom: 0,
											width: `${effectiveVolume * 100}%`,
											background: 'linear-gradient(90deg, #e63946, #ff6b7a)',
											borderRadius: 2,
											boxShadow: '0 0 6px rgba(230,57,70,0.5)',
										}}
									/>
									<div
										style={{
											position: 'absolute',
											top: '50%',
											transform: 'translate(-50%,-50%)',
											left: `${effectiveVolume * 100}%`,
											width: 10,
											height: 10,
											borderRadius: '50%',
											background: '#fff',
											boxShadow: '0 0 4px rgba(0,0,0,0.5)',
										}}
									/>
								</div>
							</div>
						</div>

						{/* Time */}
						<div className='vp-time' style={{ marginLeft: 4 }}>
							{formatTime(currentTime)}
							<span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>
								/
							</span>
							{formatTime(duration)}
						</div>

						{/* Speed badge */}
						{playbackSpeed !== 1 && (
							<div className='vp-badge'>{playbackSpeed}×</div>
						)}

						<div style={{ flex: 1 }} />

						{/* PiP */}
						{typeof document !== 'undefined' &&
							'pictureInPictureEnabled' in document && (
								<button
									className='vp-btn'
									onClick={e => {
										e.stopPropagation()
										togglePip()
									}}
									title='Picture in Picture'
								>
									<PipIcon />
								</button>
							)}

						{/* Theater mode */}
						<button
							className='vp-btn'
							onClick={e => {
								e.stopPropagation()
								setIsTheater(v => !v)
							}}
							title='Theater mode (t)'
							style={{ color: isTheater ? '#e63946' : '#fff' }}
						>
							<TheaterIcon />
						</button>

						{/* Settings */}
						<div style={{ position: 'relative' }}>
							<button
								className='vp-btn'
								onClick={e => {
									e.stopPropagation()
									setShowSettings(v => !v)
									setSettingsPanel('main')
								}}
								title='Settings'
								style={{
									color: showSettings ? '#e63946' : '#fff',
									animation: showSettings ? 'none' : undefined,
								}}
							>
								<div
									style={{
										animation: showSettings
											? 'vp-spin 3s linear infinite'
											: 'none',
									}}
								>
									<SettingsIcon />
								</div>
							</button>

							{/* SETTINGS PANEL */}
							{showSettings && (
								<div
									className='vp-settings-panel'
									onClick={e => e.stopPropagation()}
								>
									{settingsPanel === 'main' && (
										<>
											<div className='vp-menu-header'>Settings</div>
											<button
												className='vp-menu-item'
												onClick={() => setSettingsPanel('speed')}
											>
												<span
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 10,
													}}
												>
													<svg
														width='16'
														height='16'
														viewBox='0 0 24 24'
														fill='currentColor'
														style={{ opacity: 0.6 }}
													>
														<path d='M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z' />
														<path d='M10.59 15.41a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z' />
													</svg>
													Playback speed
												</span>
												<span
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 6,
														color: '#888',
														fontSize: 12,
													}}
												>
													{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}×`}
													<svg
														width='14'
														height='14'
														viewBox='0 0 24 24'
														fill='currentColor'
													>
														<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
													</svg>
												</span>
											</button>
											<button
												className='vp-menu-item'
												onClick={() => setSettingsPanel('quality')}
											>
												<span
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 10,
													}}
												>
													<svg
														width='16'
														height='16'
														viewBox='0 0 24 24'
														fill='currentColor'
														style={{ opacity: 0.6 }}
													>
														<path d='M15 8H9c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 6h-4v-4h4v4zm7-6V6.5c0-.28-.22-.5-.5-.5H19V4.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V6h-2V4.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V6H11V4.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V6H7V4.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V6H3.5c-.28 0-.5.22-.5.5V8h1.5v2H3v2h1.5v2H3v2h1.5v1.5c0 .28.22.5.5.5H6V19.5c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5V18h2v1.5c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5V18h2v1.5c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5V18h1.5c.28 0 .5-.22.5-.5V16H20v-2h-1.5v-2H20v-2h-1.5V8H20c.55 0 1-.45 1-1z' />
													</svg>
													Quality
												</span>
												<span
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 6,
														color: '#888',
														fontSize: 12,
													}}
												>
													{quality}
													{quality === 'Auto' && (
														<span
															style={{
																fontSize: 10,
																background: 'rgba(42,157,143,0.2)',
																color: '#2a9d8f',
																padding: '1px 4px',
																borderRadius: 3,
																border: '1px solid rgba(42,157,143,0.3)',
															}}
														>
															HD
														</span>
													)}
													<svg
														width='14'
														height='14'
														viewBox='0 0 24 24'
														fill='currentColor'
													>
														<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
													</svg>
												</span>
											</button>
										</>
									)}

									{settingsPanel === 'speed' && (
										<>
											<div className='vp-menu-header'>
												<button
													onClick={() => setSettingsPanel('main')}
													style={{
														background: 'none',
														border: 'none',
														cursor: 'pointer',
														color: '#666',
														display: 'flex',
														padding: 0,
													}}
												>
													<svg
														width='16'
														height='16'
														viewBox='0 0 24 24'
														fill='currentColor'
													>
														<path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
													</svg>
												</button>
												Playback Speed
											</div>
											{SPEEDS.map(s => (
												<button
													key={s}
													className={`vp-menu-item ${playbackSpeed === s ? 'active' : ''}`}
													onClick={() => {
														setPlaybackSpeed(s)
														setShowSettings(false)
													}}
												>
													<span
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: 10,
														}}
													>
														{playbackSpeed === s && (
															<svg
																width='14'
																height='14'
																viewBox='0 0 24 24'
																fill='#e63946'
															>
																<path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
															</svg>
														)}
														{s === 1 ? 'Normal' : `${s}×`}
													</span>
													{s === 1.5 && (
														<span style={{ fontSize: 10, color: '#555' }}>
															popular
														</span>
													)}
												</button>
											))}
										</>
									)}

									{settingsPanel === 'quality' && (
										<>
											<div className='vp-menu-header'>
												<button
													onClick={() => setSettingsPanel('main')}
													style={{
														background: 'none',
														border: 'none',
														cursor: 'pointer',
														color: '#666',
														display: 'flex',
														padding: 0,
													}}
												>
													<svg
														width='16'
														height='16'
														viewBox='0 0 24 24'
														fill='currentColor'
													>
														<path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
													</svg>
												</button>
												Quality
											</div>
											{QUALITY_LEVELS.map(q => (
												<button
													key={q}
													className={`vp-menu-item ${quality === q ? 'active' : ''}`}
													onClick={() => {
														setQuality(q)
														setShowSettings(false)
													}}
												>
													<span
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: 10,
														}}
													>
														{quality === q && (
															<svg
																width='14'
																height='14'
																viewBox='0 0 24 24'
																fill='#e63946'
															>
																<path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
															</svg>
														)}
														{q}
													</span>
													{q === '1080p' && (
														<span
															style={{
																fontSize: 10,
																background: 'rgba(230,57,70,0.15)',
																color: '#e63946',
																padding: '1px 5px',
																borderRadius: 3,
																border: '1px solid rgba(230,57,70,0.25)',
															}}
														>
															HD
														</span>
													)}
													{q === 'Auto' && (
														<span style={{ fontSize: 10, color: '#666' }}>
															recommended
														</span>
													)}
												</button>
											))}
										</>
									)}
								</div>
							)}
						</div>

						{/* Fullscreen */}
						<button
							className='vp-btn'
							onClick={e => {
								e.stopPropagation()
								toggleFullscreen()
							}}
							title='Fullscreen (f)'
						>
							{isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
						</button>
					</div>
				</div>

				{/* KEYBOARD SHORTCUTS HINT (top-right, fades) */}
				{controlsVisible && !playing && (
					<div
						style={{
							position: 'absolute',
							top: 14,
							right: 14,
							display: 'flex',
							gap: 6,
							flexWrap: 'wrap',
							justifyContent: 'flex-end',
							opacity: 0.5,
							pointerEvents: 'none',
						}}
					>
						{[
							['Space', 'Play'],
							['← →', '10s'],
							['↑ ↓', 'Volume'],
							['F', 'Fullscreen'],
							['M', 'Mute'],
						].map(([k, v]) => (
							<div
								key={k}
								style={{ display: 'flex', alignItems: 'center', gap: 4 }}
							>
								<span
									style={{
										fontFamily: 'DM Mono, monospace',
										fontSize: 10,
										background: 'rgba(0,0,0,0.5)',
										border: '1px solid rgba(255,255,255,0.15)',
										padding: '2px 5px',
										borderRadius: 4,
										color: '#ccc',
									}}
								>
									{k}
								</span>
								<span
									style={{
										fontFamily: 'DM Mono, monospace',
										fontSize: 10,
										color: '#888',
									}}
								>
									{v}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}
