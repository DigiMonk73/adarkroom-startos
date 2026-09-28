import { canvasStats, embark, expect, openMidGame, test } from './fixtures.js'

const MAP = 'canvas.gfx-world'

test('the world map is drawn as tiles over the text map', async ({ page }) => {
  await openMidGame(page)
  await embark(page)
  await expect(page.locator('#map')).toHaveCSS('color', 'rgba(0, 0, 0, 0)')
  const stats = await canvasStats(page, MAP)
  expect(stats.drawn).toBe(1)
  expect(stats.brightness).toBeGreaterThan(5)
})

test('clicking the map walks the wanderer that way', async ({ page }) => {
  await openMidGame(page)
  await embark(page)
  const box = await page.locator(MAP).boundingBox()
  const start = await page.evaluate(() => World.curPos.slice())
  await page.mouse.click(box.x + box.width / 2, box.y + 30) // straight above the wanderer
  await expect.poll(() => page.evaluate(() => World.curPos.slice())).toEqual([start[0], start[1] - 1])
})

test('the arrow keys still move the wanderer', async ({ page }) => {
  await openMidGame(page)
  await embark(page)
  const start = await page.evaluate(() => World.curPos.slice())
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => page.evaluate(() => World.curPos.slice())).toEqual([start[0] + 1, start[1]])
})
