import { createServer } from 'node:http'
import { loadConfig } from './src/config.mjs'
import { createApp } from './src/server.mjs'

const { cfg, errors } = loadConfig()
if (errors.length) {
  console.error('پیکربندی نامعتبر:\n - ' + errors.join('\n - '))
  process.exit(1)
}
createServer(createApp(cfg)).listen(cfg.port, () => {
  console.log(JSON.stringify({ ev: 'listening', port: cfg.port, gateway: cfg.gateway, sandbox: cfg.sandbox, enabled: cfg.paymentsEnabled, merchants: Object.keys(cfg.merchants) }))
})
