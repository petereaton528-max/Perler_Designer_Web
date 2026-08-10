import type { BeadGrid } from '../core'
import type { BeadGridEditor } from './BeadGridEditor'

export class GridPaintStroke {
  private readonly visitedCells = new Set<number>()
  private readonly originalMatchedColorIndices: Int32Array
  private readonly matchedColorIndex: number
  private readonly editor: BeadGridEditor
  private changed = false
  private currentGrid: BeadGrid

  constructor(
    grid: BeadGrid,
    matchedColorIndex: number,
    editor: BeadGridEditor,
  ) {
    this.currentGrid = grid
    this.originalMatchedColorIndices = grid.matchedColorIndices
    this.matchedColorIndex = matchedColorIndex
    this.editor = editor
  }

  paint(x: number, y: number): BeadGrid {
    const cellIndex = y * this.currentGrid.width + x
    if (this.visitedCells.has(cellIndex)) return this.currentGrid
    this.visitedCells.add(cellIndex)
    const updated = this.editor.setCellColor(this.currentGrid, x, y, this.matchedColorIndex)
    if (updated !== this.currentGrid) this.changed = true
    this.currentGrid = updated
    return updated
  }

  finish(): { grid: BeadGrid; previousMatchedColorIndices: Int32Array | null } {
    return {
      grid: this.currentGrid,
      previousMatchedColorIndices: this.changed ? this.originalMatchedColorIndices : null,
    }
  }
}
