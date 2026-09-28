// scripts/release.sh against a fake `gh` that records what it is asked to do.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const ROOT = new URL('../../', import.meta.url).pathname
const SCRIPT = join(ROOT, 'scripts/release.sh')

// `gh release view` answers per FAKE_STATE (none | published | draft); every call is
// logged, and the notes file handed to `gh release create` is copied aside.
const FAKE_GH = `#!/bin/sh
echo "$*" >> "$FAKE_DIR/calls"
case "$1 $2" in
  "release view")
    case "$FAKE_STATE" in
      published) echo false ;;
      draft) echo true ;;
      *) echo "release not found" >&2; exit 1 ;;
    esac ;;
  "release create")
    while [ $# -gt 0 ]; do
      [ "$1" = --notes-file ] && cp "$2" "$FAKE_DIR/notes"
      shift
    done ;;
esac
`

function run(state, files = ['adarkroom-graphics.s9pk']) {
  const dir = mkdtempSync(join(tmpdir(), 'release-'))
  writeFileSync(join(dir, 'gh'), FAKE_GH)
  chmodSync(join(dir, 'gh'), 0o755)
  const paths = files.map((name) => {
    const p = join(dir, name)
    writeFileSync(p, `s9pk ${name}`)
    return p
  })
  const res = spawnSync('sh', [SCRIPT, '1.4.0:2', 'abc123', ...paths], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      FAKE_DIR: dir,
      FAKE_STATE: state,
      TITLE: 'A Dark Room (Graphics)',
      RELEASE_NOTES: 'Brighter fires.',
    },
  })
  const read = (f) => {
    try {
      return readFileSync(join(dir, f), 'utf8')
    } catch {
      return ''
    }
  }
  return { ...res, calls: read('calls').trim().split('\n'), notes: read('notes') }
}

test('a new version is released as a draft, then published, with the s9pk', () => {
  const r = run('none')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.calls[0], /^release view v1\.4\.0_2 /)
  assert.match(r.calls[1], /^release create v1\.4\.0_2 \S*\/adarkroom-graphics\.s9pk --draft --target abc123 --title A Dark Room \(Graphics\) 1\.4\.0:2 /)
  assert.equal(r.calls[2], 'release edit v1.4.0_2 --draft=false --latest')
  assert.equal(r.calls.length, 3)
})

test('the release notes carry what is new, install steps and checksums', () => {
  const { notes } = run('none')
  assert.match(notes, /## What's new\n\nBrighter fires\./)
  assert.match(notes, /Sideload/)
  assert.match(notes, /`adarkroom-graphics\.s9pk`: every StartOS server/)
  assert.match(notes, /keep the tab open until the service appears/)
  assert.match(notes, /[0-9a-f]{64} {2}adarkroom-graphics\.s9pk/)
})

test('per-architecture s9pks are labelled for their servers', () => {
  const { notes } = run('none', ['adarkroom-graphics_x86_64.s9pk', 'adarkroom-graphics_aarch64.s9pk'])
  assert.match(notes, /`adarkroom-graphics_x86_64\.s9pk`: Intel or AMD servers only/)
  assert.match(notes, /`adarkroom-graphics_aarch64\.s9pk`: ARM servers only/)
})

test('a version already released is left alone', () => {
  const r = run('published')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /already released/)
  assert.equal(r.calls.length, 1)
})

test('a draft left by an interrupted run is replaced', () => {
  const r = run('draft')
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.calls[1], 'release delete v1.4.0_2 --yes --cleanup-tag')
  assert.match(r.calls[2], /^release create /)
})

test('refuses to release without s9pks', () => {
  const r = run('none', [])
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /no s9pk files/)
})
