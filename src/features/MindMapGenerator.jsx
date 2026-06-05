import { useState } from 'react'
import mermaid from 'mermaid'
import { useProject } from '../ProjectContext'
import './MindMapGenerator.css'

/**
 * MindMapGenerator - Creates visual mind maps from project structure
 * Uses Mermaid for rendering
 */
export default function MindMapGenerator() {
  const { activeProject } = useProject()
  const [mindMapMermaid, setMindMapMermaid] = useState('')
  const [showVisualization, setShowVisualization] = useState(false)

  const generateMindMap = () => {
    if (!activeProject) {
      alert('No project selected')
      return
    }

    // Build mind map structure from project data
    let mermaidCode = `mindmap\n  root((${activeProject.name}))\n`

    // Add project status and basics
    mermaidCode += `    Project Status: ${activeProject.status}\n`

    // Add tasks grouped by status
    const tasksByStatus = {}
    activeProject.tasks.forEach((task) => {
      if (!tasksByStatus[task.status]) {
        tasksByStatus[task.status] = []
      }
      tasksByStatus[task.status].push(task)
    })

    Object.entries(tasksByStatus).forEach(([status, tasks]) => {
      mermaidCode += `    ${status.charAt(0).toUpperCase() + status.slice(1)}\n`
      tasks.slice(0, 5).forEach((task) => {
        const title = task.title.substring(0, 30)
        mermaidCode += `      ${title}\n`
      })
      if (tasks.length > 5) {
        mermaidCode += `      ... and ${tasks.length - 5} more\n`
      }
    })

    // Add milestones
    if (activeProject.milestones.length > 0) {
      mermaidCode += `    Milestones\n`
      activeProject.milestones.slice(0, 5).forEach((milestone) => {
        const title = milestone.title.substring(0, 25)
        mermaidCode += `      ${title}\n`
      })
    }

    // Add team
    if (activeProject.teamMembers.length > 0) {
      mermaidCode += `    Team (${activeProject.teamMembers.length} members)\n`
      activeProject.teamMembers.slice(0, 5).forEach((member) => {
        mermaidCode += `      ${member.name} - ${member.role}\n`
      })
    }

    // Add risks
    if (activeProject.risks.length > 0) {
      const openRisks = activeProject.risks.filter((r) => r.status === 'open')
      if (openRisks.length > 0) {
        mermaidCode += `    Risks (${openRisks.length} open)\n`
        openRisks.slice(0, 5).forEach((risk) => {
          const title = risk.title.substring(0, 25)
          mermaidCode += `      ${title}\n`
        })
      }
    }

    setMindMapMermaid(mermaidCode)
    setShowVisualization(true)

    // Initialize mermaid rendering
    setTimeout(() => {
      mermaid.contentLoaded()
    }, 100)
  }

  const exportMindMap = async () => {
    const element = document.querySelector('.mermaid')
    if (!element) {
      alert('No mind map generated yet')
      return
    }

    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.href = canvas.toDataURL()
      link.download = `mindmap-${activeProject.name}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error exporting mind map:', err)
      alert('Failed to export mind map')
    }
  }

  return (
    <div className="mindmap-container">
      <div className="mindmap-controls">
        <button onClick={generateMindMap} className="feature-button" disabled={!activeProject}>
          🧠 Generate Mind Map
        </button>
        {showVisualization && (
          <button onClick={exportMindMap} className="feature-button secondary">
            💾 Export as Image
          </button>
        )}
      </div>

      {showVisualization && mindMapMermaid && (
        <div className="mindmap-visualization">
          <div className="mermaid">{mindMapMermaid}</div>
        </div>
      )}
    </div>
  )
}
