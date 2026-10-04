// Run against an already running test browser:
// node scripts/verify-browser.mjs <cdp-url> <path-to-playwright-package>
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[3] || 'playwright')
const browser = await chromium.connectOverCDP(process.argv[2])
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const output = path.resolve('tmp/verification')
await fs.mkdir(output, { recursive: true })
const base = 'http://127.0.0.1:5173'
const results = []
const check = (name, condition) => { assert(condition, name); results.push(name); console.log(`PASS ${name}`) }

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    for (const route of ['/', '/services', '/industries', '/about', '/work', '/contact']) {
      await page.goto(base + route, { waitUntil: 'networkidle' })
      await page.locator('h1').waitFor({ state: 'visible' })
      check(`${viewport.width}px ${route} has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      check(`${viewport.width}px ${route} has no error overlay`, await page.locator('vite-error-overlay').count() === 0)
      check(`${viewport.width}px ${route} has one h1`, await page.locator('h1').count() === 1)
      if (route === '/') {
        await page.locator('canvas').waitFor({ state: 'visible' })
        check(`${viewport.width}px 3D canvas renders`, await page.locator('canvas').evaluate(canvas => canvas.width > 0 && canvas.height > 0))
      }
      await page.screenshot({ path: path.join(output, `${viewport.width}-${route === '/' ? 'home' : route.slice(1)}.png`) })
    }
  }
  await page.goto(base + '/contact?service=Basic%20Portfolio', { waitUntil: 'networkidle' })
  check('Service links prefill the enquiry form', await page.getByRole('combobox').inputValue() === 'Basic Portfolio')
  await page.getByRole('textbox', { name: 'Your name' }).fill('Pearl Panda QA')
  await page.getByRole('textbox', { name: 'Email address' }).fill('qa@example.com')
  await page.getByRole('textbox', { name: 'Business / brand name' }).fill('Sample Café')
  await page.getByRole('textbox', { name: 'A little about your project' }).fill('A responsive café website with menu and enquiry pages.')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await page.reload({ waitUntil: 'networkidle' })
  check('Saved brief restores on reload', await page.getByRole('textbox', { name: 'Your name' }).inputValue() === 'Pearl Panda QA')
  check('Consent is not persisted', !(await page.getByRole('checkbox').isChecked()))
  await page.getByRole('checkbox').check()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download a copy', exact: true }).click()
  const download = await downloadPromise
  await download.saveAs(path.join(output, 'verified-project-brief.txt'))
  const brief = await fs.readFile(path.join(output, 'verified-project-brief.txt'), 'utf8')
  check('Downloaded brief contains entered data and truthful delivery status', brief.includes('Pearl Panda QA') && brief.includes('Downloading does not send'))
  await page.getByRole('button', { name: 'Remove saved draft' }).click()
  await page.reload({ waitUntil: 'networkidle' })
  check('Saved draft can be removed', await page.getByRole('textbox', { name: 'Your name' }).inputValue() === '')

  await page.goto(base + '/work', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Social', exact: true }).click()
  check('Social filter shows one matching concept', await page.locator('.ip-work-card').count() === 1)
  await page.getByRole('button', { name: 'View After Hours concept' }).click()
  check('Concept dialog opens', await page.getByRole('dialog').isVisible())
  await page.keyboard.press('Escape')
  check('Escape closes concept dialog', !(await page.getByRole('dialog').isVisible()))
  await page.getByRole('button', { name: 'Open menu' }).click()
  check('Mobile menu opens', await page.getByRole('navigation', { name: 'Main navigation' }).isVisible())
  await page.keyboard.press('Escape')
  check('Escape closes mobile menu', !(await page.getByRole('navigation', { name: 'Main navigation' }).isVisible()))

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle' })
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: new RegExp(`Scene ${i + 1}:`) }).click()
    await page.waitForFunction(index => document.querySelector(`[data-scene="${index}"]`)?.getAttribute('aria-hidden') === 'false', i)
    check(`Hero scene ${i + 1} activates`, await page.locator(`[data-scene="${i}"]`).getAttribute('aria-hidden') === 'false')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(base, { waitUntil: 'networkidle' })
  check('Reduced motion removes the sticky scroll runway', await page.locator('.specimen').evaluate(el => el.offsetHeight <= innerHeight + 30))
  await page.screenshot({ path: path.join(output, 'home-reduced-full.png'), fullPage: true })
  await page.setViewportSize({ width: 320, height: 740 })
  for (const route of ['/', '/services', '/industries', '/about', '/work', '/contact']) {
    await page.goto(base + route, { waitUntil: 'networkidle' })
    check(`320px ${route} has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  }
  check('No uncaught browser errors', errors.length === 0)
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed: results.length, checks: results, errors }, null, 2))
  console.log(`\n${results.length} browser checks passed.`)
} finally {
  await context.close()
  await browser.close()
}
