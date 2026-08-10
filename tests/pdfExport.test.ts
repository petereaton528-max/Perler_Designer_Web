import { describe, expect, it } from 'vitest'
import type { BeadBrand, BeadGrid, BoardPiece } from '../src/core'
import { DefaultBeadStatisticsCalculator } from '../src/core'
import {
  A4_HEIGHT,
  A4_WIDTH,
  MIN_PDF_NUMBER_FONT_SIZE,
  calculatePdfBoardLayout,
  getSuggestedMaximumBoardSize,
  validatePdfBoardPieces,
} from '../src/pdf_export'

function grid(width: number, height: number): BeadGrid {
  return {
    width,
    height,
    originalArgb: new Uint32Array(width * height),
    matchedColorIndices: new Int32Array(width * height),
    colorTable: [{ brandId: 'test', code: 'T01', name: 'Black', red: 20, green: 20, blue: 20 }],
  }
}

function piece(number: number, width: number, height: number): BoardPiece {
  return { number, row: 0, column: number - 1, width, height, grid: grid(width, height) }
}

describe('PDF export layout', () => {
  it('uses standard A4 dimensions and keeps 29x29 cells square', () => {
    const layout = calculatePdfBoardLayout(29, 29)
    expect(A4_WIDTH).toBeCloseTo(595.28)
    expect(A4_HEIGHT).toBeCloseTo(841.89)
    expect(layout.gridWidth / 29).toBeCloseTo(layout.gridHeight / 29)
    expect(layout.numberFontSize).toBeGreaterThanOrEqual(MIN_PDF_NUMBER_FONT_SIZE)
  })

  it('gives an edge board larger readable cells', () => {
    const full = calculatePdfBoardLayout(29, 29)
    const edge = calculatePdfBoardLayout(11, 11)
    expect(edge.cellSize).toBeGreaterThan(full.cellSize)
  })

  it('lays out a non-square board without distorting cells', () => {
    const layout = calculatePdfBoardLayout(20, 29)
    expect(layout.gridWidth / 20).toBeCloseTo(layout.gridHeight / 29)
    expect(layout.originX).toBeGreaterThan(0)
  })

  it('enforces the minimum number font size boundary', () => {
    const maximum = getSuggestedMaximumBoardSize()
    expect(calculatePdfBoardLayout(maximum.width, 1).numberFontSize).toBeGreaterThanOrEqual(MIN_PDF_NUMBER_FONT_SIZE)
    expect(() => calculatePdfBoardLayout(maximum.width + 1, 1)).toThrow(/无法清晰显示/)
  })

  it('rejects an oversized BoardPiece and identifies its number', () => {
    expect(() => validatePdfBoardPieces([piece(1, 29, 29), piece(2, 100, 100)]))
      .toThrow(/第 2 块拼板/)
  })

  it('does not include empty cells in the PDF shopping-list statistics', () => {
    const source = grid(3, 1)
    source.matchedColorIndices.set([0, -1, 0])
    const brands: BeadBrand[] = [{ id: 'test', name: 'Test' }]
    const statistics = new DefaultBeadStatisticsCalculator().calculate(source, brands)
    expect(statistics.totalBeads).toBe(2)
    expect(statistics.entries).toHaveLength(1)
    expect(statistics.entries[0]?.count).toBe(2)
  })
})
