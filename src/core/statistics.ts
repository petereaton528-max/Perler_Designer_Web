import type { BeadBrand, BeadGrid } from './models'

export interface BeadStatisticsEntry {
  readonly colorIndex: number
  readonly colorCode: string
  readonly colorName: string
  readonly brandId: string
  readonly brandName: string
  readonly red: number
  readonly green: number
  readonly blue: number
  readonly count: number
}

export interface BeadStatistics {
  readonly entries: readonly BeadStatisticsEntry[]
  readonly totalBeads: number
}

export interface BeadStatisticsCalculator {
  calculate(grid: BeadGrid, brands: readonly BeadBrand[]): BeadStatistics
}

export class DefaultBeadStatisticsCalculator implements BeadStatisticsCalculator {
  calculate(grid: BeadGrid, brands: readonly BeadBrand[]): BeadStatistics {
    const brandsById = new Map(brands.map((brand) => [brand.id, brand]))
    const entriesByCode = new Map<string, MutableStatisticsEntry>()

    grid.matchedColorIndices.forEach((colorIndex) => {
      if (colorIndex === -1) return
      const color = grid.colorTable[colorIndex]
      if (!color) throw new Error(`网格包含无效的匹配颜色索引：${colorIndex}`)
      const existing = entriesByCode.get(color.code)
      if (existing) {
        existing.count += 1
        return
      }
      const brand = brandsById.get(color.brandId)
      entriesByCode.set(color.code, {
        colorIndex,
        colorCode: color.code,
        colorName: color.name,
        brandId: color.brandId,
        brandName: brand?.name ?? color.brandId,
        red: color.red,
        green: color.green,
        blue: color.blue,
        count: 1,
      })
    })

    const entries = [...entriesByCode.values()]
      .sort((left, right) => compareCodes(left.colorCode, right.colorCode))
      .map((entry) => ({ ...entry }))
    return {
      entries,
      totalBeads: entries.reduce((total, entry) => total + entry.count, 0),
    }
  }
}

interface MutableStatisticsEntry extends BeadStatisticsEntry {
  count: number
}

function compareCodes(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}
