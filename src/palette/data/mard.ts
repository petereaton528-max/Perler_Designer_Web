import rawMardCsv from './mard.csv?raw'
import { PALETTE_SOURCES } from './paletteSources'
import type { OfficialPaletteColor, OfficialPaletteDefinition } from './paletteValidation'

const BRAND = 'MARD'
const SERIES = 'MARD 291'

function parseMardCsv(csv: string): readonly OfficialPaletteColor[] {
  return csv.trim().split(/\r?\n/).map((line, index) => {
    const fields = line.split(',')
    if (fields.length !== 6) throw new Error(`MARD CSV 第 ${index + 1} 行不是 6 列。`)
    const [code, name, red, green, blue, contributor] = fields
    if (![red, green, blue].every((value) => value?.trim())) {
      throw new Error(`MARD CSV 第 ${index + 1} 行存在空 RGB。`)
    }
    return {
      code: code?.trim() ?? '',
      name: name?.trim() ?? '',
      red: Number(red),
      green: Number(green),
      blue: Number(blue),
      contributor: contributor?.trim() ?? '',
      brand: BRAND,
      series: SERIES,
    }
  })
}

export const mard291: OfficialPaletteDefinition = {
  id: 'mard-291',
  brandName: BRAND,
  displayName: 'MARD',
  series: SERIES,
  expectedColorCount: PALETTE_SOURCES.beadColorsMard.expectedColors,
  sourcePage: PALETTE_SOURCES.beadColorsMard.repository,
  sourceRgbFile: PALETTE_SOURCES.beadColorsMard.rawFile,
  colors: parseMardCsv(rawMardCsv),
}
