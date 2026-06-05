import jsPDF from 'jspdf'
import { useProject } from '../ProjectContext'

/**
 * PDFExporter - Exports project to professional PDF report
 */
export class PDFExporter {
  static generateProjectPDF(project) {
    if (!project) return

    const doc = new jsPDF('p', 'mm', 'a4')
    let yPosition = 20

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin

    // Helper to add page if needed
    const checkPageBreak = (minHeight) => {
      if (yPosition + minHeight > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
      }
    }

    // Title
    doc.setFontSize(24)
    doc.setTextColor(99, 102, 241) // accent color
    doc.text(`${project.name} - Project Report`, margin, yPosition)
    yPosition += 15

    // Metadata
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // text-muted
    const createdDate = new Date(project.createdAt).toLocaleDateString()
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Created: ${createdDate}`, margin, yPosition)
    yPosition += 10

    // Status and description
    checkPageBreak(20)
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59) // text color
    doc.text(`Status: ${project.status.toUpperCase()}`, margin, yPosition)
    yPosition += 7

    if (project.description) {
      const splitDesc = doc.splitTextToSize(project.description, contentWidth)
      doc.setFontSize(10)
      doc.text(splitDesc, margin, yPosition)
      yPosition += splitDesc.length * 5 + 5
    }

    // Summary section
    checkPageBreak(30)
    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text('Project Overview', margin, yPosition)
    yPosition += 10

    const stats = {
      'Total Tasks': project.tasks.length,
      'Completed': project.tasks.filter((t) => t.status === 'done').length,
      'Pending': project.tasks.filter((t) => t.status !== 'done').length,
      'Team Members': project.teamMembers.length,
      'Active Milestones': project.milestones.filter((m) => m.status !== 'completed').length,
      'Open Risks': project.risks.filter((r) => r.status === 'open').length,
    }

    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    Object.entries(stats).forEach(([key, value]) => {
      checkPageBreak(6)
      doc.text(`• ${key}: ${value}`, margin + 5, yPosition)
      yPosition += 6
    })

    // Tasks section
    if (project.tasks.length > 0) {
      checkPageBreak(20)
      yPosition += 5
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Tasks', margin, yPosition)
      yPosition += 10

      const taskTableData = project.tasks.map((task) => [
        task.title.substring(0, 30),
        task.priority,
        task.status,
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-',
      ])

      doc.setFontSize(9)
      doc.autoTable({
        head: [['Task', 'Priority', 'Status', 'Due Date']],
        body: taskTableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      yPosition = doc.internal.pageSize.getHeight() - 30
    }

    // Milestones section
    if (project.milestones.length > 0) {
      checkPageBreak(20)
      yPosition += 5
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Milestones', margin, yPosition)
      yPosition += 10

      project.milestones.slice(0, 10).forEach((milestone) => {
        checkPageBreak(10)
        doc.setFontSize(10)
        doc.setTextColor(30, 41, 59)
        doc.text(`• ${milestone.title}`, margin + 5, yPosition)
        yPosition += 5

        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(`  Status: ${milestone.status} | Due: ${new Date(milestone.dueDate).toLocaleDateString()}`, margin + 5, yPosition)
        yPosition += 6
      })
    }

    // Team Members section
    if (project.teamMembers.length > 0) {
      checkPageBreak(20)
      yPosition += 5
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Team Members', margin, yPosition)
      yPosition += 10

      const teamTableData = project.teamMembers.map((member) => [
        member.name,
        member.role,
        member.email || '-',
      ])

      doc.setFontSize(9)
      doc.autoTable({
        head: [['Name', 'Role', 'Email']],
        body: teamTableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      })

      yPosition = doc.internal.pageSize.getHeight() - 30
    }

    // Risks section
    if (project.risks.length > 0) {
      doc.addPage()
      yPosition = 20
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('Risk Assessment', margin, yPosition)
      yPosition += 10

      project.risks.slice(0, 10).forEach((risk) => {
        checkPageBreak(15)
        doc.setFontSize(10)
        doc.setTextColor(30, 41, 59)
        doc.text(`• ${risk.title}`, margin + 5, yPosition)
        yPosition += 5

        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(
          `  Severity: ${risk.severity} | Probability: ${risk.probability} | Status: ${risk.status}`,
          margin + 5,
          yPosition
        )
        yPosition += 5

        if (risk.mitigation) {
          const splitMit = doc.splitTextToSize(`Mitigation: ${risk.mitigation}`, contentWidth - 10)
          doc.setFontSize(8)
          doc.text(splitMit, margin + 5, yPosition)
          yPosition += splitMit.length * 4 + 5
        }
      })
    }

    // AI Summary section
    if (project.aiSummary) {
      checkPageBreak(20)
      yPosition += 5
      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.text('AI Summary', margin, yPosition)
      yPosition += 10

      const splitSummary = doc.splitTextToSize(project.aiSummary, contentWidth)
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.text(splitSummary, margin, yPosition)
    }

    // Save the PDF
    doc.save(`${project.name}-report-${Date.now()}.pdf`)
  }
}

/**
 * PDFExportButton - Button component to trigger PDF export
 */
export function PDFExportButton() {
  const { activeProject } = useProject()

  const handleExport = () => {
    if (!activeProject) {
      alert('No project selected')
      return
    }
    PDFExporter.generateProjectPDF(activeProject)
  }

  return (
    <button
      onClick={handleExport}
      className="feature-button"
      title="Export project as PDF"
      disabled={!activeProject}
    >
      📄 Export PDF
    </button>
  )
}

export default PDFExportButton
