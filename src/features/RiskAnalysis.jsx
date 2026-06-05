import { useState } from 'react'
import { useProject } from '../ProjectContext'
import { generateAIResponse } from '../openrouterHelper'
import './RiskAnalysis.css'

/**
 * RiskAnalysis - AI-powered risk analysis for projects
 */
export default function RiskAnalysis() {
  const { activeProject, addRisk } = useProject()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [riskSuggestions, setRiskSuggestions] = useState([])
  const [selectedRisks, setSelectedRisks] = useState(new Set())

  const analyzeProjectRisks = async () => {
    if (!activeProject) {
      alert('No project selected')
      return
    }

    setLoading(true)
    try {
      const overdueTasks = activeProject.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      )

      const prompt = `Analyze risks for project "${activeProject.name}".
Project Status: ${activeProject.status}
Total Tasks: ${activeProject.tasks.length}
Completed Tasks: ${activeProject.tasks.filter((t) => t.status === 'done').length}
Overdue Tasks: ${overdueTasks.length}
Team Size: ${activeProject.teamMembers.length}
Active Milestones: ${activeProject.milestones.filter((m) => m.status !== 'completed').length}

Please provide:
1. Executive Risk Summary (2-3 sentences)
2. Top 5 specific risks with severity (HIGH/MEDIUM/LOW) and mitigation strategies
Format each risk as:
RISK: [title] [SEVERITY]
Mitigation: [strategy]

Then provide overall risk score (0-100) and recommendations.`

      let response = ''
      await generateAIResponse(
        prompt,
        [],
        null,
        (chunk) => {
          response += chunk
        }
      )

      // Parse risks from response
      const riskLines = response.split('\n').filter((line) => line.trim().startsWith('RISK:'))
      const risks = riskLines.map((line) => {
        const match = line.match(/RISK:\s*(.+?)\s*\((HIGH|MEDIUM|LOW)\)/i)
        if (match) {
          return {
            title: match[1],
            severity: match[2].toLowerCase(),
            probability: 'medium',
            mitigation: '',
          }
        }
        return null
      }).filter(Boolean)

      setAnalysis(response)
      setRiskSuggestions(risks)
    } catch (err) {
      console.error('Error analyzing risks:', err)
      alert('Failed to analyze risks: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleRiskSelection = (index) => {
    const newSelected = new Set(selectedRisks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRisks(newSelected)
  }

  const addSelectedRisks = () => {
    let added = 0
    selectedRisks.forEach((index) => {
      const risk = riskSuggestions[index]
      if (risk) {
        addRisk(activeProject.id, risk)
        added++
      }
    })

    alert(`Added ${added} risk${added !== 1 ? 's' : ''} to the project`)
    setRiskSuggestions([])
    setSelectedRisks(new Set())
  }

  // Calculate current risk score
  const currentRiskScore = activeProject
    ? activeProject.risks.reduce((score, risk) => {
        const severityScore = {
          critical: 25,
          high: 15,
          medium: 8,
          low: 2,
        }[risk.severity] || 0
        const isOpen = risk.status === 'open' ? 1 : 0.5
        return score + severityScore * isOpen
      }, 0)
    : 0

  return (
    <div className="risk-analysis-container">
      <div className="risk-controls">
        <button
          onClick={analyzeProjectRisks}
          className="feature-button"
          disabled={!activeProject || loading}
        >
          {loading ? '⏳ Analyzing...' : '🎯 Analyze Risks with AI'}
        </button>
      </div>

      {/* Current Risks */}
      {activeProject && activeProject.risks.length > 0 && (
        <div className="current-risks">
          <div className="risks-header">
            <h3>Current Risks</h3>
            <div className="risk-score">
              Risk Score: <span className="score-value">{Math.round(currentRiskScore)}/100</span>
            </div>
          </div>

          <div className="risks-list">
            {activeProject.risks.map((risk) => (
              <div key={risk.id} className={`risk-item severity-${risk.severity}`}>
                <div className="risk-header">
                  <div className="risk-title">{risk.title}</div>
                  <div className="risk-badges">
                    <span className={`badge severity-${risk.severity}`}>{risk.severity}</span>
                    <span className={`badge status-${risk.status}`}>{risk.status}</span>
                  </div>
                </div>
                {risk.mitigation && <div className="risk-mitigation">Mitigation: {risk.mitigation}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <h3>AI Risk Analysis</h3>
          <div className="analysis-content">
            {analysis.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Risks */}
      {riskSuggestions.length > 0 && (
        <div className="suggested-risks">
          <div className="suggestions-header">
            <h3>Suggested Risks to Add ({riskSuggestions.length})</h3>
            <button
              onClick={addSelectedRisks}
              className="feature-button secondary"
              disabled={selectedRisks.size === 0}
            >
              Add Selected ({selectedRisks.size})
            </button>
          </div>

          <div className="risks-list">
            {riskSuggestions.map((risk, index) => (
              <div key={index} className={`risk-item severity-${risk.severity}`}>
                <input
                  type="checkbox"
                  checked={selectedRisks.has(index)}
                  onChange={() => toggleRiskSelection(index)}
                  className="risk-checkbox"
                />
                <div className="risk-content">
                  <div className="risk-title">{risk.title}</div>
                  <div className="risk-badges">
                    <span className={`badge severity-${risk.severity}`}>{risk.severity}</span>
                  </div>
                  {risk.mitigation && <div className="risk-mitigation">Mitigation: {risk.mitigation}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
