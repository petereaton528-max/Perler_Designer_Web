import { PALETTE_SOURCES } from './paletteSources'
import type { OfficialPaletteDefinition } from './paletteValidation'

/** No partial data: official PDF is incomplete and contains an invalid RGB value. */
export const artkalC26mm: OfficialPaletteDefinition = {
  id: 'artkal-c-2-6mm', brandName: 'Artkal', series: 'C-2.6mm',
  expectedColorCount: PALETTE_SOURCES.artkalC26mm.expectedColors,
  sourcePage: PALETTE_SOURCES.artkalC26mm.page,
  sourceRgbFile: PALETTE_SOURCES.artkalC26mm.rgbFile,
  colors: [],
  importBlockers: [
    '官方 RGB PDF 文本层仅包含 174 个编号，与官方页面声明的 197 色不一致。',
    '官方 RGB PDF 未提供 C35 的 RGB 数值。',
    '官方 RGB PDF 文本层中 C152 的 RGB 为 189, 199, 273，B 值超出 0–255。',
  ],
}
