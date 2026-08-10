import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { BeadGrid } from '../core'
import { drawBeadGrid, locateGridCell } from '../grid'
import type { GridCell } from '../grid'

interface BeadGridCanvasProps {
  readonly grid: BeadGrid
  readonly showGrid?: boolean
  readonly selectedCell?: GridCell | null
  readonly onCellSelect?: (cell: GridCell) => void
  readonly onStrokeStart?: (cell: GridCell) => void
  readonly onStrokeMove?: (cell: GridCell) => void
  readonly onStrokeEnd?: () => void
}

export function BeadGridCanvas({
  grid,
  showGrid = true,
  selectedCell = null,
  onCellSelect,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
}: BeadGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activePointerId = useRef<number | null>(null)

  useEffect(() => {
    if (canvasRef.current) drawBeadGrid(canvasRef.current, grid, showGrid, selectedCell)
  }, [grid, selectedCell, showGrid])

  const cellFromPointer = (
    event: ReactMouseEvent<HTMLCanvasElement> | ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return locateGridCell({
      clientX: event.clientX,
      clientY: event.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      gridWidth: grid.width,
      gridHeight: grid.height,
    })
  }

  const finishStroke = (pointerId: number) => {
    if (activePointerId.current !== pointerId) return
    activePointerId.current = null
    onStrokeEnd?.()
  }

  return (
    <canvas
      ref={canvasRef}
      className={`bead-grid-canvas${onCellSelect || onStrokeStart ? ' editable' : ''}${onStrokeStart ? ' drawing' : ''}`}
      aria-label={`${grid.width} × ${grid.height} 像素网格`}
      onClick={(event) => {
        if (!onCellSelect) return
        const cell = cellFromPointer(event)
        if (cell) onCellSelect(cell)
      }}
      onPointerDown={(event) => {
        if (!onStrokeStart || activePointerId.current !== null) return
        const cell = cellFromPointer(event)
        if (!cell) return
        event.preventDefault()
        activePointerId.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        onStrokeStart(cell)
      }}
      onPointerMove={(event) => {
        if (activePointerId.current !== event.pointerId || !onStrokeMove) return
        event.preventDefault()
        const cell = cellFromPointer(event)
        if (cell) onStrokeMove(cell)
      }}
      onPointerUp={(event) => finishStroke(event.pointerId)}
      onPointerCancel={(event) => finishStroke(event.pointerId)}
      onLostPointerCapture={(event) => finishStroke(event.pointerId)}
    />
  )
}
