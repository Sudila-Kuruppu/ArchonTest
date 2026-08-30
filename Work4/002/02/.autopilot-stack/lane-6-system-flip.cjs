#!/usr/bin/env node
// Live-lane harness extension for PR 1-2 lane 6.
// Boots a PHP server, opens theme-test.html with stored=system and OS=dark,
// then flips the OS preference to light and asserts data-theme follows
// within one animation frame. Saves screenshot to /tmp/swarm-1-2/worker-6/.
//
// Usage: node lane-6-system-flip.mjs

const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const REPO = '/home/user/archontesting';
const DOCROOT = path.join(REPO, 'Work4', '002', '02', 'public');
const OUT_DIR = '/tmp/swarm-1-2/worker-6';
const SLUG = 'theme-system-live';
const SCREENSHOT = path.join(OUT_DIR, SLUG + '.png');

fs.mkdirSync(OUT_DIR, { recursive: true });

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
  await page.evaluateOnNewDocument((seed) => {
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
  }, { 'tickettrade.theme': 'system' });
  await page.evaluateOnNewDocument(() => {
    window.matchMedia = (q) => ({
      matches: q.includes('dark'), media: q,
      onchange: null, addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false
    });
  });

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

    await page.goto('http://127.0.0.1:' + port + '/theme-test.html', { waitUntil: 'networkidle0' });
    await sleep(500);

    const before = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('tickettrade.theme')
    }));

    // Flip OS preference to light and re-resolve.
    await page.evaluate((q) => {
      window.matchMedia = (q2) => ({
        matches: q2.includes(q), media: q2,
        onchange: null, addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false
      });
    }, 'light');
    await page.evaluate(() => { window.TicketTradeTheme.applyTheme('system'); });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));

    const after = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('tickettrade.theme')
    }));

    await page.screenshot({ path: SCREENSHOT, fullPage: false });

    const ok = before.theme === 'dark' && after.theme === 'light';
    if (ok) {
      console.log('PASS pr=1-2 lane=6 slug=' + SLUG + ' screenshot=' + SCREENSHOT);
      console.log(JSON.stringify({ before, after }));
      process.exit(0);
    } else {
      console.error('FAIL pr=1-2 lane=6 slug=' + SLUG + ' screenshot=' + SCREENSHOT);
      console.error('  - before: ' + JSON.stringify(before));
      console.error('  - after:  ' + JSON.stringify(after));
      process.exit(1);
    }
  } catch (e) {
    console.error('FAIL pr=1-2 lane=6 exception: ' + e.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    php.kill('SIGTERM');
  }
})();
