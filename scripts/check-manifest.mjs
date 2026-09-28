#!/usr/bin/env node
// Sanity checks on the bundled manifest (run after `npm run build`): the
// things that would break existing installs or ship the wrong package if they
// drifted.
import { appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { manifest: m } = require('../javascript/index.js')

const errors = []
const check = (ok, msg) => ok || errors.push(msg)

check(m.id === 'adarkroom-graphics', `package id must stay "adarkroom-graphics" (existing installs), got ${m.id}`)
check(m.license === 'MPL-2.0', `license must be upstream's MPL-2.0, got ${m.license}`)
check(/^\d+\.\d+\.\d+:\d+$/.test(m.version), `version ${m.version} is not <x.y.z>:<n>`)
check(m.canMigrateTo === `=${m.version}`, `downgrades must be impossible, canMigrateTo is ${m.canMigrateTo}`)
check(
  JSON.stringify([...(m.images?.main?.arch ?? [])].sort()) === '["aarch64","x86_64"]',
  `arch must be x86_64 + aarch64, got ${m.images?.main?.arch}`,
)
check('dockerBuild' in (m.images?.main?.source ?? {}), 'the image must be built from the Dockerfile')
check(m.volumes.length === 0, `no volumes by design (saves live in the browser), got ${m.volumes}`)
check(Object.keys(m.dependencies).length === 0, `no dependencies expected, got ${Object.keys(m.dependencies)}`)
for (const key of ['short', 'long']) {
  const locales = Object.keys(m.description?.[key] ?? {}).sort().join(',')
  check(locales === 'de_DE,en_US,es_ES,fr_FR,pl_PL', `description.${key} locales are ${locales}`)
}
const noteLocales = Object.keys(m.releaseNotes ?? {}).sort().join(',')
check(noteLocales === 'de_DE,en_US,es_ES,fr_FR,pl_PL', `release notes locales are ${noteLocales}`)
check(!('alerts' in m), 'alerts was removed in start-sdk 2.0')

if (errors.length) {
  console.error(`manifest check failed:\n - ${errors.join('\n - ')}`)
  process.exit(1)
}
console.log(`manifest ok: ${m.id} ${m.version}`)

// In CI: the version, title and release notes, for the release job.
if (process.env.GITHUB_OUTPUT) {
  const notes = m.releaseNotes?.en_US ?? ''
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${m.version}\ntitle=${m.title}\nnotes<<NOTES_EOF\n${notes}\nNOTES_EOF\n`)
}
