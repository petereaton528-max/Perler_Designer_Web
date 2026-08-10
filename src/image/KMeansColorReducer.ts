import type { ColorLimit, ColorReducer, ReducedImage } from './ColorReducer'

interface Centroid { red: number; green: number; blue: number }

export class KMeansColorReducer implements ColorReducer {
  private readonly maxWorkingPixels: number
  private readonly maxSamplePixels: number
  private readonly maxIterations: number

  constructor(
    maxWorkingPixels = 40_000,
    maxSamplePixels = 10_000,
    maxIterations = 10,
  ) {
    this.maxWorkingPixels = maxWorkingPixels
    this.maxSamplePixels = maxSamplePixels
    this.maxIterations = maxIterations
  }

  async reduce(
    image: CanvasImageSource,
    width: number,
    height: number,
    maxColors: ColorLimit,
  ): Promise<ReducedImage> {
    if (width <= 0 || height <= 0) throw new Error('颜色减少输入尺寸无效。')
    const ratio = Math.min(1, Math.sqrt(this.maxWorkingPixels / (width * height)))
    const workingWidth = Math.max(1, Math.floor(width * ratio))
    const workingHeight = Math.max(1, Math.floor(height * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = workingWidth
    canvas.height = workingHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('浏览器无法创建颜色处理 Canvas。')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, workingWidth, workingHeight)

    const imageData = context.getImageData(0, 0, workingWidth, workingHeight)
    const pixels = rgbaToArgb(imageData.data)
    const sample = createSample(pixels, this.maxSamplePixels)
    const clusterCount = Math.min(maxColors, sample.length)
    if (clusterCount === 0) throw new Error('图片没有可处理的像素。')
    const centroids = initializeCentroids(sample, clusterCount)
    await runKMeans(sample, centroids, this.maxIterations)

    for (let index = 0; index < pixels.length; index += 1) {
      const original = pixels[index] ?? 0
      const centroid = centroids[nearestCentroid(original, centroids)]
      if (!centroid) continue
      const offset = index * 4
      imageData.data[offset] = centroid.red
      imageData.data[offset + 1] = centroid.green
      imageData.data[offset + 2] = centroid.blue
      imageData.data[offset + 3] = (original >>> 24) & 0xff
    }
    context.putImageData(imageData, 0, 0)
    const bitmap = await createImageBitmap(canvas)
    return { bitmap, width: workingWidth, height: workingHeight }
  }
}

function rgbaToArgb(rgba: Uint8ClampedArray): Uint32Array {
  const pixels = new Uint32Array(rgba.length / 4)
  for (let offset = 0, pixel = 0; offset < rgba.length; offset += 4, pixel += 1) {
    pixels[pixel] = (
      ((rgba[offset + 3] ?? 0) << 24) |
      ((rgba[offset] ?? 0) << 16) |
      ((rgba[offset + 1] ?? 0) << 8) |
      (rgba[offset + 2] ?? 0)
    ) >>> 0
  }
  return pixels
}

function createSample(pixels: Uint32Array, maxSamplePixels: number): Uint32Array {
  if (pixels.length <= maxSamplePixels) return pixels
  const step = pixels.length / maxSamplePixels
  return Uint32Array.from(
    { length: maxSamplePixels },
    (_, index) => pixels[Math.min(Math.floor(index * step), pixels.length - 1)] ?? 0,
  )
}

function initializeCentroids(sample: Uint32Array, count: number): Centroid[] {
  const step = sample.length / count
  return Array.from({ length: count }, (_, index) => {
    const color = sample[Math.min(Math.floor(index * step), sample.length - 1)] ?? 0
    return centroidFromColor(color)
  })
}

async function runKMeans(
  sample: Uint32Array,
  centroids: Centroid[],
  maxIterations: number,
): Promise<void> {
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const redSums = new Float64Array(centroids.length)
    const greenSums = new Float64Array(centroids.length)
    const blueSums = new Float64Array(centroids.length)
    const counts = new Uint32Array(centroids.length)
    sample.forEach((color) => {
      const cluster = nearestCentroid(color, centroids)
      redSums[cluster] = (redSums[cluster] ?? 0) + ((color >>> 16) & 0xff)
      greenSums[cluster] = (greenSums[cluster] ?? 0) + ((color >>> 8) & 0xff)
      blueSums[cluster] = (blueSums[cluster] ?? 0) + (color & 0xff)
      counts[cluster] = (counts[cluster] ?? 0) + 1
    })

    let changed = false
    centroids.forEach((centroid, index) => {
      const count = counts[index] ?? 0
      if (count === 0) return
      const updated = {
        red: Math.floor((redSums[index] ?? 0) / count),
        green: Math.floor((greenSums[index] ?? 0) / count),
        blue: Math.floor((blueSums[index] ?? 0) / count),
      }
      if (updated.red !== centroid.red || updated.green !== centroid.green || updated.blue !== centroid.blue) {
        centroids[index] = updated
        changed = true
      }
    })
    if (!changed) return
    await yieldToBrowser()
  }
}

function nearestCentroid(color: number, centroids: readonly Centroid[]): number {
  const red = (color >>> 16) & 0xff
  const green = (color >>> 8) & 0xff
  const blue = color & 0xff
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  centroids.forEach((centroid, index) => {
    const redDelta = red - centroid.red
    const greenDelta = green - centroid.green
    const blueDelta = blue - centroid.blue
    const distance = redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })
  return nearestIndex
}

function centroidFromColor(color: number): Centroid {
  return { red: (color >>> 16) & 0xff, green: (color >>> 8) & 0xff, blue: color & 0xff }
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}
