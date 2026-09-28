/*
 * A Dark Room — graphics layer: the village.
 *
 * A dusk scene under the grey, windblown sky. The cabin with the fire is at
 * its heart (its windows follow the fire level); huts and every other
 * building from game.buildings appear as they are built, villagers walk
 * the snow in proportion to game.population, and chimneys smoke.
 * Everything sits in the left 470px: the village and stores boxes cover the
 * right-hand column.
 */
(function () {
  'use strict';
  var Gfx = window.Gfx;
  if (!Gfx || !Gfx.enabled) return;

  var W = 700;
  var H = 660;
  var HZ = 470; // horizon
  var INK = '#15130f'; // silhouette colour
  var WIND = 60; // px/s drift for snow and smoke

  var scene = {
    name: 'village',
    c: null,
    bg: null,
    layer: null,
    sig: '',
    huts: -1,
    windows: [],
    chimneys: [],
    smoke: [],
    snow: [],
    folk: [],
    sprites: null,
  };

  // ---- static backdrop --------------------------------------------------------

  function pine(ctx, x, base, h, colour) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x, base - h);
    for (var i = 1; i <= 3; i++) {
      var y = base - h + (h * i) / 3.2;
      var w = (h * 0.22 * i) / 1.6;
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w * 0.45, y);
    }
    ctx.lineTo(x + h * 0.08, base);
    ctx.lineTo(x - h * 0.08, base);
    for (var j = 3; j >= 1; j--) {
      var yy = base - h + (h * j) / 3.2;
      var ww = (h * 0.22 * j) / 1.6;
      ctx.lineTo(x - ww * 0.45, yy);
      ctx.lineTo(x - ww, yy);
    }
    ctx.closePath();
    ctx.fill();
  }

  function buildBackdrop() {
    var c = Gfx.canvas(W, H);
    var ctx = c.ctx;
    var rnd = Gfx.rng(23);

    var sky = ctx.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, Gfx.BG);
    sky.addColorStop(0.45, '#2d3036');
    sky.addColorStop(1, '#565962');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HZ);

    // a pale sun behind the overcast
    var sun = ctx.createRadialGradient(390, 330, 0, 390, 330, 70);
    sun.addColorStop(0, 'rgba(225,220,205,0.22)');
    sun.addColorStop(1, 'rgba(225,220,205,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(300, 250, 180, 160);

    // hills
    ctx.fillStyle = '#3a3d45';
    ctx.beginPath();
    ctx.moveTo(0, HZ);
    for (var x = 0; x <= W; x += 20) {
      ctx.lineTo(x, HZ - 26 - Math.sin(x / 90) * 14 - Math.sin(x / 37 + 1) * 6);
    }
    ctx.lineTo(W, HZ);
    ctx.fill();

    // far treeline
    for (var t = 0; t < 110; t++) {
      pine(ctx, rnd() * W, HZ + 2, 16 + rnd() * 26, '#26282d');
    }

    // snow-covered ground
    var ground = ctx.createLinearGradient(0, HZ, 0, H);
    ground.addColorStop(0, '#4b4e56');
    ground.addColorStop(1, '#2c2e33');
    ctx.fillStyle = ground;
    ctx.fillRect(0, HZ, W, H - HZ);
    for (var s = 0; s < 70; s++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(220,225,235,0.07)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.ellipse(rnd() * W, HZ + 10 + rnd() * (H - HZ), 20 + rnd() * 50, 3 + rnd() * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // near forest at the western edge
    for (var n = 0; n < 7; n++) {
      pine(ctx, -10 + rnd() * 34, HZ + 30 + rnd() * 90, 60 + rnd() * 50, '#1b1c1f');
    }

    // fade the sky into the page
    var fade = ctx.createLinearGradient(0, 0, 0, 90);
    fade.addColorStop(0, Gfx.BG);
    fade.addColorStop(1, 'rgba(39,40,35,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, 90);
    return c;
  }

  // ---- buildings --------------------------------------------------------------

  function roof(ctx, x0, x1, y, h, snow) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo((x0 + x1) / 2, y - h);
    ctx.lineTo(x1, y);
    ctx.closePath();
    ctx.fill();
    if (snow) {
      ctx.strokeStyle = 'rgba(215,220,230,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + 2, y - 1);
      ctx.lineTo((x0 + x1) / 2, y - h + 1);
      ctx.lineTo(x1 - 2, y - 1);
      ctx.stroke();
    }
  }

  function box(ctx, x, y, w, h) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - w / 2, y - h, w, h);
  }

  function windowAt(x, y, w, h, bright) {
    scene.windows.push({ x: x, y: y, w: w, h: h, bright: bright, ph: Math.random() * 6 });
  }

  function chimney(ctx, x, y, h, rate, dark) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 3, y - h, 6, h);
    if (rate > 0) scene.chimneys.push({ x: x, y: y - h, rate: rate, acc: Math.random(), dark: !!dark });
  }

  function hut(ctx, x, y, s, rnd) {
    var w = (30 + rnd() * 8) * s;
    var h = 18 * s;
    box(ctx, x, y, w, h);
    roof(ctx, x - w / 2 - 4 * s, x + w / 2 + 4 * s, y - h + 1, (15 + rnd() * 5) * s, true);
    chimney(ctx, x + w * 0.22, y - h - 4 * s, 9 * s, 0.35);
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(x - w / 2 + 5 * s, y - 11 * s, 7 * s, 11 * s);
    windowAt(x + w / 4, y - 11 * s, 5 * s, 4 * s, 0.55);
  }

  function cabin(ctx, x, y, fire) {
    box(ctx, x, y, 66, 36);
    roof(ctx, x - 40, x + 40, y - 35, 28, true);
    chimney(ctx, x + 20, y - 44, 16, fire > 0 ? 0.6 + fire * 0.9 : 0.15);
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(x - 6, y - 18, 12, 18);
    var bright = [0.08, 0.3, 0.6, 0.85, 1][fire] || 0;
    windowAt(x - 21, y - 22, 9, 8, bright);
    windowAt(x + 21, y - 22, 9, 8, bright);
  }

  function lodge(ctx, x, y, s) {
    box(ctx, x, y, 70 * s, 22 * s);
    roof(ctx, x - 40 * s, x + 40 * s, y - 21 * s, 14 * s, true);
    ctx.strokeStyle = 'rgba(200,190,170,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 36 * s);
    ctx.quadraticCurveTo(x - 12 * s, y - 44 * s, x - 14 * s, y - 50 * s);
    ctx.moveTo(x + 2, y - 36 * s);
    ctx.quadraticCurveTo(x + 12 * s, y - 44 * s, x + 14 * s, y - 50 * s);
    ctx.stroke();
    windowAt(x - 22 * s, y - 13 * s, 6 * s, 5 * s, 0.5);
    windowAt(x + 22 * s, y - 13 * s, 6 * s, 5 * s, 0.5);
  }

  function tradingPost(ctx, x, y, s) {
    box(ctx, x, y, 46 * s, 24 * s);
    roof(ctx, x - 28 * s, x + 28 * s, y - 23 * s, 10 * s, true);
    for (var i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#7d6a55' : '#6a2f28';
      ctx.fillRect(x - 24 * s + i * 8 * s, y - 16 * s, 8 * s, 5 * s);
    }
    ctx.fillStyle = INK;
    ctx.fillRect(x + 25 * s, y - 9 * s, 9 * s, 9 * s);
    ctx.fillRect(x + 28 * s, y - 16 * s, 7 * s, 7 * s);
    windowAt(x, y - 9 * s, 10 * s, 4 * s, 0.6);
  }

  function tannery(ctx, x, y, s) {
    box(ctx, x + 12 * s, y, 26 * s, 18 * s);
    roof(ctx, x - 2 * s, x + 26 * s, y - 17 * s, 10 * s, true);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 26 * s, y - 26 * s, 3 * s, 26 * s);
    ctx.fillRect(x - 4 * s, y - 26 * s, 3 * s, 26 * s);
    ctx.fillRect(x - 27 * s, y - 27 * s, 27 * s, 3 * s);
    ctx.fillStyle = '#7a5d40';
    ctx.fillRect(x - 22 * s, y - 23 * s, 7 * s, 12 * s);
    ctx.fillStyle = '#6a4e36';
    ctx.fillRect(x - 13 * s, y - 23 * s, 7 * s, 10 * s);
  }

  function smokehouse(ctx, x, y, s) {
    box(ctx, x, y, 24 * s, 32 * s);
    roof(ctx, x - 15 * s, x + 15 * s, y - 31 * s, 12 * s, true);
    chimney(ctx, x, y - 40 * s, 6 * s, 2.5);
  }

  function workshop(ctx, x, y, s) {
    box(ctx, x, y, 46 * s, 24 * s);
    roof(ctx, x - 27 * s, x + 27 * s, y - 23 * s, 13 * s, true);
    chimney(ctx, x - 12 * s, y - 30 * s, 8 * s, 0.8);
    ctx.fillStyle = INK;
    ctx.fillRect(x + 26 * s, y - 7 * s, 12 * s, 3 * s);
    ctx.fillRect(x + 30 * s, y - 4 * s, 4 * s, 4 * s);
    windowAt(x + 10 * s, y - 14 * s, 8 * s, 6 * s, 0.75);
  }

  function steelworks(ctx, x, y, s) {
    box(ctx, x, y, 62 * s, 30 * s);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 31 * s, y - 36 * s, 34 * s, 7 * s);
    chimney(ctx, x + 20 * s, y - 29 * s, 34 * s, 3, true);
    windowAt(x - 15 * s, y - 16 * s, 16 * s, 8 * s, 1);
  }

  function armoury(ctx, x, y, s) {
    box(ctx, x, y, 38 * s, 34 * s);
    ctx.fillStyle = INK;
    for (var i = 0; i < 4; i++) ctx.fillRect(x - 19 * s + i * 11 * s, y - 40 * s, 6 * s, 7 * s);
    ctx.fillStyle = '#5a5d66';
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y - 26 * s);
    ctx.lineTo(x + 6 * s, y - 26 * s);
    ctx.lineTo(x + 6 * s, y - 20 * s);
    ctx.lineTo(x, y - 14 * s);
    ctx.lineTo(x - 6 * s, y - 20 * s);
    ctx.closePath();
    ctx.fill();
  }

  function mine(ctx, x, y, s, ore) {
    ctx.fillStyle = '#2b2c31';
    ctx.beginPath();
    ctx.ellipse(x, y, 24 * s, 16 * s, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#060606';
    ctx.fillRect(x - 6 * s, y - 11 * s, 12 * s, 11 * s);
    ctx.fillStyle = '#3d2a1a';
    ctx.fillRect(x - 8 * s, y - 13 * s, 16 * s, 2.5 * s);
    ctx.fillRect(x - 8 * s, y - 13 * s, 2.5 * s, 13 * s);
    ctx.fillRect(x + 5.5 * s, y - 13 * s, 2.5 * s, 13 * s);
    ctx.fillStyle = ore;
    ctx.beginPath();
    ctx.ellipse(x + 17 * s, y - 2 * s, 7 * s, 4 * s, 0, Math.PI, 0);
    ctx.fill();
  }

  function cart(ctx, x, y) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 14, y - 12, 28, 7);
    ctx.fillRect(x + 12, y - 9, 14, 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 7, y - 4, 4, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 4, 4, 0, Math.PI * 2);
    ctx.stroke();
    // its load follows the wood in store
    var logs = Math.min(4, Math.ceil(Math.log(Gfx.num('stores.wood') + 1) / 2));
    ctx.fillStyle = '#5c4129';
    for (var i = 0; i < logs; i++) ctx.fillRect(x - 12 + (i % 2) * 4, y - 15 - i * 3, 22, 3);
  }

  function traps(ctx, n, baited) {
    for (var i = 0; i < Math.min(n, 16); i++) {
      var x = 26 + i * 27 + (i % 3) * 5;
      var y = HZ + 6 + (i % 2) * 6;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x, y - 7);
      ctx.lineTo(x + 4, y);
      ctx.stroke();
      if (i < baited) {
        ctx.fillStyle = '#8c2a22';
        ctx.fillRect(x - 1, y - 2, 2, 2);
      }
    }
  }

  // Slots, back to front. Huts fill two rows in front of the cabin.
  var HUT_SLOTS = (function () {
    var slots = [];
    for (var i = 0; i < 10; i++) slots.push({ x: 34 + i * 45, y: 568, s: 1 });
    for (var j = 0; j < 10; j++) slots.push({ x: 56 + j * 45, y: 632, s: 1.12 });
    return slots;
  })();

  function buildLayer(b, fire) {
    var c = Gfx.canvas(W, H);
    var ctx = c.ctx;
    var rnd = Gfx.rng(5);
    scene.windows = [];
    scene.chimneys = [];

    var FAR = 486;
    var BACK = 510;
    if (b['iron mine']) mine(ctx, 40, FAR, 0.8, '#7a4a3a');
    if (b['steelworks']) steelworks(ctx, 150, FAR, 0.75);
    if (b['armoury']) armoury(ctx, 332, FAR, 0.75);
    if (b['coal mine']) mine(ctx, 410, FAR, 0.8, '#0c0c0c');
    if (b['sulphur mine']) mine(ctx, 455, FAR + 4, 0.8, '#b8a846');

    traps(ctx, b['trap'] || 0, Gfx.num('stores.bait'));

    if (b['lodge']) lodge(ctx, 72, BACK, 0.9);
    if (b['trading post']) tradingPost(ctx, 152, BACK, 0.9);
    cabin(ctx, 238, BACK + 6, fire);
    if (b['tannery']) tannery(ctx, 322, BACK, 0.9);
    if (b['smokehouse']) smokehouse(ctx, 376, BACK, 0.9);
    if (b['workshop']) workshop(ctx, 432, BACK, 0.9);
    if (b['cart']) cart(ctx, 190, BACK + 22);

    var huts = Math.min(b['hut'] || 0, HUT_SLOTS.length);
    for (var i = 0; i < huts; i++) {
      var slot = HUT_SLOTS[i];
      hut(ctx, slot.x + (rnd() - 0.5) * 8, slot.y + (rnd() - 0.5) * 6, slot.s, rnd);
    }
    return { c: c, huts: huts };
  }

  // ---- the living layer -------------------------------------------------------

  function syncFolk(pop) {
    var want = Math.min(pop, 24);
    while (scene.folk.length < want) {
      // two lanes in front of each hut row, so nobody walks through a wall
      var y = Math.random() < 0.5 ? 574 + Math.random() * 14 : 640 + Math.random() * 16;
      scene.folk.push({ x: 20 + Math.random() * 440, y: y, tx: 0, wait: Math.random() * 2, sp: 10 + Math.random() * 12, ph: Math.random() * 6 });
    }
    scene.folk.length = want;
  }

  function drawFolk(ctx, dt, t) {
    ctx.fillStyle = '#100e0c';
    for (var i = 0; i < scene.folk.length; i++) {
      var f = scene.folk[i];
      var moving = false;
      if (f.wait > 0) {
        f.wait -= dt;
        if (f.wait <= 0) f.tx = 20 + Math.random() * 440;
      } else {
        var d = f.tx - f.x;
        if (Math.abs(d) < 1) {
          f.wait = 1 + Math.random() * 3;
        } else {
          f.x += Math.sign(d) * Math.min(Math.abs(d), f.sp * dt);
          moving = true;
        }
      }
      var s = 0.8 + ((f.y - 540) / 110) * 0.4;
      var step = moving ? Math.sin(t * 9 + f.ph) : 0;
      ctx.fillRect(f.x - 1.5 * s, f.y - 11 * s, 3 * s, 7 * s);
      ctx.beginPath();
      ctx.arc(f.x, f.y - 13 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(f.x - 1.5 * s + step * s, f.y - 4 * s, 1.2 * s, 4 * s);
      ctx.fillRect(f.x + 0.3 * s - step * s, f.y - 4 * s, 1.2 * s, 4 * s);
    }
  }

  function drawSmoke(ctx, dt) {
    for (var i = 0; i < scene.chimneys.length; i++) {
      var ch = scene.chimneys[i];
      ch.acc += ch.rate * dt;
      while (ch.acc >= 1) {
        ch.acc -= 1;
        scene.smoke.push({ x: ch.x, y: ch.y, age: 0, life: 2.5 + Math.random() * 2, dark: ch.dark, size: 6 + Math.random() * 5 });
      }
    }
    var keep = [];
    for (var j = 0; j < scene.smoke.length; j++) {
      var p = scene.smoke[j];
      p.age += dt;
      if (p.age >= p.life) continue;
      keep.push(p);
      var f = p.age / p.life;
      p.x += WIND * 0.4 * f * dt + 4 * dt;
      p.y -= (16 - f * 8) * dt;
      var size = p.size * (1 + f * 3);
      ctx.globalAlpha = Math.sin(f * Math.PI) * (p.dark ? 0.35 : 0.2);
      ctx.drawImage(p.dark ? scene.sprites.soot : scene.sprites.smoke, p.x - size / 2, p.y - size / 2, size, size);
    }
    scene.smoke = keep;
    ctx.globalAlpha = 1;
  }

  function drawWindows(ctx, t) {
    for (var i = 0; i < scene.windows.length; i++) {
      var w = scene.windows[i];
      var flick = 0.85 + 0.15 * Math.sin(t * 7 + w.ph) * Math.sin(t * 3.1 + w.ph * 2);
      var a = w.bright * flick;
      ctx.fillStyle = 'rgba(255,170,80,' + (0.25 + 0.75 * a).toFixed(3) + ')';
      ctx.fillRect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 * a;
      var g = 14 + w.w * 2.5;
      ctx.drawImage(scene.sprites.glow, w.x - g / 2, w.y - g / 2, g, g);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function drawSnow(ctx, dt) {
    if (!scene.snow.length) {
      for (var i = 0; i < 90; i++) {
        scene.snow.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.8, r: 0.6 + Math.random() * 1.2 });
      }
    }
    ctx.fillStyle = 'rgba(232,236,245,0.65)';
    for (var j = 0; j < scene.snow.length; j++) {
      var f = scene.snow[j];
      f.x += WIND * f.v * dt;
      f.y += 22 * f.v * dt;
      if (f.x > W) f.x -= W;
      if (f.y > H) {
        f.y = 60;
        f.x = Math.random() * W;
      }
      ctx.fillRect(f.x, f.y, f.r * 1.6, f.r);
    }
  }

  function dustPuff(slot) {
    for (var i = 0; i < 10; i++) {
      scene.smoke.push({ x: slot.x + (Math.random() - 0.5) * 30, y: slot.y - Math.random() * 10, age: 0, life: 1 + Math.random(), dark: false, size: 8 + Math.random() * 8 });
    }
  }

  // ---- scene ------------------------------------------------------------------

  scene.visible = function () {
    if (!scene.c) {
      var panel = $('#outsidePanel');
      if (!panel.length) return false;
      scene.sprites = {
        smoke: Gfx.glow(32, 170, 172, 180),
        soot: Gfx.glow(32, 40, 38, 36),
        glow: Gfx.glow(64, 255, 160, 70),
      };
      scene.bg = buildBackdrop();
      scene.c = Gfx.canvas(W, H, 'gfx-scene');
      panel.prepend(scene.c.el);
    }
    return Gfx.isActive(window.Outside);
  };

  scene.frame = function (dt, t) {
    var b = $SM.get('game.buildings') || {};
    var fire = Gfx.num('game.fire.value');
    var sig = JSON.stringify(b) + '|' + fire + '|' + Gfx.num('stores.bait') + '|' + Math.ceil(Math.log(Gfx.num('stores.wood') + 1) / 2);
    if (sig !== scene.sig) {
      scene.sig = sig;
      var built = buildLayer(b, fire);
      scene.layer = built.c;
      if (scene.huts >= 0 && built.huts > scene.huts) dustPuff(HUT_SLOTS[built.huts - 1]);
      scene.huts = built.huts;
    }
    syncFolk(Gfx.num('game.population'));

    var ctx = scene.c.ctx;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(scene.bg.el, 0, 0, W, H);
    ctx.drawImage(scene.layer.el, 0, 0, W, H);
    drawWindows(ctx, t);
    drawSmoke(ctx, dt);
    drawFolk(ctx, dt, t);
    drawSnow(ctx, dt);
  };

  Gfx.register(scene);
})();
