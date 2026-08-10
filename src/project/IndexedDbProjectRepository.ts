import { SavedProjectMigrator } from './SavedProjectMigrator'
import { CURRENT_PROJECT_SCHEMA_VERSION } from './ProjectRepository'
import type { ProjectRepository, ProjectSummary, SavedProject, SavedProjectData } from './ProjectRepository'

const DEFAULT_DATABASE_NAME = 'perler-designer-projects'
const STORE_NAME = 'projects'

export class IndexedDbProjectRepository implements ProjectRepository {
  private readonly writeQueues = new Map<string, Promise<unknown>>()
  private readonly migrator = new SavedProjectMigrator()
  private readonly databaseName: string
  private readonly indexedDb: IDBFactory

  constructor(
    databaseName = DEFAULT_DATABASE_NAME,
    indexedDbFactory: IDBFactory = indexedDB,
  ) {
    this.databaseName = databaseName
    this.indexedDb = indexedDbFactory
  }

  createProject(name: string, data: SavedProjectData): SavedProject {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('项目名称不能为空。')
    const now = Date.now()
    return {
      ...data,
      id: createId(),
      name: trimmedName,
      createdAt: now,
      updatedAt: now,
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    }
  }

  async listProjects(): Promise<readonly ProjectSummary[]> {
    const database = await this.openDatabase()
    try {
      const records = await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll())
      return records
        .map((record) => this.migrator.migrate(record))
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .map((project) => ({
          id: project.id,
          name: project.name,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          width: project.grid.width,
          height: project.grid.height,
        }))
    } catch (error) {
      throw repositoryError('读取项目列表失败', error)
    } finally {
      database.close()
    }
  }

  saveProject(project: SavedProject): Promise<SavedProject> {
    return this.enqueueWrite(project.id, async () => {
      const database = await this.openDatabase()
      const saved = { ...project, updatedAt: Date.now(), schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION }
      try {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        transaction.objectStore(STORE_NAME).put(saved)
        await transactionComplete(transaction)
        return saved
      } catch (error) {
        throw repositoryError('保存项目失败，原项目未被修改', error)
      } finally {
        database.close()
      }
    })
  }

  async loadProject(id: string): Promise<SavedProject> {
    const database = await this.openDatabase()
    try {
      const record = await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).get(id))
      if (!record) throw new Error('项目不存在或已被删除。')
      return this.migrator.migrate(record)
    } catch (error) {
      throw repositoryError('打开项目失败', error)
    } finally {
      database.close()
    }
  }

  deleteProject(id: string): Promise<void> {
    return this.enqueueWrite(id, async () => {
      const database = await this.openDatabase()
      try {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        transaction.objectStore(STORE_NAME).delete(id)
        await transactionComplete(transaction)
      } catch (error) {
        throw repositoryError('删除项目失败', error)
      } finally {
        database.close()
      }
    })
  }

  private async openDatabase(): Promise<IDBDatabase> {
    try {
      const request = this.indexedDb.open(this.databaseName, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
      return await requestResult(request)
    } catch (error) {
      throw repositoryError('无法打开浏览器本地项目数据库', error)
    }
  }

  private enqueueWrite<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.writeQueues.get(id) ?? Promise.resolve()
    const current = previous.catch(() => undefined).then(operation)
    this.writeQueues.set(id, current)
    void current.finally(() => {
      if (this.writeQueues.get(id) === current) this.writeQueues.delete(id)
    }).catch(() => undefined)
    return current
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败。'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 事务已中止。'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB 事务失败。'))
  })
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function repositoryError(message: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error)
  return new Error(`${message}：${detail}`)
}
