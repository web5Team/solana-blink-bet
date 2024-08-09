// Bun Runtime Only
import type { Buffer } from 'node:buffer'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

async function resizedSvgToSharp(p: string | Buffer, { width, height }: { width?: number, height?: number }) {
  const instance = sharp(p)

  const metadata = await instance.metadata()

  const initDensity = metadata.density ?? 72

  if (metadata.format !== 'svg') {
    return instance
  }

  let wDensity = 0
  let hDensity = 0
  if (width && metadata.width) {
    wDensity = (initDensity * width) / metadata.width
  }

  if (height && metadata.height) {
    hDensity = (initDensity * height) / metadata.height
  }

  if (!wDensity && !hDensity) {
    // both width & height are not present and/or
    // can't detect both metadata.width & metadata.height
    return instance
  }

  return sharp(p, { density: Math.max(wDensity, hDensity) }).resize(
    width,
    height,
  )
}

const iconSvgFile = join(import.meta.dirname, '../public/icon.svg')

const pwaIcon144 = await resizedSvgToSharp(iconSvgFile, {
  width: 144,
  height: 144,
})

const favicon = await resizedSvgToSharp(iconSvgFile, {
  width: 180,
  height: 180,
})

favicon.png().toFile(join(dirname(iconSvgFile), 'favicon.png'))

pwaIcon144.png().toFile(join(dirname(iconSvgFile), 'pwa-icon@144.png'))
