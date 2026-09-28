import { expect, test } from '@playwright/test'

// What the server hands out. The header checks describe nginx.conf, so they
// run only against the image (CHECK_IMAGE=1), not the local dev server.
const image = !!process.env.CHECK_IMAGE

test('serves the game and the graphics layer', async ({ request }) => {
  for (const path of ['/', '/gfx/gfx.css', '/gfx/js/core.js', '/lang/fr/strings.js', '/audio/fire-burning.flac']) {
    expect((await request.get(path)).status(), path).toBe(200)
  }
})

test("leaves out upstream's dev files and translation sources", async ({ request }) => {
  for (const path of ['/dev-server.js', '/package.json', '/tools/', '/lang/fr/strings.po', '/lang/adarkroom.pot']) {
    expect((await request.get(path)).status(), path).toBe(404)
  }
})

test('the page and scripts are revalidated, media is cached', async ({ request }) => {
  test.skip(!image, 'nginx headers: set CHECK_IMAGE=1 against the image')
  for (const path of ['/', '/gfx/js/core.js']) {
    expect((await request.get(path)).headers()['cache-control'], path).toBe('no-cache')
  }
  const flac = await request.get('/audio/fire-burning.flac')
  expect(flac.headers()['content-type']).toBe('audio/flac')
  expect(flac.headers()['cache-control']).toBe('max-age=604800')
  expect((await request.get('/', { headers: { 'accept-encoding': 'gzip' } })).headers()['content-encoding']).toBe('gzip')
})
