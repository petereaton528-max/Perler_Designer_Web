type BoardSizePreset = '29' | 'custom'

interface BoardLayoutPanelProps {
  readonly preset: BoardSizePreset
  readonly customWidth: string
  readonly customHeight: string
  readonly isValid: boolean
  readonly totalPieces: number
  readonly onPresetChanged: (preset: BoardSizePreset) => void
  readonly onCustomWidthChanged: (value: string) => void
  readonly onCustomHeightChanged: (value: string) => void
  readonly onOpenPreview: () => void
}

export function BoardLayoutPanel(props: BoardLayoutPanelProps) {
  const {
    preset, customWidth, customHeight, isValid, totalPieces,
    onPresetChanged, onCustomWidthChanged, onCustomHeightChanged, onOpenPreview,
  } = props
  return (
    <section className="board-layout-card" aria-labelledby="board-layout-title">
      <div className="board-layout-heading">
        <div><p className="section-label">BOARDS</p><h2 id="board-layout-title">拼板分页</h2></div>
        <div className="board-total"><strong>{isValid ? totalPieces : '—'}</strong><span>块拼板</span></div>
      </div>
      <div className="size-options" role="radiogroup" aria-label="拼板尺寸">
        <button className={`size-option${preset === '29' ? ' selected' : ''}`} type="button" role="radio" aria-checked={preset === '29'} onClick={() => onPresetChanged('29')}>29 × 29</button>
        <button className={`size-option${preset === 'custom' ? ' selected' : ''}`} type="button" role="radio" aria-checked={preset === 'custom'} onClick={() => onPresetChanged('custom')}>自定义</button>
      </div>
      {preset === 'custom' && (
        <div className="custom-size-fields">
          <label>拼板宽度<input type="number" min="1" max="200" value={customWidth} onChange={(event) => onCustomWidthChanged(event.target.value)} /></label>
          <span aria-hidden="true">×</span>
          <label>拼板高度<input type="number" min="1" max="200" value={customHeight} onChange={(event) => onCustomHeightChanged(event.target.value)} /></label>
          <small>范围 1–200</small>
        </div>
      )}
      {!isValid && <p className="field-error">拼板宽度和高度必须是 1–200 的整数。</p>}
      <button className="board-preview-button" type="button" disabled={!isValid || totalPieces === 0} onClick={onOpenPreview}>预览拼板</button>
    </section>
  )
}

export type { BoardSizePreset }
