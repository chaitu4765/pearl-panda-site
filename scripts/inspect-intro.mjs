import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[3])
const browser = await chromium.connectOverCDP(process.argv[2])
const context = await browser.newContext({ viewport: { width: 1280, height: 760 } })
const page = await context.newPage()
await fs.mkdir('tmp/video', { recursive: true })
try {
  const files = await fs.readdir('.')
  const filename = files.find(f => f.endsWith('.mp4'))
  await page.goto(`http://127.0.0.1:5173/${encodeURIComponent(filename)}`)
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2)
  const info = await page.locator('video').evaluate(v => { v.pause(); v.muted = true; return { duration: v.duration, width: v.videoWidth, height: v.videoHeight } })
  console.log(JSON.stringify(info))
  for (const fraction of [0.65, 0.72, 0.8, 0.95]) {
    const time = fraction * info.duration
    await page.locator('video').evaluate((v, time) => new Promise(resolve => { v.addEventListener('seeked', resolve, { once: true }); v.currentTime = time }), time)
    await page.locator('video').screenshot({ path: `tmp/video/source-${Math.round(fraction * 100)}.png` })
  }
} finally { await context.close(); await browser.close() }
