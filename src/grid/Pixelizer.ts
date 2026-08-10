import type { BeadGrid } from '../core'

export const MIN_GRID_SIZE = 1
export const MAX_GRID_SIZE = 200

export interface PixelizeRequest {
  readonly image: CanvasImageSource
  readonly width: number
  readonly height: number
}

/** This async boundary can later be implemented by a Web Worker adapter. */
export interface Pixelizer {
  pixelize(request: PixelizeRequest): Promise<BeadGrid>
}

export class BrowserPixelizer implements Pixelizer {
  async pixelize(request: PixelizeRequest): Promise<BeadGrid> {
    validateGridSize(request.width, request.height)
    await yieldToBrowser()

    const canvas = createRasterCanvas(request.width, request.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('浏览器无法创建图片处理 Canvas。')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.clearRect(0, 0, request.width, request.height)
    context.drawImage(request.image, 0, 0, request.width, request.height)
    const rgba = context.getImageData(0, 0, request.width, request.height).data
    const originalArgb = new Uint32Array(request.width * request.height)
    for (let index = 0, pixel = 0; index < rgba.length; index += 4, pixel += 1) {
      originalArgb[pixel] = (
        ((rgba[index + 3] ?? 0) << 24) |
        ((rgba[index] ?? 0) << 16) |
        ((rgba[index + 1] ?? 0) << 8) |
        (rgba[index + 2] ?? 0)
      ) >>> 0
    }

    const matchedColorIndices = new Int32Array(originalArgb.length)
    matchedColorIndices.fill(-1)
    return {
      width: request.width,
      height: request.height,
      originalArgb,
      matchedColorIndices,
      colorTable: [],
    }
  }
}

export function validateGridSize(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('网格宽高必须为整数。')
  }
  if (
    width < MIN_GRID_SIZE || width > MAX_GRID_SIZE ||
    height < MIN_GRID_SIZE || height > MAX_GRID_SIZE
  ) {
    throw new Error(`自定义尺寸必须在 ${MIN_GRID_SIZE}–${MAX_GRID_SIZE} 之间。`)
  }
}

function createRasterCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}
