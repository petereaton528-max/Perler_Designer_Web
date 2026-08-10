export interface GridCell {
  readonly x: number
  readonly y: number
}

export interface CanvasPointerMetrics {
  readonly clientX: number
  readonly clientY: number
  readonly rectLeft: number
  readonly rectTop: number
  readonly rectWidth: number
  readonly rectHeight: number
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly gridWidth: number
  readonly gridHeight: number
}

/** Converts CSS viewport coordinates through the Canvas backing-store scale. */
export function locateGridCell(metrics: CanvasPointerMetrics): GridCell | null {
  if (
    metrics.rectWidth <= 0 || metrics.rectHeight <= 0 ||
    metrics.canvasWidth <= 0 || metrics.canvasHeight <= 0 ||
    metrics.gridWidth <= 0 || metrics.gridHeight <= 0
  ) return null

  const cssX = metrics.clientX - metrics.rectLeft
  const cssY = metrics.clientY - metrics.rectTop
  if (cssX < 0 || cssY < 0 || cssX >= metrics.rectWidth || cssY >= metrics.rectHeight) {
    return null
  }
  const backingX = cssX * (metrics.canvasWidth / metrics.rectWidth)
  const backingY = cssY * (metrics.canvasHeight / metrics.rectHeight)
  const x = Math.floor(backingX / (metrics.canvasWidth / metrics.gridWidth))
  const y = Math.floor(backingY / (metrics.canvasHeight / metrics.gridHeight))
  if (x < 0 || x >= metrics.gridWidth || y < 0 || y >= metrics.gridHeight) return null
  return { x, y }
}
