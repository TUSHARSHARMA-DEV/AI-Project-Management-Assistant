import { useState } from 'react'
import { useProject } from './ProjectContext'
import './ProjectPanel.css'

/**
 * ProjectPanel - Main UI for managing projects and accessing features
 */
export default function ProjectPanel({ onTabChange }) {
  const {
    projects,
    activeProject,
    activeProjectId,
    createProject,
    setActiveProjectId,
    deleteProject,
    updateProject,
  } = useProject()

  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleCreateProject = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Project name is required')
      return
    }
    createProject(formData)
    setFormData({ name: '', description: '' })
    setShowNewProjectForm(false)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  return (
    <div className="project-panel">
      <div className="project-sidebar">
        <div className="projects-header">
          <h3>Projects</h3>
          <button
            className="new-project-btn"
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            title="New Project"
          >
            +
          </button>
        </div>

        {showNewProjectForm && (
          <form className="new-project-form" onSubmit={handleCreateProject}>
            <input
              type="text"
              name="name"
              placeholder="Project name..."
              value={formData.name}
              onChange={handleFormChange}
              autoFocus
            />
            <textarea
              name="description"
              placeholder="Description (optional)..."
              value={formData.description}
              onChange={handleFormChange}
              rows={2}
            />
            <div className="form-buttons">
              <button type="submit" className="btn-create">
                Create
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowNewProjectForm(false)
                  setFormData({ name: '', description: '' })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="projects-list">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
            >
              <button
                className="project-name"
                onClick={() => setActiveProjectId(project.id)}
                title={project.name}
              >
                {project.name}
              </button>
              <button
                className="project-delete"
                onClick={() => {
                  if (confirm(`Delete "${project.name}"?`)) {
                    deleteProject(project.id)
                  }
                }}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {projects.length === 0 && !showNewProjectForm && (
          <div className="empty-projects">
            <p>No projects yet. Create one to get started!</p>
          </div>
        )}
      </div>

      <div className="project-content">
        {activeProject ? (
          <>
            <div className="content-header">
              <div>
                <h2>{activeProject.name}</h2>
                <p className="project-description">{activeProject.description}</p>
              </div>
              <div className="project-status">
                <select
                  value={activeProject.status}
                  onChange={(e) =>
                    updateProject(activeProjectId, { status: e.target.value })
                  }
                  className="status-select"
                >
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="tabs">
              <button
                className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                📊 Dashboard
              </button>
              <button
                className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => handleTabChange('timeline')}
              >
                📅 Timeline
              </button>
              <button
                className={`tab ${activeTab === 'mindmap' ? 'active' : ''}`}
                onClick={() => handleTabChange('mindmap')}
              >
                🧠 Mind Map
              </button>
              <button
                className={`tab ${activeTab === 'architecture' ? 'active' : ''}`}
                onClick={() => handleTabChange('architecture')}
              >
                🏗️ Architecture
              </button>
              <button
                className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleTabChange('tasks')}
              >
                ✨ AI Tasks
              </button>
              <button
                className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => handleTabChange('documents')}
              >
                📝 Documents
              </button>
              <button
                className={`tab ${activeTab === 'risks' ? 'active' : ''}`}
                onClick={() => handleTabChange('risks')}
              >
                🎯 Risks
              </button>
            </div>
          </>
        ) : (
          <div className="no-project">
            <p>Select or create a project to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
