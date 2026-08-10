import type { BeadPalette } from '../../core'

export interface OfficialPaletteColor {
  readonly code: string
  readonly name: string
  readonly red: number
  readonly green: number
  readonly blue: number
  readonly brand: string
  readonly series: string
  readonly contributor: string
}

export interface OfficialPaletteDefinition {
  readonly id: string
  readonly brandName: string
  readonly displayName?: string
  readonly series: string
  readonly expectedColorCount: number
  readonly sourcePage: string
  readonly sourceRgbFile: string
  readonly colors: readonly OfficialPaletteColor[]
  readonly importBlockers?: readonly string[]
}

export interface PaletteValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

export function validateOfficialPalette(definition: OfficialPaletteDefinition): PaletteValidationResult {
  const errors: string[] = [...(definition.importBlockers ?? [])]
  if (definition.colors.length !== definition.expectedColorCount) {
    errors.push(`颜色数量应为 ${definition.expectedColorCount}，实际为 ${definition.colors.length}。`)
  }
  const codes = new Set<string>()
  for (const color of definition.colors) {
    if (!color.code.trim()) errors.push('存在缺失颜色编号的数据。')
    else if (codes.has(color.code)) errors.push(`颜色编号重复：${color.code}。`)
    codes.add(color.code)
    for (const [channel, value] of [['R', color.red], ['G', color.green], ['B', color.blue]] as const) {
      if (!Number.isInteger(value) || value < 0 || value > 255) errors.push(`${color.code || '未知编号'} 的 ${channel} 值 ${value} 不在 0–255。`)
    }
    if (color.brand !== definition.brandName) errors.push(`${color.code} 的品牌与色卡定义不一致。`)
    if (color.series !== definition.series) errors.push(`${color.code} 的系列与色卡定义不一致。`)
    if (!color.contributor.trim()) errors.push(`${color.code} 缺少 contributor。`)
  }
  return { valid: errors.length === 0, errors }
}

export function toBeadPaletteIfValid(definition: OfficialPaletteDefinition): BeadPalette | null {
  if (!validateOfficialPalette(definition).valid) return null
  const brand = { id: definition.id, name: definition.displayName ?? `${definition.brandName} ${definition.series}` }
  return {
    brand,
    colors: definition.colors.map((color) => ({
      brandId: brand.id, code: color.code, name: color.name,
      red: color.red, green: color.green, blue: color.blue,
      series: color.series, contributor: color.contributor, sourceId: definition.id,
    })),
  }
}
