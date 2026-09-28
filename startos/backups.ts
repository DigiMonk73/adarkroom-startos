import { sdk } from './sdk'

/**
 * Nothing to back up: the game is static files in the image, and each
 * player's progress is saved in their own browser, never on the server.
 */
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes(),
)
