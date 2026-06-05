import { useState } from 'react'
import mermaid from 'mermaid'
import { useProject } from '../ProjectContext'
import './ArchitectureGenerator.css'

/**
 * ArchitectureGenerator - Creates system architecture diagrams
 */
export default function ArchitectureGenerator() {
  const { activeProject } = useProject()
  const [architectureCode, setArchitectureCode] = useState('')
  const [showVisualization, setShowVisualization] = useState(false)

  const generateArchitecture = () => {
    if (!activeProject) {
      alert('No project selected')
      return
    }

    // Generate architecture diagram from project structure
    // This is a basic template - can be customized based on project metadata
    let diagramCode = `graph TD\n`

    // Define main components based on project scope
    const components = {
      'Frontend': { id: 'FE', color: '#667eea' },
      'Backend API': { id: 'API', color: '#764ba2' },
      'Database': { id: 'DB', color: '#f093fb' },
      'Cache': { id: 'CACHE', color: '#4facfe' },
      'Analytics': { id: 'ANALYTICS', color: '#00f2fe' },
    }

    // Add nodes
    Object.entries(components).forEach(([name, { id }]) => {
      diagramCode += `  ${id}["${name}"]\n`
    })

    // Add connections
    diagramCode += `  FE -->|REST/GraphQL| API\n`
    diagramCode += `  API -->|Query/Write| DB\n`
    diagramCode += `  API -->|Cache| CACHE\n`
    diagramCode += `  API -->|Track Events| ANALYTICS\n`
    diagramCode += `  CACHE -->|Return| FE\n`

    // Add services if team has specific roles
    const roles = new Set(activeProject.teamMembers.map((m) => m.role))
    diagramCode += `\n  style FE fill:#667eea,stroke:#333,stroke-width:2px,color:#fff\n`
    diagramCode += `  style API fill:#764ba2,stroke:#333,stroke-width:2px,color:#fff\n`
    diagramCode += `  style DB fill:#f093fb,stroke:#333,stroke-width:2px,color:#fff\n`
    diagramCode += `  style CACHE fill:#4facfe,stroke:#333,stroke-width:2px,color:#fff\n`
    diagramCode += `  style ANALYTICS fill:#00f2fe,stroke:#333,stroke-width:2px,color:#333\n`

    setArchitectureCode(diagramCode)
    setShowVisualization(true)

    setTimeout(() => {
      mermaid.contentLoaded()
    }, 100)
  }

  const exportArchitecture = async () => {
    const element = document.querySelector('.architecture-mermaid')
    if (!element) {
      alert('No architecture diagram generated yet')
      return
    }

    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.href = canvas.toDataURL()
      link.download = `architecture-${activeProject.name}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error exporting architecture:', err)
      alert('Failed to export architecture diagram')
    }
  }

  return (
    <div className="architecture-container">
      <div className="architecture-controls">
        <button onClick={generateArchitecture} className="feature-button" disabled={!activeProject}>
          🏗️ Generate Architecture
        </button>
        {showVisualization && (
          <button onClick={exportArchitecture} className="feature-button secondary">
            💾 Export as Image
          </button>
        )}
      </div>

      {showVisualization && architectureCode && (
        <div className="architecture-visualization">
          <div className="architecture-mermaid mermaid">{architectureCode}</div>
        </div>
      )}
    </div>
  )
}
