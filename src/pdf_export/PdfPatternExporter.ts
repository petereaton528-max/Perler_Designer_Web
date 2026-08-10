import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import type { BeadGrid, BeadStatistics, BoardPiece } from '../core'
import { A4_HEIGHT, A4_WIDTH, calculatePdfBoardLayout, validatePdfBoardPieces } from './PdfLayout'

export interface PdfExportRequest {
  readonly grid: BeadGrid
  readonly boardPieces: readonly BoardPiece[]
  readonly statistics: BeadStatistics
  readonly brandName: string
}

export interface PdfPatternExporter { export(request: PdfExportRequest): Promise<Blob> }

export class BrowserPdfPatternExporter implements PdfPatternExporter {
  async export(request: PdfExportRequest): Promise<Blob> {
    validatePdfBoardPieces(request.boardPieces)
    const document = await PDFDocument.create()
    const regular = await document.embedFont(StandardFonts.Helvetica)
    const bold = await document.embedFont(StandardFonts.HelveticaBold)
    drawOverviewPage(document.addPage([A4_WIDTH, A4_HEIGHT]), request, regular, bold)
    drawShoppingPage(document.addPage([A4_WIDTH, A4_HEIGHT]), request.statistics, regular, bold)
    for (const piece of request.boardPieces) drawBoardPage(document.addPage([A4_WIDTH, A4_HEIGHT]), piece, regular, bold)
    const bytes = await document.save()
    return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  }
}

function drawOverviewPage(page: PDFPage, request: PdfExportRequest, regular: PDFFont, bold: PDFFont): void {
  page.drawText('Perler Designer', { x: 36, y: 790, size: 25, font: bold, color: rgb(0.12, 0.13, 0.11) })
  page.drawText('Printable bead pattern', { x: 36, y: 765, size: 11, font: regular, color: rgb(0.4, 0.4, 0.37) })
  const overview = fitGrid(request.grid.width, request.grid.height, 523, 560)
  drawGrid(page, request.grid, overview.cellSize, (A4_WIDTH - overview.width) / 2, 175, false, regular)
  const brand = asciiOrFallback(request.brandName, request.grid.colorTable[0]?.brandId ?? 'Unknown')
  const details = [`Grid: ${request.grid.width} x ${request.grid.height}`, `Total beads: ${request.statistics.totalBeads}`, `Boards: ${request.boardPieces.length}`, `Brand: ${brand}`]
  details.forEach((text, index) => page.drawText(text, { x: 36, y: 135 - index * 22, size: 12, font: regular }))
}

function drawShoppingPage(page: PDFPage, statistics: BeadStatistics, regular: PDFFont, bold: PDFFont): void {
  page.drawText('Color shopping list', { x: 36, y: 792, size: 22, font: bold })
  page.drawText(`Total beads: ${statistics.totalBeads}`, { x: 36, y: 766, size: 11, font: regular })
  const rowHeight = Math.min(14, 680 / Math.max(1, statistics.entries.length))
  const fontSize = Math.max(6, Math.min(10, rowHeight * 0.65))
  statistics.entries.forEach((entry, index) => {
    const y = 736 - index * rowHeight
    page.drawRectangle({ x: 36, y: y - 2, width: 10, height: 10, color: rgb(entry.red / 255, entry.green / 255, entry.blue / 255), borderWidth: 0.4, borderColor: rgb(0.3, 0.3, 0.3) })
    page.drawText(asciiOrFallback(entry.colorCode, '?'), { x: 54, y, size: fontSize, font: bold })
    page.drawText(asciiOrFallback(entry.colorName, entry.colorCode), { x: 115, y, size: fontSize, font: regular })
    page.drawText(String(entry.count), { x: 500, y, size: fontSize, font: bold })
  })
}

function drawBoardPage(page: PDFPage, piece: BoardPiece, regular: PDFFont, bold: PDFFont): void {
  const layout = calculatePdfBoardLayout(piece.width, piece.height)
  page.drawText(`Board ${piece.number}`, { x: 36, y: 798, size: 20, font: bold })
  page.drawText(`Row ${piece.row + 1} / Column ${piece.column + 1} / ${piece.width} x ${piece.height}`, { x: 36, y: 775, size: 11, font: regular })
  drawGrid(page, piece.grid, layout.cellSize, layout.originX, layout.originY, true, regular)
}

function drawGrid(page: PDFPage, grid: BeadGrid, cellSize: number, originX: number, originY: number, showNumbers: boolean, font: PDFFont): void {
  const numberSize = cellSize * 0.32
  for (let row = 0; row < grid.height; row += 1) {
    for (let column = 0; column < grid.width; column += 1) {
      const index = row * grid.width + column
      const matchedIndex = grid.matchedColorIndices[index] ?? -1
      const color = matchedIndex >= 0 ? grid.colorTable[matchedIndex] : undefined
      const x = originX + column * cellSize
      const y = originY + (grid.height - row - 1) * cellSize
      page.drawRectangle({ x, y, width: cellSize, height: cellSize, color: color ? rgb(color.red / 255, color.green / 255, color.blue / 255) : rgb(1, 1, 1), borderWidth: 0.35, borderColor: rgb(0.35, 0.35, 0.33) })
      if (!showNumbers || !color) continue
      const code = asciiOrFallback(color.code, '?')
      const textWidth = font.widthOfTextAtSize(code, numberSize)
      page.drawText(code, { x: x + Math.max(0.7, (cellSize - textWidth) / 2), y: y + (cellSize - numberSize) / 2 + 1, size: numberSize, font, color: rgb(0.08, 0.08, 0.07), maxWidth: cellSize - 1.4 })
    }
  }
}

function fitGrid(width: number, height: number, maxWidth: number, maxHeight: number) {
  const cellSize = Math.min(maxWidth / width, maxHeight / height)
  return { cellSize, width: width * cellSize, height: height * cellSize }
}

function asciiOrFallback(value: string, fallback: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : fallback
}
