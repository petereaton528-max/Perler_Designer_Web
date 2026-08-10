import type { BeadPalette } from '../core'

export interface PaletteColorDatabase {
  readonly palettes: readonly BeadPalette[]
  findPalette(brandId: string): BeadPalette | undefined
}
