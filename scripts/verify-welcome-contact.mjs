// Browser-only verification. All FormSubmit requests are intercepted locally.
// No test brief leaves the browser and no email is sent by this script.
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[3] || 'playwright')
const browser = await chromium.connectOverCDP(process.argv[2])
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
const page = await context.newPage()
const results = []
const errors = []
const videoRequests = []
const submissions = []
const check = (name, condition) => { assert(condition, name); results.push(name); console.log(`PASS ${name}`) }
page.on('pageerror', error => errors.push(error.message))
page.on('request', request => { if (/intro.*\.(mp4|jpg)/.test(request.url())) videoRequests.push(request.url()) })
await context.route('https://formsubmit.co/**', async route => {
  submissions.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData() })
  await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Local interception</title><h1>Submission intercepted locally. No email sent.</h1>' })
})
await fs.mkdir('tmp/verification', { recursive: true })
const waitResolved = () => page.waitForFunction(() => !document.querySelector('.hero-cover .decrypt-text__glyph[data-state="scramble"]'))
try {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  check('No intro video or blocking welcome modal', await page.locator('video, .video-intro-overlay').count() === 0)
  check('Replay intro was removed', await page.getByRole('button', { name: 'Replay intro' }).count() === 0)
  check('Single welcome heading is accessible', await page.getByRole('heading', { level: 1, name: /Welcome to.*pearl panda\./ }).count() === 1)
  await waitResolved()
  check('Welcome decrypt animation resolves under StrictMode', await page.locator('.hero-welcome .decrypt-text__glyph').evaluateAll(cells => cells.every(cell => cell.textContent === cell.dataset.decryptChar)))
  await page.screenshot({ path: 'tmp/verification/welcome-desktop.png' })
  for (let index = 1; index <= 3; index++) {
    await page.getByRole('button', { name: new RegExp(`^Growth message ${index}:`) }).click()
    await waitResolved()
    check(`Growth message ${index} resolves cleanly`, await page.locator('.hero-growth-note .decrypt-text__glyph').evaluateAll(cells => cells.every(cell => cell.textContent === cell.dataset.decryptChar)))
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    check(`${width}px welcome has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await page.screenshot({ path: `tmp/verification/welcome-${width}.png` })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'networkidle' })
  check('Reduced motion makes welcome text immediately static', await page.locator('.hero-cover .decrypt-text').evaluateAll(elements => elements.every(element => element.dataset.motion === 'static')))
  check('Removed intro is never fetched', videoRequests.length === 0)

  await page.goto('http://127.0.0.1:5173/contact?service=Basic%20Portfolio', { waitUntil: 'networkidle' })
  const form = page.locator('.ip-brief-form')
  check('Form targets the requested Gmail via FormSubmit', await form.getAttribute('action') === 'https://formsubmit.co/chaitu4765@gmail.com')
  check('FormSubmit processing is disclosed', (await page.locator('#ip-delivery-note').innerText()).includes('FormSubmit'))
  check('Direct Gmail fallback is present', await page.getByRole('link', { name: 'chaitu4765@gmail.com' }).getAttribute('href') === 'mailto:chaitu4765@gmail.com')
  await page.getByRole('button', { name: 'Send project brief', exact: true }).click()
  check('Incomplete briefs cannot be submitted', submissions.length === 0)
  await page.getByRole('textbox', { name: 'Your name' }).fill('Local verification only')
  await page.getByRole('textbox', { name: 'Email address' }).fill('qa@example.com')
  await page.getByRole('textbox', { name: 'Business / brand name' }).fill('Example Brand')
  await page.getByRole('textbox', { name: 'A little about your project' }).fill('Local intercepted verification. This brief must not be emailed.')
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await page.reload({ waitUntil: 'networkidle' })
  check('Save draft stays local and restores data', submissions.length === 0 && await page.getByRole('textbox', { name: 'Your name' }).inputValue() === 'Local verification only')
  check('Consent is not stored with drafts', !(await page.getByRole('checkbox').isChecked()))
  await page.getByRole('button', { name: 'Send project brief', exact: true }).click()
  check('Sending requires explicit consent', submissions.length === 0)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download a copy', exact: true }).click()
  const download = await downloaded
  await download.saveAs('tmp/verification/gmail-brief-local-copy.txt')
  const brief = await fs.readFile('tmp/verification/gmail-brief-local-copy.txt', 'utf8')
  check('Download remains local and truthful', submissions.length === 0 && brief.includes('Downloading does not send a message'))
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Send project brief', exact: true }).click()
  await page.getByRole('heading', { name: 'Submission intercepted locally. No email sent.' }).waitFor()
  check('Only the deliberate Send action submits', submissions.length === 1 && submissions[0].method === 'POST')
  const data = new URLSearchParams(submissions[0].body)
  check('Brief fields and reply-to reach the intended handler', data.get('name') === 'Local verification only' && data.get('email') === 'qa@example.com' && data.get('_replyto') === 'qa@example.com' && data.get('service') === 'Basic Portfolio' && data.get('project').includes('must not be emailed'))
  check('Captcha is enabled and honeypot included', data.get('_captcha') !== 'false' && data.has('_honey') && data.get('_honey') === '')
  check('Subject, template and consent are included', data.get('_subject').includes('Pearl Panda') && data.get('_template') === 'table' && data.get('consent').includes('Agreed'))
  check('No uncaught browser errors', errors.length === 0)
  await fs.writeFile('tmp/verification/welcome-contact-results.json', JSON.stringify({ passed: results.length, results, errors, externalDeliveryVerified: false }, null, 2))
  console.log(`${results.length} welcome/contact checks passed. No email was sent.`)
} finally {
  await context.close()
  await browser.close()
}
