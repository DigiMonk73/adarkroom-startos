import { embark, expect, openMidGame, test } from './fixtures.js'

test('both fighters get a sprite, and a fight plays out', async ({ page }) => {
  await openMidGame(page)
  await embark(page)
  // The snarling beast, started directly so the test doesn't depend on terrain.
  await page.evaluate(() => Events.startEvent(Events.Encounters.find((e) => e.scenes.start.enemy === 'snarling beast')))
  const wanderer = page.locator('#wanderer canvas.gfx-fighter')
  const enemy = page.locator('#enemy canvas.gfx-fighter')
  await expect(wanderer).toBeVisible()
  await expect(enemy).toBeVisible()
  await expect(page.locator('#enemy .label')).toBeHidden()

  // Fight until one side wins.
  const attack = page.locator('#attackButtons .button').first()
  await expect
    .poll(
      async () => {
        if (await attack.isVisible()) await attack.click({ timeout: 1000 }).catch(() => {})
        return page.evaluate(() => Events.won || World.dead || !Events.activeEvent())
      },
      { timeout: 45_000, intervals: [500] },
    )
    .toBe(true)
})

test('every enemy in the game has its own sprite', async ({ page }) => {
  await openMidGame(page)
  const result = await page.evaluate(() => {
    // Walk all event collections for combat scenes, so new upstream enemies are covered.
    const enemies = new Map()
    const visit = (node, depth) => {
      if (!node || typeof node !== 'object' || depth > 4) return
      if (node.scenes) {
        for (const s of Object.values(node.scenes)) {
          if (s && s.combat) enemies.set(`${s.enemy}|${s.chara}`, s)
        }
        return
      }
      for (const v of Object.values(node)) visit(v, depth + 1)
    }
    for (const key of ['Encounters', 'Setpieces', 'Executioner', 'Global', 'Room', 'Outside', 'Marketing']) {
      visit(Events[key], 0)
    }
    const sprites = [...enemies.values()].map((s) => {
      const c = Gfx.sprites.enemy(s.enemy || s.enemyName, s.chara)
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      let opaque = 0
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) opaque++
      return { name: s.enemy, opaque, image: c.toDataURL() }
    })
    return {
      count: sprites.length,
      names: new Set(sprites.map((s) => s.name)).size,
      distinct: new Set(sprites.map((s) => s.image)).size,
      empty: sprites.filter((s) => s.opaque < 20).map((s) => s.name),
    }
  })
  expect(result.count).toBeGreaterThan(40)
  expect(result.empty).toEqual([])
  expect(result.distinct).toBe(result.names)
})
