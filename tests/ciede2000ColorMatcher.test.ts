import { describe, expect, it } from 'vitest'
import type { BeadGrid } from '../src/core'
import {
  Ciede2000ColorMatcher,
  deltaE2000,
  mard291,
  rgbToLab,
  toBeadPaletteIfValid,
} from '../src/palette'

describe('RGB to CIELAB', () => {
  it('converts known sRGB colors using D65', () => {
    expect(rgbToLab(0, 0, 0)).toEqual({ l: 0, a: 0, b: 0 })
    const white = rgbToLab(255, 255, 255)
    expect(white.l).toBeCloseTo(100, 3)
    expect(white.a).toBeCloseTo(0, 2)
    expect(white.b).toBeCloseTo(0, 2)
    const red = rgbToLab(255, 0, 0)
    expect(red.l).toBeCloseTo(53.2408, 3)
    expect(red.a).toBeCloseTo(80.0925, 3)
    expect(red.b).toBeCloseTo(67.2032, 3)
  })
})

describe('CIEDE2000', () => {
  it('matches the Sharma reference pair and is symmetric', () => {
    const first = { l: 50, a: 2.6772, b: -79.7751 }
    const second = { l: 50, a: 0, b: -82.7485 }
    expect(deltaE2000(first, second)).toBeCloseTo(2.0425, 4)
    expect(deltaE2000(first, second)).toBeCloseTo(deltaE2000(second, first), 12)
  })

  it('returns zero for identical colors', () => {
    const color = rgbToLab(73, 121, 204)
    expect(deltaE2000(color, color)).toBe(0)
  })
})

describe('Ciede2000ColorMatcher', () => {
  it('matches an exact MARD color deterministically', async () => {
    const palette = toBeadPaletteIfValid(mard291)
    expect(palette).not.toBeNull()
    const expectedIndex = palette!.colors.findIndex((color) => color.code === 'A1')
    const color = palette!.colors[expectedIndex]!
    const argb = (0xff000000 | color.red << 16 | color.green << 8 | color.blue) >>> 0
    const grid: BeadGrid = {
      width: 2,
      height: 1,
      originalArgb: new Uint32Array([argb, argb]),
      matchedColorIndices: new Int32Array([-1, -1]),
      colorTable: [],
    }
    const result = await new Ciede2000ColorMatcher().match(grid, palette!)
    expect(Array.from(result.matchedColorIndices)).toEqual([expectedIndex, expectedIndex])
    expect(result.colorTable[expectedIndex]?.code).toBe('A1')
  })
})
