import OpenAI from 'openai'

/**
 * Creates and returns an OpenRouter client configured for the OpenAI SDK
 * @returns {OpenAI} Configured OpenAI client pointing to OpenRouter
 * @throws {Error} If VITE_OPENROUTER_API_KEY is not set
 */
function createOpenRouterClient(signal) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing OpenRouter API key. Set VITE_OPENROUTER_API_KEY in your .env and restart the dev server.'
    )
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    dangerouslyAllowBrowser: true,
    timeout: 60000,
    signal,
  })
}

/**
 * Converts image file to base64 data URL
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} Base64 data URL
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Generates an AI response using OpenRouter's API with streaming support
 * @param {string} prompt - The user's prompt/message
 * @param {Array<Object>} conversationHistory - Previous messages for context
 * @param {Object} image - Optional image object {file: File, preview: string}
 * @param {Function} onChunk - Callback for streaming chunks
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<string>} The complete AI response text
 */
export async function generateAIResponse(
  prompt,
  conversationHistory = [],
  image = null,
  onChunk = null,
  signal = null
) {
  try {
    const client = createOpenRouterClient(signal)

    // Build message content - support both text and image
    let messageContent = prompt
    if (image && image.preview) {
      // For multimodal support with images
      messageContent = [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: image.preview,
            detail: 'auto',
          },
        },
      ]
    }

    // Build messages array including full conversation history
    // conversationHistory already contains all previous messages
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: messageContent,
      },
    ]

    // Request with streaming
    const stream = await client.chat.completions.create({
      model: 'openrouter/auto',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    })

    let fullResponse = ''

    // Process streaming chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content

      if (content) {
        fullResponse += content

        // Call streaming callback if provided
        if (onChunk && typeof onChunk === 'function') {
          onChunk(content)
        }
      }
    }

    if (!fullResponse) {
      throw new Error('No response content received from OpenRouter API')
    }

    return fullResponse
  } catch (error) {
    // Handle abort errors gracefully
    if (error.name === 'AbortError') {
      console.log('[OpenRouter] Request cancelled by user')
      throw new Error('Request cancelled')
    }

    // Log full error details for debugging
    console.error('[OpenRouter API Error] Full error object:', error)
    console.error('[OpenRouter API Error] Error message:', error?.message)
    console.error('[OpenRouter API Error] Error status:', error?.status)

    let errorMessage = 'Error generating AI response.'

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      if (error.error?.message) {
        errorMessage = error.error.message
      } else if (error.message) {
        errorMessage = error.message
      }
    }

    console.error('[OpenRouter API Error] Final error message to user:', errorMessage)
    throw new Error(errorMessage)
  }
}
