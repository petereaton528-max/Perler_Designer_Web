export const PALETTE_SOURCES = {
  artkalS5mm: {
    page: 'https://www.artkalfusebeads.com/pages/s-color-chart',
    rgbFile: 'https://cdn.shopify.com/s/files/1/1323/8195/files/S_MIDI_Beads_RGB_Color_Chart_2024.pdf?v=1744686607',
    expectedColors: 225,
    checkedAt: '2026-08-10',
  },
  artkalC26mm: {
    page: 'https://www.artkalfusebeads.com/pages/c-color-chart',
    rgbFile: 'https://cdn.shopify.com/s/files/1/1323/8195/files/C_MINI_Beads_RGB_Color_Chart_2024.pdf?v=1744700289',
    expectedColors: 197,
    checkedAt: '2026-08-10',
  },
  beadColorsMard: {
    repository: 'https://github.com/maxcleme/beadcolors',
    rawFile: 'https://raw.githubusercontent.com/maxcleme/beadcolors/refs/heads/master/raw/mard.csv',
    license: 'MIT',
    licenseFile: 'https://github.com/maxcleme/beadcolors/blob/master/LICENSE',
    copyright: 'Copyright (c) 2020 maxcleme',
    expectedColors: 291,
    contributor: 'Asher',
    checkedAt: '2026-08-10',
  },
} as const
