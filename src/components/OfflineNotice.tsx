import { IconCloudOff } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { useOnline } from '../lib/online'
import { toast } from './toast'

/** اتصال که قطع می‌شود، یک جملهٔ همدلانه؛ وقتی برگشت، toast. (به‌جای Lottie: آیکن SVG با انیمیشن CSS، بدون وابستگی اضافه) */
export function OfflineNotice() {
  const online = useOnline()
  const was = useRef(online)
  useEffect(() => {
    if (online && !was.current) toast('دوباره آنلاین شدید', 'ok')
    was.current = online
  }, [online])
  if (online) return null
  return (
    <div className="offline" role="status">
      <IconCloudOff size={34} className="offline__icon" aria-hidden />
      <div>
        <strong>اینترنت قطع است، نگران نباشید</strong>
        <p>آنچه قبلاً دیده‌اید همچنان در دسترس است. هر وقت اتصال برگشت، ادامه می‌دهیم؛ دل‌تان به یاد آقا آرام باشد.</p>
      </div>
    </div>
  )
}
