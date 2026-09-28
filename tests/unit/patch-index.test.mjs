// scripts/patch-index.mjs against upstream's real index.html (the submodule).
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const ROOT = new URL('../../', import.meta.url).pathname
const PATCH = join(ROOT, 'scripts/patch-index.mjs')
const UPSTREAM = join(ROOT, 'adarkroom/index.html')

function freshCopy(html = readFileSync(UPSTREAM, 'utf8')) {
  const file = join(mkdtempSync(join(tmpdir(), 'adr-')), 'index.html')
  writeFileSync(file, html)
  return file
}

const patch = (file) => spawnSync(process.execPath, [PATCH, file], { encoding: 'utf8' })

test('upstream index.html is checked out', { skip: !existsSync(UPSTREAM) && 'run git submodule update --init' }, () => {
  assert.ok(readFileSync(UPSTREAM, 'utf8').includes('script/engine.js'))
})

test('wires in the graphics layer after the game, in load order', { skip: !existsSync(UPSTREAM) }, () => {
  const file = freshCopy()
  execFileSync(process.execPath, [PATCH, file])
  const html = readFileSync(file, 'utf8')

  const order = ['script/localization.js', 'gfx/gfx.css', ...['core', 'room', 'village', 'world', 'combat'].map((s) => `gfx/js/${s}.js`)]
  const positions = order.map((s) => html.indexOf(s))
  assert.ok(positions.every((p) => p > 0), `missing one of ${order}`)
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'graphics scripts out of order')
  assert.ok(html.indexOf('gfx/js/combat.js') < html.indexOf('</head>'))
})

test('removes every outside request and keeps the bundled jQuery', { skip: !existsSync(UPSTREAM) }, () => {
  const file = freshCopy()
  execFileSync(process.execPath, [PATCH, file])
  const html = readFileSync(file, 'utf8')
  assert.equal(html.match(/src="https?:\/\//g), null, 'an absolute script src is left')
  assert.ok(!html.includes('googletagmanager') && !html.includes('gtag('))
  assert.ok(html.includes('lib/jquery.min.js'), 'the local jQuery fallback is gone')
})

test('patching twice changes nothing', { skip: !existsSync(UPSTREAM) }, () => {
  const file = freshCopy()
  execFileSync(process.execPath, [PATCH, file])
  const once = readFileSync(file, 'utf8')
  const second = patch(file)
  assert.equal(second.status, 0)
  assert.equal(readFileSync(file, 'utf8'), once)
})

test('refuses an index.html it does not recognise, leaving it untouched', () => {
  const html = '<html><head><script src="script/engine.js"></script></head><body></body></html>\n'
  const file = freshCopy(html)
  const res = patch(file)
  assert.notEqual(res.status, 0)
  assert.match(res.stderr, /not found/)
  assert.equal(readFileSync(file, 'utf8'), html)
})
