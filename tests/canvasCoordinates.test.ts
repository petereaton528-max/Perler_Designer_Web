import { describe, expect, it } from 'vitest'
import { locateGridCell } from '../src/grid/canvasCoordinates'

describe('locateGridCell', () => {
  it('locates a 40x40 cell when CSS scales the Canvas to half size', () => {
    expect(locateGridCell({
      clientX: 100 + 12.5 * 8, clientY: 50 + 8.5 * 8,
      rectLeft: 100, rectTop: 50, rectWidth: 320, rectHeight: 320,
      canvasWidth: 640, canvasHeight: 640, gridWidth: 40, gridHeight: 40,
    })).toEqual({ x: 12, y: 8 })
  })

  it('locates an 80x80 cell with a different backing-store scale', () => {
    expect(locateGridCell({
      clientX: 25 + 41.25 * 5, clientY: 10 + 63.5 * 5,
      rectLeft: 25, rectTop: 10, rectWidth: 400, rectHeight: 400,
      canvasWidth: 800, canvasHeight: 800, gridWidth: 80, gridHeight: 80,
    })).toEqual({ x: 41, y: 63 })
  })

  it('locates a cell in a non-square 60x40 grid', () => {
    expect(locateGridCell({
      clientX: 10 + 59.5 * 6, clientY: 20 + 39.5 * 6,
      rectLeft: 10, rectTop: 20, rectWidth: 360, rectHeight: 240,
      canvasWidth: 720, canvasHeight: 480, gridWidth: 60, gridHeight: 40,
    })).toEqual({ x: 59, y: 39 })
  })

  it('rejects clicks exactly on or outside the right and bottom edges', () => {
    const base = {
      rectLeft: 10, rectTop: 20, rectWidth: 320, rectHeight: 320,
      canvasWidth: 640, canvasHeight: 640, gridWidth: 40, gridHeight: 40,
    }
    expect(locateGridCell({ ...base, clientX: 330, clientY: 100 })).toBeNull()
    expect(locateGridCell({ ...base, clientX: 100, clientY: 340 })).toBeNull()
    expect(locateGridCell({ ...base, clientX: 9, clientY: 100 })).toBeNull()
  })
})
