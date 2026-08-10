export interface LabColor {
  readonly l: number
  readonly a: number
  readonly b: number
}

/** Converts an 8-bit sRGB color to CIELAB using the D65 reference white. */
export function rgbToLab(red: number, green: number, blue: number): LabColor {
  const r = linearize(clampChannel(red) / 255)
  const g = linearize(clampChannel(green) / 255)
  const b = linearize(clampChannel(blue) / 255)

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883
  const fx = labCurve(x)
  const fy = labCurve(y)
  const fz = labCurve(z)
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

function clampChannel(value: number): number {
  if (!Number.isFinite(value)) throw new Error('RGB 通道必须是有限数字。')
  return Math.min(255, Math.max(0, value))
}

function linearize(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function labCurve(value: number): number {
  const epsilon = 216 / 24389
  const kappa = 24389 / 27
  return value > epsilon ? Math.cbrt(value) : (kappa * value + 16) / 116
}
