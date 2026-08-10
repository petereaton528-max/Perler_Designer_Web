import { describe, expect, it } from 'vitest'
import type { BeadGrid } from '../src/core'
import { DefaultBoardLayoutPlanner } from '../src/grid'

const planner = new DefaultBoardLayoutPlanner()

function createGrid(width: number, height: number): BeadGrid {
  const size = width * height
  return {
    width,
    height,
    originalArgb: Uint32Array.from({ length: size }, (_, index) => 0xff000000 + index),
    matchedColorIndices: Int32Array.from({ length: size }, (_, index) => index % 7),
    colorTable: [],
  }
}

describe('DefaultBoardLayoutPlanner', () => {
  it('splits a 40x40 grid into four 29x29 boards with smaller edges', () => {
    const pieces = planner.split(createGrid(40, 40), 29, 29)

    expect(pieces).toHaveLength(4)
    expect(pieces.map(({ number, row, column, width, height }) => (
      { number, row, column, width, height }
    ))).toEqual([
      { number: 1, row: 0, column: 0, width: 29, height: 29 },
      { number: 2, row: 0, column: 1, width: 11, height: 29 },
      { number: 3, row: 1, column: 0, width: 29, height: 11 },
      { number: 4, row: 1, column: 1, width: 11, height: 11 },
    ])
  })

  it('splits an 80x80 grid row-first into nine boards', () => {
    const pieces = planner.split(createGrid(80, 80), 29, 29)

    expect(pieces).toHaveLength(9)
    expect(pieces[2]).toMatchObject({ number: 3, row: 0, column: 2, width: 22, height: 29 })
    expect(pieces[8]).toMatchObject({ number: 9, row: 2, column: 2, width: 22, height: 22 })
  })

  it('supports custom board sizes and incomplete edges', () => {
    const pieces = planner.split(createGrid(23, 17), 10, 8)

    expect(pieces).toHaveLength(9)
    expect(pieces[8]).toMatchObject({ row: 2, column: 2, width: 3, height: 1 })
  })

  it('handles non-square grids', () => {
    const pieces = planner.split(createGrid(60, 40), 29, 29)

    expect(pieces).toHaveLength(6)
    expect(pieces[5]).toMatchObject({ row: 1, column: 2, width: 2, height: 11 })
  })

  it('copies both grid arrays into independent, correctly positioned slices', () => {
    const source = createGrid(4, 3)
    const originalBefore = Array.from(source.originalArgb)
    const matchedBefore = Array.from(source.matchedColorIndices)
    const pieces = planner.split(source, 3, 2)

    expect(Array.from(pieces[0].grid.originalArgb)).toEqual([
      source.originalArgb[0], source.originalArgb[1], source.originalArgb[2],
      source.originalArgb[4], source.originalArgb[5], source.originalArgb[6],
    ])
    expect(Array.from(pieces[0].grid.matchedColorIndices)).toEqual([0, 1, 2, 4, 5, 6])
    expect(Array.from(pieces[3].grid.originalArgb)).toEqual([source.originalArgb[11]])

    pieces[0].grid.originalArgb[0] = 0
    pieces[0].grid.matchedColorIndices[0] = -1
    expect(Array.from(source.originalArgb)).toEqual(originalBefore)
    expect(Array.from(source.matchedColorIndices)).toEqual(matchedBefore)
  })

  it('rejects custom board sizes outside 1..200', () => {
    expect(() => planner.split(createGrid(2, 2), 0, 29)).toThrow()
    expect(() => planner.split(createGrid(2, 2), 29, 201)).toThrow()
  })
})
