import { canvasStats, expect, open, openMidGame, scene, test } from './fixtures.js'

const ROOM = '#roomPanel canvas.gfx-scene'

test('a new game starts in the dark, and lighting the fire lights the room', async ({ page }) => {
  await open(page)
  await expect(page.locator('body')).toHaveClass(/\bgfx\b/)
  await expect(page.locator(ROOM)).toHaveCount(1)
  await page.waitForTimeout(500)
  const dark = await canvasStats(page, ROOM)
  expect(dark.drawn).toBeGreaterThan(0.95) // the whole room is painted, just dark
  expect(dark.brightness).toBeLessThan(25)

  await page.locator('#lightButton').click()
  await expect.poll(() => page.evaluate(() => $SM.get('game.fire.value'))).toBe(3)
  await expect(page.locator('#location_room')).toHaveText('A Firelit Room')
  // the light eases in over a second or two
  await expect
    .poll(async () => (await canvasStats(page, ROOM)).brightness, { timeout: 10_000 })
    .toBeGreaterThan(dark.brightness * 2)
})

test('the fire dies down and the room darkens with it', async ({ page }) => {
  await openMidGame(page)
  await expect.poll(async () => (await scene(page, 'room')).level, { timeout: 10_000 }).toBeGreaterThan(3.9)
  const roaring = await canvasStats(page, ROOM)

  await page.evaluate(() => {
    $SM.set('game.fire', Room.FireEnum.Dead)
    Room.onFireChange()
  })
  await expect.poll(async () => (await scene(page, 'room')).level, { timeout: 10_000 }).toBeLessThan(0.1)
  expect((await canvasStats(page, ROOM)).brightness).toBeLessThan(roaring.brightness / 2)
})

test('stoking the fire works through the scene', async ({ page }) => {
  await openMidGame(page)
  await page.evaluate(() => {
    $SM.set('game.fire', Room.FireEnum.Flickering)
    Room.onFireChange()
  })
  await expect(page.locator('#stokeButton')).not.toHaveClass(/disabled/, { timeout: 15_000 })
  await page.locator('#stokeButton').click()
  await expect.poll(() => page.evaluate(() => $SM.get('game.fire.value'))).toBe(3)
})
