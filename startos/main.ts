import { T } from '@start9labs/start-sdk'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

/** The game page answers 200: more than an open port, which a broken nginx config also gives. */
async function pageHealth(): Promise<Omit<T.NamedHealthCheckResult, 'name'>> {
  let res: Response
  try {
    res = await fetch(`http://127.0.0.1:${uiPort}/`, {
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    return { result: 'failure', message: i18n('The game is not responding') }
  }
  if (res.ok) return { result: 'success', message: i18n('The game is ready') }
  return {
    result: 'failure',
    message: i18n('The game page returned HTTP ${status}', {
      status: String(res.status),
    }),
  }
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting A Dark Room'))

  return sdk.Daemons.of(effects).addDaemon('webui', {
    subcontainer: sdk.SubContainer.of(
      effects,
      { imageId: 'main' },
      sdk.Mounts.of(),
      'nginx',
    ),
    exec: { command: ['nginx', '-g', 'daemon off;'] },
    ready: {
      display: i18n('Web Interface'),
      fn: pageHealth,
    },
    requires: [],
  })
})
