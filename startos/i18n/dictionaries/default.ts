export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting A Dark Room': 0,
  'Web Interface': 1,
  'The game is ready': 2,
  'The game is not responding': 3,
  'The game page returned HTTP ${status}': 4,

  // interfaces.ts
  'Web UI': 5,
  'Play A Dark Room in your browser': 6,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
