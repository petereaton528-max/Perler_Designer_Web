import type { BeadGrid, BeadPalette } from '../core'
import type { ColorMatcher } from './ColorMatcher'

export class RgbColorMatcher implements ColorMatcher {
  async match(grid: BeadGrid, palette: BeadPalette): Promise<BeadGrid> {
    if (palette.colors.length === 0) throw new Error('所选拼豆色卡没有可用颜色。')
    const matchedColorIndices = new Int32Array(grid.originalArgb.length)
    for (let index = 0; index < grid.originalArgb.length; index += 1) {
      matchedColorIndices[index] = findNearestColorIndex(grid.originalArgb[index] ?? 0, palette)
      if (index > 0 && index % 4096 === 0) await yieldToBrowser()
    }
    return { ...grid, matchedColorIndices, colorTable: palette.colors }
  }
}

function findNearestColorIndex(argb: number, palette: BeadPalette): number {
  const red = (argb >>> 16) & 0xff
  const green = (argb >>> 8) & 0xff
  const blue = argb & 0xff
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  palette.colors.forEach((color, index) => {
    const redDelta = red - color.red
    const greenDelta = green - color.green
    const blueDelta = blue - color.blue
    const distance = redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })
  return nearestIndex
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}
