export interface Banner {
  id: string
  kind: 'ad' | 'campaign'
  placement: 'home' | 'messages' | 'both'
  image?: string
  title?: string
  text?: string
  alt?: string
  sponsor?: string
  href?: string
  startsAt?: string
  endsAt?: string
  weight: number
}

export interface Category {
  id: string
  title: string
  order: number
}

export interface Prayer {
  id: string
  title: string
  text: string // مسیر نسبی داخل رسانه
  audio?: string
  order: number
  pinned: boolean
  categories: string[]
  addedAt: string
}

export interface Music {
  id: string
  title: string
  artist: string
  src: string
  cover?: string
  order: number
  pinned: boolean
  categories: string[]
  addedAt: string
}

export interface HeroVideo {
  src: string
  poster?: string
}

/** ویدیوی آپارات؛ aparat = شناسهٔ ویدیو (مثلاً ckn3o4e) */
export interface VideoItem {
  id: string
  title: string
  aparat: string
  poster?: string
  featured: boolean // ویدیوی معرفی؛ اول صفحهٔ اصلی
  order: number
  pinned: boolean
  categories: string[]
  addedAt: string
}

export interface Manifest {
  version: 1
  generatedAt: string
  video?: HeroVideo
  categories: Category[]
  banners: Banner[]
  videos: VideoItem[]
  prayers: Prayer[]
  music: Music[]
}
