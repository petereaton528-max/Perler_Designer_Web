export class GridEditHistory {
  private readonly undoStack: Int32Array[] = []
  private readonly redoStack: Int32Array[] = []
  private readonly maxHistorySize: number

  constructor(maxHistorySize = 50) {
    if (!Number.isInteger(maxHistorySize) || maxHistorySize <= 0) {
      throw new Error('历史记录上限必须是正整数。')
    }
    this.maxHistorySize = maxHistorySize
  }

  get canUndo(): boolean { return this.undoStack.length > 0 }
  get canRedo(): boolean { return this.redoStack.length > 0 }

  record(previousMatchedColorIndices: Int32Array): void {
    this.undoStack.push(new Int32Array(previousMatchedColorIndices))
    if (this.undoStack.length > this.maxHistorySize) this.undoStack.shift()
    this.redoStack.length = 0
  }

  undo(currentMatchedColorIndices: Int32Array): Int32Array | null {
    const previous = this.undoStack.pop()
    if (!previous) return null
    this.redoStack.push(new Int32Array(currentMatchedColorIndices))
    return previous
  }

  redo(currentMatchedColorIndices: Int32Array): Int32Array | null {
    const next = this.redoStack.pop()
    if (!next) return null
    this.undoStack.push(new Int32Array(currentMatchedColorIndices))
    return next
  }

  clear(): void {
    this.undoStack.length = 0
    this.redoStack.length = 0
  }
}
