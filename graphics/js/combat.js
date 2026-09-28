/*
 * A Dark Room — graphics layer: combat.
 *
 * Gives each fighter a 16×16 pixel-art sprite in place of its letter. Enemy
 * sprites are generated from a template picked by the enemy's name
 * (humanoid, beast, bird, machine, insect) and varied by a seed from that
 * name, so every snarling beast looks the same and every enemy type looks
 * different. Hits flash the target; the loser falls.
 */
(function () {
  'use strict';
  var Gfx = window.Gfx;
  if (!Gfx || !Gfx.enabled) return;

  var P = 16;
  var SIZE = 56; // on screen
  var OUTLINE = '#0a0908';
  var cache = {};

  function painter(ctx) {
    return function (x, y, col, w, h) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w || 1, h || 1);
    };
  }

  function hsl(h, s, l) {
    return 'hsl(' + Math.round(h) + ',' + s + '%,' + l + '%)';
  }

  // Dark 1px outline so sprites read on any background.
  function outline(ctx, w, h) {
    var img = ctx.getImageData(0, 0, w, h);
    var d = img.data;
    var solid = function (x, y) {
      return x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    };
    var edge = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
      }
    }
    ctx.fillStyle = OUTLINE;
    for (var i = 0; i < edge.length; i++) ctx.fillRect(edge[i][0], edge[i][1], 1, 1);
  }

  // ---- templates (all face left, towards the wanderer) ----------------------------

  var ARMED = /sniper|soldier|commando|operative|veteran|vigilante|chief/;

  function humanoid(px, rnd, name) {
    var hue = rnd() * 360;
    var skin = ['#c9a07a', '#a87a58', '#7a553a', '#d8b896'][Math.floor(rnd() * 4)];
    var cloth = hsl(hue, 18 + rnd() * 18, 26 + rnd() * 10);
    var dark = hsl(hue, 18, 16);
    var gaunt = /gaunt|frail|old|shivering|deformed/.test(name);
    var tx = gaunt ? 6 : 5;
    var tw = gaunt ? 4 : 6;
    px(tx, 5, cloth, tw, 6); // torso
    px(tx - 1, 5, cloth, 1, 5); // arms
    px(tx + tw, 5, cloth, 1, 5);
    px(tx - 1, 10, skin);
    px(tx + tw, 10, skin);
    px(6, 11, dark, 2, 4); // legs
    px(9, 11, dark, 2, 4);
    px(5, 15, OUTLINE, 3, 1);
    px(9, 15, OUTLINE, 3, 1);
    px(6, 1, skin, 4, 4); // head
    var hat = rnd();
    if (hat < 0.35) {
      px(5, 0, dark, 6, 2); // hood
      px(5, 2, dark, 1, 3);
      px(10, 2, dark, 1, 3);
    } else if (hat < 0.6) {
      px(4, 1, dark, 8, 1); // brimmed hat
      px(6, 0, dark, 4, 1);
    } else {
      px(6, 1, hsl(rnd() * 40, 20, 18), 4, 1); // hair
    }
    var mad = /madman|immortal|deformed/.test(name);
    px(6, 3, mad ? '#e04030' : '#1a1410');
    px(8, 3, mad ? '#e04030' : '#1a1410');
    if (/deformed|man-eater/.test(name)) px(10, 2, skin, 2, 3); // a growth
    if (ARMED.test(name)) {
      px(0, 8, '#2a2a2a', 7, 1); // rifle
      px(5, 9, '#3a2a1a', 2, 1);
    } else if (rnd() < 0.6) {
      px(2, 7, '#8a8680', 1, 4); // knife or club
      px(2, 10, '#3a2a1a', 1, 2);
    }
    if (/medic/.test(name)) px(tx + 2, 6, '#c03030', 2, 2);
    if (/welder/.test(name)) px(5, 2, '#3a3d40', 6, 2);
  }

  function beast(px, rnd, name) {
    var lizard = /lizard/.test(name);
    var rat = /\brats?\b/.test(name);
    var hue = lizard ? 90 + rnd() * 40 : rat ? 30 : 15 + rnd() * 30;
    var fur = hsl(hue, lizard ? 30 : 18, lizard ? 30 : rat ? 38 : 26 + rnd() * 8);
    var belly = hsl(hue, 16, lizard ? 40 : 36);
    var top = lizard ? 9 : rat ? 9 : 6;
    var bottom = 12;
    px(4, top, fur, 9, bottom - top); // body
    px(5, top - 1, fur, 7, 1);
    px(5, bottom - 1, belly, 7, 1);
    px(1, top - 1, fur, 4, 4); // head
    px(0, top + 1, fur, 1, 2); // snout
    px(1, top, rnd() < 0.5 ? '#e0b030' : '#d03a2a'); // eye
    px(0, top + 2, '#e8e0d0'); // teeth
    if (!lizard) {
      px(2, top - 2, fur);
      px(4, top - 2, fur);
    } // ears
    var legH = lizard || rat ? 2 : 3;
    [5, 7, 10, 12].forEach(function (x) {
      px(x, bottom, fur, 1, legH);
    });
    px(13, top, fur, 2, 1); // tail
    px(15, top - 1, fur, 1, 1);
    if (rat || lizard) px(13, bottom - 2, fur, 3, 1);
    if (/matriarch|ancient|terror/.test(name) || rnd() < 0.3) {
      for (var i = 6; i < 12; i += 2) px(i, top - 2, '#d8d2c4'); // spines
    }
    if (/two-headed/.test(name)) {
      px(1, top + 3, fur, 4, 3);
      px(1, top + 4, '#d03a2a');
    }
  }

  function bird(px, rnd, name) {
    var hue = /strange/.test(name) ? 280 : 20 + rnd() * 30;
    var body = hsl(hue, 20, 26);
    px(5, 6, body, 6, 5);
    px(3, 4, body, 3, 3); // head
    px(1, 5, '#c8a040', 2, 1); // beak
    px(4, 5, '#e04030');
    px(7, 2, body, 6, 2); // raised wing
    px(9, 1, body, 5, 1);
    px(11, 7, body, 4, 2); // tail
    px(6, 11, '#8a7050', 1, 3);
    px(9, 11, '#8a7050', 1, 3);
  }

  function machine(px, rnd, name) {
    var metal = hsl(200 + rnd() * 30, 8, 36 + rnd() * 8);
    var dark = hsl(210, 10, 20);
    if (/turret/.test(name)) {
      px(4, 11, dark, 8, 4);
      px(5, 6, metal, 6, 5);
      px(0, 7, dark, 5, 2);
      px(7, 7, '#ff3a2a', 2, 1);
      return;
    }
    if (/quadruped/.test(name)) {
      px(3, 6, metal, 11, 5);
      px(1, 5, metal, 3, 3);
      px(1, 6, '#ff3a2a');
      [4, 6, 11, 13].forEach(function (x) {
        px(x, 11, dark, 1, 4);
      });
      return;
    }
    px(5, 5, metal, 6, 6); // bot
    px(6, 1, metal, 4, 4);
    px(6, 2, '#ff3a2a', 1, 1);
    px(8, 2, '#ff3a2a', 1, 1);
    px(7, 0, dark);
    px(4, 5, dark, 1, 5);
    px(11, 5, dark, 1, 5);
    px(6, 11, dark, 1, 4);
    px(9, 11, dark, 1, 4);
    if (/unstable/.test(name)) {
      px(12, 3, '#ffd24a');
      px(3, 9, '#ffd24a');
    }
  }

  function insect(px, rnd, name) {
    if (/tentacle/.test(name)) {
      var flesh = hsl(330, 22, 30);
      for (var t = 0; t < 4; t++) {
        var x = 3 + t * 3;
        for (var y = 15; y > 3 + t; y--) px(x + Math.round(Math.sin(y * 0.8 + t) * 1.2), y, flesh);
      }
      return;
    }
    var shell = hsl(280 + rnd() * 40, 20, /queen/.test(name) ? 30 : 22);
    px(3, 5, shell, 4, 5); // head/thorax
    px(7, 6, shell, 7, 6); // abdomen
    px(9, 5, hsl(290, 20, 34), 3, 1);
    px(3, 6, '#b0e040'); // eye
    for (var i = 0; i < 3; i++) {
      px(5 + i * 3, 11, shell, 1, 3);
      px(4 + i * 3, 14, shell, 1, 1);
    }
    px(1, 4, shell, 2, 1); // mandible
    px(1, 9, shell, 2, 1);
    if (/queen/.test(name)) px(8, 3, '#d8c870', 4, 2);
  }

  function template(name) {
    if (/turret|mechanical|robot|automaton|prototype|machine/.test(name)) return machine;
    if (/bird/.test(name)) return bird;
    if (/chitinous|tentacle/.test(name)) return insect;
    if (/\b(lizards?|rats?|beast|beastly|matriarch|terror|creature|man-eater|experiment)\b/.test(name)) return beast;
    return humanoid;
  }

  function enemySprite(name, chara) {
    name = String(name || chara || '').toLowerCase();
    var group = String(chara || '').length > 1 || /^(rats|lizards|squatters)$/.test(name);
    var key = name + (group ? '*' : '');
    if (cache[key]) return cache[key];
    var one = Gfx.sprite(P, P, function (ctx) {
      template(name)(painter(ctx), Gfx.rng(Gfx.hash(name)), name);
      outline(ctx, P, P);
    });
    if (!group) return (cache[key] = one);
    // a pack: three smaller copies
    return (cache[key] = Gfx.sprite(P, P, function (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(one, 5, 1, 11, 11);
      ctx.drawImage(one, 0, 4, 11, 11);
      ctx.drawImage(one, 6, 6, 10, 10);
    }));
  }

  function wandererSprite() {
    if (cache['@']) return cache['@'];
    return (cache['@'] = Gfx.sprite(P, P, function (ctx) {
      var px = painter(ctx);
      px(6, 0, '#3a2e24', 4, 1); // hood
      px(5, 1, '#3a2e24', 6, 4);
      px(7, 2, '#e0c8a8', 3, 2);
      px(9, 2, '#1a1410');
      px(4, 5, '#5f4b3a', 8, 7); // cloak
      px(3, 6, '#3a2e24', 3, 5); // pack
      px(11, 6, '#e0c8a8', 2, 1); // arm forward
      px(12, 4, '#8a8680', 1, 3); // blade
      px(6, 12, '#2a211a', 2, 3);
      px(9, 12, '#2a211a', 2, 3);
      px(5, 15, OUTLINE, 3, 1);
      px(9, 15, OUTLINE, 3, 1);
      px(2, 9, '#ffd27a'); // lantern
      outline(ctx, P, P);
    }));
  }

  function attach(fighter, sprite) {
    if (!fighter.length || $('canvas.gfx-fighter', fighter).length) return;
    var c = Gfx.canvas(SIZE, SIZE, 'gfx-fighter');
    c.ctx.imageSmoothingEnabled = false;
    c.ctx.drawImage(sprite, 0, 0, SIZE, SIZE);
    fighter.prepend(c.el);
  }

  Gfx.after(window.Events, 'startCombat', function (scene) {
    // The event panel may not be in the document yet: search inside it.
    var panel = Events.eventPanel();
    attach($('#wanderer', panel), wandererSprite());
    attach($('#enemy', panel), enemySprite(scene.enemy || scene.enemyName, scene.chara));
  });

  Gfx.after(window.Events, 'damage', function (fighter, target, dmg) {
    if (typeof dmg !== 'number' || dmg <= 0) return;
    var c = $('canvas.gfx-fighter', target);
    c.removeClass('gfx-hit');
    void c.width(); // restart the animation
    c.addClass('gfx-hit');
    setTimeout(function () {
      c.removeClass('gfx-hit');
    }, 260);
  });

  Gfx.sprites = { enemy: enemySprite, wanderer: wandererSprite };

  Gfx.after(window.Events, 'winFight', function () {
    $('#enemy canvas.gfx-fighter').addClass('gfx-dead');
  });
  Gfx.after(window.Events, 'loseFight', function () {
    $('#wanderer canvas.gfx-fighter').addClass('gfx-dead');
  });
})();
