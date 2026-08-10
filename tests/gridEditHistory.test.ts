import { describe, expect, it } from 'vitest'
import type { BeadGrid } from '../src/core'
import { DefaultBeadGridEditor, GridEditHistory, GridPaintStroke } from '../src/grid'

function grid(width = 3): BeadGrid {
  return {
    width,
    height: 1,
    originalArgb: new Uint32Array(width),
    matchedColorIndices: new Int32Array(width).fill(0),
    colorTable: [{ brandId: 'test', code: 'A', name: 'A', red: 0, green: 0, blue: 0 }],
  }
}

describe('GridEditHistory', () => {
  it('supports undo and redo', () => {
    const history = new GridEditHistory()
    history.record(new Int32Array([0, 0]))
    const previous = history.undo(new Int32Array([1, 0]))
    expect([...previous!]).toEqual([0, 0])
    expect(history.canRedo).toBe(true)
    expect([...history.redo(previous!)!]).toEqual([1, 0])
  })

  it('keeps only the newest 50 operations', () => {
    const history = new GridEditHistory()
    for (let step = 0; step < 51; step += 1) history.record(new Int32Array([step]))
    let current = new Int32Array([51])
    let undoCount = 0
    while (history.canUndo) {
      current = history.undo(current)!
      undoCount += 1
    }
    expect(undoCount).toBe(50)
    expect([...current]).toEqual([1])
  })

  it('clears redo when a new operation is recorded', () => {
    const history = new GridEditHistory()
    history.record(new Int32Array([0]))
    expect(history.undo(new Int32Array([1]))).not.toBeNull()
    expect(history.canRedo).toBe(true)
    history.record(new Int32Array([2]))
    expect(history.canRedo).toBe(false)
  })

  it('records a continuous paint stroke as one operation', () => {
    const editor = new DefaultBeadGridEditor()
    const history = new GridEditHistory()
    const source = grid()
    const stroke = new GridPaintStroke(source, -1, editor)
    stroke.paint(0, 0)
    stroke.paint(1, 0)
    stroke.paint(1, 0)
    const completed = stroke.finish()
    history.record(completed.previousMatchedColorIndices!)

    expect([...completed.grid.matchedColorIndices]).toEqual([-1, -1, 0])
    expect([...history.undo(completed.grid.matchedColorIndices)!]).toEqual([0, 0, 0])
    expect(history.undo(new Int32Array([0, 0, 0]))).toBeNull()
  })
})
