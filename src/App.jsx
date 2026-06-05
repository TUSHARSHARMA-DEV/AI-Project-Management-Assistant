import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { generateAIResponse, fileToBase64 } from './openrouterHelper'

const initialChats = [
  {
    id: 'chat-1',
    title: 'Roadmap sync',
    messages: [
      {
        id: 'welcome-1',
        role: 'assistant',
        text: 'Hello! I’m your AI Project Management Assistant. Share a task or ask a planning question to get started.',
      },
    ],
  },
  {
    id: 'chat-2',
    title: 'Sprint goals',
    messages: [
      {
        id: 'welcome-2',
        role: 'assistant',
        text: 'This chat is ready for sprint planning. Ask me to help define goals, scope, or timelines.',
      },
    ],
  },
  {
    id: 'chat-3',
    title: 'Release plan',
    messages: [
      {
        id: 'welcome-3',
        role: 'assistant',
        text: 'Use this chat to refine your release plan and coordinate handoffs with stakeholders.',
      },
    ],
  },
]

const markdownToHtml = (text) => {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/(?:\r\n|\r|\n){2,}/g, '</p><p>')
    .replace(/(?:\r\n|\r|\n)/g, '<br/>')

  return `<p>${escaped}</p>`
}

function App() {
  // Storage keys
  const STORAGE_KEY = 'projectflow_chats'
  const ACTIVE_CHAT_KEY = 'projectflow_active_chat'

  // Initialize chats from localStorage or use defaults
  const [chats, setChats] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Error loading chats from localStorage:', err)
    }
    return initialChats
  })

  const [activeChat, setActiveChat] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_CHAT_KEY) || initialChats[0].id
    } catch {
      return initialChats[0].id
    }
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attachedImage, setAttachedImage] = useState(null) // {file, preview}
  const [streamingMessageId, setStreamingMessageId] = useState(null)

  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const abortControllerRef = useRef(null)

  const openrouterApiKeyAvailable = Boolean(import.meta.env.VITE_OPENROUTER_API_KEY)

  // Save chats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    } catch (err) {
      console.error('Error saving chats to localStorage:', err)
    }
  }, [chats])

  // Save active chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_CHAT_KEY, activeChat)
    } catch (err) {
      console.error('Error saving active chat to localStorage:', err)
    }
  }, [activeChat])

  const activeConversation = useMemo(
    () => chats.find((chat) => chat.id === activeChat) || chats[0],
    [chats, activeChat]
  )

  const messages = useMemo(
    () => activeConversation?.messages || [],
    [activeConversation]
  )

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(timer)
  }, [messages, streamingMessageId])

  const updateActiveChatMessages = (updateFn) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChat
          ? { ...chat, messages: updateFn(chat.messages) }
          : chat
      )
    )
  }

  const updateActiveChatTitle = (title) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChat
          ? { ...chat, title }
          : chat
      )
    )
  }

  const createAssistantMessage = (text) => ({
    id: `ai-${Date.now()}-${Math.random()}`,
    role: 'assistant',
    text,
    streaming: false,
  })

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    setStreamingMessageId(null)
  }

  const handleSend = async (event) => {
    event.preventDefault()
    setError('')

    if (!openrouterApiKeyAvailable) {
      setError('Missing OpenRouter API key. Add VITE_OPENROUTER_API_KEY to .env and restart the dev server.')
      return
    }

    const trimmed = input.trim()
    if (!trimmed && !attachedImage) return

    // Create user message with optional image
    const userMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      text: trimmed || '(Image attachment)',
      image: attachedImage ? { preview: attachedImage.preview } : null,
    }

    updateActiveChatMessages((currentMessages) => [...currentMessages, userMessage])
    setInput('')
    setAttachedImage(null)
    setLoading(true)

    // Create placeholder for streaming message
    const aiMessageId = `ai-${Date.now()}-${Math.random()}`
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      text: '',
      streaming: true,
    }

    updateActiveChatMessages((currentMessages) => [...currentMessages, aiMessage])
    setStreamingMessageId(aiMessageId)

    // Prepare conversation history for context
    // Exclude streaming messages and the current user message (which will be added separately)
    const conversationHistory = messages
      .filter((msg) => !msg.streaming)
      .slice(0, -1) // Exclude the most recent message (current user message)
      .map((msg) => ({
        role: msg.role,
        content: msg.text,
      }))

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      let fullResponse = ''

      // Stream response with chunks
      await generateAIResponse(
        trimmed || '(Image attachment)',
        conversationHistory,
        attachedImage,
        (chunk) => {
          fullResponse += chunk
          // Update the streaming message in real-time
          updateActiveChatMessages((currentMessages) => {
            const updatedMessages = [...currentMessages]
            const messageIndex = updatedMessages.findIndex((m) => m.id === aiMessageId)
            if (messageIndex !== -1) {
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                text: fullResponse,
              }
            }
            return updatedMessages
          })
        },
        abortControllerRef.current.signal
      )

      // Mark message as finished streaming
      updateActiveChatMessages((currentMessages) => {
        const updatedMessages = [...currentMessages]
        const messageIndex = updatedMessages.findIndex((m) => m.id === aiMessageId)
        if (messageIndex !== -1) {
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            streaming: false,
          }
        }
        return updatedMessages
      })

      // Update chat title if it's still default
      if (
        activeConversation.title === 'New chat' ||
        activeConversation.title.startsWith('Chat-')
      ) {
        const firstUserMessage = messages.find((m) => m.role === 'user')
        if (firstUserMessage) {
          const titlePreview = firstUserMessage.text.substring(0, 30)
          updateActiveChatTitle(titlePreview + (firstUserMessage.text.length > 30 ? '...' : ''))
        }
      }
    } catch (err) {
      if (err.message !== 'Request cancelled') {
        const message = err instanceof Error ? err.message : 'Unable to get reply from OpenRouter.'
        setError(message)

        // Update message with error
        updateActiveChatMessages((currentMessages) => {
          const updatedMessages = [...currentMessages]
          const messageIndex = updatedMessages.findIndex((m) => m.id === aiMessageId)
          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              text: `Error: ${message}`,
              streaming: false,
            }
          }
          return updatedMessages
        })
      }
    } finally {
      setLoading(false)
      setStreamingMessageId(null)
      abortControllerRef.current = null
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend(event)
    }
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Only accept image files
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      event.target.value = ''
      return
    }

    try {
      const preview = await fileToBase64(file)
      setAttachedImage({ file, preview })
      setError('')
    } catch (err) {
      setError('Error loading image: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }

    event.target.value = ''
  }

  const handleRemoveImage = () => {
    setAttachedImage(null)
    setError('')
  }

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`
    const newChat = {
      id: newId,
      title: `Chat-${chats.length + 1}`,
      messages: [
        {
          id: `welcome-${newId}`,
          role: 'assistant',
          text: 'New conversation created. Ask anything about your project, tasks, or timelines. I\'ll remember our conversation context.',
          streaming: false,
        },
      ],
    }

    setChats((current) => [newChat, ...current])
    setActiveChat(newId)
    setInput('')
    setError('')
    setAttachedImage(null)
  }

  const handleSelectChat = (chatId) => {
    setActiveChat(chatId)
    setInput('')
    setError('')
    setAttachedImage(null)
  }

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation()
    setChats((current) => current.filter((chat) => chat.id !== chatId))
    if (activeChat === chatId) {
      const remaining = chats.filter((chat) => chat.id !== chatId)
      if (remaining.length > 0) {
        setActiveChat(remaining[0].id)
      }
    }
  }

  return (
    <div className="app-shell">
      <div className="workspace">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">PF</div>
            <div className="brand-copy">
              <span className="brand-name">ProjectFlow</span>
              <span className="brand-tagline">AI PM Assistant</span>
            </div>
          </div>

          <button type="button" className="new-chat-button" onClick={handleNewChat}>
            <span>+</span>
            New chat
          </button>

          <div className="recent-section">
            <div className="recent-title">
              <span>Recent</span>
              <span>{chats.length}</span>
            </div>
            <div className="recent-list">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleSelectChat(chat.id)}
                  className={`recent-item ${activeChat === chat.id ? 'recent-item-active' : ''}`}
                  title={chat.title}
                >
                  <span>{chat.title}</span>
                  <button
                    type="button"
                    className="delete-chat-button"
                    aria-label="Delete chat"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="panel">
          <div className="conversation-shell">
            <div className="conversation-header">
              <div>
                <span className="topic-chip">Project chat</span>
                <h1>Manage milestones, tasks, and scope with AI</h1>
              </div>
              <span className="assistant-label">AI Assistant</span>
            </div>

            <div className="messages-wrapper">
              <div className="messages-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-row ${message.role === 'user' ? 'message-user' : 'message-ai'}`}
                  >
                    <div
                      className={`message-bubble ${message.role === 'user' ? 'message-user-bubble' : ''} ${
                        message.streaming ? 'message-streaming' : ''
                      }`}
                    >
                      {message.image && (
                        <img src={message.image.preview} alt="Attached" className="message-image" />
                      )}
                      <div
                        className="message-content"
                        dangerouslySetInnerHTML={{
                          __html: markdownToHtml(message.text),
                        }}
                      />
                      {message.streaming && <div className="typing-cursor" />}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </div>
          </div>

          <form className="composer" onSubmit={handleSend}>
            {attachedImage && (
              <div className="image-preview">
                <img src={attachedImage.preview} alt="Attached" />
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            )}

            <textarea
              id="chat-input"
              className="composer-textarea"
              placeholder="Send a message... (or attach an image)"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />

            <div className="composer-actions">
              <button
                type="button"
                className="icon-button"
                aria-label="Attach image"
                onClick={handleAttachmentClick}
                disabled={loading}
                title="Attach image for analysis"
              >
                📎
              </button>
              {loading ? (
                <button
                  type="button"
                  className="send-button stop-button"
                  onClick={handleStopGeneration}
                  title="Stop generating"
                >
                  ⏹ Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className="send-button"
                  disabled={!input.trim() && !attachedImage}
                  title="Send message (Shift+Enter for new line)"
                >
                  Send
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="chat-error">
              <span>{error}</span>
              <button
                type="button"
                className="error-close"
                onClick={() => setError('')}
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={handleFileSelected}
            accept="image/*"
          />
        </main>
      </div>
    </div>
  )
}

export default App
