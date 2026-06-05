import { useEffect, useState } from 'react'
import { useProject } from '../ProjectContext'
import ProjectDashboard from '../ProjectDashboard'
import GanttChart from './GanttChart'
import MindMapGenerator from './MindMapGenerator'
import ArchitectureGenerator from './ArchitectureGenerator'
import AITaskGenerator from './AITaskGenerator'
import DocumentGenerator from './DocumentGenerator'
import RiskAnalysis from './RiskAnalysis'
import PDFExportButton from './PDFExporter'
import './ProjectFeatures.css'

/**
 * ProjectFeatures - Main container for all project management features
 */
export default function ProjectFeatures({ activeTab }) {
  const { activeProject } = useProject()

  useEffect(() => {
    // Initialize mermaid when component mounts or activeTab changes
    if (typeof window !== 'undefined' && window.mermaid) {
      window.mermaid.contentLoaded()
    }
  }, [activeTab])

  if (!activeProject) {
    return (
      <div className="features-empty">
        <p>Select a project to access features</p>
      </div>
    )
  }

  return (
    <div className="project-features">
      {activeTab === 'dashboard' && <ProjectDashboard />}
      {activeTab === 'timeline' && <GanttChart />}
      {activeTab === 'mindmap' && <MindMapGenerator />}
      {activeTab === 'architecture' && <ArchitectureGenerator />}
      {activeTab === 'tasks' && <AITaskGenerator />}
      {activeTab === 'documents' && <DocumentGenerator />}
      {activeTab === 'risks' && <RiskAnalysis />}

      {/* Floating action buttons for quick access */}
      <div className="floating-actions">
        <PDFExportButton />
      </div>
    </div>
  )
}
