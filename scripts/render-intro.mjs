import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ffmpeg = require('ffmpeg-static')
const source = fs.readdirSync('.').find(name => name.startsWith('Generating_digital_project_video') && name.endsWith('.mp4'))
if (!source) throw new Error('The original supplied intro video is missing.')
const output = path.resolve('public/media')
fs.mkdirSync(output, { recursive: true })
const video = path.join(output, 'pearl-panda-intro.mp4')
const grade = 'scale=1280:720:flags=lanczos,setsar=1,eq=saturation=0.70:contrast=0.97:brightness=0.025:gamma=1.025,colorbalance=rm=0.012:gm=0.02:bm=-0.025:rh=0.022:gh=0.028:bh=-0.032'
const filter = [
  `[0:v]split=2[a][b]`,
  `[a]trim=start=5.55:end=7.50,setpts=PTS-STARTPTS,${grade}[panda]`,
  `[b]trim=start=8.65:end=9.95,setpts=PTS-STARTPTS,${grade}[logo]`,
  '[panda][logo]xfade=transition=fade:duration=0.6:offset=1.35,tpad=stop_mode=clone:stop_duration=1.45,fade=t=in:st=0:d=0.32:color=0xf5f7ee,fade=t=out:st=3.75:d=0.35:color=0xf5f7ee,format=yuv420p[out]',
].join(';')
const result = spawnSync(ffmpeg, ['-hide_banner', '-y', '-i', source, '-filter_complex', filter, '-map', '[out]', '-an', '-t', '4.1', '-r', '24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-movflags', '+faststart', video], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status || 1)
const poster = spawnSync(ffmpeg, ['-hide_banner', '-y', '-ss', '3.2', '-i', video, '-frames:v', '1', '-q:v', '3', path.join(output, 'pearl-panda-intro-poster.jpg')], { stdio: 'inherit' })
if (poster.status !== 0) process.exit(poster.status || 1)
console.log(`Edited intro: ${video} (${Math.round(fs.statSync(video).size / 1024)} KB)`)
