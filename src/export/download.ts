export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export function createExportBaseName(name: string | null): string {
  const withoutExtension = (name ?? 'perler-design').replace(/\.[^.]+$/, '')
  const safe = withoutExtension.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, '-').replace(/^-+|-+$/g, '')
  return safe || 'perler-design'
}
