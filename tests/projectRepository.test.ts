import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import type { BeadColor } from '../src/core'
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  IndexedDbProjectRepository,
  SavedProjectMigrator,
  restoreBeadGrid,
} from '../src/project'
import type { SavedProjectData } from '../src/project'

const colorTable: readonly BeadColor[] = [
  { brandId: 'test', code: 'T01', name: 'Black', red: 20, green: 20, blue: 20 },
]

function data(width = 3, height = 2): SavedProjectData {
  const size = width * height
  return {
    outputWidth: width,
    outputHeight: height,
    colorLimit: 16,
    brandId: 'test',
    boardWidth: 29,
    boardHeight: 29,
    grid: {
      width,
      height,
      originalArgb: Uint32Array.from({ length: size }, (_, index) => 0xff000000 + index),
      matchedColorIndices: Int32Array.from({ length: size }, (_, index) => index === 1 ? -1 : 0),
      colorTable,
    },
  }
}

function repository(): IndexedDbProjectRepository {
  return new IndexedDbProjectRepository(`test-${crypto.randomUUID()}`, new IDBFactory())
}

describe('IndexedDbProjectRepository', () => {
  it('creates and saves a versioned project', async () => {
    const repo = repository()
    const created = repo.createProject('First', data())
    const saved = await repo.saveProject(created)
    expect(saved.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION)
    expect(await repo.listProjects()).toMatchObject([{ id: saved.id, name: 'First', width: 3, height: 2 }])
  })

  it('overwrites the same project without creating a duplicate', async () => {
    const repo = repository()
    const first = await repo.saveProject(repo.createProject('Draft', data()))
    const updated = await repo.saveProject({ ...first, name: 'Final', grid: data(4, 2).grid })
    expect((await repo.listProjects())).toHaveLength(1)
    expect((await repo.loadProject(first.id)).name).toBe('Final')
    expect(updated.grid.width).toBe(4)
  })

  it('sorts project summaries by latest update first', async () => {
    const repo = repository()
    await repo.saveProject(repo.createProject('Older', data()))
    await new Promise((resolve) => setTimeout(resolve, 2))
    await repo.saveProject(repo.createProject('Newer', data()))
    expect((await repo.listProjects()).map((project) => project.name)).toEqual(['Newer', 'Older'])
  })

  it('opens a project and restores independent typed arrays including -1 cells', async () => {
    const repo = repository()
    const saved = await repo.saveProject(repo.createProject('Editable', data()))
    const loaded = await repo.loadProject(saved.id)
    const restored = restoreBeadGrid(loaded.grid)
    expect(restored.originalArgb).toBeInstanceOf(Uint32Array)
    expect(restored.matchedColorIndices).toBeInstanceOf(Int32Array)
    expect(Array.from(restored.matchedColorIndices)).toEqual([0, -1, 0, 0, 0, 0])
    restored.matchedColorIndices[0] = -1
    expect(loaded.grid.matchedColorIndices[0]).toBe(0)
  })

  it('deletes a saved project', async () => {
    const repo = repository()
    const saved = await repo.saveProject(repo.createProject('Delete me', data()))
    await repo.deleteProject(saved.id)
    expect(await repo.listProjects()).toEqual([])
    await expect(repo.loadProject(saved.id)).rejects.toThrow(/不存在/)
  })

  it('round-trips large typed arrays', async () => {
    const repo = repository()
    const saved = await repo.saveProject(repo.createProject('Large', data(200, 200)))
    const loaded = await repo.loadProject(saved.id)
    expect(loaded.grid.originalArgb).toHaveLength(40_000)
    expect(loaded.grid.originalArgb[39_999]).toBe((0xff000000 + 39_999) >>> 0)
    expect(loaded.grid.matchedColorIndices[1]).toBe(-1)
  })
})

describe('SavedProjectMigrator', () => {
  it('accepts the current schema and rejects unsupported future versions', () => {
    const migrator = new SavedProjectMigrator()
    const current = { ...repository().createProject('Current', data()), schemaVersion: 1 }
    expect(migrator.migrate(current).schemaVersion).toBe(1)
    expect(() => migrator.migrate({ ...current, schemaVersion: 99 })).toThrow(/暂不支持/)
  })
})
