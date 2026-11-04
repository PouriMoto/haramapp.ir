import { ListState } from '../../components/ListState'
import { useVideos } from '../../content/hooks'
import { VideoCard } from './VideoCard'

export function VideosPage() {
  const { data, isPending, isError, refetch } = useVideos()
  return (
    <section>
      <h2 className="page-title">ویدیوها</h2>
      <ListState loading={isPending} error={isError} empty={(data ?? []).length === 0} emptyText="هنوز ویدیویی اضافه نشده است." onRetry={() => void refetch()}>
        <ul className="rows">{(data ?? []).map((v) => <VideoCard key={v.id} video={v} />)}</ul>
      </ListState>
    </section>
  )
}
