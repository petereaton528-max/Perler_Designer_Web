import type { BoardPiece } from '../core'

export const A4_WIDTH = 595.28
export const A4_HEIGHT = 841.89
export const PDF_MARGIN = 36
export const BOARD_TITLE_HEIGHT = 58
export const MIN_PDF_NUMBER_FONT_SIZE = 5.5
export const NUMBER_FONT_RATIO = 0.32

export interface PdfBoardLayout {
  readonly cellSize: number
  readonly gridWidth: number
  readonly gridHeight: number
  readonly originX: number
  readonly originY: number
  readonly numberFontSize: number
}

export function calculatePdfBoardLayout(width: number, height: number): PdfBoardLayout {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('拼板宽高必须是正整数。')
  }
  const availableWidth = A4_WIDTH - PDF_MARGIN * 2
  const availableHeight = A4_HEIGHT - PDF_MARGIN * 2 - BOARD_TITLE_HEIGHT
  const cellSize = Math.min(availableWidth / width, availableHeight / height)
  const numberFontSize = cellSize * NUMBER_FONT_RATIO
  if (numberFontSize < MIN_PDF_NUMBER_FONT_SIZE) {
    const maximum = getSuggestedMaximumBoardSize()
    throw new Error(`拼板 ${width}×${height} 的颜色编号无法清晰显示；建议最大尺寸为 ${maximum.width}×${maximum.height}。`)
  }
  const gridWidth = cellSize * width
  const gridHeight = cellSize * height
  return { cellSize, gridWidth, gridHeight, originX: (A4_WIDTH - gridWidth) / 2, originY: PDF_MARGIN, numberFontSize }
}

export function validatePdfBoardPieces(pieces: readonly BoardPiece[]): void {
  for (const piece of pieces) {
    try {
      calculatePdfBoardLayout(piece.width, piece.height)
    } catch {
      const maximum = getSuggestedMaximumBoardSize()
      throw new Error(`第 ${piece.number} 块拼板（${piece.width}×${piece.height}）过大，无法保证编号可读。请将拼板尺寸调整为不超过 ${maximum.width}×${maximum.height}。`)
    }
  }
}

export function getSuggestedMaximumBoardSize(): { readonly width: number; readonly height: number } {
  const minimumCellSize = MIN_PDF_NUMBER_FONT_SIZE / NUMBER_FONT_RATIO
  return {
    width: Math.floor((A4_WIDTH - PDF_MARGIN * 2) / minimumCellSize),
    height: Math.floor((A4_HEIGHT - PDF_MARGIN * 2 - BOARD_TITLE_HEIGHT) / minimumCellSize),
  }
}
