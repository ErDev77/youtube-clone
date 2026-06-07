'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import UserLayout from '@/app/_components/layout/UserLayout'
import PlaylistPicker from '@/app/_components/video/PlaylistPicker'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslations } from '@/translations/translations'

/* ─── Types ─── */
type VideoResult = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  video_url: string
  category: string | null
  video_type: 'normal' | 'shorts' | null
  views_count: number
  likes_count: number
  created_at: string
  uploader: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

type ChannelResult = {
	id: string
	username: string
	display_name: string | null
	avatar_url: string | null
	bio: string | null
	created_at: string
	subscribers_count?: number
	videos_count?: number
}

type FilterType = 'all' | 'video' | 'shorts' | 'channel'
type FilterDuration = 'any' | 'short' | 'medium' | 'long'
type FilterDate = 'any' | 'today' | 'week' | 'month' | 'year'
type FilterSort = 'relevant' | 'popular' | 'newest'

interface Filters {
  type: FilterType
  duration: FilterDuration
  date: FilterDate
  sort: FilterSort
}

/* ─── Helpers ─── */
function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function timeAgo(iso: string, t: any, language: string) {
	const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)

	if (s < 60) return t.justNow

	const getWord = (num: number, key: string) => {
		const val = t[key]
		if (language === 'ru' && Array.isArray(val)) {
			const abs = Math.abs(num) % 100
			const n = abs % 10
			if (abs > 10 && abs < 20) return val[2]
			if (n > 1 && n < 5) return val[1]
			if (n === 1) return val[0]
			return val[2]
		}
		return val || ''
	}

	// 1. Минуты
	if (s < 3600) {
		const num = Math.floor(s / 60)
		let unit = getWord(num, 'minute')
		if (language === 'en' && num === 1) unit = 'minute'
		return `${num} ${unit} ${t.ago}`
	}

	// 2. Часы
	if (s < 86400) {
		const num = Math.floor(s / 3600)
		let unit = getWord(num, 'hour')
		if (language === 'en' && num === 1) unit = 'hour'
		return `${num} ${unit} ${t.ago}`
	}

	// 3. Дни
	const d = Math.floor(s / 86400)
	if (d < 7) {
		let unit = getWord(d, 'day')
		if (language === 'en' && d === 1) unit = 'day'
		return `${d} ${unit} ${t.ago}`
	}

	// 4. Недели
	if (d < 30) {
		const num = Math.floor(d / 7)
		let unit = getWord(num, 'week')
		if (language === 'en' && num === 1) unit = 'week'
		return `${num} ${unit} ${t.ago}`
	}

	// 5. Месяцы
	if (d < 365) {
		const num = Math.floor(d / 30)
		let unit = getWord(num, 'month')
		if (language === 'en' && num === 1) unit = 'month'
		return `${num} ${unit} ${t.ago}`
	}

	// 6. Года
	const num = Math.floor(d / 365)
	let unit = getWord(num, 'year')
	if (language === 'en' && num === 1) unit = 'year'
	return `${num} ${unit} ${t.ago}`
}

function colorFromId(id: string) {
  const c = ['#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#f4a261']
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return c[Math.abs(h) % c.length]
}

function matchesDateFilter(iso: string, date: FilterDate): boolean {
  if (date === 'any') return true
  const now = Date.now()
  const t = new Date(iso).getTime()
  const diff = now - t
  if (date === 'today') return diff < 86400000
  if (date === 'week') return diff < 7 * 86400000
  if (date === 'month') return diff < 30 * 86400000
  if (date === 'year') return diff < 365 * 86400000
  return true
}


/* ─── Filter Modal ─── */
function FilterModal({
  filters,
  onApply,
  onClose,
}: {
  filters: Filters
  onApply: (f: Filters) => void
  onClose: () => void
}) {
  const [local, setLocal] = useState<Filters>({ ...filters })
  const backdropRef = useRef<HTMLDivElement>(null)

  function set<K extends keyof Filters>(key: K, val: Filters[K]) {
    setLocal(prev => ({ ...prev, [key]: val }))
  }

  function handleApply() {
    onApply(local)
    onClose()
  }

  function handleReset() {
    const def: Filters = { type: 'all', duration: 'any', date: 'any', sort: 'relevant' }
    setLocal(def)
    onApply(def)
    onClose()
  }

  const chip = (
    label: string,
    active: boolean,
    onClick: () => void
  ) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 20,
        border: `1px solid ${active ? '#e63946' : '#252525'}`,
        background: active ? 'rgba(230,57,70,0.12)' : '#111',
        color: active ? '#e63946' : '#888',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap' as const,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = '#333'
          e.currentTarget.style.color = '#ccc'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = '#252525'
          e.currentTarget.style.color = '#888'
        }
      }}
    >
      {label}
    </button>
  )

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#444',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        margin: '0 0 10px',
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {children}
      </div>
    </div>
  )

  const activeCount = [
    local.type !== 'all',
    local.duration !== 'any',
    local.date !== 'any',
    local.sort !== 'relevant',
  ].filter(Boolean).length
  const t = useTranslations()

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: '#0f0f0f',
        border: '1px solid #1e1e1e',
        borderRadius: 16,
        overflow: 'hidden',
        animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid #181818',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#e63946' strokeWidth='2'>
              <line x1='4' y1='6' x2='20' y2='6' />
              <line x1='8' y1='12' x2='16' y2='12' />
              <line x1='11' y1='18' x2='13' y2='18' />
            </svg>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.filterModalTitle}</span>
            {activeCount > 0 && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(230,57,70,0.15)',
                color: '#e63946',
                padding: '2px 8px',
                borderRadius: 10,
                border: '1px solid rgba(230,57,70,0.3)',
              }}>
                {activeCount} active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: 'pointer',
              color: '#777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          {section(t.filterSectionType, <>
            {chip(t.filterAll, local.type === 'all', () => set('type', 'all'))}
            {chip(t.filterVideo, local.type === 'video', () => set('type', 'video'))}
            {chip('Shorts', local.type === 'shorts', () => set('type', 'shorts'))}
            {chip(t.filterChannels, local.type === 'channel', () => set('type', 'channel'))}
          </>)}

          {local.type !== 'channel' && section(t.filterSectionDuration, <>
            {chip(t.filterAnyDuration, local.duration === 'any', () => set('duration', 'any'))}
            {chip(t.filterUnder3m, local.duration === 'short', () => set('duration', 'short'))}
            {chip(t.filter3to20m, local.duration === 'medium', () => set('duration', 'medium'))}
            {chip(t.filterOver20m, local.duration === 'long', () => set('duration', 'long'))}
          </>)}

          {section(t.filterSectionDate, <>
            {chip(t.filterAnyTime, local.date === 'any', () => set('date', 'any'))}
            {chip(t.filterToday, local.date === 'today', () => set('date', 'today'))}
            {chip(t.filterThisWeek, local.date === 'week', () => set('date', 'week'))}
            {chip(t.filterThisMonth, local.date === 'month', () => set('date', 'month'))}
            {chip(t.filterThisYear, local.date === 'year', () => set('date', 'year'))}
          </>)}

          {section(t.filterSectionSort, <>
            {chip(t.filterRelevant, local.sort === 'relevant', () => set('sort', 'relevant'))}
            {chip(t.filterPopular, local.sort === 'popular', () => set('sort', 'popular'))}
            {chip(t.filterNewest, local.sort === 'newest', () => set('sort', 'newest'))}
          </>)}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '16px 22px',
          borderTop: '1px solid #181818',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: '1px solid #252525',
              background: 'none',
              color: '#666',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#333'
              e.currentTarget.style.color = '#aaa'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#252525'
              e.currentTarget.style.color = '#666'
            }}
          >
            {t.filterResetBtn}
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              border: 'none',
              background: '#e63946',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#c62e3b')}
            onMouseLeave={e => (e.currentTarget.style.background = '#e63946')}
          >
            {t.filterApplyBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Shorts card ─── */
function ShortsCard({ video }: { video: VideoResult }) {
  const [hovered, setHovered] = useState(false)
  const t = useTranslations()

  return (
    <Link
      href={`/en/shorts/${video.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/16',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#1a1a1a',
        marginBottom: 8,
      }}>
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform .2s',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width='24' height='24' viewBox='0 0 24 24' fill='#333'><path d='M8 5v14l11-7z' /></svg>
          </div>
        )}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(230,57,70,.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='#fff'><path d='M8 5v14l11-7z' /></svg>
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 6, left: 6,
          background: 'rgba(0,0,0,.72)', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
        }}>
          {fmt(video.views_count)} {t.viewsText}
        </div>
      </div>
      <p style={{
        fontSize: 13, fontWeight: 600, color: hovered ? '#fff' : '#ddd',
        margin: '0 0 2px', lineHeight: 1.35,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', transition: 'color .15s',
      }}>{video.title}</p>
      <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
        {video.uploader.display_name || video.uploader.username}
      </p>
    </Link>
  )
}

/* ─── Video row card ─── */
function VideoRow({
  video,
  onAddToPlaylist,
}: {
  video: VideoResult
  onAddToPlaylist: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const name = video.uploader.display_name || video.uploader.username
  const color = colorFromId(video.uploader.id)
  const menuRef = useRef<HTMLDivElement>(null)
  const t = useTranslations()
  const { language } = useLanguage()

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: 'flex',
				gap: 14,
				alignItems: 'flex-start',
				padding: '10px',
				borderRadius: 12,
				background: hovered ? '#0f0f0f' : 'transparent',
				border: `1px solid ${hovered ? '#1a1a1a' : 'transparent'}`,
				transition: 'all 0.15s',
				cursor: 'default',
			}}
		>
			{/* Thumbnail */}
			<Link
				href={`/en/watch/${video.id}`}
				style={{ textDecoration: 'none', flexShrink: 0 }}
			>
				<div
					style={{
						width: 280,
						height: 157,
						borderRadius: 10,
						overflow: 'hidden',
						background: '#1a1a1a',
						position: 'relative',
					}}
				>
					{video.thumbnail_url ? (
						<img
							src={video.thumbnail_url}
							alt={video.title}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								transform: hovered ? 'scale(1.03)' : 'scale(1)',
								transition: 'transform .2s',
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
							<svg width='32' height='32' viewBox='0 0 24 24' fill='#333'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					)}
					{hovered && (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								background: 'rgba(0,0,0,0.25)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<div
								style={{
									width: 44,
									height: 44,
									borderRadius: '50%',
									background: 'rgba(230,57,70,0.9)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<svg width='18' height='18' viewBox='0 0 24 24' fill='#fff'>
									<path d='M8 5v14l11-7z' />
								</svg>
							</div>
						</div>
					)}
				</div>
			</Link>

			{/* Info */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<Link href={`/en/watch/${video.id}`} style={{ textDecoration: 'none' }}>
					<h3
						style={{
							fontSize: 16,
							fontWeight: 700,
							color: '#fff',
							margin: '0 0 6px',
							lineHeight: 1.4,
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{video.title}
					</h3>
				</Link>

				<p style={{ fontSize: 13, color: '#666', margin: '0 0 10px' }}>
					{fmt(video.views_count)} {t.viewsText} · {timeAgo(video.created_at, t, language)}
				</p>

				<Link
					href={`/en/channel/${video.uploader.id}`}
					style={{ textDecoration: 'none' }}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							marginBottom: 10,
						}}
					>
						{video.uploader.avatar_url ? (
							<img
								src={video.uploader.avatar_url}
								alt={name}
								style={{
									width: 24,
									height: 24,
									borderRadius: '50%',
									objectFit: 'cover',
								}}
							/>
						) : (
							<div
								style={{
									width: 24,
									height: 24,
									borderRadius: '50%',
									background: color,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 9,
									fontWeight: 700,
									color: '#fff',
								}}
							>
								{name.slice(0, 2).toUpperCase()}
							</div>
						)}
						<span style={{ fontSize: 13, color: '#888' }}>{name}</span>
					</div>
				</Link>

				{video.description && (
					<p
						style={{
							fontSize: 13,
							color: '#555',
							margin: 0,
							lineHeight: 1.6,
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{video.description}
					</p>
				)}
			</div>

			{/* Kebab */}
			<div style={{ position: 'relative', flexShrink: 0 }}>
				<button
					onClick={e => {
						e.preventDefault()
						e.stopPropagation()
						setMenuOpen(v => !v)
					}}
					style={{
						width: 32,
						height: 32,
						borderRadius: '50%',
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: '#777',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: hovered || menuOpen ? 1 : 0,
						transition: 'opacity .15s, background .15s',
					}}
					onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
					onMouseLeave={e => (e.currentTarget.style.background = 'none')}
				>
					<svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
						<circle cx='12' cy='5' r='2' />
						<circle cx='12' cy='12' r='2' />
						<circle cx='12' cy='19' r='2' />
					</svg>
				</button>
				{menuOpen && (
					<div
						ref={menuRef}
						style={{
							position: 'absolute',
							top: '100%',
							right: 0,
							zIndex: 300,
							background: '#1c1c1c',
							border: '1px solid #2a2a2a',
							borderRadius: 10,
							minWidth: 186,
							overflow: 'hidden',
							boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
							animation: 'pop .12s ease',
						}}
					>
						{[
							{
								label: t.saveToWatchLater,
								icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
								action: async () => {
									await fetch('/api/me/watch-later', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ video_id: video.id }),
									}).catch(() => {})
									setMenuOpen(false)
								},
							},
							{
								label: t.addToPlaylist,
								icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
								action: () => {
									onAddToPlaylist(video.id)
									setMenuOpen(false)
								},
							},
							{
								label: t.copyLink,
								icon: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2。92s2。92-1。31 2。92-2。92-1。31-2。92-2。92-2。92z',
								action: () => {
									navigator.clipboard
										?.writeText(
											`${window.location.origin}/en/watch/${video.id}`,
										)
										.catch(() => {})
									setMenuOpen(false)
								},
							},
						].map(item => (
							<button
								key={item.label}
								onClick={item.action}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									width: '100%',
									padding: '10px 14px',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: '#ccc',
									fontSize: 13,
									fontFamily: 'inherit',
									textAlign: 'left',
								}}
								onMouseEnter={e =>
									(e.currentTarget.style.background = '#252525')
								}
								onMouseLeave={e => (e.currentTarget.style.background = 'none')}
							>
								<svg width='16' height='16' viewBox='0 0 24 24' fill='#666'>
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

/* ─── Channel row card ─── */
function ChannelRow({ channel }: { channel: ChannelResult }) {
  const [hovered, setHovered] = useState(false)
  const color = colorFromId(channel.id)
  const name = channel.display_name || channel.username
  const t = useTranslations()
  return (
		<Link
			href={`/en/channel/${channel.id}`}
			style={{ textDecoration: 'none' }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: '16px',
					borderRadius: 14,
					background: hovered ? '#0f0f0f' : 'transparent',
					border: `1px solid ${hovered ? '#1a1a1a' : 'transparent'}`,
					transition: 'all 0.15s',
				}}
			>
				{channel.avatar_url ? (
					<img
						src={channel.avatar_url}
						alt={name}
						style={{
							width: 70,
							height: 70,
							borderRadius: '50%',
							objectFit: 'cover',
							flexShrink: 0,
						}}
					/>
				) : (
					<div
						style={{
							width: 70,
							height: 70,
							borderRadius: '50%',
							background: color,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 24,
							fontWeight: 800,
							color: '#fff',
							flexShrink: 0,
						}}
					>
						{name.slice(0, 2).toUpperCase()}
					</div>
				)}
				<div style={{ flex: 1, minWidth: 0 }}>
					<p
						style={{
							fontSize: 16,
							fontWeight: 700,
							color: '#fff',
							margin: '0 0 2px',
						}}
					>
						{name}
					</p>
					<p style={{ fontSize: 13, color: '#666', margin: '0 0 6px' }}>
						@{channel.username} · {fmt(channel.subscribers_count || 0)}{' '}
						{t.subscribers} · {fmt(channel.videos_count || 0)} {t.videos}
					</p>
					{channel.bio && (
						<p
							style={{
								fontSize: 13,
								color: '#555',
								margin: 0,
								lineHeight: 1.5,
								display: '-webkit-box',
								WebkitLineClamp: 1,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{channel.bio}
						</p>
					)}
				</div>
				<div
					style={{
						padding: '8px 20px',
						borderRadius: 24,
						border: '1px solid #2a2a2a',
						color: '#ccc',
						fontSize: 13,
						fontWeight: 600,
						transition: 'all 0.15s',
						...(hovered
							? {
									borderColor: '#e63946',
									color: '#e63946',
									background: 'rgba(230,57,70,0.08)',
								}
							: {}),
					}}
				>
					View channel
				</div>
			</div>
		</Link>
	)
}

/* ─── Skeleton ─── */
function Skeleton() {
  const s = { background: '#161616', borderRadius: 8, animation: 'pulse 1.6s ease-in-out infinite' } as React.CSSProperties
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: '10px' }}>
          <div style={{ ...s, width: 280, height: 157, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...s, height: 18, marginBottom: 8, width: '75%' }} />
            <div style={{ ...s, height: 14, marginBottom: 14, width: '35%' }} />
            <div style={{ ...s, height: 14, marginBottom: 8, width: '30%' }} />
            <div style={{ ...s, height: 13, width: '55%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ─── */
export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''

  const [allVideos, setAllVideos] = useState<VideoResult[]>([])
  const [allChannels, setAllChannels] = useState<ChannelResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>({ type: 'all', duration: 'any', date: 'any', sort: 'relevant' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [playlistVideoId, setPlaylistVideoId] = useState<string | null>(null)
  const t = useTranslations()
	const { language } = useLanguage()
  /* Fetch results */
  useEffect(() => {
    if (!q.trim()) return
    setLoading(true)

    const fetchVideos = fetch(`/api/videos?limit=50`).then(r => r.json()).catch(() => ({ ok: false }))
    const fetchUsers = fetch(`/api/videos?limit=50`).then(r => r.json()).catch(() => ({ ok: false }))

    Promise.all([fetchVideos]).then(([vd]) => {
      if (vd.ok) {
        const query = q.toLowerCase()
        const matched: VideoResult[] = (vd.data?.items || []).filter((v: VideoResult) =>
          v.title.toLowerCase().includes(query) ||
          (v.description || '').toLowerCase().includes(query) ||
          (v.uploader?.display_name || v.uploader?.username || '').toLowerCase().includes(query)
        )
        setAllVideos(matched)
        // Extract unique channels from results
        const channelMap = new Map<string, ChannelResult>()
        matched.forEach((v: VideoResult) => {
          if (!channelMap.has(v.uploader.id)) {
            channelMap.set(v.uploader.id, {
              id: v.uploader.id,
              username: v.uploader.username,
              display_name: v.uploader.display_name,
              avatar_url: v.uploader.avatar_url,
              bio: null,
              created_at: v.created_at,
            })
          }
        })
        // Also check channel name match
        const channelMatches = [...channelMap.values()].filter(c =>
          (c.display_name || '').toLowerCase().includes(q.toLowerCase()) ||
          c.username.toLowerCase().includes(q.toLowerCase())
        )
        setAllChannels(channelMatches)
      }
    }).finally(() => setLoading(false))
  }, [q])

  /* Apply filters + sorting */
  const filteredVideos = useCallback(() => {
    let vids = allVideos.filter(v => {
      if (filters.type === 'video' && v.video_type !== 'normal') return false
      if (filters.type === 'shorts' && v.video_type !== 'shorts') return false
      if (!matchesDateFilter(v.created_at, filters.date)) return false
      return true
    })

    if (filters.sort === 'popular') {
      vids = vids.sort((a, b) => b.views_count - a.views_count)
    } else if (filters.sort === 'newest') {
      vids = vids.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return vids
  }, [allVideos, filters])()

  const showChannels = filters.type === 'all' || filters.type === 'channel'
  const showVideos = filters.type === 'all' || filters.type === 'video'
  const showShorts = filters.type === 'all' || filters.type === 'shorts'

  const shortsResults = filteredVideos.filter(v => v.video_type === 'shorts')
  const videoResults = filteredVideos.filter(v => v.video_type !== 'shorts')

  const activeFilterCount = [
    filters.type !== 'all',
    filters.duration !== 'any',
    filters.date !== 'any',
    filters.sort !== 'relevant',
  ].filter(Boolean).length

  const totalResults = (showChannels ? allChannels.length : 0) +
    (showShorts ? shortsResults.length : 0) +
    (showVideos ? videoResults.length : 0)

  return (
    <UserLayout>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pop { from{opacity:0;transform:scale(.95) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          {q ? (
            <>
              <p style={{ fontSize: 13, color: '#555', margin: '0 0 2px' }}>{t.searchResultsFor}</p>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                &ldquo;{q}&rdquo;
              </h1>
            </>
          ) : (
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{t.searchTitle}</h1>
          )}
        </div>

        {q && (
          <button
            onClick={() => setFiltersOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 24,
              border: `1px solid ${activeFilterCount > 0 ? '#e63946' : '#252525'}`,
              background: activeFilterCount > 0 ? 'rgba(230,57,70,0.08)' : '#111',
              color: activeFilterCount > 0 ? '#e63946' : '#888',
              fontSize: 13, fontWeight: activeFilterCount > 0 ? 600 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (activeFilterCount === 0) {
                e.currentTarget.style.borderColor = '#333'
                e.currentTarget.style.color = '#ccc'
              }
            }}
            onMouseLeave={e => {
              if (activeFilterCount === 0) {
                e.currentTarget.style.borderColor = '#252525'
                e.currentTarget.style.color = '#888'
              }
            }}
          >
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <line x1='4' y1='6' x2='20' y2='6' />
              <line x1='8' y1='12' x2='16' y2='12' />
              <line x1='11' y1='18' x2='13' y2='18' />
            </svg>
            {t.filtersBtn}
            {activeFilterCount > 0 && (
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#e63946', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* No query */}
      {!q && (
        <div style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed #1e1e1e', borderRadius: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#e63946' strokeWidth='1.5'>
              <circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' />
            </svg>
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Start searching</p>
          <p style={{ fontSize: 14, color: '#444', margin: 0 }}>Use the search bar above to find videos, shorts, and channels.</p>
        </div>
      )}

      {/* Loading */}
      {loading && q && <Skeleton />}

      {/* Results */}
      {!loading && q && (
        <div style={{ animation: 'fadeUp .25s ease both' }}>

          {/* No results */}
          {totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed #1e1e1e', borderRadius: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#141414', border: '1px solid #1e1e1e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='#333' strokeWidth='1.5'>
                  <circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' />
                  <line x1='8' y1='11' x2='14' y2='11' />
                </svg>
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>No results found</p>
              <p style={{ fontSize: 14, color: '#444', margin: '0 0 20px' }}>
                No videos or channels match &ldquo;{q}&rdquo;
                {activeFilterCount > 0 ? ' with the current filters.' : '.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ type: 'all', duration: 'any', date: 'any', sort: 'relevant' })}
                  style={{
                    padding: '9px 20px', borderRadius: 24,
                    border: '1px solid #2a2a2a', background: 'none',
                    color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* ── Shorts section (first) ── */}
          {showShorts && shortsResults.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <svg width='18' height='18' viewBox='0 0 24 24' fill='#e63946'>
                  <path d='M17.77 10.32l-1.2-.5L18 9.19C19.38 8.42 19.86 6.68 19.09 5.3c-.77-1.38-2.51-1.86-3.89-1.09l-5.85 3.28-.01.02-1.17.65c-1.38.77-1.86 2.51-1.09 3.89.28.49.68.87 1.14 1.12l1.2.5L8 13.81C6.62 14.58 6.14 16.32 6.91 17.7c.77 1.38 2.51 1.86 3.89 1.09l5.85-3.27.01-.01 1.17-.65c1.38-.77 1.86-2.51 1.09-3.89-.28-.49-.68-.87-1.15-1.14zM13 14.5l-2-1.17 2-1.16 2 1.16-2 1.17z' />
                </svg>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Shorts</h2>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 14,
              }}>
                {shortsResults.map(v => (
                  <ShortsCard key={v.id} video={v} />
                ))}
              </div>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#1e1e1e 20%,#1e1e1e 80%,transparent)', margin: '28px 0 0' }} />
            </section>
          )}

          {/* ── Channels section ── */}
          {showChannels && allChannels.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Channels</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allChannels.map(c => <ChannelRow key={c.id} channel={c} />)}
              </div>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#1e1e1e 20%,#1e1e1e 80%,transparent)', margin: '20px 0 28px' }} />
            </section>
          )}

          {/* ── Videos section ── */}
          {showVideos && videoResults.length > 0 && (
            <section>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {videoResults.map(v => (
                  <VideoRow
                    key={v.id}
                    video={v}
                    onAddToPlaylist={id => setPlaylistVideoId(id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Filters modal */}
      {filtersOpen && (
        <FilterModal
          filters={filters}
          onApply={setFilters}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {/* Playlist picker */}
      {playlistVideoId && (
        <PlaylistPicker
          videoId={playlistVideoId}
          onClose={() => setPlaylistVideoId(null)}
        />
      )}
    </UserLayout>
  )
}