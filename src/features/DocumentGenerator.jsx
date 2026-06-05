import { useState } from 'react'
import jsPDF from 'jspdf'
import { useProject } from '../ProjectContext'
import { generateAIResponse } from '../openrouterHelper'
import './DocumentGenerator.css'

/**
 * DocumentGenerator - Generates professional project documents
 * Supports: SRS, BRD, Project Proposal, Sprint Report, Weekly Report
 */
export default function DocumentGenerator() {
  const { activeProject } = useProject()
  const [selectedDocType, setSelectedDocType] = useState('srs')
  const [loading, setLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  const docTypes = {
    srs: { name: 'Software Requirements Specification (SRS)', icon: '📋' },
    brd: { name: 'Business Requirements Document (BRD)', icon: '📊' },
    proposal: { name: 'Project Proposal', icon: '💼' },
    sprint: { name: 'Sprint Report', icon: '🏃' },
    weekly: { name: 'Weekly Status Report', icon: '📅' },
  }

  const generateDocument = async () => {
    if (!activeProject) {
      alert('No project selected')
      return
    }

    setLoading(true)
    try {
      const prompts = {
        srs: `Generate a Software Requirements Specification document for project "${activeProject.name}".
Include: Functional Requirements, Non-Functional Requirements, Use Cases, and System Constraints.
Project has ${activeProject.tasks.length} tasks, ${activeProject.teamMembers.length} team members.`,
        
        brd: `Generate a Business Requirements Document for project "${activeProject.name}".
Description: ${activeProject.description}
Include: Business Objectives, Stakeholders, Success Criteria, Timeline, Budget Considerations.`,
        
        proposal: `Generate a Project Proposal document for "${activeProject.name}".
Description: ${activeProject.description}
Team Size: ${activeProject.teamMembers.length}
Planned Tasks: ${activeProject.tasks.length}
Include: Executive Summary, Scope, Objectives, Timeline, Team, Risk Analysis.`,
        
        sprint: `Generate a Sprint Report for project "${activeProject.name}".
Completed Tasks: ${activeProject.tasks.filter((t) => t.status === 'done').length}
Pending Tasks: ${activeProject.tasks.filter((t) => t.status !== 'done').length}
Include: Sprint Summary, Completed Work, Pending Work, Challenges, Next Steps.`,
        
        weekly: `Generate a Weekly Status Report for project "${activeProject.name}".
Tasks Completed This Week: ${activeProject.tasks.filter((t) => t.status === 'done').length}
Overall Progress: ${Math.round((activeProject.tasks.filter((t) => t.status === 'done').length / activeProject.tasks.length) * 100)}%
Include: Accomplishments, Current Activities, Blockers, Next Week Plan.`,
      }

      let content = ''
      await generateAIResponse(
        prompts[selectedDocType],
        [],
        null,
        (chunk) => {
          content += chunk
        }
      )

      setGeneratedContent(content)
    } catch (err) {
      console.error('Error generating document:', err)
      alert('Failed to generate document: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    if (!generatedContent) {
      alert('No document generated yet')
      return
    }

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin

    // Title
    doc.setFontSize(20)
    doc.setTextColor(99, 102, 241)
    doc.text(`${activeProject.name} - ${docTypes[selectedDocType].name}`, margin, 20)

    // Metadata
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 28)

    // Content
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    const splitContent = doc.splitTextToSize(generatedContent, contentWidth)
    doc.text(splitContent, margin, 35)

    // Save
    doc.save(`${activeProject.name}-${selectedDocType}-${Date.now()}.pdf`)
  }

  const downloadAsText = () => {
    if (!generatedContent) {
      alert('No document generated yet')
      return
    }

    const element = document.createElement('a')
    const file = new Blob([generatedContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${activeProject.name}-${selectedDocType}-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="doc-generator-container">
      <div className="doc-controls">
        <div className="doc-type-selector">
          {Object.entries(docTypes).map(([key, { name, icon }]) => (
            <button
              key={key}
              onClick={() => setSelectedDocType(key)}
              className={`doc-type-btn ${selectedDocType === key ? 'active' : ''}`}
              title={name}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="doc-actions">
          <button
            onClick={generateDocument}
            className="feature-button"
            disabled={!activeProject || loading}
          >
            {loading ? '⏳ Generating...' : '📝 Generate Document'}
          </button>
          {generatedContent && (
            <>
              <button onClick={exportToPDF} className="feature-button secondary">
                📥 Export PDF
              </button>
              <button onClick={downloadAsText} className="feature-button secondary">
                💾 Download Text
              </button>
            </>
          )}
        </div>
      </div>

      {generatedContent && (
        <div className="doc-preview">
          <h3>{docTypes[selectedDocType].name}</h3>
          <div className="doc-content">
            {generatedContent.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
