import type { BeadColor, BeadGrid } from '../core'
import type { ColorLimit } from '../image'

export const CURRENT_PROJECT_SCHEMA_VERSION = 1

export interface SavedSourceImage {
  readonly fileName: string
  readonly mimeType: string
  readonly blob: Blob
}

export interface SavedProjectGrid {
  readonly width: number
  readonly height: number
  readonly originalArgb: Uint32Array
  readonly matchedColorIndices: Int32Array
  readonly colorTable: readonly BeadColor[]
}

export interface SavedProjectData {
  readonly sourceImage?: SavedSourceImage
  readonly outputWidth: number
  readonly outputHeight: number
  readonly colorLimit: ColorLimit
  readonly brandId: string
  readonly boardWidth: number
  readonly boardHeight: number
  readonly grid: SavedProjectGrid
}

export interface SavedProject extends SavedProjectData {
  readonly id: string
  readonly name: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly schemaVersion: number
}

export interface ProjectSummary {
  readonly id: string
  readonly name: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly width: number
  readonly height: number
}

export interface ProjectRepository {
  listProjects(): Promise<readonly ProjectSummary[]>
  saveProject(project: SavedProject): Promise<SavedProject>
  loadProject(id: string): Promise<SavedProject>
  deleteProject(id: string): Promise<void>
  createProject(name: string, data: SavedProjectData): SavedProject
}

export function toSavedProjectGrid(grid: BeadGrid): SavedProjectGrid {
  return {
    width: grid.width,
    height: grid.height,
    originalArgb: new Uint32Array(grid.originalArgb),
    matchedColorIndices: new Int32Array(grid.matchedColorIndices),
    colorTable: grid.colorTable.map((color) => ({ ...color })),
  }
}

export function restoreBeadGrid(grid: SavedProjectGrid): BeadGrid {
  return {
    width: grid.width,
    height: grid.height,
    originalArgb: new Uint32Array(grid.originalArgb),
    matchedColorIndices: new Int32Array(grid.matchedColorIndices),
    colorTable: grid.colorTable.map((color) => ({ ...color })),
  }
}
