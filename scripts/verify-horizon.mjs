// node scripts/verify-horizon.mjs <cdp-url> <path-to-playwright-package>
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[3] || 'playwright')
const browser = await chromium.connectOverCDP(process.argv[2])
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
const results = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
const check = (name, value) => { assert(value, name); results.push(name); console.log(`PASS ${name}`) }
const base = 'http://127.0.0.1:5173'
await fs.mkdir('tmp/verification/horizon', { recursive: true })
const rest = async index => {
  await page.getByRole('button', { name: new RegExp(`^Scene ${index + 1}:`) }).click()
  await page.waitForFunction(expected => Math.abs(Number(document.querySelector('.horizon-stage')?.getAttribute('data-progress')) - expected) < .001, index / 5)
}
try {
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.horizon-world canvas').waitFor({ state: 'visible' })
  check('Horizon replaces the prior hero and video', await page.locator('.horizon-hero').count() === 1 && await page.locator('.specimen,video').count() === 0)
  check('A single canvas renders the entire scene', await page.locator('canvas').count() === 1 && await page.locator('canvas').evaluate(el => el.width > 0 && el.height > 0))
  check('One accessible primary welcome heading', await page.getByRole('heading', { level: 1, name: /Welcome to.*pearl panda\./ }).count() === 1)
  await page.waitForFunction(() => [...document.querySelectorAll('.horizon-title-char')].every(el => Number(getComputedStyle(el).opacity) > .99))
  await page.screenshot({ path: 'tmp/verification/horizon/desktop-opening.png' })
  for (let index = 0; index < 6; index++) {
    await rest(index)
    check(`Chapter ${index + 1} reaches its complete readable pose`, await page.locator(`[data-chapter="${index}"].horizon-panel`).evaluate(el => Number(el.style.opacity) > .99 && el.getAttribute('aria-hidden') === 'false'))
    check(`Chapter ${index + 1} is the only keyboard-accessible panel`, await page.locator('.horizon-panel:not([inert])').count() === 1)
    await page.screenshot({ path: `tmp/verification/horizon/chapter-${index + 1}.png` })
  }
  for (const index of [4, 2, 0]) {
    await rest(index)
    check(`Reverse scroll returns cleanly to chapter ${index + 1}`, await page.locator('.horizon-stage').getAttribute('data-chapter') === String(index))
  }
  await page.getByRole('button', { name: 'Pause ambient motion' }).click()
  check('Ambient motion has an accessible pause control', await page.getByRole('button', { name: 'Resume ambient motion' }).getAttribute('aria-pressed') === 'true')
  await rest(1)
  check('Manual chapter navigation still works while paused', await page.locator('.horizon-stage').getAttribute('data-chapter') === '1')
  await page.getByRole('button', { name: 'Resume ambient motion' }).click()
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    await page.reload({ waitUntil: 'networkidle' })
    await rest(0)
    check(`${viewport.width}x${viewport.height} has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    check(`${viewport.width}x${viewport.height} has a visible welcome and CTA`, await page.locator('[data-chapter="0"].horizon-panel').isVisible() && await page.getByRole('link', { name: 'Let’s grow together', exact: true }).isVisible())
    await page.screenshot({ path: `tmp/verification/horizon/${viewport.width}-opening.png` })
    if (viewport.width === 390) { await rest(5); await page.screenshot({ path: 'tmp/verification/horizon/390-ending.png' }) }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await rest(3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForFunction(() => document.querySelector('.horizon-hero')?.getAttribute('data-reduced') === 'true')
  check('Reduced motion parks the journey at a readable welcome', await page.locator('.horizon-stage').getAttribute('data-progress') === '0.0000')
  check('Reduced motion removes the scroll runway', await page.locator('.horizon-hero').evaluate(el => el.offsetHeight <= innerHeight + 20))
  await page.getByRole('link', { name: 'Let’s grow together', exact: true }).click()
  check('Hero CTA reaches the existing contact form', await page.locator('.ip-brief-form').getAttribute('action') === 'https://formsubmit.co/chaitu4765@gmail.com')
  await page.getByRole('navigation', { name: 'Main navigation' }).count()
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto(base, { waitUntil: 'networkidle' })
    check(`Remount ${attempt + 1} creates only one canvas`, await page.locator('canvas').count() === 1)
    await page.goto(`${base}/about`, { waitUntil: 'networkidle' })
  }
  check('No browser or WebGL shader errors', errors.length === 0)
  await fs.writeFile('tmp/verification/horizon/results.json', JSON.stringify({ passed: results.length, results, errors }, null, 2))
  console.log(`${results.length} Horizon checks passed.`)
} finally {
  await context.close()
  await browser.close()
}
