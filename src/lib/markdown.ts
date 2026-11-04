/** عنوان اول (# ...) را حذف می‌کند؛ عنوان صفحه از manifest می‌آید. */
export function stripLeadingTitle(md: string): string {
  return md.replace(/^﻿?\s*#[ \t]+[^\n]*\n?/, '').trimStart()
}
