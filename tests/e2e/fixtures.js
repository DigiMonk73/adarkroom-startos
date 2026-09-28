import { test as base, expect } from '@playwright/test'

/**
 * Every test fails on a page error, a console error (a 404 included), a
 * request that leaves the server, or a graphics scene that disabled itself
 * after throwing (core.js turns a broken scene off rather than the game).
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL).origin
    const problems = []
    page.on('pageerror', (e) => problems.push(`page error: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`console error: ${m.text()}`)
    })
    page.on('request', (r) => {
      const url = r.url()
      if (!url.startsWith(origin) && !/^(data|blob):/.test(url)) problems.push(`outside request: ${url}`)
    })

    await use(page)

    if (!page.isClosed()) {
      const broken = await page.evaluate(() => (window.Gfx ? Gfx.scenes.filter((s) => s.broken).map((s) => s.name) : []))
      for (const name of broken) problems.push(`graphics scene "${name}" disabled itself`)
    }
    expect(problems, problems.join('\n')).toEqual([])
  },
})

export { expect }

/** Load the game and wait for it to be running, without the one-time "sound available" prompt. */
export async function open(page) {
  await page.goto('/')
  await page.waitForFunction(() => window.Engine && Engine.activeModule)
  await page.evaluate(() => $SM.set('playStats.audioAlertShown', true))
}

/**
 * Start from a mid-game save: a village with every kind of building, the
 * fire roaring, a compass for the path.
 */
export async function openMidGame(page) {
  await open(page)
  await page.evaluate(() => {
    $SM.set('stores', { wood: 800, fur: 120, meat: 40, bait: 3, compass: 1, 'cured meat': 60, leather: 30 })
    $SM.set('game.buildings', {
      hut: 13,
      trap: 9,
      cart: 1,
      lodge: 1,
      'trading post': 1,
      tannery: 1,
      smokehouse: 1,
      workshop: 1,
      steelworks: 1,
      armoury: 1,
      'iron mine': 1,
      'coal mine': 1,
      'sulphur mine': 1,
    })
    $SM.set('game.population', 40)
    $SM.set('game.builder.level', 4)
    $SM.set('game.fire', Room.FireEnum.Roaring)
    $SM.set('game.temperature', Room.TempEnum.Hot)
    Engine.saveGame()
  })
  await page.reload()
  await page.waitForFunction(() => window.Engine && Engine.activeModule === Room)
}

/** Set out from the village onto the world map with some food and a spear. */
export async function embark(page) {
  await page.evaluate(() => {
    Engine.travelTo(Path)
    Path.outfit['cured meat'] = 10
    Path.outfit['bone spear'] = 1
    Path.embark()
  })
  // The map slides in over 300ms (Path.embark animates #outerSlider): wait for
  // it to settle, or a click measured mid-slide lands where the map no longer is.
  await page.waitForFunction(
    () => Engine.activeModule === World && document.querySelector('canvas.gfx-world') && !$('#outerSlider').is(':animated'),
  )
}

/** Mean brightness (0–255) of a canvas, and the share of its pixels that are drawn. */
export function canvasStats(page, selector) {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel)
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let sum = 0
    let drawn = 0
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      drawn++
      sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * (d[i + 3] / 255)
    }
    return { brightness: drawn ? sum / drawn : 0, drawn: drawn / (d.length / 4) }
  }, selector)
}

export function scene(page, name) {
  return page.evaluate((n) => {
    const s = Gfx.scenes.find((x) => x.name === n)
    return s && { broken: !!s.broken, huts: s.huts, level: s.level }
  }, name)
}
