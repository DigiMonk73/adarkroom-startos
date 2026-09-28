/*
 * A Dark Room — graphics layer: the world map.
 *
 * Draws World.state.map as 16×16 pixel-art tiles at 2× over the ASCII map,
 * with a camera that follows the wanderer, the game's own fog of war
 * (World.state.mask), a minimap, and landmark names on hover. The ASCII map
 * is still rendered underneath (just transparent), so the game's logic is
 * untouched; clicks on the canvas call the same World.move* functions.
 */
(function () {
  'use strict';
  var Gfx = window.Gfx;
  if (!Gfx || !Gfx.enabled) return;

  var T = 32; // tile size on screen
  var P = 16; // tile size in sprite pixels
  var FOG = '#0b0b0a';

  var scene = {
    name: 'world',
    c: null,
    cam: null,
    tiles: {},
    mini: null,
    miniDirty: true,
    hover: null,
  };

  // ---- pixel-art tiles ----------------------------------------------------------

  function painter(ctx, rnd) {
    return {
      px: function (x, y, col, w, h) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, w || 1, h || 1);
      },
      speckle: function (n, cols) {
        for (var i = 0; i < n; i++) {
          ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
          ctx.fillRect(Math.floor(rnd() * P), Math.floor(rnd() * P), 1, 1);
        }
      },
      rnd: rnd,
    };
  }

  var BASES = {
    field: function (p) {
      p.px(0, 0, '#3f4325', P, P);
      p.speckle(22, ['#55592f', '#4b4f2a', '#6a6b3b', '#363a20']);
    },
    forest: function (p) {
      p.px(0, 0, '#1b261a', P, P);
      p.speckle(10, ['#243322', '#141c13']);
      var n = 2 + Math.floor(p.rnd() * 2);
      for (var i = 0; i < n; i++) {
        var x = 2 + Math.floor(p.rnd() * 10);
        var y = 4 + Math.floor(p.rnd() * 7);
        p.px(x + 2, y + 4, '#3b2a1a', 1, 2);
        p.px(x + 2, y - 1, '#2c4a2a');
        p.px(x + 1, y, '#2c4a2a', 3, 1);
        p.px(x + 1, y + 1, '#2c4a2a', 3, 1);
        p.px(x, y + 2, '#2c4a2a', 5, 1);
        p.px(x, y + 3, '#23391f', 5, 1);
        p.px(x + 2, y, '#3e6136');
        p.px(x + 1, y + 2, '#3e6136');
      }
    },
    barrens: function (p) {
      p.px(0, 0, '#4a4033', P, P);
      p.speckle(16, ['#5c5042', '#3a3228', '#534838']);
      if (p.rnd() < 0.5) {
        var x = Math.floor(p.rnd() * 10);
        var y = Math.floor(p.rnd() * 12);
        p.px(x, y, '#3a3228', 3, 1);
        p.px(x + 3, y + 1, '#3a3228', 2, 1);
      }
    },
    road: function (p) {
      p.px(0, 0, '#3e3b36', P, P);
      p.speckle(18, ['#4f4b44', '#35322e', '#57534b']);
      p.px(7, 2, '#5e5a50', 2, 3);
      p.px(7, 10, '#5e5a50', 2, 3);
    },
    swamp: function (p) {
      p.px(0, 0, '#27301f', P, P);
      p.px(2, 4, '#1b2a2c', 6, 3);
      p.px(8, 10, '#1b2a2c', 6, 3);
      p.px(3, 5, '#2b4144', 3, 1);
      p.px(9, 11, '#2b4144', 3, 1);
      p.speckle(12, ['#3d4a2a', '#34402a']);
      p.px(12, 3, '#4d5a30', 1, 4);
      p.px(4, 11, '#4d5a30', 1, 3);
    },
    dark: function (p) {
      p.px(0, 0, '#35302a', P, P);
      p.speckle(16, ['#403a33', '#2a2621']);
    },
  };

  function mound(p, rock, ore) {
    p.px(3, 9, rock, 10, 6);
    p.px(4, 7, rock, 8, 2);
    p.px(6, 6, rock, 4, 1);
    p.px(4, 7, '#777069', 3, 1);
    p.px(6, 10, '#050505', 4, 5);
    p.px(5, 9, '#5a3d24', 6, 1);
    p.px(5, 9, '#5a3d24', 1, 6);
    p.px(10, 9, '#5a3d24', 1, 6);
    if (ore) {
      p.px(12, 13, ore, 2, 2);
      p.px(13, 12, ore);
      p.px(2, 14, ore);
    }
  }

  // Landmark icons, keyed by World.TILE character, each with its ground.
  var ICONS = {
    A: ['field', function (p) {
      p.px(2, 8, '#2a211a', 6, 5);
      p.px(1, 7, '#1a1410', 8, 1);
      p.px(2, 6, '#1a1410', 6, 1);
      p.px(3, 5, '#1a1410', 4, 1);
      p.px(4, 10, '#ffab4a', 2, 2);
      p.px(9, 9, '#2a211a', 6, 5);
      p.px(8, 8, '#1a1410', 8, 1);
      p.px(9, 7, '#1a1410', 6, 1);
      p.px(10, 6, '#1a1410', 4, 1);
      p.px(12, 11, '#ffab4a', 2, 1);
      p.px(12, 3, '#9a948a', 1, 3);
      p.px(13, 2, '#9a948a', 1, 1);
    }],
    H: ['barrens', function (p) {
      p.px(3, 7, '#6b6660', 10, 7);
      p.px(2, 6, '#2b2622', 12, 1);
      p.px(3, 5, '#2b2622', 10, 1);
      p.px(5, 4, '#2b2622', 6, 1);
      p.px(5, 9, '#141210', 2, 2);
      p.px(9, 10, '#141210', 2, 4);
      p.px(12, 8, '#57524c', 1, 6);
    }],
    V: ['barrens', function (p) {
      p.px(1, 8, '#5a5550', 14, 7);
      p.px(3, 6, '#5a5550', 10, 2);
      p.px(5, 5, '#5a5550', 6, 1);
      p.px(3, 6, '#716b64', 4, 1);
      p.px(5, 10, '#050505', 6, 5);
      p.px(6, 9, '#050505', 4, 1);
    }],
    O: ['barrens', function (p) {
      p.px(1, 8, '#5d5953', 4, 6);
      p.px(6, 5, '#6a665f', 4, 9);
      p.px(11, 9, '#57534d', 4, 5);
      p.px(7, 7, '#1d1b19', 1, 1);
      p.px(8, 10, '#1d1b19', 1, 1);
      p.px(2, 10, '#1d1b19', 1, 1);
      p.px(12, 11, '#1d1b19', 1, 1);
      p.px(6, 4, '#6a665f', 2, 1);
    }],
    Y: ['dark', function (p) {
      p.px(1, 4, '#4f4c48', 4, 11);
      p.px(6, 1, '#5b5853', 4, 14);
      p.px(11, 6, '#4a4743', 4, 9);
      p.px(1, 3, '#4f4c48', 2, 1);
      p.px(8, 0, '#5b5853', 2, 1);
      for (var y = 3; y < 14; y += 2) {
        p.px(7, y, '#23211f');
        p.px(2, y + 1, '#23211f');
        p.px(12, y + 2 > 14 ? 14 : y + 2, '#23211f');
      }
      p.px(8, 5, '#c9a45a');
      p.px(3, 9, '#c9a45a');
    }],
    I: ['barrens', function (p) { mound(p, '#5a5550', '#9a5a44'); }],
    C: ['barrens', function (p) { mound(p, '#5a5550', '#111111'); }],
    S: ['barrens', function (p) { mound(p, '#5a5550', '#c8b84a'); }],
    P: ['field', function (p) {
      p.px(7, 2, '#3a2a1a', 1, 12);
      p.px(8, 2, '#a33a2e', 4, 3);
      p.px(3, 10, '#9c8b6a', 10, 4);
      p.px(4, 9, '#9c8b6a', 8, 1);
      p.px(6, 8, '#9c8b6a', 4, 1);
      p.px(7, 11, '#2a241c', 2, 3);
    }],
    W: ['barrens', function (p) {
      for (var i = 0; i < 12; i++) p.px(2 + i, 11 - Math.floor(i / 2), '#7c8a92', 2, 3);
      p.px(4, 9, '#9fb0b8', 6, 1);
      p.px(12, 4, '#56e0c8', 2, 2);
      p.px(1, 13, '#3b3a38', 14, 2);
    }],
    B: ['barrens', function (p) {
      p.px(3, 4, '#6a6258', 10, 9);
      p.px(2, 6, '#6a6258', 12, 5);
      p.px(4, 5, '#0a0908', 8, 7);
      p.px(3, 7, '#0a0908', 10, 3);
      p.px(5, 6, '#1e1b18', 6, 1);
    }],
    F: ['barrens', function (p) {
      p.px(3, 3, '#6d6a66');
      p.px(4, 4, '#6d6a66');
      p.px(5, 5, '#6d6a66');
      p.px(6, 6, '#6d6a66');
      p.px(7, 7, '#6d6a66');
      p.px(7, 3, '#6d6a66');
      p.px(6, 4, '#6d6a66');
      p.px(4, 6, '#6d6a66');
      p.px(3, 7, '#6d6a66');
      p.px(10, 10, '#d8d2c4', 3, 2);
      p.px(10, 12, '#d8d2c4', 1, 1);
      p.px(12, 12, '#d8d2c4', 1, 1);
      p.px(10, 11, '#1a1816', 1, 1);
      p.px(12, 11, '#1a1816', 1, 1);
      p.px(2, 12, '#7a3a2a', 3, 1);
    }],
    M: ['swamp', function () {}],
    U: ['barrens', function (p) {
      p.px(4, 6, '#6b4a2a', 8, 7);
      p.px(4, 6, '#4a3220', 8, 1);
      p.px(4, 9, '#4a3220', 8, 1);
      p.px(4, 12, '#4a3220', 8, 1);
      p.px(7, 8, '#b8a060', 2, 2);
    }],
    X: ['dark', function (p) {
      p.px(1, 3, '#2a2a2e', 14, 12);
      p.px(3, 1, '#2a2a2e', 10, 2);
      p.px(2, 4, '#3a3a40', 3, 10);
      p.px(11, 5, '#3a3a40', 2, 9);
      p.px(7, 6, '#d0342c', 2, 2);
      p.px(6, 9, '#1a1a1d', 4, 6);
    }],
  };

  var BASE_OF = { ';': 'forest', ',': 'field', '.': 'barrens', '#': 'road' };

  function tile(ch, variant, used) {
    var key = ch + variant + (used ? '!' : '');
    if (scene.tiles[key]) return scene.tiles[key];
    var icon = ICONS[ch];
    var base = icon ? icon[0] : BASE_OF[ch] || 'barrens';
    scene.tiles[key] = Gfx.sprite(P, P, function (ctx) {
      var p = painter(ctx, Gfx.rng(Gfx.hash(ch) + variant * 977));
      BASES[base](p);
      if (icon) {
        icon[1](p);
        if (used) {
          ctx.fillStyle = 'rgba(30,30,30,0.55)';
          ctx.fillRect(0, 0, P, P);
        }
      }
    });
    return scene.tiles[key];
  }

  function wandererSprite() {
    return Gfx.sprite(P, P, function (ctx) {
      var p = painter(ctx, Gfx.rng(1));
      p.px(6, 2, '#1a1512', 4, 1);
      p.px(5, 3, '#1a1512', 6, 4);
      p.px(6, 4, '#e0c8a8', 4, 2);
      p.px(6, 4, '#2a211a', 4, 1);
      p.px(4, 7, '#5f4b3a', 8, 6);
      p.px(3, 8, '#5f4b3a', 1, 4);
      p.px(12, 8, '#5f4b3a', 1, 4);
      p.px(10, 7, '#3a2e24', 3, 5);
      p.px(5, 13, '#2a211a', 2, 2);
      p.px(9, 13, '#2a211a', 2, 2);
      p.px(3, 11, '#ffd27a', 1, 2);
    });
  }

  var MINI_COLOURS = { ';': '#2c3f28', ',': '#555a31', '.': '#5c5042', '#': '#6a665e' };

  function buildMini() {
    var R = World.RADIUS * 2 + 1;
    var st = World.state;
    scene.mini = Gfx.sprite(R, R, function (ctx) {
      ctx.fillStyle = 'rgba(8,8,7,0.85)';
      ctx.fillRect(0, 0, R, R);
      for (var i = 0; i < R; i++) {
        for (var j = 0; j < R; j++) {
          if (!st.mask[i][j]) continue;
          var c = st.map[i][j][0];
          ctx.fillStyle = MINI_COLOURS[c] || (c === 'A' ? '#ffab4a' : '#d8d2c4');
          ctx.fillRect(i, j, 1, 1);
        }
      }
    });
    scene.miniDirty = false;
  }

  // ---- input --------------------------------------------------------------------

  function playerScreen() {
    return [
      (World.curPos[0] - scene.cam[0]) * T + scene.c.w / 2,
      (World.curPos[1] - scene.cam[1]) * T + scene.c.h / 2,
    ];
  }

  function onClick(e) {
    if (!World.state) return;
    var r = scene.c.el.getBoundingClientRect();
    var ps = playerScreen();
    var dx = e.clientX - r.left - ps[0];
    var dy = e.clientY - r.top - ps[1];
    // same quadrant split as World.click
    if (dx > dy && dx < -dy) World.moveNorth();
    else if (dx < dy && dx > -dy) World.moveSouth();
    else if (dx < dy && dx < -dy) World.moveWest();
    else if (dx > dy && dx > -dy) World.moveEast();
  }

  function onMove(e) {
    if (!World.state || !scene.cam) return;
    var r = scene.c.el.getBoundingClientRect();
    var tx = Math.round((e.clientX - r.left - scene.c.w / 2) / T + scene.cam[0]);
    var ty = Math.round((e.clientY - r.top - scene.c.h / 2) / T + scene.cam[1]);
    scene.hover = [tx, ty];
  }

  // ---- drawing ------------------------------------------------------------------

  function ensureCanvas() {
    var map = $('#map');
    if (!map.length) return false;
    var w = map.outerWidth();
    var h = map.outerHeight();
    if (!w || !h) return false;
    if (!scene.c || scene.c.w !== w || scene.c.h !== h) {
      if (scene.c) $(scene.c.el).remove();
      scene.c = Gfx.canvas(w, h, 'gfx-world');
      $(scene.c.el)
        .css({ left: map.position().left, top: map.position().top })
        .on('click', onClick)
        .on('mousemove', onMove)
        .on('mouseleave', function () {
          scene.hover = null;
        })
        .appendTo('#worldOuter');
      scene.wanderer = wandererSprite();
    }
    return true;
  }

  function label(ctx, text, x, y) {
    ctx.font = '12px "Times New Roman", serif';
    var w = ctx.measureText(text).width + 10;
    var lx = Math.max(2, Math.min(scene.c.w - w - 2, x - w / 2));
    ctx.fillStyle = 'rgba(12,12,11,0.9)';
    ctx.fillRect(lx, y - 22, w, 17);
    ctx.strokeStyle = '#8a857c';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx + 0.5, y - 21.5, w - 1, 16);
    ctx.fillStyle = '#eee';
    ctx.fillText(text, lx + 5, y - 9);
  }

  scene.visible = function () {
    return Gfx.isActive(window.World) && !!World.state && ensureCanvas();
  };

  scene.frame = function (dt, t) {
    var st = World.state;
    var ctx = scene.c.ctx;
    var cw = scene.c.w;
    var ch = scene.c.h;
    var pos = World.curPos;
    if (!scene.cam || Math.abs(scene.cam[0] - pos[0]) + Math.abs(scene.cam[1] - pos[1]) > 4) {
      scene.cam = [pos[0], pos[1]];
    }
    var k = Math.min(1, dt * 12);
    scene.cam[0] += (pos[0] - scene.cam[0]) * k;
    scene.cam[1] += (pos[1] - scene.cam[1]) * k;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = FOG;
    ctx.fillRect(0, 0, cw, ch);

    var R = World.RADIUS * 2;
    var halfX = Math.ceil(cw / T / 2) + 1;
    var halfY = Math.ceil(ch / T / 2) + 1;
    var ci = Math.round(scene.cam[0]);
    var cj = Math.round(scene.cam[1]);
    for (var i = ci - halfX; i <= ci + halfX; i++) {
      if (i < 0 || i > R) continue;
      for (var j = cj - halfY; j <= cj + halfY; j++) {
        if (j < 0 || j > R || !st.mask[i][j]) continue;
        var c = st.map[i][j];
        var used = c.length > 1 || (c === World.TILE.OUTPOST && World.outpostUsed(i, j));
        var sx = Math.round((i - scene.cam[0]) * T + cw / 2 - T / 2);
        var sy = Math.round((j - scene.cam[1]) * T + ch / 2 - T / 2);
        ctx.drawImage(tile(c[0], (Gfx.hash(i * 131 + j) % 3), used), sx, sy, T, T);
      }
    }

    // the wanderer and their lantern
    var ps = playerScreen();
    var bob = Math.sin(t * 3) * 1;
    ctx.drawImage(scene.wanderer, Math.round(ps[0] - T / 2), Math.round(ps[1] - T / 2 + bob), T, T);
    var light = ctx.createRadialGradient(ps[0], ps[1], T * 2.5, ps[0], ps[1], T * 9);
    light.addColorStop(0, 'rgba(0,0,0,0)');
    light.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighter';
    var warm = ctx.createRadialGradient(ps[0] - 8, ps[1] + 4, 0, ps[0] - 8, ps[1] + 4, T * 2.2);
    warm.addColorStop(0, 'rgba(255,190,100,' + (0.14 + 0.03 * Math.sin(t * 9)).toFixed(3) + ')');
    warm.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';

    // minimap
    if (scene.miniDirty || !scene.mini) buildMini();
    var ms = 2;
    var mw = (R + 1) * ms;
    var mx = cw - mw - 8;
    var my = 8;
    ctx.drawImage(scene.mini, mx, my, mw, mw);
    ctx.strokeStyle = '#6d6a64';
    ctx.strokeRect(mx - 0.5, my - 0.5, mw + 1, mw + 1);
    if (Math.floor(t * 3) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(mx + pos[0] * ms - 1, my + pos[1] * ms - 1, 4, 4);
    }

    // landmark name under the cursor
    var hv = scene.hover;
    if (hv && hv[0] >= 0 && hv[0] <= R && hv[1] >= 0 && hv[1] <= R) {
      var hx = (hv[0] - scene.cam[0]) * T + cw / 2;
      var hy = (hv[1] - scene.cam[1]) * T + ch / 2 - T / 2;
      if (hv[0] === pos[0] && hv[1] === pos[1]) {
        label(ctx, _('Wanderer'), hx, hy);
      } else if (st.mask[hv[0]][hv[1]]) {
        var lc = st.map[hv[0]][hv[1]][0];
        if (lc === World.TILE.VILLAGE) label(ctx, _('The Village'), hx, hy);
        else if (World.LANDMARKS[lc]) label(ctx, World.LANDMARKS[lc].label, hx, hy);
      }
    }
  };

  Gfx.register(scene);

  Gfx.after(window.World, 'drawMap', function () {
    scene.miniDirty = true;
  });
})();
