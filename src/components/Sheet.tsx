import { IconX } from '@tabler/icons-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

/** bottom sheet روی <dialog> بومی: focus trap، Esc و backdrop رایگان */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose(): void; title: string; children: ReactNode }) {
  const dlg = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={dlg} className="sheet" onClose={onClose} onClick={(e) => { if (e.target === dlg.current) onClose() }} aria-labelledby={id}>
      <div className="sheet__panel">
        <div className="sheet__head">
          <h2 id={id}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="بستن"><IconX size={22} aria-hidden /></button>
        </div>
        {open && children}
      </div>
    </dialog>
  )
}
