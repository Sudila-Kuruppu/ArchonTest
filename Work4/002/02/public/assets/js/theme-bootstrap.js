/*
 * public/assets/js/theme-bootstrap.js
 *
 * Synchronous inline-script variant. This file is the SOURCE for the bootstrap
 * snippet that is pasted (verbatim) into <head> on every page, ahead of any
 * deferred module. It runs before first paint to set <html data-theme="...">
 * so the correct token cascade is active before the browser paints.
 *
 * Resolution order (per spec):
 *   1. localStorage tickettrade.theme (when value is 'light' | 'dark' | 'system')
 *   2. <html data-default-theme="..."> or <html data-role="..."> (role default;
 *      'dark' on student pages, 'light' on admin pages)
 *   3. prefers-color-scheme (system preference)
 *   4. 'dark' (hard fallback)
 *
 * Role default rule (PR 1-2 §Build contract):
 *   data-role="admin"   -> light
 *   data-role="student" -> dark
 *   The role default is applied only when prefers-color-scheme returns
 *   'no-preference'. When the OS reports light or dark, the system
 *   preference wins; the role default is the safety net for environments
 *   that cannot or will not report a preference.
 *
 * After resolving the theme the bootstrap writes `system` to localStorage
 * when no explicit user choice exists, so the toggle's aria-pressed is
 * coherent across reloads and the matchMedia('change') listener in
 * theme.js can attach.
 *
 * The bootstrap does NOT call auth or time helpers (FOUC risk). It is plain
 * ES2020 / DOM Level 2 only. It must NOT use `import` (the whole point of
 * inline <script> is synchronous execution; module imports are deferred).
 *
 * The function `tickettradeThemeBootstrap()` is also exposed on `window` for
 * the theme-test.html self-test fixture to call deterministically.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'tickettrade.theme';
  var ALLOWED = { light: 1, dark: 1, system: 1 };
  var DEFAULT_THEME = 'dark';
  var ROLE_DEFAULTS = { admin: 'light', student: 'dark' };

  function tickettradeThemeBootstrap() {
    try {
      var doc = document;
      var html = doc.documentElement;
      var stored = null;
      try {
        stored = globalThis.localStorage.getItem(STORAGE_KEY);
      } catch (_e) {
        // localStorage may be disabled (private mode, locked-down browser);
        // fall through to the role default.
        stored = null;
      }
      // Note: do NOT normalise absent role default to DEFAULT_THEME here.
      // Per spec the fallback chain is localStorage -> role default -> system
      // pref -> 'dark'. If the page omitted data-default-theme entirely, the
      // bootstrap must fall through to prefers-color-scheme rather than
      // silently coercing to 'dark' and skipping that branch.
      // PR 1-2 §Build contract: data-role is the canonical role signal.
      // data-default-theme remains accepted for back-compat with PR 1-1
      // pages; data-role wins when present because it carries the human
      // role (admin | student | ...) rather than the token name.
      var roleDefault = null;
      var role = html.getAttribute('data-role');
      if (role && ROLE_DEFAULTS[role]) {
        roleDefault = ROLE_DEFAULTS[role];
      }
      if (roleDefault !== 'light' && roleDefault !== 'dark') {
        var legacy = html.getAttribute('data-default-theme');
        if (legacy === 'light' || legacy === 'dark') {
          roleDefault = legacy;
        }
      }

      var mql = globalThis.matchMedia;
      var lightMql = mql && mql('(prefers-color-scheme: light)');
      var lightMatches = !!(lightMql && lightMql.matches);
      var darkMql = mql && mql('(prefers-color-scheme: dark)');
      var darkMatches = !!(darkMql && darkMql.matches);
      // PR 1-2 §Build: role default applies ONLY when prefers-color-scheme
      // returns no-preference. Some browsers omit the match entirely
      // (no matchMedia support); treat that as no-preference too.
      var noPreference = mql ? (!lightMatches && !darkMatches) : true;

      var resolved = DEFAULT_THEME;
      var resolvedFromSystemPref = false;
      if (stored === 'light' || stored === 'dark') {
        // Explicit persisted choice wins; "system" is not a final value, it
        // resolves to whatever the OS prefers at first paint.
        resolved = stored;
      } else if (stored === 'system') {
        resolved = lightMatches ? 'light' : 'dark';
        resolvedFromSystemPref = true;
      } else if (noPreference && (roleDefault === 'light' || roleDefault === 'dark')) {
        // Role default fires only when the OS preference is absent.
        resolved = roleDefault;
      } else if (lightMatches) {
        resolved = 'light';
        resolvedFromSystemPref = true;
      } else if (darkMatches) {
        resolved = 'dark';
        resolvedFromSystemPref = true;
      } else {
        resolved = DEFAULT_THEME;
      }

      if (ALLOWED[resolved] !== 1 && resolved !== 'light' && resolved !== 'dark') {
        resolved = DEFAULT_THEME;
      }

      html.setAttribute('data-theme', resolved);

      // PR 1-2 §Build: when the resolution path went through the OS
      // preference (or no-preference with no role default), seed the
      // localStorage value as 'system' so the toggle and the live
      // matchMedia listener share one source of truth across reloads.
      // When the user picked Light or Dark (stored is 'light'/'dark'),
      // localStorage already holds the explicit value, no rewrite needed.
      if (stored !== 'light' && stored !== 'dark' && stored !== 'system') {
        try { globalThis.localStorage.setItem(STORAGE_KEY, 'system'); } catch (__) {}
      }

      return resolved;
    } catch (_err) {
      // Last-ditch: if anything blows up, ensure the attribute exists so the
      // CSS cascade has a target.
      try { document.documentElement.setAttribute('data-theme', DEFAULT_THEME); } catch (__) {}
      return DEFAULT_THEME;
    }
  }

  // Expose for the theme-test.html fixture and for ad-hoc debugging.
  globalThis.tickettradeThemeBootstrap = tickettradeThemeBootstrap;

  // Run synchronously. This file is inlined into <head> ahead of any deferred
  // module, so first paint already carries the correct [data-theme] cascade.
  tickettradeThemeBootstrap();
})();
