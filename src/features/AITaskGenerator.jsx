import { useState } from 'react'
import { useProject } from '../ProjectContext'
import { generateAIResponse } from '../openrouterHelper'
import { extractTasksFromText } from '../ProjectStorage'
import './AITaskGenerator.css'

/**
 * AITaskGenerator - Automatically generates tasks from chat conversations
 */
export default function AITaskGenerator() {
  const { activeProject, addTask } = useProject()
  const [generatedTasks, setGeneratedTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState(new Set())

  const generateTasksFromChat = async () => {
    if (!activeProject) {
      alert('No project selected')
      return
    }

    setLoading(true)
    try {
      const prompt = `Based on the project "${activeProject.name}" with description "${activeProject.description}", 
      generate a comprehensive list of specific, actionable tasks that need to be completed. 
      Each task should be on a new line starting with "Task:", "TODO:", or "- ".
      Include priority (HIGH/MEDIUM/LOW) for each task.
      Example format:
      Task: User authentication system (HIGH)
      Task: Database schema design (HIGH)
      - API endpoints development (MEDIUM)
      - Unit testing (MEDIUM)
      
      Generate 5-10 realistic tasks for this project.`

      const conversationHistory = []
      let response = ''

      await generateAIResponse(
        prompt,
        conversationHistory,
        null,
        (chunk) => {
          response += chunk
        }
      )

      // Extract tasks from response
      const tasks = extractTasksFromText(response)

      // Parse priorities from task titles
      const tasksWithPriority = tasks.map((task) => {
        let priority = 'medium'
        if (task.title.match(/HIGH|critical|urgent/i)) {
          priority = 'high'
        } else if (task.title.match(/MEDIUM/i)) {
          priority = 'medium'
        } else if (task.title.match(/LOW|optional/i)) {
          priority = 'low'
        }

        return {
          ...task,
          priority,
          title: task.title.replace(/\(HIGH\)|\(MEDIUM\)|\(LOW\)/gi, '').trim(),
        }
      })

      setGeneratedTasks(tasksWithPriority)
    } catch (err) {
      console.error('Error generating tasks:', err)
      alert('Failed to generate tasks: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskSelection = (index) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTasks(newSelected)
  }

  const addSelectedTasks = () => {
    let added = 0
    selectedTasks.forEach((index) => {
      const task = generatedTasks[index]
      if (task) {
        addTask(activeProject.id, task)
        added++
      }
    })

    alert(`Added ${added} task${added !== 1 ? 's' : ''} to the project`)
    setGeneratedTasks([])
    setSelectedTasks(new Set())
  }

  return (
    <div className="task-generator-container">
      <div className="generator-controls">
        <button
          onClick={generateTasksFromChat}
          className="feature-button"
          disabled={!activeProject || loading}
        >
          {loading ? '⏳ Generating...' : '✨ Generate Tasks with AI'}
        </button>
      </div>

      {generatedTasks.length > 0 && (
        <div className="generated-tasks">
          <div className="tasks-header">
            <h3>Generated Tasks ({generatedTasks.length})</h3>
            <button
              onClick={addSelectedTasks}
              className="feature-button secondary"
              disabled={selectedTasks.size === 0}
            >
              Add Selected ({selectedTasks.size})
            </button>
          </div>

          <div className="tasks-list">
            {generatedTasks.map((task, index) => (
              <div key={index} className="generated-task-item">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(index)}
                  onChange={() => toggleTaskSelection(index)}
                  className="task-checkbox"
                />
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  <div className="task-meta">
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    <span className="status-badge">Todo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
