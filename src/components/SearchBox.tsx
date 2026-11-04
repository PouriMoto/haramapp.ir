import { IconSearch } from '@tabler/icons-react'

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange(v: string): void; placeholder: string }) {
  return (
    <label className="search-box">
      <IconSearch size={18} aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  )
}
