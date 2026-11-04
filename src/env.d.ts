/// <reference types="vite/client" />

declare const __BUILD_ID__: string
declare const __SITE__: { appsScriptUrl?: string; domain?: string; homeLimit?: number }

interface ImportMetaEnv {
  readonly VITE_DATA_PROVIDER?: string
  readonly VITE_APPS_SCRIPT_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_MEDIA_BASE_URL?: string
  readonly VITE_HOME_LIMIT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
