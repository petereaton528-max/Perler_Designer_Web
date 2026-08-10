import type { BeadGrid } from '../core'

export interface BeadGridEditor {
  setCellColor(grid: BeadGrid, x: number, y: number, matchedColorIndex: number): BeadGrid
  replaceColor(grid: BeadGrid, fromColorIndex: number, toColorIndex: number): BeadGrid
}

export class DefaultBeadGridEditor implements BeadGridEditor {
  setCellColor(grid: BeadGrid, x: number, y: number, matchedColorIndex: number): BeadGrid {
    validateCoordinates(grid, x, y)
    if (!Number.isInteger(matchedColorIndex)) {
      throw new Error('匹配颜色索引必须是整数。')
    }
    if (matchedColorIndex < -1 || matchedColorIndex >= grid.colorTable.length) {
      throw new Error(`匹配颜色索引越界：${matchedColorIndex}`)
    }
    const cellIndex = y * grid.width + x
    if (grid.matchedColorIndices[cellIndex] === matchedColorIndex) return grid
    const updatedIndices = new Int32Array(grid.matchedColorIndices)
    updatedIndices[cellIndex] = matchedColorIndex
    return { ...grid, matchedColorIndices: updatedIndices }
  }

  replaceColor(grid: BeadGrid, fromColorIndex: number, toColorIndex: number): BeadGrid {
    validateColorIndex(grid, fromColorIndex)
    validateColorIndex(grid, toColorIndex)
    if (fromColorIndex === toColorIndex) return grid
    let updatedIndices: Int32Array | null = null
    grid.matchedColorIndices.forEach((colorIndex, index) => {
      if (colorIndex !== fromColorIndex) return
      updatedIndices ??= new Int32Array(grid.matchedColorIndices)
      updatedIndices[index] = toColorIndex
    })
    return updatedIndices ? { ...grid, matchedColorIndices: updatedIndices } : grid
  }
}

function validateColorIndex(grid: BeadGrid, matchedColorIndex: number): void {
  if (!Number.isInteger(matchedColorIndex)) throw new Error('匹配颜色索引必须是整数。')
  if (matchedColorIndex < -1 || matchedColorIndex >= grid.colorTable.length) {
    throw new Error(`匹配颜色索引越界：${matchedColorIndex}`)
  }
}

function validateCoordinates(grid: BeadGrid, x: number, y: number): void {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error('格子坐标必须是整数。')
  }
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
    throw new Error(`格子坐标越界：(${x}, ${y})，网格尺寸为 ${grid.width} × ${grid.height}。`)
  }
}
