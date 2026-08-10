import type { BoardPiece } from '../core'
import { BeadGridCanvas } from './BeadGridCanvas'

interface BoardPreviewPanelProps {
  readonly piece: BoardPiece
  readonly currentIndex: number
  readonly totalPieces: number
  readonly onPrevious: () => void
  readonly onNext: () => void
  readonly onClose: () => void
}

export function BoardPreviewPanel({
  piece, currentIndex, totalPieces, onPrevious, onNext, onClose,
}: BoardPreviewPanelProps) {
  return (
    <section className="board-preview-card" aria-labelledby="board-preview-title">
      <div className="board-preview-heading">
        <div>
          <p className="section-label">BOARD {piece.number}</p>
          <h2 id="board-preview-title">第 {currentIndex + 1} 块 / 共 {totalPieces} 块</h2>
          <p>行 {piece.row + 1} · 列 {piece.column + 1} · {piece.width} × {piece.height}</p>
        </div>
        <button type="button" onClick={onClose}>关闭预览</button>
      </div>
      <div className="canvas-stage board-canvas"><BeadGridCanvas grid={piece.grid} /></div>
      <div className="board-pagination">
        <button type="button" disabled={currentIndex === 0} onClick={onPrevious}>上一块</button>
        <span>{currentIndex + 1} / {totalPieces}</span>
        <button type="button" disabled={currentIndex >= totalPieces - 1} onClick={onNext}>下一块</button>
      </div>
    </section>
  )
}
