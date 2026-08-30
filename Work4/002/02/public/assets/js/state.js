// public/assets/js/state.js
//
// CAP-7 empty-state and error-state library. Vanilla ES2020 module; no
// build step. Public API:
//
//   import { renderEmpty, renderError, renderSoldOut, renderSelfOwnedNote,
//            renderRedeemFail, renderRedeemRateLimit, renderAlreadyRedeemed,
//            clearState } from './state.js';
//
// Every error / empty string below is the verbatim copy catalogued in
// empty-error-state-library.md; no paraphrasing. Every render produces
// the documented ARIA roles (role="status" / aria-live="polite" for
// non-action states; role="alert" / aria-live="assertive" for error
// states). No emoji, no encouragement filler.

/**
 * Build an HTML element with the given tag, className, and attribute map.
 * @param {string} tag
 * @param {string} [className]
 * @param {Record<string, string>|null} [attrs]
 * @returns {HTMLElement}
 */
function el(tag, className, attrs) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === '' || v === null || v === undefined) continue;
      node.setAttribute(k, String(v));
    }
  }
  return node;
}

/**
 * Escape a string for safe insertion via textContent / innerText. The
 * public API passes strings we control, but defensive escape avoids
 * XSS if a future caller forwards user data without encoding.
 * @param {string} s
 * @returns {string}
 */
function escapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Wipe a root container and remove any leftover aria-live attributes.
 * Centralized so every renderer clears the same way.
 * @param {HTMLElement} rootEl
 */
function wipe(rootEl) {
  if (!rootEl) return;
  rootEl.innerHTML = '';
  rootEl.removeAttribute('aria-live');
  rootEl.removeAttribute('role');
}

/**
 * renderEmpty(rootEl, { copy, cta? }) — renders the documented empty
 * state. `cta` accepts either an object ({label, href}) for a link-style
 * CTA or ({label, onClick}) for a button-style CTA. Both wrap in a
 * primary button visual via .btn-primary when the host page supplies it;
 * the inline state-* classes carry the chrome.
 *
 * @param {HTMLElement} rootEl
 * @param {{ copy: string, cta?: { label: string, href?: string, onClick?: (ev: MouseEvent) => void } }} opts
 */
export function renderEmpty(rootEl, opts) {
  if (!rootEl) return;
  const copy = (opts && opts.copy) || '';
  const cta = opts && opts.cta;
  wipe(rootEl);

  const container = el('div', 'state-empty', {
    role: 'status',
    'aria-live': 'polite',
  });
  const copyEl = el('p', 'state-empty__copy');
  copyEl.textContent = copy;
  container.appendChild(copyEl);

  if (cta && cta.label) {
    let ctaEl;
    if (cta.href) {
      ctaEl = el('a', 'state-empty__cta btn-primary', {
        href: cta.href,
      });
      ctaEl.textContent = cta.label;
    } else {
      ctaEl = el('button', 'state-empty__cta btn-primary', {
        type: 'button',
      });
      ctaEl.textContent = cta.label;
      if (typeof cta.onClick === 'function') {
        ctaEl.addEventListener('click', (ev) => cta.onClick(ev));
      }
    }
    container.appendChild(ctaEl);
  }

  rootEl.appendChild(container);
}

/**
 * The refresh icon used by the fetch-fail retry button. Inline SVG so
 * the test page has zero network dependencies and the icon follows the
 * button's text color via `currentColor`.
 */
const RETRY_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M21 12a9 9 0 1 1-3.5-7.1"/>' +
  '<path d="M21 4v5h-5"/>' +
  '</svg>';

/**
 * renderError(rootEl, { copy, retry? }) — renders the documented error
 * state. `retry` may be a function (called on click) or an object
 * ({label, onClick}) for an alternative label (default aria-label
 * "Retry"). The retry affordance is a square 44x44 icon button.
 *
 * @param {HTMLElement} rootEl
 * @param {{ copy: string, retry?: (() => void) | { label?: string, onClick: () => void } }} opts
 */
export function renderError(rootEl, opts) {
  if (!rootEl) return;
  const copy = (opts && opts.copy) || '';
  const retry = opts && opts.retry;
  wipe(rootEl);

  const container = el('div', 'state-error', {
    role: 'alert',
    'aria-live': 'assertive',
  });
  const copyEl = el('p', 'state-error__copy');
  copyEl.textContent = copy;
  container.appendChild(copyEl);

  if (retry) {
    const retryBtn = el('button', 'state-action-retry', {
      type: 'button',
      'aria-label': (retry && typeof retry === 'object' && retry.label) || 'Retry',
    });
    retryBtn.innerHTML = RETRY_SVG;
    if (typeof retry === 'function') {
      retryBtn.addEventListener('click', () => retry());
    } else if (retry && typeof retry.onClick === 'function') {
      retryBtn.addEventListener('click', () => retry.onClick());
    }
    container.appendChild(retryBtn);
  }

  rootEl.appendChild(container);
}

/**
 * renderSoldOut(rootEl) — replaces the Buy Now area with the documented
 * "Sold out" text and the status badge. The badge is a `status-badge`
 * with data-status="sold" — the class lives in token-reference.md and
 * is owned by Story 1.4 (brand-specific components); if the host page
 * does not yet load that recipe, our CSS ships a minimal fallback so
 * the pill still renders legibly.
 *
 * @param {HTMLElement} rootEl
 */
export function renderSoldOut(rootEl) {
  if (!rootEl) return;
  wipe(rootEl);

  const container = el('div', 'state-sold-out', {
    role: 'status',
    'aria-live': 'polite',
  });
  container.textContent = 'Sold out';

  const badge = el('span', 'status-badge', {
    'data-status': 'sold',
    'aria-label': 'Sold',
  });
  badge.textContent = 'sold';

  container.appendChild(badge);
  rootEl.appendChild(container);
}

/**
 * renderSelfOwnedNote(rootEl) — small "You own this listing." note
 * above the seller row. Idempotent: a second call replaces the note;
 * no internal state is held.
 *
 * @param {HTMLElement} rootEl
 */
export function renderSelfOwnedNote(rootEl) {
  if (!rootEl) return;
  wipe(rootEl);
  const note = el('p', 'state-self-owned-note');
  note.textContent = 'You own this listing.';
  rootEl.appendChild(note);
}

/**
 * renderRedeemFail(rootEl, { attemptsRemaining }) — inline error
 * "Code not recognized." with a counter "N of 5 attempts remaining".
 * Caller passes the attempts remaining (1..4 in this branch); attempt
 * 5 is handled by renderRedeemRateLimit.
 *
 * @param {HTMLElement} rootEl
 * @param {{ attemptsRemaining: number }} opts
 */
export function renderRedeemFail(rootEl, opts) {
  if (!rootEl) return;
  const n = (opts && typeof opts.attemptsRemaining === 'number') ? opts.attemptsRemaining : 4;
  wipe(rootEl);
  const span = el('span', 'state-redeem-fail', {
    role: 'alert',
  });
  span.textContent = `Code not recognized. ${n} of 5 attempts remaining`;
  rootEl.appendChild(span);
}

/**
 * renderRedeemRateLimit(rootEl, inputEl) — inline error "Too many
 * attempts. Try again in 1 hour." PLUS the input is locked: disabled
 * attribute, data-locked="true", and aria-disabled="true" so the
 * screen reader announces the lockout. The next paint must observe
 * inputEl.disabled === true and data-locked === true.
 *
 * @param {HTMLElement} rootEl
 * @param {HTMLElement} inputEl
 */
export function renderRedeemRateLimit(rootEl, inputEl) {
  if (!rootEl) return;
  wipe(rootEl);
  const span = el('span', 'state-redeem-rate-limit', {
    role: 'alert',
  });
  span.textContent = 'Too many attempts. Try again in 1 hour.';
  rootEl.appendChild(span);

  if (inputEl) {
    inputEl.setAttribute('disabled', '');
    inputEl.setAttribute('data-locked', 'true');
    inputEl.setAttribute('aria-disabled', 'true');
  }
}

/**
 * renderAlreadyRedeemed(rootEl, { timestamp }) — inline info
 * "This ticket was already redeemed on {timestamp}." Idempotent by
 * contract: caller must NOT throw and must NOT mutate ticket state.
 * We render the message and return normally; the host code does the
 * rest of the no-state-change work.
 *
 * @param {HTMLElement} rootEl
 * @param {{ timestamp: string }} opts
 */
export function renderAlreadyRedeemed(rootEl, opts) {
  if (!rootEl) return;
  const ts = (opts && opts.timestamp) || '';
  wipe(rootEl);
  const span = el('span', 'state-already-redeemed', {
    role: 'status',
  });
  span.textContent = `This ticket was already redeemed on ${ts}.`;
  rootEl.appendChild(span);
}

/**
 * clearState(rootEl) — convenience: wipe the container and remove any
 * leftover aria-live attributes. Useful for "dismiss" handlers that
 * remove the state without rendering a new one.
 *
 * @param {HTMLElement} rootEl
 */
export function clearState(rootEl) {
  wipe(rootEl);
}


/**
 * window.emptyState.show({ icon, title, body, cta, target }) — public
 * API for ad-hoc empty-state rendering. The plan names a 12-column
 * centered layout with an icon slot, a title, a body, and an optional
 * CTA. If `target` is provided, the block is injected into that
 * container; otherwise the function returns the assembled element so
 * the caller can append it. This wrapper composes renderEmpty's
 * `.state-empty` chrome with an icon + title row on top.
 *
 * @param {{ icon?: string, title?: string, body?: string, cta?: { label: string, href?: string, onClick?: (ev: MouseEvent) => void }, target?: HTMLElement }} opts
 * @returns {HTMLElement | null}
 */
function showEmpty(opts) {
  if (typeof window === 'undefined') return null;
  const o = opts || {};
  const target = o.target || (typeof document !== 'undefined' ? document.body : null);
  if (!target) return null;

  // Build the wrapper with the 12-column centered layout. The CSS in
  // tickettrade.css positions .state-empty as flex column; we add a
  // .state-empty-rich modifier so the host page can opt into the wider
  // 12-column layout without changing the default .state-empty look.
  const wrap = el('div', 'state-empty state-empty-rich', {
    role: 'status',
    'aria-live': 'polite',
  });
  if (o.icon) {
    const iconSlot = el('div', 'state-empty__icon');
    iconSlot.setAttribute('aria-hidden', 'true');
    iconSlot.textContent = o.icon;
    wrap.appendChild(iconSlot);
  }
  if (o.title) {
    const title = el('h2', 'state-empty__title');
    title.textContent = o.title;
    wrap.appendChild(title);
  }
  if (o.body) {
    const body = el('p', 'state-empty__copy');
    body.textContent = o.body;
    wrap.appendChild(body);
  }
  if (o.cta && o.cta.label) {
    let ctaEl;
    if (o.cta.href) {
      ctaEl = el('a', 'state-empty__cta btn-primary', { href: o.cta.href });
      ctaEl.textContent = o.cta.label;
    } else {
      ctaEl = el('button', 'state-empty__cta btn-primary', { type: 'button' });
      ctaEl.textContent = o.cta.label;
      if (typeof o.cta.onClick === 'function') {
        ctaEl.addEventListener('click', (ev) => o.cta.onClick(ev));
      }
    }
    wrap.appendChild(ctaEl);
  }

  // Inject into target (replacing any prior content).
  if (target === document.body) {
    // For body, prepend so the empty state is the first thing visible.
    target.insertBefore(wrap, target.firstChild);
  } else {
    target.innerHTML = '';
    target.appendChild(wrap);
  }
  return wrap;
}

// Expose the public API on window so non-module consumers can call
// window.emptyState.show(...) from the page console.
if (typeof window !== 'undefined') {
  window.emptyState = Object.freeze({
    show: showEmpty,
    renderEmpty,
    renderError,
    renderSoldOut,
    renderSelfOwnedNote,
    renderRedeemFail,
    renderRedeemRateLimit,
    renderAlreadyRedeemed,
    clearState,
  });
}
