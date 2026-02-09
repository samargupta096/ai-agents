import { useEffect, useRef, useState } from 'react'
import CodeBlock from './CodeBlock'
import './OutputPanel.css'

// Parse output to extract code blocks
function parseOutput(output) {
  if (!output) return []
  
  const parts = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(output)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const text = output.slice(lastIndex, match.index)
      if (text.trim()) {
        parts.push({ type: 'text', content: text })
      }
    }
    
    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < output.length) {
    const text = output.slice(lastIndex)
    if (text.trim()) {
      parts.push({ type: 'text', content: text })
    }
  }
  
  // If no code blocks found, return entire output as text
  if (parts.length === 0 && output.trim()) {
    parts.push({ type: 'text', content: output })
  }
  
  return parts
}

export default function OutputPanel({ 
  output, 
  status, 
  isExecuting, 
  selectedAgent, 
  metadata,
  onCopy,
  onClear 
}) {
  const outputRef = useRef(null)
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleCopy = async () => {
    await onCopy()
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedAgent?.id || 'output'}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveToFile = async () => {
    // Use File System Access API if available
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${selectedAgent?.id || 'output'}.py`,
          types: [
            {
              description: 'Code files',
              accept: {
                'text/plain': ['.py', '.js', '.ts', '.go', '.rs', '.java', '.txt'],
              },
            },
          ],
        })
        const writable = await handle.createWritable()
        await writable.write(output)
        await writable.close()
      } catch (err) {
        // User cancelled or error - fall back to download
        if (err.name !== 'AbortError') {
          downloadOutput()
        }
      }
    } else {
      downloadOutput()
    }
  }

  const parsedOutput = parseOutput(output)

  return (
    <div className="output-panel">
      <div className="panel-header">
        <div className="header-left">
          <span className="output-icon">📤</span>
          <h3>Output</h3>
          {status && (
            <span className={`status-badge ${isExecuting ? 'active' : ''}`}>
              {status}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="action-btn"
            onClick={onClear}
            disabled={!output}
            title="Clear output"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <button 
            className={`action-btn ${copyFeedback ? 'success' : ''}`}
            onClick={handleCopy}
            disabled={!output}
            title="Copy to clipboard"
          >
            {copyFeedback ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            )}
          </button>
          <button 
            className="action-btn"
            onClick={saveToFile}
            disabled={!output}
            title="Save to file"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
            </svg>
          </button>
          <button 
            className="action-btn"
            onClick={downloadOutput}
            disabled={!output}
            title="Download"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Output Stats Matrix - Always visible when metadata exists */}
      {metadata && (
        <div className="output-matrix">
          <div className="matrix-cell">
            <span className="matrix-icon">📥</span>
            <div className="matrix-data">
              <span className="matrix-value">{metadata.promptTokens}</span>
              <span className="matrix-label">prompt</span>
            </div>
          </div>
          <div className="matrix-cell highlight">
            <span className="matrix-icon">📤</span>
            <div className="matrix-data">
              <span className="matrix-value">{metadata.generatedTokens}</span>
              <span className="matrix-label">generated</span>
            </div>
          </div>
          <div className="matrix-cell">
            <span className="matrix-icon">⚡</span>
            <div className="matrix-data">
              <span className="matrix-value">{metadata.tokensPerSecond}</span>
              <span className="matrix-label">tok/s</span>
            </div>
          </div>
          <div className="matrix-cell">
            <span className="matrix-icon">📊</span>
            <div className="matrix-data">
              <span className="matrix-value">{metadata.contextUsed}</span>
              <span className="matrix-label">ctx</span>
            </div>
          </div>
          <div className="matrix-cell">
            <span className="matrix-icon">⏱️</span>
            <div className="matrix-data">
              <span className="matrix-value">{metadata.totalDuration}</span>
              <span className="matrix-label">duration</span>
            </div>
          </div>
        </div>
      )}

      <div className="output-content" ref={outputRef}>
        {!output && !isExecuting && (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h4>Ready to Execute</h4>
            <p>Select an agent, enter your prompt, and click Execute to see the output here.</p>
          </div>
        )}

        {isExecuting && !output && (
          <div className="loading-state">
            <div className="thinking-animation">
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
            </div>
            <p>{status || 'Initializing...'}</p>
          </div>
        )}

        {output && (
          <div className="output-formatted">
            {parsedOutput.map((part, index) => (
              part.type === 'code' ? (
                <CodeBlock 
                  key={index}
                  code={part.content}
                  language={part.language}
                  showLineNumbers={true}
                />
              ) : (
                <pre key={index} className="output-text">
                  <code>{part.content}</code>
                </pre>
              )
            ))}
          </div>
        )}
      </div>

      <div className="output-footer">
        <div className="output-stats">
          {output && (
            <>
              <span className="stat">
                <span className="stat-label">Length:</span>
                <span className="stat-value">{output.length.toLocaleString()} chars</span>
              </span>
              <span className="stat">
                <span className="stat-label">Lines:</span>
                <span className="stat-value">{output.split('\n').length}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
