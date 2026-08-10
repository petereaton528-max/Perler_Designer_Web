import { CURRENT_PROJECT_SCHEMA_VERSION } from './ProjectRepository'
import type { SavedProject } from './ProjectRepository'

export class SavedProjectMigrator {
  migrate(value: unknown): SavedProject {
    if (!isRecord(value)) throw new Error('项目数据格式无效。')
    const version = value.schemaVersion
    if (!Number.isInteger(version)) throw new Error('项目缺少有效的 schemaVersion。')
    if ((version as number) > CURRENT_PROJECT_SCHEMA_VERSION) {
      throw new Error(`项目版本 ${version} 暂不支持，请更新 Perler Designer 后再打开。`)
    }
    if (version !== 1) throw new Error(`无法迁移项目版本 ${version}。`)
    return value as unknown as SavedProject
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
