import { canvasStats, expect, openMidGame, scene, test } from './fixtures.js'

const VILLAGE = '#outsidePanel canvas.gfx-scene'

test('the village is drawn with a hut for every hut built', async ({ page }) => {
  await openMidGame(page)
  await page.evaluate(() => Engine.travelTo(Outside))
  await expect(page.locator(VILLAGE)).toHaveCount(1)
  await expect.poll(async () => (await scene(page, 'village')).huts).toBe(13)
  const stats = await canvasStats(page, VILLAGE)
  expect(stats.drawn).toBeGreaterThan(0.95)
  expect(stats.brightness).toBeGreaterThan(20)
})

test('building a hut adds one to the scene', async ({ page }) => {
  await openMidGame(page)
  await page.evaluate(() => Engine.travelTo(Outside))
  await expect.poll(async () => (await scene(page, 'village')).huts).toBe(13)
  await page.evaluate(() => $SM.add('game.buildings["hut"]', 1))
  await expect.poll(async () => (await scene(page, 'village')).huts).toBe(14)
})

test('gathering wood works through the scene', async ({ page }) => {
  await openMidGame(page)
  await page.evaluate(() => Engine.travelTo(Outside))
  const before = await page.evaluate(() => $SM.get('stores.wood'))
  await page.locator('#gatherButton').click()
  await expect.poll(() => page.evaluate(() => $SM.get('stores.wood'))).toBeGreaterThan(before)
})
