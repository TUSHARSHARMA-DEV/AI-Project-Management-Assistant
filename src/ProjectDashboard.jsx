import { useProject } from './ProjectContext'
import './ProjectDashboard.css'

/**
 * ProjectDashboard - Main dashboard showing project overview and statistics
 */
export default function ProjectDashboard() {
  const { activeProject } = useProject()

  if (!activeProject) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          <p>No project selected. Create a new project to get started.</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const totalTasks = activeProject.tasks.length
  const completedTasks = activeProject.tasks.filter((t) => t.status === 'done').length
  const pendingTasks = totalTasks - completedTasks
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const openRisks = activeProject.risks.filter((r) => r.status === 'open').length

  // High priority tasks
  const highPriorityTasks = activeProject.tasks.filter(
    (t) => t.priority === 'critical' || t.priority === 'high'
  )

  // Overdue tasks
  const now = new Date()
  const overdueTasks = activeProject.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
  )

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>{activeProject.name}</h2>
          <p className="dashboard-status">{activeProject.description}</p>
        </div>
        <div className="dashboard-meta">
          <span className="status-badge">{activeProject.status}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{totalTasks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completedTasks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pendingTasks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Progress</div>
          <div className="stat-value">{progressPercent}%</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Team Members</div>
          <div className="stat-value">{activeProject.teamMembers.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Milestones</div>
          <div className="stat-value">
            {activeProject.milestones.filter((m) => m.status !== 'completed').length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Open Risks</div>
          <div className="stat-value">{openRisks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Overdue Tasks</div>
          <div className="stat-value">{overdueTasks.length}</div>
        </div>
      </div>

      {/* High Priority Tasks */}
      {highPriorityTasks.length > 0 && (
        <div className="dashboard-section">
          <h3>🔴 High Priority Tasks</h3>
          <div className="task-list">
            {highPriorityTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                  <span className={`status-badge status-${task.status}`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="dashboard-section">
          <h3>⚠️ Overdue Tasks</h3>
          <div className="task-list">
            {overdueTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {activeProject.teamMembers.length > 0 && (
        <div className="dashboard-section">
          <h3>👥 Team Members</h3>
          <div className="team-grid">
            {activeProject.teamMembers.map((member) => (
              <div key={member.id} className="team-member">
                <div className="member-avatar">{member.name.charAt(0)}</div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
