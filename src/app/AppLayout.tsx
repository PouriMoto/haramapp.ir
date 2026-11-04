import { IconHeart, IconHeartHandshake, IconHome, IconMessageCircle, IconMoon, IconPencil, IconSun } from '@tabler/icons-react'
import { useState } from 'react'
import { InstallPrompt } from '../components/InstallPrompt'
import { OfflineNotice } from '../components/OfflineNotice'
import { Toaster } from '../components/Toaster'
import { toggleTheme } from '../lib/theme'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { MessageSheet } from '../features/messages/MessageSheet'
import { MiniPlayer } from '../features/player/MiniPlayer'
import { usePlayer } from '../features/player/context'

export function AppLayout() {
  const { current } = usePlayer()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  return (
    <>
      <header className="app-header">
        <h1>امام رضا (ع) قربونت برم</h1>
        <p>درد و دل‌های خود را با آقا در میان بگذارید</p>
        <div className="app-header__tools">
          <Link to="/favorites" aria-label="علاقه‌مندی‌ها"><IconHeart size={20} aria-hidden /></Link>
          <button type="button" onClick={() => setDark(toggleTheme() === 'dark')} aria-label="تغییر حالت شب و روز">{dark ? <IconSun size={20} aria-hidden /> : <IconMoon size={20} aria-hidden />}</button>
        </div>
      </header>

      <main className={current ? 'app-main has-player' : 'app-main'}>
        <OfflineNotice />
        <InstallPrompt />
        <Outlet />
      </main>

      <MiniPlayer />
      <Toaster />

      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        <NavLink to="/" end className="nav-item">
          <IconHome size={24} aria-hidden />
          <span>خانه</span>
        </NavLink>
        <NavLink to="/messages" className="nav-item">
          <IconMessageCircle size={24} aria-hidden />
          <span>درد و دل‌ها</span>
        </NavLink>

        <span className="nav-spacer" aria-hidden />

        <NavLink to="/stats" className="nav-item">
          <IconHeart size={24} aria-hidden />
          <span>صلوات‌شمار</span>
        </NavLink>
        <NavLink to="/help" className="nav-item">
          <IconHeartHandshake size={24} aria-hidden />
          <span>همیاری</span>
        </NavLink>

        <button type="button" className="fab" onClick={() => setSheetOpen(true)}>
          <IconPencil size={20} aria-hidden />
          <span>درد و دل با امام رضا (ع)</span>
        </button>
      </nav>

      <MessageSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
