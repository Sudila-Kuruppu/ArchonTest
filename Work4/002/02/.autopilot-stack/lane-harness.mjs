#!/usr/bin/env node
// Live-lane harness for epic-1 plan autopilot-stack run.
// Boots `php -S` on a free port against /public, drives headless Chromium
// via puppeteer-core, optionally runs @axe-core/puppeteer, saves a screenshot,
// prints one PASS/FAIL line, and exits with the lane's pass predicate.
//
// Usage:  node lane-harness.mjs --pr 1-1 --lane 1 --page theme-test.html --slug theme-tokens-light
//         [--viewport 1280x800] [--theme dark] [--emulate-mq prefers-reduced-motion:reduce]
//         [--emulate-media-color-scheme dark] [--local-storage '{"tickettrade.theme":"dark"}']
//         [--js false] [--assert-css "selector|prop|value|op"] ...
//         [--assert-attr "selector|attr|value"] ...
//         [--assert-js "document.querySelector(...) == ..."] ...
//         [--run-axe] [--out-dir /tmp/swarm-1-1/worker-1]

import puppeteer from "puppeteer-core";
import { AxePuppeteer } from "@axe-core/puppeteer";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const REPO = "/home/user/archontesting";
const DOCROOT = path.join(REPO, "Work4", "002", "02", "public");

if (!args.pr || !args.lane || !args.page || !args.slug) {
  console.error("FAIL: --pr --lane --page --slug are required");
  process.exit(2);
}

const outDir = args["out-dir"] || `/tmp/swarm-${args.pr}/worker-${args.lane}`;
fs.mkdirSync(outDir, { recursive: true });
const screenshot = path.join(outDir, `${args.slug}.png`);

const port = await freePort();
const php = spawn("php", ["-S", `127.0.0.1:${port}`, "-t", DOCROOT], {
  stdio: ["ignore", "ignore", "ignore"],
});
const url = `http://127.0.0.1:${port}/${args.page}`;

for (let i = 0; i < 30; i++) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (r.ok) break;
  } catch {}
  await sleep(100);
}

let browser;
try {
  browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--headless=new"],
    headless: true,
  });
  const page = await browser.newPage();

  const [vw, vh] = (args.viewport || "1280x800").split("x").map(Number);
  await page.setViewport({ width: vw, height: vh });

  if (args.js === "false") {
    page.setJavaScriptEnabled(false);
  }

  if (args["local-storage"]) {
    await page.evaluateOnNewDocument((seed) => {
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
    }, JSON.parse(args["local-storage"]));
  }
  if (args["matchmedia-overrides"]) {
    await page.evaluateOnNewDocument((seed) => {
      const stub = (q) => ({
        matches: Object.prototype.hasOwnProperty.call(seed, q) ? !!seed[q] : false,
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      });
      window.matchMedia = stub;
    }, JSON.parse(args["matchmedia-overrides"]));
  }

  if (args["emulate-mq"]) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  if (args["emulate-media-color-scheme"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: args["emulate-media-color-scheme"] }]);
  }

  if (args["matchmedia-flip-after"]) {
    // Format: "<ms>|<JSON overrides>". Re-stubs window.matchMedia after
    // the given delay so a stored=system page reacts to the flip.
    const [delayStr, overridesJson] = args["matchmedia-flip-after"].split("|");
    const delay = parseInt(delayStr, 10) || 100;
    const overrides = JSON.parse(overridesJson);
    setTimeout(async () => {
      try {
        await page.evaluate((seed) => {
          const stub = (q) => ({
            matches: Object.prototype.hasOwnProperty.call(seed, q) ? !!seed[q] : false,
            media: q,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false
          });
          window.matchMedia = stub;
        }, overrides);
      } catch (_e) {}
    }, delay);
  }

  await page.goto(url, { waitUntil: args["wait-until"] || "networkidle0", timeout: 15000 });

  if (args.theme) {
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), args.theme);
    await sleep(150);
  }

  const failures = [];
  for (const a of args["assert-css"] || []) {
    const [sel, prop, val, op] = a.split("|");
    const got = await page.evaluate((s, p) => {
      const el = document.querySelector(s);
      if (!el) return "";
      return getComputedStyle(el).getPropertyValue(p).trim();
    }, sel, prop);
    const expected = op === "contains" ? got.includes(val) : got === val;
    if (!expected) failures.push(`css: ${sel} ${prop} expected ${op || "=="} ${val}, got ${got}`);
  }
  for (const a of args["assert-attr"] || []) {
    const [sel, attr, val] = a.split("|");
    const got = await page.evaluate((s, a) => document.querySelector(s)?.getAttribute(a), sel, attr);
    if (got !== val) failures.push(`attr: ${sel}[${attr}] expected ${val}, got ${got}`);
  }
  for (const a of args["assert-js"] || []) {
    const got = await page.evaluate((expr) => { return eval(expr); }, a);
    if (got !== true) failures.push(`js: ${a} returned ${JSON.stringify(got)}`);
  }

  let axeCount = 0;
  if (args["run-axe"] === "true") {
    const results = await new AxePuppeteer(page).analyze();
    axeCount = results.violations.length;
    if (axeCount > 0 && args["axe-allow"] !== "true") {
      failures.push(`axe: ${axeCount} violations`);
      for (const v of results.violations.slice(0, 5)) failures.push(`  - ${v.id} ${v.impact} ${v.nodes.length} nodes`);
    }
  }

  await page.screenshot({ path: screenshot, fullPage: false });

  if (failures.length === 0) {
    console.log(`PASS pr=${args.pr} lane=${args.lane} slug=${args.slug} screenshot=${screenshot} axe=${axeCount}`);
    process.exit(0);
  } else {
    console.error(`FAIL pr=${args.pr} lane=${args.lane} slug=${args.slug} screenshot=${screenshot}`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
} catch (e) {
  console.error(`FAIL pr=${args.pr} lane=${args.lane} exception: ${e.message}`);
  process.exit(1);
} finally {
  if (browser) await browser.close();
  php.kill("SIGTERM");
}

async function freePort() {
  const net = await import("node:net");
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
    s.on("error", reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function parseArgs(argv) {
  const out = {};
  const multi = { "assert-css": 1, "assert-attr": 1, "assert-js": 1 };
  let i = 0;
  while (i < argv.length) {
    const k = argv[i];
    if (k.startsWith("--")) {
      const key = k.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) {
        out[key] = "true";
        i++;
      } else if (multi[key]) {
        out[key] = out[key] || [];
        out[key].push(val);
        i += 2;
      } else {
        out[key] = val;
        i += 2;
      }
    } else i++;
  }
  return out;
}
