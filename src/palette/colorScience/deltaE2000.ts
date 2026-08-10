import type { LabColor } from './rgbToLab'

const DEG = Math.PI / 180

/** CIEDE2000 color difference with the standard kL=kC=kH=1 weighting. */
export function deltaE2000(left: LabColor, right: LabColor): number {
  const c1 = Math.hypot(left.a, left.b)
  const c2 = Math.hypot(right.a, right.b)
  const meanC = (c1 + c2) / 2
  const g = 0.5 * (1 - Math.sqrt(meanC ** 7 / (meanC ** 7 + 25 ** 7)))
  const a1Prime = (1 + g) * left.a
  const a2Prime = (1 + g) * right.a
  const c1Prime = Math.hypot(a1Prime, left.b)
  const c2Prime = Math.hypot(a2Prime, right.b)
  const h1Prime = hueDegrees(left.b, a1Prime)
  const h2Prime = hueDegrees(right.b, a2Prime)

  const deltaLPrime = right.l - left.l
  const deltaCPrime = c2Prime - c1Prime
  const deltaHPrimeDegrees = hueDifference(h1Prime, h2Prime, c1Prime, c2Prime)
  const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(deltaHPrimeDegrees * DEG / 2)
  const meanLPrime = (left.l + right.l) / 2
  const meanCPrime = (c1Prime + c2Prime) / 2
  const meanHPrime = meanHue(h1Prime, h2Prime, c1Prime, c2Prime)

  const t = 1
    - 0.17 * Math.cos((meanHPrime - 30) * DEG)
    + 0.24 * Math.cos(2 * meanHPrime * DEG)
    + 0.32 * Math.cos((3 * meanHPrime + 6) * DEG)
    - 0.20 * Math.cos((4 * meanHPrime - 63) * DEG)
  const deltaTheta = 30 * Math.exp(-(((meanHPrime - 275) / 25) ** 2))
  const rc = 2 * Math.sqrt(meanCPrime ** 7 / (meanCPrime ** 7 + 25 ** 7))
  const sl = 1 + 0.015 * (meanLPrime - 50) ** 2 / Math.sqrt(20 + (meanLPrime - 50) ** 2)
  const sc = 1 + 0.045 * meanCPrime
  const sh = 1 + 0.015 * meanCPrime * t
  const rt = -Math.sin(2 * deltaTheta * DEG) * rc
  const lTerm = deltaLPrime / sl
  const cTerm = deltaCPrime / sc
  const hTerm = deltaHPrime / sh
  return Math.sqrt(lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + rt * cTerm * hTerm)
}

function hueDegrees(b: number, aPrime: number): number {
  if (aPrime === 0 && b === 0) return 0
  const value = Math.atan2(b, aPrime) / DEG
  return value >= 0 ? value : value + 360
}

function hueDifference(h1: number, h2: number, c1: number, c2: number): number {
  if (c1 * c2 === 0) return 0
  const difference = h2 - h1
  if (Math.abs(difference) <= 180) return difference
  return difference > 180 ? difference - 360 : difference + 360
}

function meanHue(h1: number, h2: number, c1: number, c2: number): number {
  if (c1 * c2 === 0) return h1 + h2
  if (Math.abs(h1 - h2) <= 180) return (h1 + h2) / 2
  return h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2
}
