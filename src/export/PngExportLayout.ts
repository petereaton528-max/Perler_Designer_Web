import type { BeadGrid, BoardPiece } from '../core'

export const MAX_EXPORT_SIDE = 4096
export const MAX_EXPORT_BYTES = 64 * 1024 * 1024
export const DEFAULT_CELL_SIZE = 48
export const BOARD_HEADER_HEIGHT = 96
export const MIN_READABLE_NUMBER_CELL_SIZE = 14

export interface ExportDimensions {
  readonly width: number
  readonly height: number
  readonly cellSize: number
  readonly estimatedBytes: number
}

export function calculateGridExportDimensions(
  gridWidth: number,
  gridHeight: number,
  preferredCellSize = DEFAULT_CELL_SIZE,
  extraHeight = 0,
): ExportDimensions {
  if (!Number.isInteger(gridWidth) || !Number.isInteger(gridHeight) || gridWidth < 1 || gridHeight < 1) {
    throw new Error('导出网格宽高必须是正整数。')
  }
  const maxCellByWidth = Math.floor(MAX_EXPORT_SIDE / gridWidth)
  const maxCellByHeight = Math.floor((MAX_EXPORT_SIDE - extraHeight) / gridHeight)
  const maxPixelsByMemory = Math.floor(
    Math.sqrt(MAX_EXPORT_BYTES / 4 / (gridWidth * gridHeight)),
  )
  const cellSize = Math.min(preferredCellSize, maxCellByWidth, maxCellByHeight, maxPixelsByMemory)
  if (cellSize < 1) throw new Error('导出尺寸超过浏览器安全范围，请减小网格或拼板尺寸。')
  const width = gridWidth * cellSize
  const height = gridHeight * cellSize + extraHeight
  const estimatedBytes = width * height * 4
  if (width > MAX_EXPORT_SIDE || height > MAX_EXPORT_SIDE || estimatedBytes > MAX_EXPORT_BYTES) {
    throw new Error('导出图片预计占用内存过大，请减小输出尺寸。')
  }
  return { width, height, cellSize, estimatedBytes }
}

export function calculateNumberFontSize(cellSize: number): number {
  if (cellSize < MIN_READABLE_NUMBER_CELL_SIZE) {
    throw new Error(`当前格子仅 ${cellSize}px，颜色编号无法清晰显示，请使用拼板分页图。`)
  }
  return Math.max(9, Math.floor(cellSize * 0.38))
}

export function getMatchedCellColor(grid: BeadGrid, cellIndex: number): string | null {
  const matchedIndex = grid.matchedColorIndices[cellIndex] ?? -1
  if (matchedIndex < 0) return null
  const color = grid.colorTable[matchedIndex]
  if (!color) return null
  return `rgb(${color.red}, ${color.green}, ${color.blue})`
}

export function calculateBoardExportDimensions(piece: BoardPiece): ExportDimensions {
  return calculateGridExportDimensions(piece.width, piece.height, DEFAULT_CELL_SIZE, BOARD_HEADER_HEIGHT)
}
