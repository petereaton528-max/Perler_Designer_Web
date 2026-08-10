import type { BeadGrid } from '../core'
import type { GridCell } from './canvasCoordinates'

const MAX_CANVAS_SIDE = 800
const MAX_CELL_SIZE = 16
const MIN_CELL_SIZE = 3

export function drawBeadGrid(
  canvas: HTMLCanvasElement,
  grid: BeadGrid,
  showGrid = true,
  selectedCell: GridCell | null = null,
): void {
  const longestSide = Math.max(grid.width, grid.height)
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.min(MAX_CELL_SIZE, Math.floor(MAX_CANVAS_SIDE / longestSide)),
  )
  canvas.width = grid.width * cellSize
  canvas.height = grid.height * cellSize
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器无法创建网格 Canvas。')

  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, canvas.width, canvas.height)
  for (let row = 0; row < grid.height; row += 1) {
    for (let column = 0; column < grid.width; column += 1) {
      const cellIndex = row * grid.width + column
      const matchedIndex = grid.matchedColorIndices[cellIndex] ?? -1
      const matchedColor = matchedIndex >= 0 ? grid.colorTable[matchedIndex] : undefined
      const argb = grid.originalArgb[cellIndex] ?? 0
      const alpha = ((argb >>> 24) & 0xff) / 255
      const red = matchedColor?.red ?? ((argb >>> 16) & 0xff)
      const green = matchedColor?.green ?? ((argb >>> 8) & 0xff)
      const blue = matchedColor?.blue ?? (argb & 0xff)
      if (matchedIndex >= 0) {
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
        context.fillRect(column * cellSize, row * cellSize, cellSize, cellSize)
      }
    }
  }

  if (showGrid && cellSize >= 4) {
    context.beginPath()
    context.strokeStyle = 'rgba(32, 33, 29, 0.24)'
    context.lineWidth = 1
    for (let column = 0; column <= grid.width; column += 1) {
      const x = column * cellSize + 0.5
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
    }
    for (let row = 0; row <= grid.height; row += 1) {
      const y = row * cellSize + 0.5
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
    }
    context.stroke()
  }
  if (selectedCell) {
    context.save()
    context.strokeStyle = '#f23821'
    context.lineWidth = Math.max(2, Math.min(4, cellSize * 0.22))
    const inset = context.lineWidth / 2
    context.strokeRect(
      selectedCell.x * cellSize + inset,
      selectedCell.y * cellSize + inset,
      cellSize - context.lineWidth,
      cellSize - context.lineWidth,
    )
    context.restore()
  }
}
