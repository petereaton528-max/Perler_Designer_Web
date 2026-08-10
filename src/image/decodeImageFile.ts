const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SUPPORTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i

export interface DecodedImage {
  readonly bitmap: ImageBitmap
  readonly width: number
  readonly height: number
  readonly sourceWidth: number
  readonly sourceHeight: number
}

export class ImageDecodeError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ImageDecodeError'
  }
}

export async function decodeImageFile(file: File, maxDimension = 2048): Promise<DecodedImage> {
  if (!SUPPORTED_MIME_TYPES.has(file.type) && !SUPPORTED_EXTENSIONS.test(file.name)) {
    throw new ImageDecodeError('不支持的图片格式。请选择 JPG、PNG 或 WebP 图片。')
  }
  if (file.size === 0) throw new ImageDecodeError('图片文件为空，无法解码。')
  if (!Number.isInteger(maxDimension) || maxDimension <= 0) {
    throw new ImageDecodeError('最大解码尺寸配置无效。')
  }
  if (!('createImageBitmap' in window)) {
    throw new ImageDecodeError('当前浏览器不支持本地图片解码，请升级浏览器后重试。')
  }

  try {
    const dimensions = await readImageDimensions(file)
    const scale = Math.min(1, maxDimension / Math.max(dimensions.width, dimensions.height))
    const width = Math.max(1, Math.round(dimensions.width * scale))
    const height = Math.max(1, Math.round(dimensions.height * scale))
    const bitmap = await createImageBitmap(file, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high',
    })
    if (bitmap.width <= 0 || bitmap.height <= 0) {
      bitmap.close()
      throw new ImageDecodeError('图片解码结果无效。')
    }
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      sourceWidth: dimensions.width,
      sourceHeight: dimensions.height,
    }
  } catch (error) {
    if (error instanceof ImageDecodeError) throw error
    throw new ImageDecodeError('图片解码失败，文件可能已损坏或格式不受浏览器支持。', {
      cause: error,
    })
  }
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const width = image.naturalWidth
      const height = image.naturalHeight
      URL.revokeObjectURL(objectUrl)
      if (width > 0 && height > 0) resolve({ width, height })
      else reject(new ImageDecodeError('无法读取图片尺寸。'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new ImageDecodeError('无法读取图片，文件可能已损坏。'))
    }
    image.src = objectUrl
  })
}
