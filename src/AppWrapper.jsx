import { useState } from 'react'
import { ProjectProvider, useProject } from './ProjectContext'
import ProjectPanel from './ProjectPanel'
import ProjectFeatures from './features/ProjectFeatures'
import App from './App'
import './AppWrapper.css'

/**
 * AppWrapper - Integrates chat and project management into a unified interface
 */
function AppContent() {
  const [mode, setMode] = useState('chat') // 'chat' or 'projects'
  const [activeTab, setActiveTab] = useState('dashboard')
  const { projects } = useProject()

  return (
    <div className="app-wrapper">
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
          onClick={() => setMode('chat')}
          title="Chat Mode"
        >
          💬 Chat
        </button>
        <button
          className={`mode-btn ${mode === 'projects' ? 'active' : ''}`}
          onClick={() => setMode('projects')}
          title="Project Management"
        >
          📊 Projects {projects.length > 0 && `(${projects.length})`}
        </button>
      </div>

      <div className="content-area">
        {mode === 'chat' && <App />}
        {mode === 'projects' && (
          <div className="projects-mode">
            <ProjectPanel onTabChange={setActiveTab} />
            <div className="features-container">
              <ProjectFeatures activeTab={activeTab} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Export wrapped app with ProjectProvider
 */
export default function AppWrapper() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  )
}
