export interface ChipItem { id: string; title: string; count: number }

export function CategoryChips({ items, value, onChange, total }: { items: ChipItem[]; value: string | null; onChange(id: string | null): void; total: number }) {
  if (items.length === 0) return null
  return (
    <div className="cat-chips" role="group" aria-label="دسته‌بندی">
      <button type="button" className={value === null ? 'cat-chip cat-chip--on' : 'cat-chip'} aria-pressed={value === null} onClick={() => onChange(null)}>
        همه <small>{total.toLocaleString('fa-IR')}</small>
      </button>
      {items.map((c) => (
        <button key={c.id} type="button" className={value === c.id ? 'cat-chip cat-chip--on' : 'cat-chip'} aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
          {c.title} <small>{c.count.toLocaleString('fa-IR')}</small>
        </button>
      ))}
    </div>
  )
}
