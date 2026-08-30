/*
 * public/assets/js/a11y.js
 *
 * Accessibility primitives. ES module. Exports:
 *
 *   announce(message, opts?)       -- write to shared #a11y-announcer
 *   getFocusable(root)             -- list focusable elements in DOM order
 *   trapFocus(container)           -- install Tab/Shift+Tab wrap; return teardown
 *   releaseFocus(container, ret?)  -- run teardown + focus returnTo
 *   bindSkipLink(linkEl, mainId?)  -- wire a skip-link to jump+focus #main
 *
 * Shared announcer lives at #a11y-announcer (visually hidden, aria-live).
 * Both polite (default) and assertive writes are supported; the polite
 * region is reused and assertive writes temporarily swap aria-live.
 *
 * The focus-trap is intentionally framework-free: it stores the previously
 * focused element on a WeakMap so nested traps compose without leaking.
 *
 * Story 1.3 ships the implementations; PR 1.4..1.13 and every later epic
 * consume these exports.
 */

const ANNOUNCER_ID = "a11y-announcer";

function getAnnouncer() {
  let region = document.getElementById(ANNOUNCER_ID);
  if (region) return region;
  region = document.createElement("div");
  region.id = ANNOUNCER_ID;
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  // Visually hidden but still announced by assistive tech.
  Object.assign(region.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: "0",
  });
  document.body.appendChild(region);
  return region;
}

/**
 * Announce a message to screen readers via the shared polite live region.
 * Polite is the default. Assertive briefly swaps aria-live to ensure the
 * message interrupts any pending polite announcement.
 *
 * @param {string} message
 * @param {{ politeness?: 'polite'|'assertive' }} [opts]
 */
export function announce(message, opts) {
  const region = getAnnouncer();
  const politeness = (opts && opts.politeness) || "polite";
  region.textContent = "";
  // Use a microtask so the clearing actually lands before the new text.
  Promise.resolve().then(() => {
    if (politeness === "assertive") {
      const prev = region.getAttribute("aria-live");
      region.setAttribute("aria-live", "assertive");
      region.textContent = String(message);
      if (prev) {
        // Restore on next animation frame so screen readers register the
        // assertive write first.
        requestAnimationFrame(() => region.setAttribute("aria-live", prev));
      }
    } else {
      region.setAttribute("aria-live", "polite");
      region.textContent = String(message);
    }
  });
}

/**
 * Return all focusable elements inside `root`, in DOM order. Selectors
 * mirror the WAI-ARIA Authoring Practices list; elements with tabindex="-1"
 * or hidden aria are excluded.
 *
 * @param {ParentNode} root
 * @returns {HTMLElement[]}
 */
export function getFocusable(root) {
  if (!root) return [];
  const selector = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "object",
    "embed",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
  ].join(",");
  return Array.from(root.querySelectorAll(selector)).filter((el) => {
    if (el.hasAttribute("hidden")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (rect && (rect.width === 0 || rect.height === 0) && el.tagName !== "INPUT") {
      return false;
    }
    return true;
  });
}

/* Module-level map: container -> previously focused element. */
const PREVIOUSLY_FOCUSED = new WeakMap();
const TEARDOWNS = new WeakMap();

/**
 * Trap Tab focus inside `container`. Stores the previously focused element
 * on a WeakMap so releaseFocus can restore it. Returns a teardown function.
 *
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export function trapFocus(container) {
  if (!container) return () => {};
  PREVIOUSLY_FOCUSED.set(container, document.activeElement);
  const items = getFocusable(container);
  if (items.length > 0) {
    try {
      items[0].focus();
    } catch (_) {
      /* ignore focus errors on hidden elements */
    }
  }
  const handler = (e) => {
    if (e.key !== "Tab") return;
    const focusables = getFocusable(container);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener("keydown", handler);
  const teardown = () => container.removeEventListener("keydown", handler);
  TEARDOWNS.set(container, teardown);
  return teardown;
}

/**
 * Release a focus trap previously installed by trapFocus. Returns focus to
 * the originally focused element if `returnTo` is omitted; otherwise returns
 * focus to `returnTo`.
 *
 * @param {HTMLElement} container
 * @param {HTMLElement} [returnTo]
 */
export function releaseFocus(container, returnTo) {
  if (!container) return;
  const teardown = TEARDOWNS.get(container);
  if (teardown) {
    teardown();
    TEARDOWNS.delete(container);
  }
  const target = returnTo || PREVIOUSLY_FOCUSED.get(container);
  PREVIOUSLY_FOCUSED.delete(container);
  if (target && typeof target.focus === "function") {
    try {
      target.focus();
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * Wire a skip-link element so clicking it (or activating it via Enter) jumps
 * to `#${mainId}` and shifts focus to the main element. Returns a teardown
 * function for callers that want to remove the listener.
 *
 * @param {HTMLElement} linkEl
 * @param {string} [mainId="main"]
 * @returns {() => void}
 */
export function bindSkipLink(linkEl, mainId) {
  if (!linkEl) return () => {};
  const targetId = mainId || "main";
  const handler = (e) => {
    const main = document.getElementById(targetId);
    if (!main) return;
    e.preventDefault();
    // Make the main element programmatically focusable if it isn't already.
    if (!main.hasAttribute("tabindex")) {
      main.setAttribute("tabindex", "-1");
    }
    main.focus();
    // Update the URL hash without an extra scroll jump.
    if (history && typeof history.pushState === "function") {
      history.pushState(null, "", "#" + targetId);
    } else {
      window.location.hash = targetId;
    }
  };
  linkEl.addEventListener("click", handler);
  return () => linkEl.removeEventListener("click", handler);
}
