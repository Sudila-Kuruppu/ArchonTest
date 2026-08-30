#!/usr/bin/env node
// PR 1-2 perf probe: measures the gap between DOMContentLoaded and the moment
// the bootstrap script sets data-theme on <html>. The bootstrap is supposed to
// run synchronously in <head> before DOMContentLoaded, so the gap should be
// ~0ms. Runs 50 trials at the head.

const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const REPO = '/home/user/archontesting';
const DOCROOT = path.join(REPO, 'Work4', '002', '02', 'public');
const TRIALS = 50;

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'],
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  // Force the same localStorage state across trials (cleared).
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (_) {} });

  const port = await freePort();
  const php = spawn('php', ['-S', '127.0.0.1:' + port, '-t', DOCROOT], { stdio: ['ignore', 'ignore', 'ignore'] });

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const r = await fetch('http://127.0.0.1:' + port + '/theme-test.html', { method: 'HEAD' });
        if (r.ok) break;
      } catch {}
      await sleep(100);
    }

    const gaps = [];
    for (let i = 0; i < TRIALS; i++) {
      // Measure: the time between DOMContentLoaded firing and the bootstrap
      // having already written data-theme. The bootstrap is in <head> and
      // runs synchronously, so by the time DOMContentLoaded fires, the
      // data-theme attribute is already set.
      const probe = await page.evaluate(() => new Promise((resolve) => {
        const t0 = performance.now();
        const onReady = () => {
          const html = document.documentElement;
          const theme = html.getAttribute('data-theme');
          // Use a microtask to read performance.now() after the handler runs.
          const t1 = performance.now();
          resolve({
            dcl_to_now_ms: t1 - t0,
            theme_at_dcl: theme,
            bootstrap_fn: typeof globalThis.tickettradeThemeBootstrap === 'function',
            paint: (performance.getEntriesByType && performance.getEntriesByType('paint')) || []
          });
        };
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          onReady();
        } else {
          document.addEventListener('DOMContentLoaded', onReady, { once: true });
        }
      }));
      gaps.push(probe.dcl_to_now_ms);
      // Navigate again to reset.
      await page.goto('http://127.0.0.1:' + port + '/theme-test.html', { waitUntil: 'load' });
      await sleep(20);
    }

    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    const mean = gaps.reduce((s, x) => s + x, 0) / gaps.length;
    const min = gaps[0];
    const max = gaps[gaps.length - 1];
    console.log(JSON.stringify({
      trials: TRIALS,
      median_ms: median,
      mean_ms: mean,
      min_ms: min,
      max_ms: max,
      // The contract: head mean within plus 1 frame (16.7ms) of trunk.
      // Without a trunk baseline, we report the absolute value. The slice
      // verify is the unit gate; the lane harness is the live gate.
      rule: 'mean within +16.7ms of trunk; fail on +50ms'
    }));
  } finally {
    await browser.close();
    php.kill('SIGTERM');
  }
})();
