import { useState } from 'react'
import type { BeadColor, BeadGrid } from '../core'
import type { GridCell } from '../grid'

export type GridEditTool = 'select' | 'brush' | 'eraser'

interface GridEditorPanelProps {
  readonly grid: BeadGrid
  readonly selectedCell: GridCell | null
  readonly tool: GridEditTool
  readonly activeColorIndex: number
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly onToolSelected: (tool: GridEditTool) => void
  readonly onColorSelected: (matchedColorIndex: number) => void
  readonly onUndo: () => void
  readonly onRedo: () => void
  readonly onReplaceColor: (fromColorIndex: number, toColorIndex: number) => void
}

export function GridEditorPanel(props: GridEditorPanelProps) {
  const {
    grid, selectedCell, tool, activeColorIndex, canUndo, canRedo,
    onToolSelected, onColorSelected, onUndo, onRedo, onReplaceColor,
  } = props
  const [showReplace, setShowReplace] = useState(false)
  const [replaceFrom, setReplaceFrom] = useState(0)
  const [replaceTo, setReplaceTo] = useState(-1)
  const matchedIndex = selectedCell
    ? (grid.matchedColorIndices[selectedCell.y * grid.width + selectedCell.x] ?? -1)
    : -1
  const currentColor = matchedIndex >= 0 ? grid.colorTable[matchedIndex] : undefined

  return (
    <section className="grid-editor-panel" aria-labelledby="grid-editor-title">
      <div className="editor-heading">
        <div><p className="section-label">EDIT</p><h2 id="grid-editor-title">编辑拼豆</h2></div>
        {selectedCell ? (
          <div className="selected-cell-details">
            <span>X: <strong>{selectedCell.x}</strong></span>
            <span>Y: <strong>{selectedCell.y}</strong></span>
            <span>{currentColor ? `${currentColor.code} · ${currentColor.name}` : '空格'}</span>
          </div>
        ) : <span className="selection-hint">{tool === 'select' ? '点击网格选择格子' : '在网格上按住并拖动画笔'}</span>}
      </div>

      <div className="editor-toolbar" aria-label="网格编辑工具">
        <ToolButton label="选择" active={tool === 'select'} onClick={() => onToolSelected('select')} />
        <ToolButton label="画笔" active={tool === 'brush'} onClick={() => onToolSelected('brush')} />
        <ToolButton label="橡皮擦" active={tool === 'eraser'} onClick={() => onToolSelected('eraser')} />
        <span className="toolbar-divider" aria-hidden="true" />
        <button type="button" disabled={!canUndo} onClick={onUndo}>撤销</button>
        <button type="button" disabled={!canRedo} onClick={onRedo}>重做</button>
        <button type="button" className={showReplace ? 'active' : ''} onClick={() => setShowReplace((shown) => !shown)}>批量替换</button>
      </div>

      {showReplace && (
        <div className="replace-color-panel">
          <label>原颜色<ColorSelect grid={grid} value={replaceFrom} onChange={setReplaceFrom} /></label>
          <span aria-hidden="true">→</span>
          <label>新颜色<ColorSelect grid={grid} value={replaceTo} onChange={setReplaceTo} /></label>
          <button type="button" disabled={replaceFrom === replaceTo} onClick={() => onReplaceColor(replaceFrom, replaceTo)}>确认替换</button>
        </div>
      )}

      <p className="palette-instruction">
        {tool === 'select' ? '选择格子后点击颜色进行修改。' : tool === 'brush' ? '先选择画笔颜色，再在网格上拖动。' : '在网格上拖动，将经过的格子设为空格。'}
      </p>
      <div className="palette-grid" aria-label="可用拼豆颜色">
        <ColorOption
          code="空格" name="透明 / 不计入统计" isEmpty
          selected={(tool === 'select' ? matchedIndex : activeColorIndex) === -1}
          disabled={tool === 'select' && !selectedCell}
          onClick={() => onColorSelected(-1)}
        />
        {grid.colorTable.map((color, index) => (
          <ColorOption
            key={`${color.brandId}-${color.code}`}
            code={color.code} name={color.name} color={color}
            selected={(tool === 'select' ? matchedIndex : activeColorIndex) === index}
            disabled={tool === 'select' && !selectedCell}
            onClick={() => onColorSelected(index)}
          />
        ))}
      </div>
    </section>
  )
}

function ToolButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={active ? 'active' : ''} aria-pressed={active} onClick={onClick}>{label}</button>
}

function ColorSelect({ grid, value, onChange }: { grid: BeadGrid; value: number; onChange: (value: number) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
      <option value={-1}>空格</option>
      {grid.colorTable.map((color, index) => <option value={index} key={`${color.brandId}-${color.code}`}>{color.code} · {color.name}</option>)}
    </select>
  )
}

interface ColorOptionProps {
  readonly code: string
  readonly name: string
  readonly color?: BeadColor
  readonly isEmpty?: boolean
  readonly selected: boolean
  readonly disabled: boolean
  readonly onClick: () => void
}

function ColorOption({ code, name, color, isEmpty = false, selected, disabled, onClick }: ColorOptionProps) {
  return (
    <button className={`palette-option${selected ? ' selected' : ''}`} type="button" disabled={disabled} aria-pressed={selected} onClick={onClick}>
      <span className={`palette-swatch${isEmpty ? ' empty' : ''}`} style={color ? { backgroundColor: `rgb(${color.red}, ${color.green}, ${color.blue})` } : undefined} aria-hidden="true" />
      <span className="palette-copy"><strong>{code}</strong><small>{name}</small></span>
    </button>
  )
}
