import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.4.0:0',
  releaseNotes: {
    en_US:
      'First release of the graphics edition: A Dark Room with a room lit by its fire, a village you watch grow, a pixel-art world map and illustrated fights. Choose "graphics off." in the game menu to play the original text game; your progress carries over either way.',
    es_ES:
      'Primera versión de la edición con gráficos: A Dark Room con una habitación iluminada por su fuego, una aldea que ves crecer, un mapa del mundo en pixel art y combates ilustrados. Elige «graphics off.» en el menú del juego para jugar al juego original en texto; tu progreso se conserva en ambos casos.',
    de_DE:
      'Erste Version der Grafik-Ausgabe: A Dark Room mit einem Raum, den sein Feuer erhellt, einem Dorf, das du wachsen siehst, einer Weltkarte in Pixel-Art und illustrierten Kämpfen. Wähle „graphics off.“ im Spielmenü, um das ursprüngliche Textspiel zu spielen; dein Fortschritt bleibt in beiden Fällen erhalten.',
    pl_PL:
      'Pierwsze wydanie edycji z grafiką: A Dark Room z pokojem oświetlonym przez ogień, wioską, która rośnie na twoich oczach, mapą świata w stylu pixel art i ilustrowanymi walkami. Wybierz „graphics off.” w menu gry, aby grać w oryginalną grę tekstową; postęp zostaje zachowany w obu przypadkach.',
    fr_FR:
      'Première version de l’édition avec graphismes : A Dark Room avec une pièce éclairée par son feu, un village que vous voyez grandir, une carte du monde en pixel art et des combats illustrés. Choisissez « graphics off. » dans le menu du jeu pour jouer au jeu texte d’origine ; votre progression est conservée dans les deux cas.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
