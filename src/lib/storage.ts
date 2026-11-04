/** localStorage امن: در حالت خصوصی/غیرفعال خطا نمی‌دهد. فقط برای راحتی شخصی؛ هرگز برای داده‌ٔ مهم. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

export function removeKey(key: string): void {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}
