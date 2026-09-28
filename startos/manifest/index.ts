import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'adarkroom-graphics',
  title: 'A Dark Room (Graphics)',
  license: 'MPL-2.0',
  packageRepo: 'https://github.com/DigiMonk73/adarkroom-startos',
  upstreamRepo: 'https://github.com/doublespeakgames/adarkroom',
  marketingUrl: 'https://adarkroom.doublespeakgames.com/',
  donationUrl: null,
  description: { short, long },
  // Nothing to keep: the game is static files in the image, and players'
  // progress lives in their own browsers.
  volumes: [],
  images: {
    // Dockerfile at the repository root: the adarkroom submodule plus the
    // graphics layer, served by nginx.
    main: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
