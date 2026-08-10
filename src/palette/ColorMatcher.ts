import type { BeadGrid, BeadPalette } from '../core'

export interface ColorMatcher {
  match(grid: BeadGrid, palette: BeadPalette): Promise<BeadGrid>
}
