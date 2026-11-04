// جایگزین موقت صفحه‌ها تا نشست مربوط به خودشان.
export function PageStub({ title, note }: { title: string; note: string }) {
  return (
    <section className="page-stub">
      <h2>{title}</h2>
      <p>{note}</p>
    </section>
  )
}
