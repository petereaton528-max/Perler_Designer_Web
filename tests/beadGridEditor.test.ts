import { describe, expect, it } from 'vitest'
import type { BeadBrand, BeadGrid } from '../src/core'
import { DefaultBeadStatisticsCalculator } from '../src/core'
import { DefaultBeadGridEditor, GridPaintStroke } from '../src/grid'

const brand: BeadBrand = { id: 'test', name: '测试色卡' }
const grid: BeadGrid = {
  width: 2,
  height: 1,
  originalArgb: new Uint32Array([0xffff0000, 0xffff0000]),
  matchedColorIndices: new Int32Array([0, 0]),
  colorTable: [
    { brandId: brand.id, code: 'A01', name: '红', red: 255, green: 0, blue: 0 },
    { brandId: brand.id, code: 'B01', name: '蓝', red: 0, green: 0, blue: 255 },
  ],
}

describe('DefaultBeadGridEditor', () => {
  const editor = new DefaultBeadGridEditor()
  const calculator = new DefaultBeadStatisticsCalculator()

  it('immutably changes one matched color and updates statistics', () => {
    const updated = editor.setCellColor(grid, 0, 0, 1)
    const statistics = calculator.calculate(updated, [brand])
    expect(updated).not.toBe(grid)
    expect(updated.originalArgb).toBe(grid.originalArgb)
    expect(updated.matchedColorIndices).not.toBe(grid.matchedColorIndices)
    expect([...grid.matchedColorIndices]).toEqual([0, 0])
    expect([...updated.matchedColorIndices]).toEqual([1, 0])
    expect(statistics.totalBeads).toBe(2)
    expect(statistics.entries.map((entry) => [entry.colorCode, entry.count])).toEqual([
      ['A01', 1], ['B01', 1],
    ])
  })

  it('sets a cell to empty and decreases total beads', () => {
    const updated = editor.setCellColor(grid, 1, 0, -1)
    const statistics = calculator.calculate(updated, [brand])
    expect([...updated.matchedColorIndices]).toEqual([0, -1])
    expect(statistics.totalBeads).toBe(1)
    expect(statistics.entries).toHaveLength(1)
    expect(statistics.entries[0]?.colorCode).toBe('A01')
  })

  it('replaces every matching color as one immutable grid change', () => {
    const source: BeadGrid = {
      ...grid,
      width: 3,
      originalArgb: new Uint32Array(3),
      matchedColorIndices: new Int32Array([0, 1, 0]),
    }
    const updated = editor.replaceColor(source, 0, 1)
    expect([...updated.matchedColorIndices]).toEqual([1, 1, 1])
    expect([...source.matchedColorIndices]).toEqual([0, 1, 0])
  })

  it('replaces a color with empty and updates statistics', () => {
    const updated = editor.replaceColor(grid, 0, -1)
    const statistics = calculator.calculate(updated, [brand])
    expect([...updated.matchedColorIndices]).toEqual([-1, -1])
    expect(statistics.totalBeads).toBe(0)
    expect(statistics.entries).toHaveLength(0)
  })

  it('an eraser stroke keeps statistics in sync', () => {
    const stroke = new GridPaintStroke(grid, -1, editor)
    const updated = stroke.paint(0, 0)
    expect(calculator.calculate(updated, [brand]).totalBeads).toBe(1)
  })

  it('rejects out-of-bounds coordinates without touching the source arrays', () => {
    expect(() => editor.setCellColor(grid, 2, 0, 1)).toThrow(/越界/)
    expect(() => editor.setCellColor(grid, 0, 1, 1)).toThrow(/越界/)
    expect([...grid.matchedColorIndices]).toEqual([0, 0])
  })
})
