import { useEffect, useMemo, useRef, useState } from 'react'
import { DefaultBeadStatisticsCalculator } from './core'
import type { BeadGrid } from './core'
import {
  BrowserPixelizer,
  DefaultBeadGridEditor,
  DefaultBoardLayoutPlanner,
  GridEditHistory,
  GridPaintStroke,
  MAX_BOARD_SIZE,
  MAX_GRID_SIZE,
  MIN_BOARD_SIZE,
  MIN_GRID_SIZE,
} from './grid'
import type { GridCell } from './grid'
import { decodeImageFile, KMeansColorReducer } from './image'
import type { ColorLimit, DecodedImage } from './image'
import { Ciede2000ColorMatcher, TestPaletteColorDatabase } from './palette'
import { restoreBeadGrid, toSavedProjectGrid } from './project'
import type { SavedProject, SavedProjectData, SavedSourceImage } from './project'
import {
  BeadGridCanvas,
  BeadStatisticsPanel,
  BoardLayoutPanel,
  BoardPreviewPanel,
  GridEditorPanel,
  PngExportPanel,
  PdfExportPanel,
  ProjectPanel,
} from './ui'
import type { BoardSizePreset, GridEditTool } from './ui'
import './App.css'

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp'
const pixelizer = new BrowserPixelizer()
const colorReducer = new KMeansColorReducer()
const colorMatcher = new Ciede2000ColorMatcher()
const paletteDatabase = new TestPaletteColorDatabase()
const statisticsCalculator = new DefaultBeadStatisticsCalculator()
const beadGridEditor = new DefaultBeadGridEditor()
const boardLayoutPlanner = new DefaultBoardLayoutPlanner()
type SizePreset = '40' | '80' | 'custom'

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const decodeRequestRef = useRef(0)
  const generationRequestRef = useRef(0)
  const gridRef = useRef<BeadGrid | null>(null)
  const historyRef = useRef(new GridEditHistory())
  const strokeRef = useRef<GridPaintStroke | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [sourceImage, setSourceImage] = useState<SavedSourceImage | undefined>()
  const [decodedImage, setDecodedImage] = useState<DecodedImage | null>(null)
  const [sizePreset, setSizePreset] = useState<SizePreset>('40')
  const [customWidth, setCustomWidth] = useState('40')
  const [customHeight, setCustomHeight] = useState('40')
  const [colorLimit, setColorLimit] = useState<ColorLimit>(16)
  const [selectedBrandId, setSelectedBrandId] = useState(
    paletteDatabase.palettes[0]?.brand.id ?? '',
  )
  const [grid, setGrid] = useState<BeadGrid | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null)
  const [editTool, setEditTool] = useState<GridEditTool>('select')
  const [activeColorIndex, setActiveColorIndex] = useState(0)
  const [, setHistoryRevision] = useState(0)
  const [boardSizePreset, setBoardSizePreset] = useState<BoardSizePreset>('29')
  const [customBoardWidth, setCustomBoardWidth] = useState('29')
  const [customBoardHeight, setCustomBoardHeight] = useState('29')
  const [boardPreviewIndex, setBoardPreviewIndex] = useState<number | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => () => bitmapRef.current?.close(), [])
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const outputSize = useMemo(() => {
    if (sizePreset === '40') return { width: 40, height: 40 }
    if (sizePreset === '80') return { width: 80, height: 80 }
    const width = Number(customWidth)
    const height = Number(customHeight)
    if (
      !Number.isInteger(width) || !Number.isInteger(height) ||
      width < MIN_GRID_SIZE || width > MAX_GRID_SIZE ||
      height < MIN_GRID_SIZE || height > MAX_GRID_SIZE
    ) return null
    return { width, height }
  }, [customHeight, customWidth, sizePreset])
  const statistics = useMemo(() => grid ? statisticsCalculator.calculate(
    grid,
    paletteDatabase.palettes.map((palette) => palette.brand),
  ) : null, [grid])
  const boardSize = useMemo(() => {
    if (boardSizePreset === '29') return { width: 29, height: 29 }
    const width = Number(customBoardWidth)
    const height = Number(customBoardHeight)
    if (
      !Number.isInteger(width) || !Number.isInteger(height) ||
      width < MIN_BOARD_SIZE || width > MAX_BOARD_SIZE ||
      height < MIN_BOARD_SIZE || height > MAX_BOARD_SIZE
    ) return null
    return { width, height }
  }, [boardSizePreset, customBoardHeight, customBoardWidth])
  const boardPieces = useMemo(() => (
    grid && boardSize
      ? boardLayoutPlanner.split(grid, boardSize.width, boardSize.height)
      : []
  ), [boardSize, grid])

  const publishGrid = (nextGrid: BeadGrid | null) => {
    gridRef.current = nextGrid
    setGrid(nextGrid)
  }

  const resetEditSession = () => {
    strokeRef.current = null
    historyRef.current.clear()
    setHistoryRevision((revision) => revision + 1)
    setIsEditing(false)
    setSelectedCell(null)
    setEditTool('select')
    setActiveColorIndex(0)
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    const requestId = ++decodeRequestRef.current
    bitmapRef.current?.close()
    generationRequestRef.current += 1
    setIsGenerating(false)
    bitmapRef.current = null
    setDecodedImage(null)
    publishGrid(null)
    resetEditSession()
    setBoardPreviewIndex(null)
    setErrorMessage(null)
    setIsDecoding(true)
    setPreviewUrl(URL.createObjectURL(file))
    setFileName(file.name)
    setSourceImage({ fileName: file.name, mimeType: file.type, blob: file })

    try {
      const decoded = await decodeImageFile(file)
      if (requestId !== decodeRequestRef.current) {
        decoded.bitmap.close()
        return
      }
      bitmapRef.current = decoded.bitmap
      setDecodedImage(decoded)
    } catch (error) {
      if (requestId === decodeRequestRef.current) {
        setErrorMessage(error instanceof Error ? error.message : '图片解码失败。')
      }
    } finally {
      if (requestId === decodeRequestRef.current) setIsDecoding(false)
    }
  }

  const handleGenerate = async () => {
    const bitmap = bitmapRef.current
    const palette = paletteDatabase.findPalette(selectedBrandId)
    if (!bitmap || !outputSize || !palette || !decodedImage) return
    const requestId = ++generationRequestRef.current
    resetEditSession()
    setBoardPreviewIndex(null)
    setIsGenerating(true)
    setErrorMessage(null)
    try {
      const reduced = await colorReducer.reduce(
        bitmap,
        decodedImage.width,
        decodedImage.height,
        colorLimit,
      )
      try {
        const rawGrid = await pixelizer.pixelize({
          image: reduced.bitmap,
          width: outputSize.width,
          height: outputSize.height,
        })
        const matchedGrid = await colorMatcher.match(rawGrid, palette)
        if (requestId === generationRequestRef.current) publishGrid(matchedGrid)
      } finally {
        reduced.bitmap.close()
      }
    } catch (error) {
      if (requestId === generationRequestRef.current) {
        setErrorMessage(error instanceof Error ? error.message : '像素图生成失败。')
      }
    } finally {
      if (requestId === generationRequestRef.current) setIsGenerating(false)
    }
  }

  const clearGeneratedResult = () => {
    generationRequestRef.current += 1
    setIsGenerating(false)
    publishGrid(null)
    resetEditSession()
    setBoardPreviewIndex(null)
    setErrorMessage(null)
  }

  const handleCellColorChange = (matchedColorIndex: number) => {
    setActiveColorIndex(matchedColorIndex)
    if (editTool !== 'select' || !grid || !selectedCell) return
    try {
      const updated = beadGridEditor.setCellColor(
        grid,
        selectedCell.x,
        selectedCell.y,
        matchedColorIndex,
      )
      if (updated !== grid) {
        historyRef.current.record(grid.matchedColorIndices)
        publishGrid(updated)
        setHistoryRevision((revision) => revision + 1)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '修改格子颜色失败。')
    }
  }

  const handleStrokeStart = (cell: GridCell) => {
    const current = gridRef.current
    if (!current) return
    const paintIndex = editTool === 'eraser' ? -1 : activeColorIndex
    const stroke = new GridPaintStroke(current, paintIndex, beadGridEditor)
    strokeRef.current = stroke
    publishGrid(stroke.paint(cell.x, cell.y))
    setSelectedCell(cell)
  }

  const handleStrokeMove = (cell: GridCell) => {
    const stroke = strokeRef.current
    if (!stroke) return
    publishGrid(stroke.paint(cell.x, cell.y))
    setSelectedCell(cell)
  }

  const handleStrokeEnd = () => {
    const stroke = strokeRef.current
    if (!stroke) return
    strokeRef.current = null
    const completed = stroke.finish()
    if (completed.previousMatchedColorIndices) {
      historyRef.current.record(completed.previousMatchedColorIndices)
      setHistoryRevision((revision) => revision + 1)
    }
  }

  const handleUndo = () => {
    const current = gridRef.current
    if (!current) return
    const restored = historyRef.current.undo(current.matchedColorIndices)
    if (!restored) return
    publishGrid({ ...current, matchedColorIndices: restored })
    setHistoryRevision((revision) => revision + 1)
  }

  const handleRedo = () => {
    const current = gridRef.current
    if (!current) return
    const restored = historyRef.current.redo(current.matchedColorIndices)
    if (!restored) return
    publishGrid({ ...current, matchedColorIndices: restored })
    setHistoryRevision((revision) => revision + 1)
  }

  const handleReplaceColor = (fromColorIndex: number, toColorIndex: number) => {
    const current = gridRef.current
    if (!current) return
    try {
      const updated = beadGridEditor.replaceColor(current, fromColorIndex, toColorIndex)
      if (updated === current) return
      historyRef.current.record(current.matchedColorIndices)
      publishGrid(updated)
      setHistoryRevision((revision) => revision + 1)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '批量替换颜色失败。')
    }
  }

  const projectData = useMemo<SavedProjectData | null>(() => {
    if (!grid || !outputSize || !boardSize) return null
    return {
      sourceImage,
      outputWidth: outputSize.width,
      outputHeight: outputSize.height,
      colorLimit,
      brandId: selectedBrandId,
      boardWidth: boardSize.width,
      boardHeight: boardSize.height,
      grid: toSavedProjectGrid(grid),
    }
  }, [boardSize, colorLimit, grid, outputSize, selectedBrandId, sourceImage])

  const handleOpenProject = (project: SavedProject) => {
    generationRequestRef.current += 1
    decodeRequestRef.current += 1
    bitmapRef.current?.close()
    bitmapRef.current = null
    setDecodedImage(null)
    setIsDecoding(false)
    setIsGenerating(false)
    const image = project.sourceImage
    setSourceImage(image)
    setFileName(image?.fileName ?? null)
    setPreviewUrl(image ? URL.createObjectURL(image.blob) : null)
    if (project.outputWidth === project.outputHeight && (project.outputWidth === 40 || project.outputWidth === 80)) {
      setSizePreset(String(project.outputWidth) as SizePreset)
    } else {
      setSizePreset('custom')
      setCustomWidth(String(project.outputWidth))
      setCustomHeight(String(project.outputHeight))
    }
    setColorLimit(project.colorLimit)
    setSelectedBrandId(project.brandId)
    if (project.boardWidth === 29 && project.boardHeight === 29) setBoardSizePreset('29')
    else {
      setBoardSizePreset('custom')
      setCustomBoardWidth(String(project.boardWidth))
      setCustomBoardHeight(String(project.boardHeight))
    }
    publishGrid(restoreBeadGrid(project.grid))
    resetEditSession()
    setBoardPreviewIndex(null)
    setErrorMessage(null)
  }

  const handleNewProject = () => {
    generationRequestRef.current += 1
    decodeRequestRef.current += 1
    bitmapRef.current?.close()
    bitmapRef.current = null
    setPreviewUrl(null)
    setFileName(null)
    setSourceImage(undefined)
    setDecodedImage(null)
    setSizePreset('40')
    setCustomWidth('40')
    setCustomHeight('40')
    setColorLimit(16)
    setSelectedBrandId(paletteDatabase.palettes[0]?.brand.id ?? '')
    setBoardSizePreset('29')
    setCustomBoardWidth('29')
    setCustomBoardHeight('29')
    publishGrid(null)
    resetEditSession()
    setBoardPreviewIndex(null)
    setErrorMessage(null)
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Perler Designer 首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>Perler Designer</span>
        </a>
        <div className="site-links">
          <a href="/about">关于</a><a href="/privacy">隐私</a>
          <span className="privacy-pill">图片仅在浏览器本地处理</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">FREE · PRIVATE · NO SIGN-UP</p>
        <h1 id="page-title">把喜欢的图片，变成你的拼豆图纸</h1>
        <p className="hero-copy">
          免费、无需登录。你的图片不会上传到服务器，所有处理都将在浏览器中完成。
        </p>
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <button className="import-button" type="button" onClick={() => inputRef.current?.click()}>
          <span aria-hidden="true">＋</span>{fileName ? '更换图片' : '导入图片'}
        </button>
        <p className="file-hint">支持 JPG、PNG、WebP · 最长边解码至 2048 px</p>
      </section>

      <section className="preview-card" aria-labelledby="preview-title">
        <div className="preview-heading">
          <div><p className="section-label">INPUT</p><h2 id="preview-title">图片预览</h2></div>
          {fileName && <span className="file-name">{fileName}</span>}
        </div>
        <div className={`preview-area${previewUrl ? ' has-image' : ''}`}>
          {previewUrl ? (
            <img src={previewUrl} alt={`已导入图片：${fileName ?? ''}`} />
          ) : (
            <div className="empty-preview">
              <span className="empty-icon" aria-hidden="true">◇</span>
              <strong>还没有选择图片</strong>
              <span>点击上方按钮，从你的设备导入一张图片</span>
            </div>
          )}
        </div>
        {decodedImage && (
          <p className="decode-note">
            原始 {decodedImage.sourceWidth} × {decodedImage.sourceHeight} · 本地处理尺寸 {decodedImage.width} × {decodedImage.height}
          </p>
        )}
      </section>

      <section className="generator-card" aria-labelledby="size-title">
        <div>
          <p className="section-label">OUTPUT</p>
          <h2 id="size-title">选择拼豆图尺寸</h2>
        </div>
        <div className="size-options" role="radiogroup" aria-label="输出尺寸">
          {(['40', '80', 'custom'] as const).map((preset) => (
            <button
              key={preset}
              className={`size-option${sizePreset === preset ? ' selected' : ''}`}
              type="button"
              role="radio"
              aria-checked={sizePreset === preset}
              onClick={() => { setSizePreset(preset); clearGeneratedResult() }}
            >
              {preset === 'custom' ? '自定义' : `${preset} × ${preset}`}
            </button>
          ))}
        </div>
        {sizePreset === 'custom' && (
          <div className="custom-size-fields">
            <label>宽度<input type="number" min="1" max="200" value={customWidth} onChange={(event) => { setCustomWidth(event.target.value); clearGeneratedResult() }} /></label>
            <span aria-hidden="true">×</span>
            <label>高度<input type="number" min="1" max="200" value={customHeight} onChange={(event) => { setCustomHeight(event.target.value); clearGeneratedResult() }} /></label>
            <small>范围 1–200</small>
          </div>
        )}
        {sizePreset === 'custom' && !outputSize && <p className="field-error">宽度和高度必须是 1–200 的整数。</p>}
        <div className="config-group">
          <h3>颜色数量</h3>
          <div className="size-options" role="radiogroup" aria-label="颜色数量限制">
            {([16, 32, 48] as const).map((limit) => (
              <button
                key={limit}
                className={`size-option${colorLimit === limit ? ' selected' : ''}`}
                type="button"
                role="radio"
                aria-checked={colorLimit === limit}
                onClick={() => { setColorLimit(limit); clearGeneratedResult() }}
              >
                {limit} 色
              </button>
            ))}
          </div>
        </div>
        <div className="config-group">
          <h3>拼豆品牌</h3>
          <div className="size-options" role="radiogroup" aria-label="拼豆品牌色卡">
            {paletteDatabase.palettes.map((palette) => (
              <button
                key={palette.brand.id}
                className={`size-option${selectedBrandId === palette.brand.id ? ' selected' : ''}`}
                type="button"
                role="radio"
                aria-checked={selectedBrandId === palette.brand.id}
                onClick={() => { setSelectedBrandId(palette.brand.id); clearGeneratedResult() }}
              >
                {palette.brand.name}
              </button>
            ))}
          </div>
        </div>
        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        <button
          className="generate-button"
          type="button"
          disabled={!decodedImage || !outputSize || isDecoding || isGenerating}
          onClick={() => void handleGenerate()}
        >
          {isDecoding ? '正在解码…' : isGenerating ? '正在生成…' : '开始生成'}
        </button>
      </section>

      <ProjectPanel projectData={projectData} onNewProject={handleNewProject} onOpenProject={handleOpenProject} />

      {grid && (
        <>
          <section className="result-card" aria-labelledby="result-title">
            <div className="preview-heading">
              <div><p className="section-label">RESULT</p><h2 id="result-title">像素化结果</h2></div>
              <div className="result-actions">
                <span className="grid-size-badge">{grid.width} × {grid.height}</span>
                <button
                  className={`edit-grid-button${isEditing ? ' active' : ''}`}
                  type="button"
                  onClick={() => {
                    setIsEditing((editing) => !editing)
                    setSelectedCell(null)
                  }}
                >
                  {isEditing ? '退出编辑' : '编辑拼豆'}
                </button>
              </div>
            </div>
            <div className="canvas-stage">
              <BeadGridCanvas
                grid={grid}
                selectedCell={selectedCell}
                onCellSelect={isEditing && editTool === 'select' ? setSelectedCell : undefined}
                onStrokeStart={isEditing && editTool !== 'select' ? handleStrokeStart : undefined}
                onStrokeMove={isEditing && editTool !== 'select' ? handleStrokeMove : undefined}
                onStrokeEnd={isEditing && editTool !== 'select' ? handleStrokeEnd : undefined}
              />
            </div>
          </section>
          {isEditing && (
            <GridEditorPanel
              grid={grid}
              selectedCell={selectedCell}
              tool={editTool}
              activeColorIndex={activeColorIndex}
              canUndo={historyRef.current.canUndo}
              canRedo={historyRef.current.canRedo}
              onToolSelected={(tool) => { setEditTool(tool); strokeRef.current = null }}
              onColorSelected={handleCellColorChange}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onReplaceColor={handleReplaceColor}
            />
          )}
          {statistics && <BeadStatisticsPanel statistics={statistics} />}
          <BoardLayoutPanel
            preset={boardSizePreset}
            customWidth={customBoardWidth}
            customHeight={customBoardHeight}
            isValid={boardSize !== null}
            totalPieces={boardPieces.length}
            onPresetChanged={(preset) => {
              setBoardSizePreset(preset)
              setBoardPreviewIndex(null)
            }}
            onCustomWidthChanged={(value) => {
              setCustomBoardWidth(value)
              setBoardPreviewIndex(null)
            }}
            onCustomHeightChanged={(value) => {
              setCustomBoardHeight(value)
              setBoardPreviewIndex(null)
            }}
            onOpenPreview={() => setBoardPreviewIndex(0)}
          />
          {boardPreviewIndex !== null && boardPieces[boardPreviewIndex] && (
            <BoardPreviewPanel
              piece={boardPieces[boardPreviewIndex]}
              currentIndex={boardPreviewIndex}
              totalPieces={boardPieces.length}
              onPrevious={() => setBoardPreviewIndex((index) => Math.max(0, (index ?? 0) - 1))}
              onNext={() => setBoardPreviewIndex((index) => Math.min(
                boardPieces.length - 1,
                (index ?? 0) + 1,
              ))}
              onClose={() => setBoardPreviewIndex(null)}
            />
          )}
          <PngExportPanel grid={grid} boardPieces={boardPieces} sourceFileName={fileName} />
          {statistics && (
            <PdfExportPanel
              grid={grid}
              boardPieces={boardPieces}
              statistics={statistics}
              brandName={paletteDatabase.findPalette(selectedBrandId)?.brand.name ?? selectedBrandId}
            />
          )}
        </>
      )}

      <footer><span>perlerdesigner.xyz</span><span>本地处理 · 不上传 · 无需账号</span></footer>
    </main>
  )
}

export default App
