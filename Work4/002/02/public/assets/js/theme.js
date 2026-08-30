/*
 * public/assets/js/theme.js
 *
 * Theme state owner. Exports getTheme(), setTheme(value), applyTheme(value),
 * clearStoredTheme() and the CustomEvent `tickettrade:theme-change` for
 * subscribers. The 3-state Web Component <theme-toggle> ships from here so any
 * page can drop it in.
 *
 * The single source of theme state is the `data-theme` attribute on <html>;
 * the bootstrap in theme-bootstrap.js sets it before first paint. Everything
 * in this module reads + writes that attribute.
 *
 * localStorage key is exactly `tickettrade.theme` with value `light` | `dark`
 * | `system`. `system` is the value written when the user picks System; it
 * tells the bootstrap (and the toggle) to track prefers-color-scheme.
 * applyTheme() resolves the value to a concrete `light` | `dark` for the
 * `data-theme` attribute (the CSS cascade only knows the binary).
 *
 * When localStorage is absent on page load, the bootstrap writes `system` so
 * the stored-preference API and the toggle's aria-pressed are coherent
 * across reloads. The matchMedia('change') listener is attached only when
 * the stored value is `system`; that is the lane-6 contract (flipping the OS
 * preference flips data-theme within one animation frame).
 *
 * The Web Component is a Custom Element registered with `customElements.define`.
 * It renders 3 buttons (Light / Dark / System). Each button carries
 * `aria-pressed="true"` for the active state. The component reads the current
 * theme via getTheme() and updates aria-pressed on connectedCallback +
 * whenever the theme-change event fires.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'tickettrade.theme';
  var THEME_VALUES = { light: 1, dark: 1, system: 1 };
  var EVENT_NAME = 'tickettrade:theme-change';
  var DEFAULT_THEME = 'dark';

  function safeGetStored() {
    try { return globalThis.localStorage.getItem(STORAGE_KEY); } catch (_e) { return null; }
  }
  function safeSetStored(value) {
    try { globalThis.localStorage.setItem(STORAGE_KEY, value); } catch (_e) {}
  }
  function safeRemoveStored() {
    try { globalThis.localStorage.removeItem(STORAGE_KEY); } catch (_e) {}
  }

  function systemPrefers() {
    if (!globalThis.matchMedia) return 'dark';
    return globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function resolveStoredOrSystem() {
    var stored = safeGetStored();
    if (stored === 'light' || stored === 'dark') return stored;
    if (stored === 'system') return systemPrefers();
    return null;
  }

  function getTheme() {
    var html = document.documentElement;
    var attr = html.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    // Defensive: if bootstrap hasn't run yet, fall through to the same
    // resolution chain so callers don't get an undefined back.
    var resolved = resolveStoredOrSystem();
    if (resolved) return resolved;
    var role = html.getAttribute('data-default-theme');
    if (role === 'light' || role === 'dark') return role;
    return systemPrefers();
  }

  function getStoredPreference() {
    // Returns the explicit user preference (light | dark | system) or 'system'
    // when the user has not chosen. Distinct from getTheme() which always
    // resolves to a concrete light/dark value.
    //
    // The 'system' default reflects the per-spec contract: an absent key means
    // the user has not picked, which is functionally equivalent to choosing
    // System. The bootstrap writes 'system' on first load so this method
    // returns a concrete value across reloads.
    var stored = safeGetStored();
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  }

  function applyTheme(value) {
    var html = document.documentElement;
    var next;
    if (value === 'light' || value === 'dark') {
      next = value;
    } else if (value === 'system') {
      next = systemPrefers();
    } else {
      // Anything else: fall through to the default. The bootstrap already
      // normalised localStorage values on read; this is a defensive net.
      next = DEFAULT_THEME;
    }
    var prev = html.getAttribute('data-theme');
    html.setAttribute('data-theme', next);
    if (prev !== next) {
      globalThis.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { theme: next, previous: prev } }));
    }
    return next;
  }

  function setTheme(value) {
    if (value !== 'light' && value !== 'dark' && value !== 'system') return null;
    // PR 1-2 §Build contract: System writes the literal 'system' value to
    // localStorage so the bootstrap, the toggle, and the live matchMedia
    // listener all share one source of truth. The bootstrap also seeds this
    // value on first load when the user has not yet chosen.
    safeSetStored(value);
    return applyTheme(value);
  }

  function clearStoredTheme() {
    // Legacy clear path. Kept for callers that want to drop the key entirely
    // (e.g. for a sign-out flow). After clearing, getStoredPreference()
    // reports 'system' (the absent-key default) and the live matchMedia
    // listener attaches via attachSystemListenerIfNeeded().
    safeRemoveStored();
    return applyTheme('system');
  }

  // -------------------------------------------------------------------------
  // System-mode live listener
  // -------------------------------------------------------------------------
  // Per the PR 1-2 §Build contract, we subscribe to matchMedia('change') ONLY
  // when the stored preference is 'system'. The listener flips data-theme to
  // the new prefers-color-scheme value and fires tickettrade:theme-change.
  // Detaching on light/dark keeps the toggle inert for explicit choices and
  // lets the OS pref change without surprising the user.
  var _systemMql = null;
  var _systemListener = null;

  function detachSystemListener() {
    if (_systemMql && _systemListener) {
      try { _systemMql.removeEventListener('change', _systemListener); } catch (_e) {}
      _systemMql = null;
      _systemListener = null;
    }
  }

  function attachSystemListenerIfNeeded() {
    var stored = getStoredPreference();
    if (stored !== 'system') {
      detachSystemListener();
      return;
    }
    if (!globalThis.matchMedia) return;
    if (_systemMql && _systemListener) return; // already attached
    var mql = globalThis.matchMedia('(prefers-color-scheme: dark)');
    if (!mql) return;
    _systemListener = function () {
      // Re-resolve and apply; applyTheme() fires the change event only when
      // the resolved theme actually flipped.
      applyTheme('system');
    };
    try { mql.addEventListener('change', _systemListener); } catch (_e) {}
    _systemMql = mql;
  }

  function syncSystemListener() {
    attachSystemListenerIfNeeded();
  }

  // -------------------------------------------------------------------------
  // <theme-toggle> Web Component
  // -------------------------------------------------------------------------
  // Markup:
  //   <theme-toggle></theme-toggle>
  // Renders three buttons: Light, Dark, System. The active button carries
  // aria-pressed="true". Clicking a button calls setTheme(value). The
  // component listens for the tickettrade:theme-change event so multiple
  // instances on the same page (or a programmatic setTheme call) stay in
  // sync, plus a storage event for cross-tab sync.
  var TEMPLATE_HTML = ''
    + '<div class="theme-toggle" role="group" aria-label="Theme">'
    +   '<button type="button" class="theme-toggle__btn" data-theme-value="light" aria-pressed="false">'
    +     '<span class="theme-toggle__icon" aria-hidden="true">'
    +       '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    +         '<circle cx="12" cy="12" r="4"></circle>'
    +         '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>'
    +       '</svg>'
    +     '</span>'
    +     '<span class="theme-toggle__label">Light</span>'
    +   '</button>'
    +   '<button type="button" class="theme-toggle__btn" data-theme-value="dark" aria-pressed="false">'
    +     '<span class="theme-toggle__icon" aria-hidden="true">'
    +       '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">'
    +         '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
    +       '</svg>'
    +     '</span>'
    +     '<span class="theme-toggle__label">Dark</span>'
    +   '</button>'
    +   '<button type="button" class="theme-toggle__btn" data-theme-value="system" aria-pressed="false">'
    +     '<span class="theme-toggle__icon" aria-hidden="true">'
    +       '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    +         '<rect x="2" y="4" width="20" height="14" rx="2"></rect>'
    +         '<path d="M8 22h8M12 18v4"></path>'
    +       '</svg>'
    +     '</span>'
    +     '<span class="theme-toggle__label">System</span>'
    +   '</button>'
    + '</div>';

  var TEMPLATE;
  function getTemplate() {
    if (!TEMPLATE) {
      TEMPLATE = document.createElement('template');
      TEMPLATE.innerHTML = TEMPLATE_HTML;
    }
    return TEMPLATE;
  }

  function activeValue() {
    // The toggle's active button reflects the explicit user preference.
    // getStoredPreference() returns 'system' when no choice is stored, so
    // the System button is the default-pressed state on a fresh load.
    return getStoredPreference();
  }

  function ThemeToggleElement() {
    var self = Reflect.construct(HTMLElement, [], ThemeToggleElement);
    return self;
  }
  ThemeToggleElement.prototype = Object.create(HTMLElement.prototype);
  ThemeToggleElement.prototype.constructor = ThemeToggleElement;
  Object.setPrototypeOf(ThemeToggleElement, HTMLElement);

  ThemeToggleElement.prototype.connectedCallback = function () {
    var tpl = getTemplate();
    var node = tpl.content.cloneNode(true);
    var root = node.querySelector('.theme-toggle');
    if (!root) return;
    // Move the cloned children into the host element. We do not append the
    // <div class="theme-toggle"> wrapper itself because the host element is
    // the wrapper; the .theme-toggle class is added to `this`.
    while (root.firstChild) {
      this.appendChild(root.firstChild);
    }
    this.classList.add('theme-toggle');

    this._onClick = function (ev) {
      var t = ev.target;
      while (t && t !== this) {
        if (t.dataset && t.dataset.themeValue) {
          var value = t.dataset.themeValue;
          if (value === 'light' || value === 'dark' || value === 'system') {
            setTheme(value);
            // PR 1-2 §Lane 7: announce the choice via the toast channel so
            // the page can surface "Theme set to system." per EXPERIENCE.md
            // §State Patterns Settings row. The toast.js module owns the
            // real emitter; here we dispatch a CustomEvent the host page
            // can bridge into window.toast.
            try {
              globalThis.dispatchEvent(new CustomEvent('tickettrade:theme-set', {
                detail: { theme: value }
              }));
            } catch (_e) {}
          }
          ev.preventDefault();
          return;
        }
        t = t.parentNode;
      }
    }.bind(this);

    this._onThemeChange = function () { this.syncAria(); }.bind(this);

    this.addEventListener('click', this._onClick);
    global.addEventListener(EVENT_NAME, this._onThemeChange);
    // Cross-tab sync (storage events only fire on OTHER tabs, not this one).
    this._onStorage = function (ev) {
      if (ev.key === STORAGE_KEY) this.syncAria();
    }.bind(this);
    global.addEventListener('storage', this._onStorage);

    // The theme-toggle lives in pages that may have chosen Light or Dark
    // before the component upgraded. Sync the live system-mode listener
    // to whatever the current stored preference is.
    syncSystemListener();

    this.syncAria();
  };

  ThemeToggleElement.prototype.disconnectedCallback = function () {
    if (this._onClick) this.removeEventListener('click', this._onClick);
    if (this._onThemeChange) global.removeEventListener(EVENT_NAME, this._onThemeChange);
    if (this._onStorage) global.removeEventListener('storage', this._onStorage);
  };

  ThemeToggleElement.prototype.syncAria = function () {
    var active = activeValue();
    var buttons = this.querySelectorAll('button[data-theme-value]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.getAttribute('data-theme-value') === active) {
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }
    }
  };

  if (!customElements.get('theme-toggle')) {
    customElements.define('theme-toggle', ThemeToggleElement);
  }

  // -------------------------------------------------------------------------
  // Public exports (ES module + global). When loaded as a `<script
  // type="module" src=".../theme.js">` the named exports are available;
  // when loaded via legacy `<script>` (no `type=module`) the same surface is
  // exposed on `window.TicketTradeTheme` so the theme-test.html self-test
  // fixture can drive it without a module loader.
  // -------------------------------------------------------------------------
  var api = {
    STORAGE_KEY: STORAGE_KEY,
    EVENT_NAME: EVENT_NAME,
    DEFAULT_THEME: DEFAULT_THEME,
    getTheme: getTheme,
    setTheme: setTheme,
    applyTheme: applyTheme,
    clearStoredTheme: clearStoredTheme,
    getStoredPreference: getStoredPreference,
    attachSystemListener: attachSystemListenerIfNeeded,
    detachSystemListener: detachSystemListener
  };

  global.TicketTradeTheme = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})((typeof window !== 'undefined' ? window : globalThis));
