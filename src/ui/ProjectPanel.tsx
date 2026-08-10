import { useEffect, useState } from 'react'
import { IndexedDbProjectRepository } from '../project'
import type { ProjectSummary, SavedProject, SavedProjectData } from '../project'

const repository = new IndexedDbProjectRepository()

interface ProjectPanelProps {
  readonly projectData: SavedProjectData | null
  readonly onNewProject: () => void
  readonly onOpenProject: (project: SavedProject) => void
}

export function ProjectPanel({ projectData, onNewProject, onOpenProject }: ProjectPanelProps) {
  const [projects, setProjects] = useState<readonly ProjectSummary[]>([])
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null)
  const [name, setName] = useState('我的拼豆项目')
  const [status, setStatus] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const refresh = async () => setProjects(await repository.listProjects())
  useEffect(() => { void refresh().catch((error) => setStatus(messageOf(error))) }, [])

  const run = async (operation: () => Promise<void>) => {
    if (isBusy) return
    setIsBusy(true)
    setStatus(null)
    try { await operation() } catch (error) { setStatus(messageOf(error)) } finally { setIsBusy(false) }
  }

  const save = async () => {
    if (!projectData) throw new Error('请先生成拼豆网格再保存项目。')
    const draft = currentProject
      ? { ...currentProject, ...projectData, name: name.trim() || currentProject.name }
      : repository.createProject(name, projectData)
    const saved = await repository.saveProject(draft)
    setCurrentProject(saved)
    setName(saved.name)
    await refresh()
    setStatus('项目已保存在此浏览器中。')
  }

  return (
    <section className="project-card" aria-labelledby="project-title">
      <div className="project-heading">
        <div><p className="section-label">LOCAL PROJECTS</p><h2 id="project-title">项目</h2></div>
        <button type="button" disabled={isBusy} onClick={() => {
          setCurrentProject(null)
          setName('我的拼豆项目')
          setStatus('已新建空白项目。')
          onNewProject()
        }}>新建项目</button>
      </div>
      <p className="local-only-note">项目仅保存在此浏览器设备中，不会上传服务器。</p>
      <div className="project-save-row">
        <label>项目名称<input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
        <button type="button" disabled={isBusy || !projectData} onClick={() => void run(save)}>保存当前项目</button>
      </div>
      {status && <p className="project-status" role="status">{status}</p>}
      <div className="project-list">
        {projects.length === 0 ? <p>暂无本地项目。</p> : projects.map((project) => (
          <article key={project.id}>
            <div><strong>{project.name}</strong><span>{formatDate(project.updatedAt)} · {project.width} × {project.height}</span></div>
            <div className="project-actions">
              <button type="button" disabled={isBusy} onClick={() => void run(async () => {
                const loaded = await repository.loadProject(project.id)
                setCurrentProject(loaded)
                setName(loaded.name)
                onOpenProject(loaded)
                setStatus('项目已打开。')
              })}>打开</button>
              <button className="delete" type="button" disabled={isBusy} onClick={() => void run(async () => {
                await repository.deleteProject(project.id)
                if (currentProject?.id === project.id) setCurrentProject(null)
                await refresh()
                setStatus('项目已删除。')
              })}>删除</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '项目操作失败。'
}
