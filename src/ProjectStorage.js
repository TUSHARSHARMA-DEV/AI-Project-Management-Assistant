/**
 * ProjectStorage - Utility functions for managing project data persistence
 * Handles loading, saving, and managing multiple projects
 */

const PROJECTS_STORAGE_KEY = 'ai_projects'
const ACTIVE_PROJECT_KEY = 'ai_active_project'

/**
 * Get all projects from storage
 */
export function loadProjects() {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (err) {
    console.error('Error loading projects:', err)
    return []
  }
}

/**
 * Save projects to storage
 */
export function saveProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
    return true
  } catch (err) {
    console.error('Error saving projects:', err)
    return false
  }
}

/**
 * Get active project ID from storage
 */
export function getActiveProjectId() {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY)
  } catch (err) {
    console.error('Error getting active project ID:', err)
    return null
  }
}

/**
 * Set active project ID in storage
 */
export function setActiveProjectId(projectId) {
  try {
    if (projectId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
    return true
  } catch (err) {
    console.error('Error setting active project ID:', err)
    return false
  }
}

/**
 * Export project to JSON
 */
export function exportProjectToJSON(project) {
  const dataStr = JSON.stringify(project, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name}-export-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import project from JSON file
 */
export function importProjectFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result)
        // Ensure all required fields exist
        if (!project.id || !project.name) {
          throw new Error('Invalid project file format')
        }
        resolve(project)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Get project statistics
 */
export function getProjectStats(project) {
  if (!project) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      progressPercent: 0,
      overdueTasks: 0,
      teamSize: 0,
      activeMilestones: 0,
      openRisks: 0,
    }
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((t) => t.status === 'done').length
  const pendingTasks = totalTasks - completedTasks
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const now = new Date()
  const overdueTasks = project.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
  ).length

  const teamSize = project.teamMembers.length
  const activeMilestones = project.milestones.filter((m) => m.status !== 'completed').length
  const openRisks = project.risks.filter((r) => r.status === 'open').length

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    progressPercent,
    overdueTasks,
    teamSize,
    activeMilestones,
    openRisks,
  }
}

/**
 * Parse tasks from AI response
 * Looks for structured task-like information in the text
 */
export function extractTasksFromText(text) {
  const tasks = []
  
  // Look for patterns like "Task:", "TODO:", numbered lists, etc.
  const taskPatterns = [
    /(?:^|\n)\s*(?:Task|TODO|Action)[\s:]*(.+?)(?=\n|$)/gi,
    /(?:^|\n)\s*(?:\d+\.)\s*(.+?)(?=\n|$)/gm,
    /(?:^|\n)\s*[-*]\s*(.+?)(?=\n|$)/gm,
  ]

  const foundTitles = new Set()

  for (const pattern of taskPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const title = match[1].trim()
      if (title && title.length < 200 && !foundTitles.has(title)) {
        foundTitles.add(title)
        tasks.push({
          title,
          description: '',
          priority: 'medium',
          status: 'todo',
          assignee: null,
          dueDate: null,
          estimatedHours: 0,
        })
      }
    }
  }

  return tasks
}

/**
 * Generate AI summary from project data
 * Creates a concise overview of the project
 */
export function generateProjectSummary(project) {
  if (!project) return ''

  const stats = getProjectStats(project)
  const statusLine = `Status: ${project.status.toUpperCase()} | Progress: ${stats.progressPercent}%`
  const taskLine = `Tasks: ${stats.completedTasks}/${stats.totalTasks} completed`
  const teamLine = `Team: ${stats.teamSize} member${stats.teamSize !== 1 ? 's' : ''}`
  const risksLine = stats.openRisks > 0 ? ` | ⚠️ ${stats.openRisks} open risk${stats.openRisks !== 1 ? 's' : ''}` : ''

  return `${statusLine}\n${taskLine}\n${teamLine}${risksLine}`
}

/**
 * Calculate project timeline
 */
export function calculateTimeline(project) {
  if (!project || project.tasks.length === 0) {
    return {
      startDate: null,
      endDate: null,
      durationDays: 0,
    }
  }

  const dates = project.tasks
    .filter((t) => t.dueDate)
    .map((t) => new Date(t.dueDate))
    .filter((d) => !isNaN(d.getTime()))

  if (dates.length === 0) {
    return {
      startDate: null,
      endDate: null,
      durationDays: 0,
    }
  }

  const startDate = new Date(Math.min(...dates))
  const endDate = new Date(Math.max(...dates))
  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    durationDays,
  }
}
