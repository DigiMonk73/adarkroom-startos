/*
 * A Dark Room — graphics layer: the room.
 *
 * A stone hearth whose fire follows game.fire (dead → roaring). The fire is
 * the only light: at the start of a game the room is nearly black, and every
 * stoke pushes the dark back. The builder appears by the hearth as her
 * story advances, the woodpile tracks stores.wood, and frost creeps in from
 * the edges while the room is cold.
 */
(function () {
  'use strict';
  var Gfx = window.Gfx;
  if (!Gfx || !Gfx.enabled) return;

  var W = 700;
  var H = 660;
  var FLOOR = 600;
  var FX = 330; // flame base
  var FY = 588;

  // Per fire level (0 dead … 4 roaring).
  var DARK_CENTRE = [0.93, 0.6, 0.3, 0.12, 0.04];
  var DARK_EDGE = [0.97, 0.9, 0.8, 0.7, 0.6];
  var FROST = [0.2, 0.1, 0, 0, 0]; // per temperature level

  var scene = {
    name: 'room',
    c: null,
    room: null,
    level: null,
    lastFire: null,
    parts: [],
    acc: { flame: 0, spark: 0, smoke: 0 },
    sprites: null,
    embers: [],
  };

  function lerpLevel(table, level) {
    var i = Math.min(table.length - 2, Math.floor(level));
    var f = level - i;
    return table[i] + (table[i + 1] - table[i]) * f;
  }

  // ---- static room (drawn once) ---------------------------------------------

  function stoneBlocks(ctx, rnd, x0, y0, x1, y1, rowH) {
    for (var y = y0; y < y1; y += rowH) {
      var x = x0 - rnd() * 20;
      while (x < x1) {
        var w = 24 + rnd() * 22;
        var s = 66 + Math.floor(rnd() * 22);
        ctx.fillStyle = 'rgb(' + s + ',' + (s - 4) + ',' + (s - 9) + ')';
        var bx = Math.max(x, x0);
        var bw = Math.min(x + w, x1) - bx;
        if (bw > 3) {
          ctx.fillRect(bx + 1, y + 1, bw - 2, rowH - 2);
          ctx.fillStyle = 'rgba(255,245,230,0.06)';
          ctx.fillRect(bx + 1, y + 1, bw - 2, 2);
        }
        x += w;
      }
    }
  }

  function archPath(ctx, x0, x1, top, springY, bottom) {
    var cx = (x0 + x1) / 2;
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    ctx.lineTo(x0, springY);
    ctx.ellipse(cx, springY, (x1 - x0) / 2, springY - top, 0, Math.PI, 0);
    ctx.lineTo(x1, bottom);
    ctx.closePath();
  }

  function log(ctx, x0, y0, x1, y1, r) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2e1e12';
    ctx.lineWidth = r * 2 + 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = '#4a3220';
    ctx.lineWidth = r * 2 - 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0 + 6, y0 - 2);
    ctx.lineTo(x1 - 6, y1 - 2);
    ctx.stroke();
    ctx.restore();
  }

  function buildRoom() {
    var c = Gfx.canvas(W, H);
    var ctx = c.ctx;
    var rnd = Gfx.rng(7);

    // brick wall
    ctx.fillStyle = '#231f1b';
    ctx.fillRect(0, 0, W, FLOOR);
    var bh = 24;
    var bw = 54;
    for (var row = 0; row * bh < FLOOR; row++) {
      var y = row * bh;
      for (var x = -(row % 2) * (bw / 2); x < W; x += bw) {
        var s = 48 + Math.floor(rnd() * 16);
        ctx.fillStyle = 'rgb(' + s + ',' + (s - 6) + ',' + (s - 11) + ')';
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
        ctx.fillStyle = 'rgba(255,240,220,0.05)';
        ctx.fillRect(x + 1.5, y + 1.5, bw - 3, 2);
      }
    }
    for (var i = 0; i < 1600; i++) {
      ctx.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(rnd() * W, rnd() * FLOOR, 1.5, 1.5);
    }

    // plank floor
    ctx.fillStyle = '#34251a';
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    for (var py = FLOOR; py < H; py += 14) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, py, W, 1.5);
      for (var px = rnd() * 90; px < W; px += 110 + rnd() * 60) {
        ctx.fillRect(px, py, 1.5, 14);
      }
    }
    var shade = ctx.createLinearGradient(0, FLOOR - 24, 0, FLOOR + 6);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, FLOOR - 24, W, 30);

    // fireplace surround, mantel and hearth stones
    var sx0 = FX - 125;
    var sx1 = FX + 125;
    ctx.fillStyle = '#1b1815';
    ctx.fillRect(sx0 - 2, 438, sx1 - sx0 + 4, FLOOR - 438);
    stoneBlocks(ctx, rnd, sx0, 440, sx1, FLOOR, 20);
    ctx.fillStyle = '#5b5046';
    ctx.fillRect(FX - 142, 424, 284, 16);
    ctx.fillStyle = 'rgba(255,240,220,0.1)';
    ctx.fillRect(FX - 142, 424, 284, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(FX - 138, 440, 276, 4);
    ctx.fillStyle = '#4c443d';
    ctx.fillRect(FX - 150, FLOOR, 300, 12);
    ctx.fillStyle = 'rgba(255,240,220,0.08)';
    ctx.fillRect(FX - 150, FLOOR, 300, 2);

    // the opening: soot-black, darker towards the flue
    archPath(ctx, FX - 82, FX + 82, 478, 520, FLOOR);
    var soot = ctx.createLinearGradient(0, 478, 0, FLOOR);
    soot.addColorStop(0, '#030202');
    soot.addColorStop(1, '#140d09');
    ctx.fillStyle = soot;
    ctx.fill();

    // grate and logs
    ctx.fillStyle = '#151210';
    ctx.fillRect(FX - 64, FLOOR - 6, 128, 4);
    log(ctx, FX - 58, FLOOR - 12, FX + 40, FLOOR - 8, 7);
    log(ctx, FX - 30, FLOOR - 7, FX + 60, FLOOR - 14, 7);
    log(ctx, FX - 44, FLOOR - 20, FX + 36, FLOOR - 22, 6);

    return c;
  }

  function buildSprites() {
    return {
      flame: [
        Gfx.glow(64, 255, 244, 200),
        Gfx.glow(64, 255, 196, 90),
        Gfx.glow(64, 255, 118, 34),
        Gfx.glow(64, 190, 48, 12),
      ],
      smoke: Gfx.glow(64, 70, 66, 62),
      light: Gfx.glow(256, 255, 150, 60),
      ember: Gfx.glow(16, 255, 110, 30),
    };
  }

  // ---- living things --------------------------------------------------------

  function spawn(kind, burst) {
    var L = scene.level;
    var r = Math.random;
    var p = { kind: kind, age: 0 };
    if (kind === 'flame') {
      p.x = FX + (r() - 0.5) * (40 + 14 * L);
      p.y = FY - r() * 8;
      p.vx = (r() - 0.5) * 12 + (FX - p.x) * 0.7;
      p.vy = -(30 + 26 * L) * (0.6 + r() * 0.6);
      p.life = 0.4 + r() * 0.35 + L * 0.08;
      p.size = 14 + L * 5 + r() * 8;
    } else if (kind === 'spark') {
      p.x = FX + (r() - 0.5) * 60;
      p.y = FY - 10 - r() * 20;
      p.vx = (r() - 0.5) * (burst ? 90 : 30);
      p.vy = -(70 + r() * 110) * (burst ? 1.4 : 1);
      p.life = 0.7 + r() * 0.9;
      p.phase = r() * 6;
    } else {
      p.x = FX + (r() - 0.5) * 50;
      p.y = FY - 20;
      p.vx = (r() - 0.5) * 6;
      p.vy = -(14 + r() * 12);
      p.life = 1.6 + r() * 1.2;
      p.size = 18 + r() * 16;
    }
    scene.parts.push(p);
  }

  function burst() {
    for (var i = 0; i < 14; i++) spawn('spark', true);
    for (var j = 0; j < 10; j++) spawn('flame');
  }

  function stepParticles(ctx, dt) {
    var L = scene.level;
    var lit = $SM.get('game.builder.level') >= 0; // the fire has been lit before
    var rates = {
      flame: Math.max(0, L - 0.6) * 36,
      spark: L > 2.4 ? (L - 2) * 5 : 0,
      smoke: (L < 1.6 && lit ? 3 : 0.6) * (L > 0.2 || lit ? 1 : 0),
    };
    for (var kind in rates) {
      scene.acc[kind] += rates[kind] * dt;
      while (scene.acc[kind] >= 1) {
        scene.acc[kind] -= 1;
        spawn(kind);
      }
    }

    var s = scene.sprites;
    var keep = [];
    for (var i = 0; i < scene.parts.length; i++) {
      var p = scene.parts[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      keep.push(p);
      var f = p.age / p.life;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'flame') {
        p.vx *= 1 - dt * 2;
        var size = p.size * (1 - f * 0.6);
        var img = s.flame[f < 0.12 ? 0 : f < 0.4 ? 1 : f < 0.72 ? 2 : 3];
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - f) * 0.5;
        ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
      } else if (p.kind === 'spark') {
        p.x += Math.sin(p.age * 9 + p.phase) * 18 * dt;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - f;
        ctx.fillStyle = f < 0.5 ? '#ffe2a0' : '#ff9a40';
        ctx.fillRect(p.x, p.y, 2, 2);
      } else {
        var ss = p.size * (1 + f);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.sin(f * Math.PI) * 0.22;
        ctx.drawImage(s.smoke, p.x - ss / 2, p.y - ss / 2, ss, ss);
      }
    }
    scene.parts = keep;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawEmbers(ctx, t) {
    var L = scene.level;
    var lit = $SM.get('game.builder.level') >= 0;
    if (!lit && L < 0.2) return;
    if (!scene.embers.length) {
      var rnd = Gfx.rng(11);
      for (var i = 0; i < 12; i++) {
        scene.embers.push({ x: FX - 50 + rnd() * 100, y: FLOOR - 24 + rnd() * 16, ph: rnd() * 6, sp: 1 + rnd() * 2 });
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < scene.embers.length; j++) {
      var e = scene.embers[j];
      ctx.globalAlpha = (0.35 + 0.3 * Math.sin(t * e.sp + e.ph)) * (0.5 + Math.min(L, 2) * 0.25);
      ctx.drawImage(scene.sprites.ember, e.x - 6, e.y - 6, 12, 12);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawWoodpile(ctx) {
    var wood = Gfx.num('stores.wood');
    var n = Math.min(15, Math.ceil(Math.log(wood + 1) / Math.LN2 * 1.5));
    var rows = [5, 4, 3, 2, 1];
    var drawn = 0;
    var r = 7.5;
    for (var row = 0; row < rows.length && drawn < n; row++) {
      for (var k = 0; k < rows[row] && drawn < n; k++, drawn++) {
        var x = FX + 170 + (k - (rows[row] - 1) / 2) * r * 2;
        var y = FLOOR - r - row * r * 1.75;
        ctx.fillStyle = '#24170e';
        ctx.beginPath();
        ctx.arc(x, y, r + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a5836';
        ctx.beginPath();
        ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,38,20,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // The builder: a hooded figure, rim-lit on the side facing the fire.
  function drawBuilder(ctx, t) {
    var stage = $SM.get('game.builder.level');
    if (typeof stage !== 'number' || stage < 1) return;
    var L = scene.level;
    var x = FX - 175;
    ctx.save();
    ctx.beginPath();
    if (stage === 1 || stage === 3) {
      // collapsed in the corner / asleep by the fire
      var bx = stage === 1 ? 70 : x;
      var breathe = stage === 3 ? Math.sin(t * 1.3) * 1.2 : 0;
      ctx.ellipse(bx, FLOOR - 9 - breathe / 2, 46, 11 + breathe, 0, 0, Math.PI * 2);
      ctx.moveTo(bx + 52, FLOOR - 10);
      ctx.arc(bx + 44, FLOOR - 12, 10, 0, Math.PI * 2);
    } else {
      // sitting up: shivering, or upright and busy
      var shiver = stage === 2 ? Math.sin(t * 45) * 0.9 : 0;
      var bob = stage === 4 ? Math.sin(t * 2.1) * 1.2 : 0;
      x += shiver;
      var top = FLOOR - 70 + (stage === 2 ? 8 : 0) + bob;
      ctx.moveTo(x - 24, FLOOR);
      ctx.quadraticCurveTo(x - 27, FLOOR - 36, x - 9, top + 8);
      ctx.quadraticCurveTo(x + 2, top, x + 14, top + 12);
      ctx.quadraticCurveTo(x + 26, FLOOR - 34, x + 30, FLOOR);
      ctx.closePath();
      ctx.moveTo(x + 14, top - 2);
      ctx.arc(x + 4, top - 2, 11, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#16110e';
    ctx.fill();
    ctx.clip();
    // fire-side rim light
    var rim = ctx.createLinearGradient(x - 30, 0, x + 34, 0);
    rim.addColorStop(0.55, 'rgba(255,140,60,0)');
    rim.addColorStop(1, 'rgba(255,140,60,' + (0.12 * L).toFixed(3) + ')');
    ctx.fillStyle = rim;
    ctx.fillRect(0, FLOOR - 120, W, 120);
    ctx.restore();
  }

  function drawFrost(ctx) {
    var a = FROST[Gfx.num('game.temperature.value')] || 0;
    if (!a) return;
    var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.9);
    g.addColorStop(0, 'rgba(190,215,255,0)');
    g.addColorStop(1, 'rgba(190,215,255,' + a + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawEdges(ctx) {
    var bg = Gfx.BG;
    var top = ctx.createLinearGradient(0, 0, 0, 70);
    top.addColorStop(0, bg);
    top.addColorStop(1, 'rgba(39,40,35,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 70);
    var left = ctx.createLinearGradient(0, 0, 30, 0);
    left.addColorStop(0, bg);
    left.addColorStop(1, 'rgba(39,40,35,0)');
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, 30, H);
    var right = ctx.createLinearGradient(W - 30, 0, W, 0);
    right.addColorStop(0, 'rgba(39,40,35,0)');
    right.addColorStop(1, bg);
    ctx.fillStyle = right;
    ctx.fillRect(W - 30, 0, 30, H);
  }

  // ---- scene ----------------------------------------------------------------

  scene.visible = function () {
    if (!scene.c) {
      var panel = $('#roomPanel');
      if (!panel.length) return false;
      scene.sprites = buildSprites();
      scene.room = buildRoom();
      scene.c = Gfx.canvas(W, H, 'gfx-scene');
      panel.prepend(scene.c.el);
      scene.level = Gfx.num('game.fire.value');
      scene.lastFire = scene.level;
    }
    return Gfx.isActive(window.Room);
  };

  scene.frame = function (dt, t) {
    var ctx = scene.c.ctx;
    var fire = Gfx.num('game.fire.value');
    scene.level += (fire - scene.level) * Math.min(1, dt * 1.5);
    var L = scene.level;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(scene.room.el, 0, 0, W, H);
    drawWoodpile(ctx);
    drawBuilder(ctx, t);

    // the dark, pushed back by the fire
    var flick = 1 + 0.05 * Math.sin(t * 11.3) + 0.035 * Math.sin(t * 23.7 + 1) + 0.03 * (Math.random() - 0.5) * L;
    var reach = (70 + L * 120) * flick;
    var cy = FY - 40;
    var dark = ctx.createRadialGradient(FX, cy, 10, FX, cy, reach * 1.6 + 80);
    dark.addColorStop(0, 'rgba(4,3,2,' + lerpLevel(DARK_CENTRE, L).toFixed(3) + ')');
    dark.addColorStop(1, 'rgba(4,3,2,' + lerpLevel(DARK_EDGE, L).toFixed(3) + ')');
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, W, H);

    // warm light
    var R = reach * 1.4;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, 0.07 * L * flick);
    ctx.drawImage(scene.sprites.light, FX - R, cy - R, R * 2, R * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    drawEmbers(ctx, t);
    stepParticles(ctx, dt);
    drawFrost(ctx);
    drawEdges(ctx);
  };

  Gfx.register(scene);

  // A shower of sparks whenever the fire is lit or stoked.
  Gfx.after(window.Room, 'onFireChange', function () {
    var fire = Gfx.num('game.fire.value');
    if (scene.lastFire !== null && fire > scene.lastFire && scene.c) burst();
    scene.lastFire = fire;
  });
})();
