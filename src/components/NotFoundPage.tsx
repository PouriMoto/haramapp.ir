import { Link } from 'react-router-dom'
import { PageStub } from './PageStub'

export function NotFoundPage() {
  return (
    <>
      <PageStub title="صفحه پیدا نشد" note="آدرس درخواستی وجود ندارد." />
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          بازگشت به خانه
        </Link>
      </p>
    </>
  )
}
