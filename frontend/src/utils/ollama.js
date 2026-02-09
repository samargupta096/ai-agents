/* Ollama API Utilities */

const OLLAMA_BASE_URL = 'http://localhost:11434';

/**
 * Check if Ollama server is running
 * @returns {Promise<boolean>}
 */
export async function checkOllamaConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch available models from Ollama
 * @returns {Promise<Array<{name: string, size: string, modified_at: string, details: object}>>}
 */
export async function fetchOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch models');
    
    const data = await response.json();
    return data.models.map(model => ({
      name: model.name,
      size: formatBytes(model.size),
      modified_at: model.modified_at,
      details: model.details || {},
      parameter_size: model.details?.parameter_size || 'Unknown',
      quantization: model.details?.quantization_level || 'Unknown',
      family: model.details?.family || 'Unknown',
    }));
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return [];
  }
}

/**
 * Get detailed model info
 * @param {string} modelName 
 * @returns {Promise<object>}
 */
export async function getModelInfo(modelName) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });
    if (!response.ok) throw new Error('Failed to get model info');
    return await response.json();
  } catch (error) {
    console.error('Failed to get model info:', error);
    return null;
  }
}

/**
 * Generate completion directly via Ollama API (bypass CrewAI backend)
 * @param {object} options 
 * @returns {AsyncGenerator<object>}
 */
export async function* generateWithOllama({
  model,
  prompt,
  system = '',
  options = {},
}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 2048,
        num_ctx: options.contextWindow ?? 4096,
        top_p: options.topP ?? 0.9,
        repeat_penalty: options.repeatPenalty ?? 1.1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let buffer = '';
  let metadata = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        
        if (data.done) {
          // Final response with metadata
          metadata = {
            promptTokens: data.prompt_eval_count || 0,
            generatedTokens: data.eval_count || 0,
            totalDuration: data.total_duration || 0,
            loadDuration: data.load_duration || 0,
            promptEvalDuration: data.prompt_eval_duration || 0,
            evalDuration: data.eval_duration || 0,
          };
          yield { type: 'complete', metadata };
        } else if (data.response) {
          yield { type: 'token', content: data.response };
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }
}

/**
 * Chat completion via Ollama API
 * @param {object} options 
 * @returns {AsyncGenerator<object>}
 */
export async function* chatWithOllama({
  model,
  messages,
  options = {},
}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 2048,
        num_ctx: options.contextWindow ?? 4096,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        
        if (data.done) {
          yield {
            type: 'complete',
            metadata: {
              promptTokens: data.prompt_eval_count || 0,
              generatedTokens: data.eval_count || 0,
              totalDuration: data.total_duration || 0,
              evalDuration: data.eval_duration || 0,
            },
          };
        } else if (data.message?.content) {
          yield { type: 'token', content: data.message.content };
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format nanoseconds to human readable string
 * @param {number} nanos 
 * @returns {string}
 */
export function formatDuration(nanos) {
  const ms = nanos / 1_000_000;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Calculate tokens per second
 * @param {number} tokens 
 * @param {number} durationNanos 
 * @returns {string}
 */
export function calculateTokensPerSecond(tokens, durationNanos) {
  if (!durationNanos || durationNanos === 0) return '0';
  const seconds = durationNanos / 1_000_000_000;
  return (tokens / seconds).toFixed(1);
}

export { OLLAMA_BASE_URL };
