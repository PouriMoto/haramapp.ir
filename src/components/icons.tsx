// آیکون‌های SVG داخلی (جایگزین @tabler/icons-react که کل بستهٔ ~۵۰۰۰ آیکون را به build می‌کشید).
// فقط آیکون‌هایی که اپ استفاده می‌کند. API: <IconX size={20} className aria-hidden />
// برای افزودن آیکون: یک خط make(...) در انتها (مسیرها در شبکهٔ 24×24؛ خط‌دار با stroke=currentColor).
import type { ReactNode } from 'react'

export interface IconProps {
  size?: number
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

function make(children: ReactNode, filled = false) {
  return function Icon({ size = 24, className, 'aria-hidden': ariaHidden }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke={filled ? 'none' : 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden={ariaHidden}
        focusable="false"
      >
        {children}
      </svg>
    )
  }
}

const ring = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0'
const heart = 'M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572'

export const IconAlertCircle = make(<><path d={ring} /><path d="M12 8v4" /><path d="M12 16h.01" /></>)
export const IconAlertTriangle = make(<><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></>)
export const IconBook2 = make(<><path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" /><path d="M19 16h-12a2 2 0 0 0 -2 2" /><path d="M9 8h6" /></>)
export const IconCalendarEvent = make(<><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M8 15h2v2h-2z" /></>)
export const IconCheck = make(<path d="M5 12l5 5l10 -10" />)
export const IconChevronLeft = make(<path d="M15 6l-6 6l6 6" />)
export const IconChevronRight = make(<path d="M9 6l6 6l-6 6" />)
export const IconCircleCheck = make(<><path d={ring} /><path d="M9 12l2 2l4 -4" /></>)
export const IconCloudOff = make(<><path d="M3 3l18 18" /><path d="M9.58 5.58a5 5 0 0 1 7.42 2.42a4.5 4.5 0 0 1 4 4.5a4.5 4.5 0 0 1 -1.1 2.9" /><path d="M18 18h-11a4 4 0 0 1 -.9 -7.9" /></>)
export const IconCopy = make(<><path d="M8 10a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></>)
export const IconDownload = make(<><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4v12" /></>)
export const IconExternalLink = make(<><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></>)
export const IconHeart = make(<path d={heart} />)
export const IconHeartFilled = make(<path d={heart} />, true)
export const IconHeartHandshake = make(<><path d={heart} /><path d="M12 6l-3.3 3.3a1 1 0 0 0 0 1.4l.5 .5c.7 .7 1.8 .7 2.5 0l1 -1a3.2 3.2 0 0 1 4.5 0l2.3 2.3" /></>)
export const IconHome = make(<><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></>)
export const IconInfoCircle = make(<><path d={ring} /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></>)
export const IconMessageCircle = make(<path d="M12 4c-4.42 0 -8 3.13 -8 7c0 1.7 .7 3.26 1.87 4.47l-.87 4.53l4.2 -1.5c.88 .33 1.82 .5 2.8 .5c4.42 0 8 -3.13 8 -7s-3.58 -7 -8 -7z" />)
export const IconMinus = make(<path d="M5 12h14" />)
export const IconMoon = make(<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />)
export const IconMusic = make(<><path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M9 17v-13h10v13" /><path d="M9 8h10" /></>)
export const IconPencil = make(<><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></>)
export const IconPlayerPauseFilled = make(<><path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /><path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /></>, true)
export const IconPlayerPlayFilled = make(<path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />, true)
export const IconPlayerTrackNext = make(<><path d="M4 5v14l11 -7z" fill="currentColor" /><path d="M19 5v14" /></>)
export const IconPlayerTrackPrev = make(<><path d="M20 5v14l-11 -7z" fill="currentColor" /><path d="M5 5v14" /></>)
export const IconPlus = make(<><path d="M12 5v14" /><path d="M5 12h14" /></>)
export const IconRotate = make(<path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5" />)
export const IconSearch = make(<><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></>)
export const IconShare3 = make(<path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z" />)
export const IconSun = make(<><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></>)
export const IconVideoOff = make(<><path d="M3 3l18 18" /><path d="M10 6h3a2 2 0 0 1 2 2v3l5 -3v8" /><path d="M15 15v1a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2" /></>)
export const IconX = make(<><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></>)
