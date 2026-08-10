import { describe, expect, it } from 'vitest'
import type { BeadColor, BeadGrid, BoardPiece } from '../src/core'
import {
  BOARD_HEADER_HEIGHT,
  MAX_EXPORT_BYTES,
  MAX_EXPORT_SIDE,
  calculateBoardExportDimensions,
  calculateGridExportDimensions,
  calculateNumberFontSize,
  getMatchedCellColor,
} from '../src/export'

const color: BeadColor = {
  brandId: 'test', code: 'P01', name: '红色', red: 220, green: 30, blue: 40,
}

function createGrid(width: number, height: number): BeadGrid {
  return {
    width,
    height,
    originalArgb: new Uint32Array(width * height),
    matchedColorIndices: new Int32Array(width * height),
    colorTable: [color],
  }
}

describe('PNG export layout', () => {
  it('calculates a clear 40x40 export', () => {
    expect(calculateGridExportDimensions(40, 40)).toEqual({
      width: 1920, height: 1920, cellSize: 48, estimatedBytes: 14_745_600,
    })
  })

  it('calculates an 80x80 export within the 4096px boundary', () => {
    const result = calculateGridExportDimensions(80, 80)
    expect(result).toMatchObject({ width: 3840, height: 3840, cellSize: 48 })
    expect(result.width).toBeLessThanOrEqual(MAX_EXPORT_SIDE)
    expect(result.estimatedBytes).toBeLessThanOrEqual(MAX_EXPORT_BYTES)
  })

  it('keeps square cells for a non-square grid and reduces unsafe dimensions', () => {
    const result = calculateGridExportDimensions(200, 100)
    expect(result).toMatchObject({ width: 4000, height: 2000, cellSize: 20 })
    expect(result.width / 200).toBe(result.height / 100)
  })

  it('does not render a color for an empty cell', () => {
    const grid = createGrid(2, 1)
    grid.matchedColorIndices[0] = -1
    grid.matchedColorIndices[1] = 0
    expect(getMatchedCellColor(grid, 0)).toBeNull()
    expect(getMatchedCellColor(grid, 1)).toBe('rgb(220, 30, 40)')
  })

  it('rejects unreadable number sizes at the font boundary', () => {
    expect(() => calculateNumberFontSize(13)).toThrow(/无法清晰显示/)
    expect(calculateNumberFontSize(14)).toBeGreaterThanOrEqual(9)
    expect(calculateNumberFontSize(48)).toBe(18)
  })

  it('includes the metadata header in BoardPiece export dimensions', () => {
    const grid = createGrid(29, 11)
    const piece: BoardPiece = {
      number: 2, row: 0, column: 1, width: 29, height: 11, grid,
    }
    expect(calculateBoardExportDimensions(piece)).toEqual({
      width: 1392,
      height: 11 * 48 + BOARD_HEADER_HEIGHT,
      cellSize: 48,
      estimatedBytes: 1392 * (11 * 48 + BOARD_HEADER_HEIGHT) * 4,
    })
  })
})
