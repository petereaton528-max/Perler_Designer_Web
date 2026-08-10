import { describe, expect, it } from 'vitest'
import {
  PALETTE_SOURCES,
  artkalC26mm,
  artkalS5mm,
  mard291,
  toBeadPaletteIfValid,
  validateOfficialPalette,
} from '../src/palette'
import type { OfficialPaletteDefinition } from '../src/palette'

function definition(overrides: Partial<OfficialPaletteDefinition> = {}): OfficialPaletteDefinition {
  return {
    id: 'official-test',
    brandName: 'Official Brand',
    series: 'Series A',
    expectedColorCount: 2,
    sourcePage: 'https://official.example/chart',
    sourceRgbFile: 'https://official.example/rgb.pdf',
    colors: [
      { code: 'A01', name: '', red: 0, green: 128, blue: 255, brand: 'Official Brand', series: 'Series A', contributor: 'Tester' },
      { code: 'A02', name: 'White', red: 255, green: 255, blue: 255, brand: 'Official Brand', series: 'Series A', contributor: 'Tester' },
    ],
    ...overrides,
  }
}

describe('official palette integrity gate', () => {
  it('accepts only a complete palette and preserves empty official names', () => {
    const source = definition()
    expect(validateOfficialPalette(source)).toEqual({ valid: true, errors: [] })
    const palette = toBeadPaletteIfValid(source)
    expect(palette?.colors).toHaveLength(2)
    expect(palette?.colors[0]?.name).toBe('')
  })

  it('rejects count mismatches and duplicate codes', () => {
    const repeated = definition({
      colors: [definition().colors[0]!, { ...definition().colors[1]!, code: 'A01' }],
    })
    const result = validateOfficialPalette(repeated)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/重复/)
    expect(validateOfficialPalette(definition({ expectedColorCount: 3 })).valid).toBe(false)
  })

  it('rejects RGB values outside 0..255', () => {
    const invalid = definition({ colors: [{ ...definition().colors[0]!, blue: 273 }] })
    expect(validateOfficialPalette(invalid).errors.join(' ')).toMatch(/273.*0–255/)
  })

  it('keeps both currently incomplete Artkal charts unavailable to the UI', () => {
    expect(validateOfficialPalette(artkalS5mm).valid).toBe(false)
    expect(validateOfficialPalette(artkalC26mm).valid).toBe(false)
    expect(toBeadPaletteIfValid(artkalS5mm)).toBeNull()
    expect(toBeadPaletteIfValid(artkalC26mm)).toBeNull()
  })

  it('records only official Artkal source pages and RGB PDF links', () => {
    expect(PALETTE_SOURCES.artkalS5mm.expectedColors).toBe(225)
    expect(PALETTE_SOURCES.artkalC26mm.expectedColors).toBe(197)
    expect(PALETTE_SOURCES.artkalS5mm.rgbFile).toMatch(/^https:\/\/cdn\.shopify\.com\/.+\.pdf/)
    expect(PALETTE_SOURCES.artkalC26mm.rgbFile).toMatch(/^https:\/\/cdn\.shopify\.com\/.+\.pdf/)
  })

  it('imports all 291 MARD colors with unique valid codes and contributor attribution', () => {
    const result = validateOfficialPalette(mard291)
    expect(result).toEqual({ valid: true, errors: [] })
    expect(mard291.colors).toHaveLength(291)
    expect(new Set(mard291.colors.map((color) => color.code)).size).toBe(291)
    expect(new Set(mard291.colors.map((color) => color.contributor))).toEqual(new Set(['Asher']))
    const palette = toBeadPaletteIfValid(mard291)
    expect(palette?.brand.name).toBe('MARD')
    expect(palette?.colors).toHaveLength(291)
    expect(palette?.colors.every((color) => color.contributor === 'Asher')).toBe(true)
  })
})
