#!/usr/bin/env node
// Wire the graphics layer into A Dark Room's index.html, and drop the two
// third-party requests (Google Analytics, jQuery from Google's CDN) so a
// self-hosted copy makes no outside calls. The game already falls back to
// its bundled lib/jquery.min.js when the CDN copy is missing.
//
// Fails loudly if upstream's index.html no longer matches, rather than
// shipping a half-patched page.
import { readFileSync, writeFileSync } from 'node:fs'

const SCRIPTS = ['core', 'room', 'village', 'world', 'combat']
const MARK = '<!-- graphics layer -->'

const file = process.argv[2]
if (!file) {
  console.error('usage: patch-index.mjs <index.html>')
  process.exit(2)
}
let html = readFileSync(file, 'utf8')
if (html.includes(MARK)) {
  console.log(`${file}: already patched`)
  process.exit(0)
}

function cut(pattern, what) {
  if (!pattern.test(html)) {
    throw new Error(`patch-index: ${what} not found in ${file}; has upstream changed?`)
  }
  html = html.replace(pattern, '')
}

cut(/[ \t]*<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config'[^\n]*\n[ \t]*<\/script>\n/, 'Google Analytics block')
cut(/[ \t]*<script src="https:\/\/ajax\.googleapis\.com\/[^"]*"><\/script>\n/, 'CDN jQuery tag')

if (!html.includes('</head>')) throw new Error(`patch-index: no </head> in ${file}`)
const tags = [
  MARK,
  '<link rel="stylesheet" type="text/css" href="gfx/gfx.css" />',
  ...SCRIPTS.map((s) => `<script src="gfx/js/${s}.js"></script>`),
]
html = html.replace('</head>', tags.map((t) => `\t${t}\n`).join('') + '</head>')

writeFileSync(file, html)
console.log(`${file}: graphics layer wired in`)
