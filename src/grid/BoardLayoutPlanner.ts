import type { BeadGrid, BoardPiece } from '../core'

export const MIN_BOARD_SIZE = 1
export const MAX_BOARD_SIZE = 200

export interface BoardLayoutPlanner {
  split(grid: BeadGrid, boardWidth: number, boardHeight: number): readonly BoardPiece[]
}

export class DefaultBoardLayoutPlanner implements BoardLayoutPlanner {
  split(grid: BeadGrid, boardWidth: number, boardHeight: number): readonly BoardPiece[] {
    validateBoardSize(boardWidth, boardHeight)
    const pieces: BoardPiece[] = []
    let number = 1
    let boardRow = 0

    for (let rowStart = 0; rowStart < grid.height; rowStart += boardHeight, boardRow += 1) {
      let boardColumn = 0
      for (
        let columnStart = 0;
        columnStart < grid.width;
        columnStart += boardWidth, boardColumn += 1
      ) {
        const width = Math.min(boardWidth, grid.width - columnStart)
        const height = Math.min(boardHeight, grid.height - rowStart)
        const originalArgb = new Uint32Array(width * height)
        const matchedColorIndices = new Int32Array(width * height)
        for (let row = 0; row < height; row += 1) {
          const sourceOffset = (rowStart + row) * grid.width + columnStart
          const targetOffset = row * width
          originalArgb.set(grid.originalArgb.subarray(sourceOffset, sourceOffset + width), targetOffset)
          matchedColorIndices.set(
            grid.matchedColorIndices.subarray(sourceOffset, sourceOffset + width),
            targetOffset,
          )
        }
        pieces.push({
          number: number++,
          row: boardRow,
          column: boardColumn,
          width,
          height,
          grid: { width, height, originalArgb, matchedColorIndices, colorTable: grid.colorTable },
        })
      }
    }
    return pieces
  }
}

export function validateBoardSize(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('拼板宽高必须为整数。')
  }
  if (
    width < MIN_BOARD_SIZE || width > MAX_BOARD_SIZE ||
    height < MIN_BOARD_SIZE || height > MAX_BOARD_SIZE
  ) {
    throw new Error(`拼板尺寸必须在 ${MIN_BOARD_SIZE}–${MAX_BOARD_SIZE} 之间。`)
  }
}
