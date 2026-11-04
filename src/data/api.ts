import { env } from '../config/env'
import { getClientId } from '../lib/clientId'
import { createAppsScriptApi, createAppsScriptHelpApi } from './adapters/appsScript'
import { createMockApi } from './adapters/mock'
import { createMockHelpApi } from './adapters/mockHelp'
import type { Api, HelpApi } from './contract'
import { ApiError } from './errors'

export type { Api, HelpApi } from './contract'

function notReady(): never {
  throw new ApiError('server', 'مسیر Supabase در نشست ۸ پیاده‌سازی می‌شود')
}

export function createApi(provider = env.dataProvider): Api {
  switch (provider) {
    case 'mock': return createMockApi()
    case 'appsscript': return createAppsScriptApi(env.appsScriptUrl, getClientId)
    case 'supabase': return notReady()
  }
}

export function createHelpApi(provider = env.dataProvider): HelpApi {
  switch (provider) {
    case 'mock': return createMockHelpApi()
    case 'appsscript': return createAppsScriptHelpApi(env.appsScriptUrl, `${env.mediaBaseUrl}/causes.json`)
    case 'supabase': return notReady()
  }
}

let apiInstance: Api | undefined
let helpInstance: HelpApi | undefined

/** singleton تنبل؛ خطای پیکربندی هنگام import اپ را نمی‌شکند */
export function getApi(): Api {
  return (apiInstance ??= createApi())
}
export function getHelpApi(): HelpApi {
  return (helpInstance ??= createHelpApi())
}
