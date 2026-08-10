export type ColorLimit = 16 | 32 | 48

export interface ReducedImage {
  readonly bitmap: ImageBitmap
  readonly width: number
  readonly height: number
}

export interface ColorReducer {
  reduce(image: CanvasImageSource, width: number, height: number, maxColors: ColorLimit): Promise<ReducedImage>
}
