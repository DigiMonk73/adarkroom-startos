import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.4.0:1',
  releaseNotes: {
    en_US:
      'The graphics edition of A Dark Room: a room lit by its fire, a village you watch grow, a pixel-art world map and illustrated fights. Choose "graphics off." in the game menu for the original text game; your progress carries over either way. New in this build: one download that installs on every StartOS server, Intel, AMD or ARM.',
    es_ES:
      'La edición con gráficos de A Dark Room: una habitación iluminada por su fuego, una aldea que ves crecer, un mapa del mundo en pixel art y combates ilustrados. Elige «graphics off.» en el menú del juego para el juego original en texto; tu progreso se conserva en ambos casos. Novedad de esta versión: una sola descarga que se instala en cualquier servidor StartOS, Intel, AMD o ARM.',
    de_DE:
      'Die Grafik-Ausgabe von A Dark Room: ein Raum, den sein Feuer erhellt, ein Dorf, das du wachsen siehst, eine Weltkarte in Pixel-Art und illustrierte Kämpfe. Wähle „graphics off.“ im Spielmenü für das ursprüngliche Textspiel; dein Fortschritt bleibt in beiden Fällen erhalten. Neu in dieser Version: ein einziger Download, der auf jedem StartOS-Server läuft, ob Intel, AMD oder ARM.',
    pl_PL:
      'Edycja A Dark Room z grafiką: pokój oświetlony przez ogień, wioska, która rośnie na twoich oczach, mapa świata w stylu pixel art i ilustrowane walki. Wybierz „graphics off.” w menu gry, aby grać w oryginalną grę tekstową; postęp zostaje zachowany w obu przypadkach. Nowość w tym wydaniu: jeden plik do pobrania, który instaluje się na każdym serwerze StartOS, z procesorem Intel, AMD lub ARM.',
    fr_FR:
      'L’édition avec graphismes d’A Dark Room : une pièce éclairée par son feu, un village que vous voyez grandir, une carte du monde en pixel art et des combats illustrés. Choisissez « graphics off. » dans le menu du jeu pour le jeu texte d’origine ; votre progression est conservée dans les deux cas. Nouveau dans cette version : un seul téléchargement qui s’installe sur tout serveur StartOS, Intel, AMD ou ARM.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
