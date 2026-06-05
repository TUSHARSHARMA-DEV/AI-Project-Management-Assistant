import { useState, useMemo } from 'react'
import { useProject } from '../ProjectContext'
import './GanttChart.css'

/**
 * GanttChart - Project timeline with tasks and dependencies
 */
export default function GanttChart() {
  const { activeProject } = useProject()
  const [hoveredTask, setHoveredTask] = useState(null)

  const ganttData = useMemo(() => {
    if (!activeProject || activeProject.tasks.length === 0) {
      return { tasks: [], startDate: null, endDate: null, rangeMs: 0 }
    }

    // Get date range from tasks
    const tasks = activeProject.tasks.filter((t) => t.startDate || t.dueDate)
    if (tasks.length === 0) {
      return { tasks: [], startDate: null, endDate: null, rangeMs: 0 }
    }

    const dates = tasks
      .flatMap((t) => [t.startDate, t.dueDate])
      .filter(Boolean)
      .map((d) => new Date(d))

    const startDate = new Date(Math.min(...dates))
    const endDate = new Date(Math.max(...dates))
    const rangeMs = endDate - startDate

    // Add padding to dates
    startDate.setDate(startDate.getDate() - 1)
    endDate.setDate(endDate.getDate() + 1)

    return {
      tasks: tasks.map((task) => ({
        ...task,
        startMs: task.startDate ? new Date(task.startDate).getTime() : startDate.getTime(),
        endMs: task.dueDate ? new Date(task.dueDate).getTime() : startDate.getTime() + 7 * 24 * 60 * 60 * 1000,
      })),
      startDate,
      endDate,
      rangeMs: endDate - startDate,
    }
  }, [activeProject])

  const getTaskPosition = (task) => {
    if (ganttData.rangeMs === 0) return { left: 0, width: 0 }

    const startOffset = task.startMs - ganttData.startDate.getTime()
    const left = (startOffset / ganttData.rangeMs) * 100
    const width = ((task.endMs - task.startMs) / ganttData.rangeMs) * 100

    return { left: Math.max(0, left), width: Math.max(2, width) }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!activeProject || ganttData.tasks.length === 0) {
    return (
      <div className="gantt-container">
        <div className="gantt-empty">
          <p>No tasks with dates found. Add start and due dates to tasks to see the Gantt chart.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <h3>Project Timeline</h3>
        <p className="gantt-meta">
          {formatDate(ganttData.startDate)} - {formatDate(ganttData.endDate)}
        </p>
      </div>

      <div className="gantt-chart">
        <div className="gantt-tasks">
          {ganttData.tasks.map((task) => {
            const pos = getTaskPosition(task)
            return (
              <div
                key={task.id}
                className="gantt-task-row"
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                <div className="task-label">{task.title.substring(0, 25)}</div>
                <div className="gantt-bar-container">
                  <div
                    className={`gantt-bar status-${task.status} priority-${task.priority} ${
                      hoveredTask === task.id ? 'hovered' : ''
                    }`}
                    style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                    title={`${task.title} (${task.status})`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="gantt-timeline">
          <div className="timeline-labels">
            {Array.from({ length: 5 }).map((_, i) => {
              const date = new Date(ganttData.startDate)
              date.setTime(date.getTime() + (ganttData.rangeMs / 4) * i)
              return (
                <div key={i} className="timeline-label">
                  {formatDate(date)}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="gantt-legend">
        <div className="legend-item">
          <div className="legend-color status-done"></div>
          <span>Done</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-in-progress"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color status-todo"></div>
          <span>Todo</span>
        </div>
      </div>
    </div>
  )
}
