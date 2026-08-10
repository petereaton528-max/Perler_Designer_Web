import type { BeadBrand, BeadColor, BeadPalette } from '../core'
import type { PaletteColorDatabase } from './PaletteColorDatabase'
import { artkalC26mm, artkalS5mm, mard291, toBeadPaletteIfValid } from './data'

const developmentBrand: BeadBrand = { id: 'development-test', name: '开发测试色卡' }
const sampleBrand: BeadBrand = { id: 'sample-mini', name: '示例迷你色卡（开发）' }

function color(brand: BeadBrand, code: string, name: string, red: number, green: number, blue: number): BeadColor {
  return { brandId: brand.id, code, name, red, green, blue }
}

export class TestPaletteColorDatabase implements PaletteColorDatabase {
  readonly palettes: readonly BeadPalette[] = [
    {
      brand: developmentBrand,
      colors: [
        color(developmentBrand, 'T01', 'Black', 25, 25, 25),
        color(developmentBrand, 'T02', 'White', 245, 245, 240),
        color(developmentBrand, 'T03', 'Gray', 130, 135, 140),
        color(developmentBrand, 'T04', 'Red', 205, 45, 55),
        color(developmentBrand, 'T05', 'Orange', 235, 105, 40),
        color(developmentBrand, 'T06', 'Yellow', 245, 205, 45),
        color(developmentBrand, 'T07', 'Light Green', 125, 195, 80),
        color(developmentBrand, 'T08', 'Green', 35, 135, 75),
        color(developmentBrand, 'T09', 'Cyan', 45, 180, 185),
        color(developmentBrand, 'T10', 'Blue', 45, 105, 185),
        color(developmentBrand, 'T11', 'Dark Blue', 35, 55, 115),
        color(developmentBrand, 'T12', 'Purple', 120, 70, 155),
        color(developmentBrand, 'T13', 'Pink', 235, 130, 165),
        color(developmentBrand, 'T14', 'Brown', 120, 75, 50),
        color(developmentBrand, 'T15', 'Beige', 225, 195, 150),
        color(developmentBrand, 'T16', 'Cream', 250, 225, 175),
      ],
    },
    {
      brand: sampleBrand,
      colors: [
        color(sampleBrand, 'S01', 'Charcoal', 45, 48, 52),
        color(sampleBrand, 'S02', 'Snow', 250, 250, 248),
        color(sampleBrand, 'S03', 'Coral', 230, 100, 95),
        color(sampleBrand, 'S04', 'Sun', 245, 195, 70),
        color(sampleBrand, 'S05', 'Mint', 105, 190, 145),
        color(sampleBrand, 'S06', 'Sky', 95, 160, 220),
        color(sampleBrand, 'S07', 'Lavender', 155, 125, 195),
        color(sampleBrand, 'S08', 'Cocoa', 125, 85, 70),
      ],
    },
    ...[artkalS5mm, artkalC26mm, mard291]
      .map(toBeadPaletteIfValid)
      .filter((palette): palette is BeadPalette => palette !== null),
  ]

  findPalette(brandId: string): BeadPalette | undefined {
    return this.palettes.find((palette) => palette.brand.id === brandId)
  }
}
