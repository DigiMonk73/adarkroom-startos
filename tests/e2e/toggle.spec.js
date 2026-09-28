import { expect, open, test } from './fixtures.js'

test('"graphics off." gives back the original text game, and the save carries over', async ({ page }) => {
  await open(page)
  await page.locator('#lightButton').click()
  await expect.poll(() => page.evaluate(() => $SM.get('game.fire.value'))).toBe(3)
  await expect(page.locator('.menu .lightsOff')).toBeHidden()

  await page.locator('.gfxToggle').click()
  await page.waitForFunction(() => window.Engine && Engine.activeModule)
  await expect(page.locator('body')).not.toHaveClass(/\bgfx\b/)
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('.gfxToggle')).toHaveText('graphics on.')
  await expect(page.locator('.menu .lightsOff')).toHaveText('lights off.') // the player's light theme is back
  expect(await page.evaluate(() => $SM.get('game.fire.value'))).toBe(3)

  // The text game still plays.
  await page.evaluate(() => {
    $SM.set('game.fire', Room.FireEnum.Flickering)
    Room.onFireChange()
  })
  // stoking shares the light button's cooldown, which survives the reload
  await expect(page.locator('#stokeButton')).not.toHaveClass(/disabled/, { timeout: 15_000 })
  await page.locator('#stokeButton').click()
  await expect.poll(() => page.evaluate(() => $SM.get('game.fire.value'))).toBe(3)

  await page.locator('.gfxToggle').click()
  await page.waitForFunction(() => window.Engine && Engine.activeModule)
  await expect(page.locator('body')).toHaveClass(/\bgfx\b/)
  await expect(page.locator('#roomPanel canvas.gfx-scene')).toHaveCount(1)
})
