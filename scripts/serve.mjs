#!/usr/bin/env node
// Zero-dependency static server for play-testing. Serves the assembled game
// directory, except /gfx/*, which comes straight from graphics/ so edits to
// the graphics layer show up on a plain reload.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GAME = resolve(process.argv[2] || join(ROOT, 'build/game'))
const GFX = join(ROOT, 'graphics')
const PORT = Number(process.env.PORT) || 8080

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.flac': 'audio/flac',
  '.mp3': 'audio/mpeg',
}

function locate(urlPath) {
  const [base, rel] = urlPath.startsWith('/gfx/') ? [GFX, urlPath.slice(5)] : [GAME, urlPath]
  const file = normalize(join(base, rel === '/' || rel === '' ? 'index.html' : rel))
  return file === base || file.startsWith(base + sep) ? file : null
}

createServer(async (req, res) => {
  const file = locate(decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try {
    if (!file) throw new Error('outside root')
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, () => console.log(`A Dark Room (graphics) on http://localhost:${PORT}`))
