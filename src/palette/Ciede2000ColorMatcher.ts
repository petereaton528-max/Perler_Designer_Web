import type { BeadGrid, BeadPalette } from '../core'
import type { ColorMatcher } from './ColorMatcher'
import { deltaE2000, rgbToLab } from './colorScience'

export class Ciede2000ColorMatcher implements ColorMatcher {
  async match(grid: BeadGrid, palette: BeadPalette): Promise<BeadGrid> {
    if (palette.colors.length === 0) throw new Error('所选拼豆色卡没有可用颜色。')
    const paletteLab = palette.colors.map((color) => rgbToLab(color.red, color.green, color.blue))
    const matchedColorIndices = new Int32Array(grid.originalArgb.length)
    for (let index = 0; index < grid.originalArgb.length; index += 1) {
      const argb = grid.originalArgb[index] ?? 0
      const pixelLab = rgbToLab((argb >>> 16) & 0xff, (argb >>> 8) & 0xff, argb & 0xff)
      let nearestIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY
      for (let colorIndex = 0; colorIndex < paletteLab.length; colorIndex += 1) {
        const distance = deltaE2000(pixelLab, paletteLab[colorIndex]!)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = colorIndex
        }
      }
      matchedColorIndices[index] = nearestIndex
      if (index > 0 && index % 4096 === 0) await yieldToBrowser()
    }
    return { ...grid, matchedColorIndices, colorTable: palette.colors }
  }
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}
