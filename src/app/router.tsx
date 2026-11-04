import { createBrowserRouter } from 'react-router-dom'
import { env } from '../config/env'
import { HomePage } from '../features/home/HomePage'
import { FavoritesPage } from '../features/favorites/FavoritesPage'
import { ZikrPage } from '../features/zikr/ZikrPage'
import { MessagesPage } from '../features/messages/MessagesPage'
import { CausePage } from '../features/help/CausePage'
import { HelpPage } from '../features/help/HelpPage'
import { ResultPage } from '../features/help/ResultPage'
import { MusicPage } from '../features/music/MusicPage'
import { PrayersPage } from '../features/prayers/PrayersPage'
import { VideosPage } from '../features/videos/VideosPage'
import { StatsPage } from '../features/stats/StatsPage'
import { NotFoundPage } from '../components/NotFoundPage'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'prayers', element: <PrayersPage /> },
        // react-markdown سنگین است؛ فقط وقتی کاربر متن دعا را باز کرد دانلود می‌شود
        { path: 'prayers/:id', lazy: async () => ({ Component: (await import('../features/prayers/PrayerPage')).PrayerPage }) },
        { path: 'music', element: <MusicPage /> },
        { path: 'messages', element: <MessagesPage /> },
        { path: 'favorites', element: <FavoritesPage /> },
        { path: 'zikr', element: <ZikrPage /> },
        { path: 'videos', element: <VideosPage /> },
        { path: 'stats', element: <StatsPage /> },
        { path: 'help', element: <HelpPage /> },
        { path: 'help/result', element: <ResultPage /> },
        { path: 'help/:id', element: <CausePage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: env.basePath },
)
