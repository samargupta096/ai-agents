import { useRef, useCallback } from 'react'
import './InputPanel.css'

export default function InputPanel({
  input,
  setInput,
  codeContent,
  setCodeContent,
  errorMessage,
  setErrorMessage,
  needsCodeInput,
  needsErrorInput,
  selectedAgent,
  selectedLanguage,
  onExecute,
  isExecuting,
  onClear,
}) {
  const promptRef = useRef(null)
  const codeRef = useRef(null)
  const fileInputRef = useRef(null)

  const getPlaceholder = () => {
    if (!selectedAgent) return 'Select an agent to get started...'
    
    switch (selectedAgent.id) {
      case 'generate':
        return `Describe the ${selectedLanguage} code you want to generate...\n\nExample: "Create a FastAPI endpoint for user authentication with JWT tokens"`
      case 'review':
        return 'Describe what to focus on during the review...\n\nExample: "Check for security vulnerabilities and performance issues"'
      case 'debug':
        return 'Describe the problem or symptoms...\n\nExample: "The function returns None instead of the expected list"'
      case 'test':
        return 'Describe what aspects to test...\n\nExample: "Generate tests for edge cases and error handling"'
      case 'docs':
        return 'Describe the documentation style...\n\nExample: "Generate comprehensive docstrings with examples"'
      case 'refactor':
        return 'Describe what to improve...\n\nExample: "Improve performance and reduce code duplication"'
      default:
        return 'Enter your prompt...'
    }
  }

  const handleKeyDown = useCallback((e) => {
    // Ctrl+Enter or Cmd+Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isExecuting && selectedAgent && input.trim()) {
        onExecute()
      }
    }
  }, [isExecuting, selectedAgent, input, onExecute])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setCodeContent(content)
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setCodeContent(content)
      }
    }
    reader.readAsText(file)
  }, [setCodeContent])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className="input-panel">
      <div className="panel-header">
        <div className="header-left">
          {selectedAgent && (
            <>
              <span className="agent-icon">{selectedAgent.icon}</span>
              <h3>{selectedAgent.name}</h3>
              {selectedLanguage && (
                <span className="language-badge">{selectedLanguage}</span>
              )}
            </>
          )}
        </div>
        <div className="header-actions">
          <button
            className="clear-btn"
            onClick={onClear}
            disabled={!input && !codeContent && !errorMessage}
            title="Clear all inputs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Clear
          </button>
          <button
            className={`execute-btn ${isExecuting ? 'executing' : ''}`}
            onClick={onExecute}
            disabled={isExecuting || !selectedAgent || !input.trim()}
          >
            {isExecuting ? (
              <>
                <span className="spinner"></span>
                <span>Running...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Execute</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="input-grid">
        <div className="input-section main-input">
          <label className="input-label">
            <span className="label-icon">💬</span>
            Prompt
          </label>
          <textarea
            ref={promptRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="input-textarea"
            rows={4}
          />
        </div>

        {needsCodeInput && (
          <div 
            className="input-section code-input"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label className="input-label">
              <span className="label-icon">📄</span>
              Code Input
              <button 
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Upload
              </button>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".py,.js,.jsx,.ts,.tsx,.go,.rs,.java,.cpp,.c,.cs,.rb,.php,.swift,.kt,.json,.yaml,.yml,.md,.txt"
              style={{ display: 'none' }}
            />
            <textarea
              ref={codeRef}
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your code here or drag & drop a file..."
              className="input-textarea code"
              rows={8}
            />
            {!codeContent && (
              <div className="drop-hint">
                <span>📁</span> Drop file here
              </div>
            )}
          </div>
        )}

        {needsErrorInput && (
          <div className="input-section error-input">
            <label className="input-label">
              <span className="label-icon">⚠️</span>
              Error Message / Stack Trace
            </label>
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste the error message or stack trace here..."
              className="input-textarea error"
              rows={4}
            />
          </div>
        )}
      </div>

      <div className="input-footer">
        <div className="keyboard-hints">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to execute
        </div>
      </div>
    </div>
  )
}
