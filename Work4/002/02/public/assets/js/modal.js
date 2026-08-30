/*
 * public/assets/js/modal.js
 *
 * Modal open/close API. ES module. Exports:
 *
 *   openModal(rootEl, options) -> true on open, false on nested-blocked,
 *                                 throws TypeError on invalid role/aria-modal
 *   closeModal(rootEl)         -> closes the modal, restores focus
 *   isOpen(rootEl)             -> boolean
 *
 * Options:
 *   trigger:HTMLElement        -- the element to return focus to on close
 *   scrimGuardMs:number=0      -- suppress scrim-click close for N ms
 *
 * Validation: rootEl MUST have role="dialog" AND aria-modal="true" AND
 * aria-labelledby="<id>" pointing to an element that exists inside rootEl.
 * Missing any of the three throws TypeError before any DOM mutation.
 *
 * Scroll lock: counter-based so nested opens cannot double-lock.
 * Focus trap: delegated to a11y.js (trapFocus + releaseFocus).
 */

import { trapFocus, releaseFocus } from "./a11y.js";

const OPEN_STACK = [];
const SCROLL_LOCK_COUNT_KEY = "__formModalScrollLockCount";
const FOCUS_TRAP_KEY = "__formModalFocusTrap";

function getScrollLockCount() {
  if (typeof document === "undefined") return 0;
  const body = document.body;
  return body ? Number(body.dataset[SCROLL_LOCK_COUNT_KEY] || "0") : 0;
}

function setScrollLockCount(n) {
  const body = document.body;
  if (!body) return;
  body.dataset[SCROLL_LOCK_COUNT_KEY] = String(n);
}

function lockBodyScroll() {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (!body) return;
  const n = getScrollLockCount();
  if (n === 0) {
    body.dataset.__formModalPreviousOverflow = body.style.overflow || "";
    body.style.overflow = "hidden";
  }
  setScrollLockCount(n + 1);
}

function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (!body) return;
  const n = getScrollLockCount();
  if (n <= 0) return;
  const next = n - 1;
  setScrollLockCount(next);
  if (next === 0) {
    body.style.overflow = body.dataset.__formModalPreviousOverflow || "";
    delete body.dataset.__formModalPreviousOverflow;
  }
}

/**
 * Validate that an element is wired for the modal role. Throws TypeError if
 * not, before any DOM mutation. Checks role=dialog, aria-modal=true, and
 * aria-labelledby pointing to an in-root element.
 */
function validateModalElement(rootEl) {
  if (!rootEl) {
    throw new TypeError("openModal: rootEl is required");
  }
  if (rootEl.getAttribute("role") !== "dialog") {
    throw new TypeError('openModal: element must have role="dialog"');
  }
  if (rootEl.getAttribute("aria-modal") !== "true") {
    throw new TypeError('openModal: element must have aria-modal="true"');
  }
  const labelledBy = rootEl.getAttribute("aria-labelledby");
  if (!labelledBy) {
    throw new TypeError('openModal: element must have aria-labelledby="<title-id>"');
  }
  const titleEl = rootEl.querySelector("#" + CSS.escape(labelledBy));
  if (!titleEl) {
    throw new TypeError(
      'openModal: aria-labelledby="' + labelledBy + '" does not resolve to an element inside rootEl'
    );
  }
}

const TRIGGER_MAP = new WeakMap();

/**
 * Open a modal. Returns true on success, false if a modal is already open
 * (nested opens are blocked per the 1.3 contract), throws TypeError on
 * invalid role/aria-modal/aria-labelledby.
 *
 * @param {HTMLElement} rootEl
 * @param {{ trigger?: HTMLElement, scrimGuardMs?: number }} options
 */
export function openModal(rootEl, options) {
  validateModalElement(rootEl);
  const opts = options || {};
  // Nested-open guard: refuse if any modal is open and this root is not
  // already the top of the stack (allow re-opening the same root).
  if (OPEN_STACK.length > 0 && OPEN_STACK[OPEN_STACK.length - 1] !== rootEl) {
    console.warn("nested modal blocked");
    return false;
  }
  if (OPEN_STACK[OPEN_STACK.length - 1] === rootEl) {
    // Already open; treat as no-op.
    return true;
  }

  rootEl.removeAttribute("hidden");
  rootEl.dataset.__formModalScrimGuardMs = String(opts.scrimGuardMs || 0);
  rootEl.dataset.__formModalOpenedAt = String(Date.now());
  rootEl.dataset.__formModalTrigger = opts.trigger ? "1" : "0";
  // Stash trigger on a side map so closeModal can restore focus.
  if (opts.trigger) {
    TRIGGER_MAP.set(rootEl, opts.trigger);
  }

  OPEN_STACK.push(rootEl);
  lockBodyScroll();

  const teardown = trapFocus(rootEl);
  rootEl.dataset[FOCUS_TRAP_KEY] = "1";
  rootEl.__formModalTrapTeardown = teardown;

  // ESC + X-close + scrim-click handler attached per modal.
  const onKey = (e) => {
    if (e.key === "Escape") {
      closeModal(rootEl);
    }
  };
  rootEl.addEventListener("keydown", onKey);
  rootEl.dataset.__formModalHasKeyHandler = "1";

  const onScrimClick = (e) => {
    // Only close if the click target IS the scrim (not a descendant).
    if (e.target !== rootEl && !e.target.classList.contains("modal-scrim") && !e.target.classList.contains("form-modal-scrim")) {
      return;
    }
    const openedAt = Number(rootEl.dataset.__formModalOpenedAt || "0");
    const guardMs = Number(rootEl.dataset.__formModalScrimGuardMs || "0");
    if (Date.now() - openedAt < guardMs) {
      return; // suppressed
    }
    closeModal(rootEl);
  };
  rootEl.addEventListener("click", onScrimClick);
  rootEl.dataset.__formModalHasScrimHandler = "1";

  // Wire X-close buttons inside the modal.
  rootEl.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal(rootEl);
    });
  });

  return true;
}

/**
 * Close a modal. Removes it from the open stack, releases the focus trap,
 * restores focus to the trigger, and unlocks body scroll.
 */
export function closeModal(rootEl) {
  if (!rootEl) return;
  const idx = OPEN_STACK.indexOf(rootEl);
  if (idx === -1) return;
  OPEN_STACK.splice(idx, 1);
  rootEl.setAttribute("hidden", "");
  delete rootEl.dataset.__formModalOpenedAt;
  delete rootEl.dataset.__formModalScrimGuardMs;
  delete rootEl.dataset.__formModalTrigger;

  const trigger = TRIGGER_MAP.get(rootEl);
  TRIGGER_MAP.delete(rootEl);
  releaseFocus(rootEl, trigger);
  unlockBodyScroll();
}

/** Is this modal currently open? */
export function isOpen(rootEl) {
  if (!rootEl) return false;
  return OPEN_STACK.indexOf(rootEl) !== -1;
}
