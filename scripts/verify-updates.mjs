// node scripts/verify-updates.mjs <cdp-url> <path-to-playwright-package>
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[3] || 'playwright')
const browser = await chromium.connectOverCDP(process.argv[2])
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
await context.addInitScript(() => sessionStorage.setItem('pearl-panda-intro-v1', 'seen'))
const page = await context.newPage()
const errors = []
const results = []
const check = (name, value) => { assert(value, name); results.push(name); console.log(`PASS ${name}`) }
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
await fs.mkdir('tmp/verification', { recursive: true })
const scrollPhase = async (scene, fraction) => {
  await page.evaluate(({ scene, fraction }) => {
    const root = document.querySelector('.specimen')
    const stage = document.querySelector('.specimen-stage')
    const offset = parseFloat(getComputedStyle(stage).top) || 0
    const progress = (scene + .17 + .66 * fraction) / 5
    const position = scrollY + root.getBoundingClientRect().top - offset + progress * (root.offsetHeight - stage.clientHeight)
    window.scrollTo({ top: position, behavior: 'instant' })
  }, { scene, fraction })
  // Wait for the scroll follower to settle, not the perpetual idle sculpture animation.
  await page.waitForFunction(({ expected }) => {
    const stage = document.querySelector('.specimen-stage')
    return Math.abs(Number(stage.style.getPropertyValue('--scene-progress')) * 5 - expected) < .006
  }, { expected: scene + fraction })
  return page.locator('.panda-object').evaluate(el => ({
    atoms: Number(el.dataset.atomization), phase: el.dataset.transferPhase,
    left: parseFloat(el.style.left), top: parseFloat(el.style.top),
  }))
}
try {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await page.locator('canvas').waitFor({ state: 'visible' })
  for (const [scene, from, to] of [[0, 73, 27], [1, 27, 73], [2, 73, 27], [3, 27, 73], [4, 73, 27]]) {
    let state = await scrollPhase(scene, .11)
    // Physical scroll positions round to CSS pixels; assert the actual phase,
    // not an exact half-dissolve value that sub-pixel rounding can shift.
    check(`Transition ${scene}: dissolves before moving`, state.phase === 'dissolving' && state.atoms > .25 && state.atoms < .75 && Math.abs(state.left - from) < .1)
    await page.screenshot({ path: `tmp/verification/atoms-${scene}-dissolve.png` })
    state = await scrollPhase(scene, .5)
    check(`Transition ${scene}: only particles cross the page`, state.phase === 'travelling' && state.atoms === 1 && Math.abs(state.left - (from + to) / 2) < 2)
    await page.screenshot({ path: `tmp/verification/atoms-${scene}-travel.png` })
    state = await scrollPhase(scene, .80)
    const arrivedScroll = await page.evaluate(() => scrollY)
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.atomization === '0.0000', null, { timeout: 1500 })
    check(`Transition ${scene}: automatically rebuilds immediately on arrival without more scroll`, state.phase === 'assembling' && state.atoms === 0 && Math.abs(state.left - to) < .1 && await page.evaluate(() => scrollY) === arrivedScroll)
    await page.screenshot({ path: `tmp/verification/atoms-${scene}-assemble.png` })
    state = await scrollPhase(scene, 1)
    check(`Transition ${scene}: arrives fully assembled`, state.atoms < .001 && Math.abs(state.left - to) < .1)
    await page.screenshot({ path: `tmp/verification/atoms-${scene}-solid.png` })
    state = await scrollPhase(scene, .5)
    check(`Transition ${scene}: reverses as particles`, state.atoms === 1 && Math.abs(state.left - (from + to) / 2) < 2)
    state = await scrollPhase(scene, .20)
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.atomization === '0.0000', null, { timeout: 1500 })
    check(`Transition ${scene}: reverse arrival also rebuilds without more scroll`, state.atoms === 0 && Math.abs(state.left - from) < .1)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await scrollPhase(1, .5)
  check('Mobile retains particles during a smaller side-to-side crossing', mobile.atoms === 1 && Math.abs(mobile.left - 50) < .5)
  check('Mobile hero has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  await page.screenshot({ path: 'tmp/verification/atoms-mobile.png' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForFunction(() => document.querySelector('.specimen').dataset.reduced === 'true')
  check('Reduced motion preserves a solid panda', await page.locator('.panda-object').getAttribute('data-atomization') === '0.0000')
  check('Reduced motion removes scroll runway', await page.locator('.specimen').evaluate(el => el.offsetHeight <= innerHeight + 30))
  check('No uncaught or WebGL shader errors', errors.length === 0)
  await fs.writeFile('tmp/verification/updates-results.json', JSON.stringify({ passed: results.length, results, errors }, null, 2))
  console.log(`${results.length} update checks passed.`)
} finally {
  await context.close()
  await browser.close()
}
