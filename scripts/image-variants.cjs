#!/usr/bin/env node
// Writes resized WebP copies of the site's own JPEG photos next to the originals: <name>-640.webp, <name>-1280.webp.
// Runs during the build; pages fall back to the JPEG when a copy is missing. Usage: node scripts/image-variants.cjs [publicDir]
const fs = require('fs')
const path = require('path')
const root = path.resolve((require.main === module && process.argv[2]) || path.join(__dirname, '..', 'public'))
const WIDTHS = [640, 1280]
const files = []
for (const dir of [root, path.join(root, 'places')]) {
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir)) if (/\.jpe?g$/i.test(f)) files.push(path.join(dir, f))
}
async function generate() {
  let sharp
  try { sharp = require('sharp') } catch { console.log('image-variants: sharp not available, skipped'); return }
  sharp.concurrency(1)
  sharp.cache(false)
  let made = 0, bytesIn = 0, bytesOut = 0
  for (const file of files) {
    const base = file.replace(/\.jpe?g$/i, '')
    for (const w of WIDTHS) {
      const out = `${base}-${w}.webp`
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) continue
      await sharp(file).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72, effort: 4 }).toFile(out)
      made++; bytesOut += fs.statSync(out).size
    }
    bytesIn += fs.statSync(file).size
  }
  console.log(`image-variants: ${files.length} photos, ${made} WebP files written (${Math.round(bytesIn / 1024)} KB JPEG -> ${Math.round(bytesOut / 1024)} KB new WebP)`)
}

/** Photos (path without extension, as served) that have both WebP copies. */
function available() {
  return files.filter(f => WIDTHS.every(w => fs.existsSync(f.replace(/\.jpe?g$/i, `-${w}.webp`)))).map(f => '/' + path.relative(root, f).split(path.sep).join('/').replace(/\.jpe?g$/i, ''))
}

module.exports = { generate, available }
if (require.main === module) generate().catch(e => console.log('image-variants: failed,', e.message))
