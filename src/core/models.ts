/** Shared domain models. They contain no React or browser-storage dependencies. */
export interface BeadBrand {
  readonly id: string
  readonly name: string
}

export interface BeadColor {
  readonly brandId: BeadBrand['id']
  readonly code: string
  readonly name: string
  readonly red: number
  readonly green: number
  readonly blue: number
  readonly series?: string
  readonly contributor?: string
  readonly sourceId?: string
}

export interface BeadPalette {
  readonly brand: BeadBrand
  readonly colors: readonly BeadColor[]
}

/** -1 in matchedColorIndices means that a cell has not been matched. */
export interface BeadGrid {
  readonly width: number
  readonly height: number
  readonly originalArgb: Uint32Array
  readonly matchedColorIndices: Int32Array
  readonly colorTable: readonly BeadColor[]
}

export interface BoardPiece {
  readonly number: number
  readonly row: number
  readonly column: number
  readonly width: number
  readonly height: number
  readonly grid: BeadGrid
}
