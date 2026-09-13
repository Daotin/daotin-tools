// 生成 PWA 图标：public/icons/*.png
// 图标只需生成一次并提交，所以 sharp 不进依赖，临时装了跑一次即可：
//   npm i --no-save sharp && node scripts/gen-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const BLUE = '#0087f3' // = DESIGN.md 的 blue solid oklch(0.62 0.19 252)
const OUT = new URL('../public/icons/', import.meta.url)

/** 四格图标（和首页站点图标一致的 LayoutGrid 造型），画在 512 画布上 */
function grid(scale) {
  const s = 512
  const cell = 150 * scale
  const gap = 28 * scale
  const total = cell * 2 + gap
  const x0 = (s - total) / 2
  const r = 30 * scale
  const rect = (x, y) =>
    `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${r}" fill="#fff"/>`
  return [
    rect(x0, x0),
    rect(x0 + cell + gap, x0),
    rect(x0, x0 + cell + gap),
    rect(x0 + cell + gap, x0 + cell + gap),
  ].join('')
}

const svg = (bg, scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${bg}${grid(scale)}</svg>`

const CIRCLE = `<circle cx="256" cy="256" r="256" fill="${BLUE}"/>`
const SQUARE = `<rect width="512" height="512" fill="${BLUE}"/>`

const files = [
  ['icon-192.png', svg(CIRCLE, 1), 192],
  ['icon-512.png', svg(CIRCLE, 1), 512],
  // maskable：内容收进安全区（约 60%），底色铺满整张，四角不能透明
  ['icon-512-maskable.png', svg(SQUARE, 0.62), 512],
  ['apple-touch-icon.png', svg(SQUARE, 1), 180],
]

mkdirSync(OUT, { recursive: true })
for (const [name, source, size] of files) {
  const png = await sharp(Buffer.from(source)).resize(size, size).png().toBuffer()
  writeFileSync(new URL(name, OUT), png)
  console.log('写入', name, size)
}
