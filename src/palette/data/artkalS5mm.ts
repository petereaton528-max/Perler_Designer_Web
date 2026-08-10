import { PALETTE_SOURCES } from './paletteSources'
import type { OfficialPaletteDefinition } from './paletteValidation'

/** No partial data: official PDF exposes 176 codes and omits three RGB values. */
export const artkalS5mm: OfficialPaletteDefinition = {
  id: 'artkal-s-5mm', brandName: 'Artkal', series: 'S-5mm',
  expectedColorCount: PALETTE_SOURCES.artkalS5mm.expectedColors,
  sourcePage: PALETTE_SOURCES.artkalS5mm.page,
  sourceRgbFile: PALETTE_SOURCES.artkalS5mm.rgbFile,
  colors: [],
  importBlockers: [
    '官方 RGB PDF 文本层仅包含 176 个编号，与官方页面声明的 225 色不一致。',
    '官方 RGB PDF 未提供 S41、S42、S63 的 RGB 数值。',
  ],
}
