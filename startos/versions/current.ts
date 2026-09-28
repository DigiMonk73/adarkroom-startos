import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.4.0:2',
  releaseNotes: {
    en_US:
      'Now signed with the developer’s permanent key, so every future update comes from the same signer. Nothing changes in the game, and your progress is untouched.',
    es_ES:
      'Ahora firmado con la clave permanente del desarrollador, de modo que todas las actualizaciones futuras vienen del mismo firmante. El juego no cambia y tu progreso queda intacto.',
    de_DE:
      'Jetzt mit dem dauerhaften Schlüssel des Entwicklers signiert, sodass alle künftigen Updates vom selben Unterzeichner kommen. Am Spiel ändert sich nichts, und dein Fortschritt bleibt erhalten.',
    pl_PL:
      'Teraz podpisane stałym kluczem dewelopera, więc wszystkie przyszłe aktualizacje pochodzą od tego samego podpisującego. W grze nic się nie zmienia, a twój postęp pozostaje nienaruszony.',
    fr_FR:
      'Désormais signé avec la clé permanente du développeur : toutes les futures mises à jour viennent du même signataire. Rien ne change dans le jeu, et votre progression reste intacte.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
