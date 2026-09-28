/*
 * A Dark Room — graphics layer: core.
 *
 * Loaded after the game's own scripts. The layer never changes game logic:
 * it reads state through $SM and wraps a handful of the game's render
 * functions so each scene can draw on a canvas behind (or over) the text UI.
 * Turning graphics off in the menu reloads the page as the stock game.
 */
(function () {
  'use strict';

  var PREF = 'adr-gfx';
  var PREV_LIGHTS = 'adr-gfx-prev-lights';

  function pref(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {
      /* storage blocked: graphics just stay at their default */
    }
    return null;
  }

  var Gfx = (window.Gfx = {
    enabled: pref(PREF) !== 'off',
    scenes: [],
    t: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    BG: '#272823', // page colour from the game's dark.css

    register: function (scene) {
      Gfx.scenes.push(scene);
    },

    // Wrap obj[name] so fn runs after the original with the same this/args.
    // Errors in fn are logged and never break the game.
    after: function (obj, name, fn) {
      var orig = obj && obj[name];
      if (typeof orig !== 'function') return;
      obj[name] = function () {
        var result = orig.apply(this, arguments);
        if (Gfx.enabled) {
          try {
            fn.apply(this, arguments);
          } catch (e) {
            console.error('[gfx] after ' + name, e);
          }
        }
        return result;
      };
    },

    // A HiDPI canvas drawn in CSS pixels.
    canvas: function (w, h, className) {
      var el = document.createElement('canvas');
      el.className = className || '';
      el.width = Math.round(w * Gfx.dpr);
      el.height = Math.round(h * Gfx.dpr);
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      var ctx = el.getContext('2d');
      ctx.setTransform(Gfx.dpr, 0, 0, Gfx.dpr, 0, 0);
      return { el: el, ctx: ctx, w: w, h: h };
    },

    // An offscreen 1x canvas, drawn once by draw(ctx).
    sprite: function (w, h, draw) {
      var el = document.createElement('canvas');
      el.width = w;
      el.height = h;
      draw(el.getContext('2d'), w, h);
      return el;
    },

    // Soft round light, used for flames, glows and windows.
    glow: function (size, r, g, b) {
      return Gfx.sprite(size, size, function (ctx) {
        var h = size / 2;
        var grad = ctx.createRadialGradient(h, h, 0, h, h, h);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
        grad.addColorStop(0.35, 'rgba(' + r + ',' + g + ',' + b + ',0.55)');
        grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      });
    },

    // mulberry32: small, fast, seedable.
    rng: function (seed) {
      return function () {
        seed = (seed + 0x6d2b79f5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    hash: function (s) {
      s = String(s);
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    },

    num: function (path) {
      var v = $SM.get(path, true);
      return typeof v === 'number' ? v : 0;
    },

    isActive: function (module) {
      return typeof module !== 'undefined' && Engine.activeModule === module;
    },
  });

  // ---- animation loop -------------------------------------------------------

  var last = 0;
  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;
    Gfx.t += dt;
    for (var i = 0; i < Gfx.scenes.length; i++) {
      var scene = Gfx.scenes[i];
      if (scene.broken) continue;
      try {
        if (scene.visible()) scene.frame(dt, Gfx.t);
      } catch (e) {
        // One bad scene must not take the game (or the other scenes) down.
        scene.broken = true;
        console.error('[gfx] scene ' + scene.name + ' disabled', e);
      }
    }
    window.requestAnimationFrame(frame);
  }

  // ---- menu toggle ------------------------------------------------------------

  function addToggle() {
    var btn = $('<span>')
      .addClass('gfxToggle menuBtn')
      .text(Gfx.enabled ? _('graphics off.') : _('graphics on.'))
      .click(function () {
        var on = !Gfx.enabled;
        if (!on && pref(PREV_LIGHTS) === 'on' && Engine.isLightsOff()) {
          Engine.turnLightsOff(); // hand the player back the light theme they had
        }
        if (!on) pref(PREV_LIGHTS, null);
        pref(PREF, on ? 'on' : 'off');
        Engine.saveGame();
        window.location.reload();
      });
    var lights = $('.menu .lightsOff');
    if (lights.length) btn.insertAfter(lights);
    else btn.appendTo('.menu');
  }

  // Runs after Engine.init: engine.js registered its ready handler first.
  $(function () {
    addToggle();
    if (!Gfx.enabled) return;
    $('body').addClass('gfx');
    // The scenes are painted for a dark page; remember the player's choice.
    if (pref(PREV_LIGHTS) === null) {
      pref(PREV_LIGHTS, Engine.isLightsOff() ? 'off' : 'on');
    }
    if (!Engine.isLightsOff()) Engine.turnLightsOff();
    window.requestAnimationFrame(frame);
  });
})();
