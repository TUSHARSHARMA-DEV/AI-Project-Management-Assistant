import React, { createContext, useState, useCallback, useEffect } from 'react'

export const ProjectContext = createContext(null)

/**
 * ProjectProvider - Manages project state and operations
 * Handles multiple projects, tasks, milestones, team members, risks
 */
export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(() => {
    try {
      const stored = localStorage.getItem('projects')
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error('Error loading projects:', err)
      return []
    }
  })

  const [activeProjectId, setActiveProjectId] = useState(() => {
    try {
      const stored = localStorage.getItem('activeProjectId')
      return stored || (projects.length > 0 ? projects[0].id : null)
    } catch {
      return projects.length > 0 ? projects[0].id : null
    }
  })

  // Persist projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('projects', JSON.stringify(projects))
    } catch (err) {
      console.error('Error saving projects:', err)
    }
  }, [projects])

  // Persist active project to localStorage
  useEffect(() => {
    try {
      if (activeProjectId) {
        localStorage.setItem('activeProjectId', activeProjectId)
      }
    } catch (err) {
      console.error('Error saving active project:', err)
    }
  }, [activeProjectId])

  const activeProject = projects.find((p) => p.id === activeProjectId)

  // Create a new project
  const createProject = useCallback((projectData) => {
    const newProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: projectData.name || 'New Project',
      description: projectData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'planning', // planning, in-progress, on-hold, completed
      startDate: projectData.startDate || null,
      endDate: projectData.endDate || null,
      teamMembers: projectData.teamMembers || [],
      tasks: projectData.tasks || [],
      milestones: projectData.milestones || [],
      risks: projectData.risks || [],
      files: projectData.files || [],
      aiSummary: projectData.aiSummary || '',
      metadata: projectData.metadata || {},
    }

    setProjects((current) => [newProject, ...current])
    setActiveProjectId(newProject.id)
    return newProject
  }, [])

  // Update project
  const updateProject = useCallback((projectId, updates) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, ...updates, updatedAt: new Date().toISOString() }
          : project
      )
    )
  }, [])

  // Delete project
  const deleteProject = useCallback((projectId) => {
    setProjects((current) => current.filter((p) => p.id !== projectId))
    if (activeProjectId === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId)
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null)
    }
  }, [activeProjectId, projects])

  // Add task to project
  const addTask = useCallback((projectId, taskData) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium', // low, medium, high, critical
      status: taskData.status || 'todo', // todo, in-progress, in-review, done
      assignee: taskData.assignee || null,
      dueDate: taskData.dueDate || null,
      startDate: taskData.startDate || null,
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: taskData.actualHours || 0,
      dependencies: taskData.dependencies || [],
      tags: taskData.tags || [],
      createdAt: new Date().toISOString(),
    }

    updateProject(projectId, {
      tasks: [...(activeProject?.tasks || []), newTask],
    })

    return newTask
  }, [activeProject, updateProject])

  // Update task
  const updateTask = useCallback(
    (projectId, taskId, updates) => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const updatedTasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )

      updateProject(projectId, { tasks: updatedTasks })
    },
    [projects, updateProject]
  )

  // Delete task
  const deleteTask = useCallback(
    (projectId, taskId) => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const updatedTasks = project.tasks.filter((task) => task.id !== taskId)
      updateProject(projectId, { tasks: updatedTasks })
    },
    [projects, updateProject]
  )

  // Add milestone
  const addMilestone = useCallback(
    (projectId, milestoneData) => {
      const newMilestone = {
        id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: milestoneData.title,
        description: milestoneData.description || '',
        dueDate: milestoneData.dueDate,
        status: milestoneData.status || 'not-started', // not-started, in-progress, completed
        taskIds: milestoneData.taskIds || [],
      }

      updateProject(projectId, {
        milestones: [...(activeProject?.milestones || []), newMilestone],
      })

      return newMilestone
    },
    [activeProject, updateProject]
  )

  // Add team member
  const addTeamMember = useCallback(
    (projectId, memberData) => {
      const newMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: memberData.name,
        role: memberData.role || 'developer',
        email: memberData.email || '',
        avatar: memberData.avatar || null,
      }

      updateProject(projectId, {
        teamMembers: [...(activeProject?.teamMembers || []), newMember],
      })

      return newMember
    },
    [activeProject, updateProject]
  )

  // Add risk
  const addRisk = useCallback(
    (projectId, riskData) => {
      const newRisk = {
        id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: riskData.title,
        description: riskData.description || '',
        severity: riskData.severity || 'medium', // low, medium, high, critical
        probability: riskData.probability || 'medium', // low, medium, high
        mitigation: riskData.mitigation || '',
        owner: riskData.owner || null,
        status: riskData.status || 'open', // open, mitigated, closed
      }

      updateProject(projectId, {
        risks: [...(activeProject?.risks || []), newRisk],
      })

      return newRisk
    },
    [activeProject, updateProject]
  )

  // Add file/attachment
  const addFile = useCallback(
    (projectId, fileData) => {
      const newFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        url: fileData.url, // base64 or actual URL
        uploadedAt: new Date().toISOString(),
      }

      updateProject(projectId, {
        files: [...(activeProject?.files || []), newFile],
      })

      return newFile
    },
    [activeProject, updateProject]
  )

  const value = {
    // State
    projects,
    activeProjectId,
    activeProject,

    // Project operations
    createProject,
    updateProject,
    deleteProject,
    setActiveProjectId,

    // Task operations
    addTask,
    updateTask,
    deleteTask,

    // Milestone operations
    addMilestone,

    // Team operations
    addTeamMember,

    // Risk operations
    addRisk,

    // File operations
    addFile,

    // Helper methods
    getProjectById: (id) => projects.find((p) => p.id === id),
    getTaskById: (taskId) => activeProject?.tasks.find((t) => t.id === taskId),
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const context = React.useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
