const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const publicDir = path.join(__dirname, '..', 'public')
const logos = ['seedbox-logo.png', 'seedbox-logo-black.png']

async function optimize() {
  for (const name of logos) {
    const src = path.join(publicDir, name)
    if (!fs.existsSync(src)) {
      console.warn('missing', src)
      continue
    }

    const base = path.parse(name).name

    // generate webp
    await sharp(src)
      .webp({ quality: 80 })
      .toFile(path.join(publicDir, `${base}.webp`))

    // generate avif
    await sharp(src)
      .avif({ quality: 60 })
      .toFile(path.join(publicDir, `${base}.avif`))

    // generate small variant for header
    await sharp(src)
      .resize({ width: 80 })
      .webp({ quality: 75 })
      .toFile(path.join(publicDir, `${base}-small.webp`))

    console.log('optimized', name)
  }
}

optimize().catch((err) => {
  console.error(err)
  process.exit(1)
})
