import { useState } from 'react'
import type { BeadGrid, BoardPiece } from '../core'
import { CanvasPngExporter, createExportBaseName, downloadBlob } from '../export'

const exporter = new CanvasPngExporter()

interface PngExportPanelProps {
  readonly grid: BeadGrid
  readonly boardPieces: readonly BoardPiece[]
  readonly sourceFileName: string | null
}

export function PngExportPanel({ grid, boardPieces, sourceFileName }: PngExportPanelProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const baseName = createExportBaseName(sourceFileName)

  const runExport = async (task: () => Promise<void>) => {
    if (isExporting) return
    setIsExporting(true)
    setStatus(null)
    try {
      await task()
      setStatus('导出完成。')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PNG 导出失败。')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="export-card" aria-labelledby="export-title">
      <div className="export-heading">
        <div><p className="section-label">EXPORT</p><h2 id="export-title">导出 PNG</h2></div>
        <span>基于当前编辑结果</span>
      </div>
      <div className="export-options">
        <article>
          <h3>高清拼豆图</h3>
          <p>按匹配后的拼豆颜色生成高清图片。</p>
          <label className="grid-toggle">
            <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
            显示网格
          </label>
          <button type="button" disabled={isExporting} onClick={() => void runExport(async () => {
            const blob = await exporter.exportPattern(grid, showGrid)
            downloadBlob(blob, `${baseName}-pattern.png`)
          })}>导出高清图</button>
        </article>
        <article>
          <h3>颜色编号图</h3>
          <p>显示颜色编号并始终保留网格线。</p>
          <button type="button" disabled={isExporting} onClick={() => void runExport(async () => {
            const blob = await exporter.exportNumberPattern(grid)
            downloadBlob(blob, `${baseName}-color-codes.png`)
          })}>导出编号图</button>
        </article>
        <article>
          <h3>拼板分页图</h3>
          <p>逐张下载当前 {boardPieces.length} 块拼板；浏览器可能询问是否允许多文件下载。</p>
          <button type="button" disabled={isExporting || boardPieces.length === 0} onClick={() => void runExport(async () => {
            for (const piece of boardPieces) {
              setStatus(`正在生成第 ${piece.number} / ${boardPieces.length} 块…`)
              const blob = await exporter.exportBoardPiece(piece)
              downloadBlob(blob, `${baseName}-board-${String(piece.number).padStart(2, '0')}.png`)
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
            }
          })}>逐张导出拼板</button>
        </article>
      </div>
      {status && <p className="export-status" role="status">{status}</p>}
    </section>
  )
}
