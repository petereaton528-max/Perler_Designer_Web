import { useState } from 'react'
import type { BeadGrid, BeadStatistics, BoardPiece } from '../core'
import { downloadBlob } from '../export'

interface PdfExportPanelProps {
  readonly grid: BeadGrid
  readonly boardPieces: readonly BoardPiece[]
  readonly statistics: BeadStatistics
  readonly brandName: string
}

export function PdfExportPanel(props: PdfExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    setStatus('正在生成 PDF 图纸…')
    try {
      const { BrowserPdfPatternExporter } = await import('../pdf_export/PdfPatternExporter')
      const exporter = new BrowserPdfPatternExporter()
      const blob = await exporter.export(props)
      downloadBlob(blob, `perler_pattern_${formatTimestamp(new Date())}.pdf`)
      setStatus('PDF 图纸导出完成。')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PDF 图纸导出失败。')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="pdf-export-card" aria-labelledby="pdf-export-title">
      <div>
        <p className="section-label">PRINT</p>
        <h2 id="pdf-export-title">PDF 拼豆图纸</h2>
        <p>生成 A4 总览、颜色采购清单以及每块拼板的编号图。</p>
      </div>
      <button type="button" disabled={isExporting || props.boardPieces.length === 0} onClick={() => void handleExport()}>
        {isExporting ? '正在生成…' : '导出 PDF 图纸'}
      </button>
      {status && <p className="export-status" role="status">{status}</p>}
    </section>
  )
}

function formatTimestamp(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}_${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`
}
