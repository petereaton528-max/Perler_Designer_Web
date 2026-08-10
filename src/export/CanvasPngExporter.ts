import type { BeadGrid, BoardPiece } from '../core'
import {
  BOARD_HEADER_HEIGHT,
  calculateBoardExportDimensions,
  calculateGridExportDimensions,
  calculateNumberFontSize,
  getMatchedCellColor,
} from './PngExportLayout'

export interface PngExporter {
  exportPattern(grid: BeadGrid, showGrid: boolean): Promise<Blob>
  exportNumberPattern(grid: BeadGrid): Promise<Blob>
  exportBoardPiece(piece: BoardPiece): Promise<Blob>
}

export class CanvasPngExporter implements PngExporter {
  async exportPattern(grid: BeadGrid, showGrid: boolean): Promise<Blob> {
    const dimensions = calculateGridExportDimensions(grid.width, grid.height)
    return renderToBlob(dimensions.width, dimensions.height, (context) => {
      drawCells(context, grid, dimensions.cellSize, 0, showGrid, false)
    })
  }

  async exportNumberPattern(grid: BeadGrid): Promise<Blob> {
    const dimensions = calculateGridExportDimensions(grid.width, grid.height)
    calculateNumberFontSize(dimensions.cellSize)
    return renderToBlob(dimensions.width, dimensions.height, (context) => {
      drawCells(context, grid, dimensions.cellSize, 0, true, true)
    })
  }

  async exportBoardPiece(piece: BoardPiece): Promise<Blob> {
    const dimensions = calculateBoardExportDimensions(piece)
    calculateNumberFontSize(dimensions.cellSize)
    return renderToBlob(dimensions.width, dimensions.height, (context) => {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, dimensions.width, BOARD_HEADER_HEIGHT)
      context.fillStyle = '#20211d'
      context.font = '700 28px sans-serif'
      context.fillText(`拼板 ${piece.number}`, 20, 38)
      context.font = '18px sans-serif'
      context.fillText(
        `行 ${piece.row + 1} · 列 ${piece.column + 1} · ${piece.width} × ${piece.height}`,
        20,
        72,
      )
      drawCells(context, piece.grid, dimensions.cellSize, BOARD_HEADER_HEIGHT, true, true)
    })
  }
}

function drawCells(
  context: CanvasRenderingContext2D,
  grid: BeadGrid,
  cellSize: number,
  offsetY: number,
  showGrid: boolean,
  showNumbers: boolean,
): void {
  context.fillStyle = '#ffffff'
  context.fillRect(0, offsetY, grid.width * cellSize, grid.height * cellSize)
  for (let row = 0; row < grid.height; row += 1) {
    for (let column = 0; column < grid.width; column += 1) {
      const index = row * grid.width + column
      const color = getMatchedCellColor(grid, index)
      if (!color) continue
      context.fillStyle = color
      context.fillRect(column * cellSize, offsetY + row * cellSize, cellSize, cellSize)
      if (showNumbers) {
        const matched = grid.colorTable[grid.matchedColorIndices[index] ?? -1]
        if (matched) drawNumber(context, matched.code, column, row, cellSize, offsetY)
      }
    }
  }
  if (showGrid) drawGridLines(context, grid.width, grid.height, cellSize, offsetY)
}

function drawNumber(
  context: CanvasRenderingContext2D,
  code: string,
  column: number,
  row: number,
  cellSize: number,
  offsetY: number,
): void {
  const fontSize = calculateNumberFontSize(cellSize)
  context.font = `700 ${fontSize}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineWidth = Math.max(2, fontSize * 0.16)
  const x = (column + 0.5) * cellSize
  const y = offsetY + (row + 0.5) * cellSize
  context.strokeStyle = 'rgba(255,255,255,0.9)'
  context.strokeText(code, x, y, cellSize - 3)
  context.fillStyle = '#171713'
  context.fillText(code, x, y, cellSize - 3)
}

function drawGridLines(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
  offsetY: number,
): void {
  context.beginPath()
  context.strokeStyle = 'rgba(32,33,29,0.42)'
  context.lineWidth = 1
  for (let column = 0; column <= width; column += 1) {
    const x = column * cellSize + 0.5
    context.moveTo(x, offsetY)
    context.lineTo(x, offsetY + height * cellSize)
  }
  for (let row = 0; row <= height; row += 1) {
    const y = offsetY + row * cellSize + 0.5
    context.moveTo(0, y)
    context.lineTo(width * cellSize, y)
  }
  context.stroke()
}

async function renderToBlob(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器无法创建导出 Canvas。')
    context.imageSmoothingEnabled = false
    draw(context)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG 编码失败。')), 'image/png')
    })
    return blob
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}
