import { useState } from 'react'
import './ModelSelector.css'

export default function ModelSelector({ models, selectedModel, onSelect, onRefresh, ollamaStatus }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const selectedModelInfo = models.find(m => m.name === selectedModel)
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }
  
  return (
    <div className="model-selector">
      <div className="selector-header">
        <h3>🦙 Select Model</h3>
        <div className="header-actions">
          <span className={`model-badge ${ollamaStatus}`}>
            {selectedModelInfo?.size || 'Local'}
          </span>
          <button 
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            title="Refresh models from Ollama"
            disabled={ollamaStatus === 'disconnected'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="model-dropdown">
        <select 
          value={selectedModel} 
          onChange={(e) => onSelect(e.target.value)}
          className="model-select"
        >
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name} ({model.size})
            </option>
          ))}
        </select>
        <div className="select-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </div>

      <div className="model-info">
        <div className="info-row">
          <span className="info-label">Current:</span>
          <code className="info-value">{selectedModel}</code>
        </div>
        {selectedModelInfo && (
          <>
            {selectedModelInfo.parameter_size && selectedModelInfo.parameter_size !== 'Unknown' && (
              <div className="info-row">
                <span className="info-label">Params:</span>
                <code className="info-value">{selectedModelInfo.parameter_size}</code>
              </div>
            )}
            {selectedModelInfo.family && selectedModelInfo.family !== 'Unknown' && (
              <div className="info-row">
                <span className="info-label">Family:</span>
                <code className="info-value">{selectedModelInfo.family}</code>
              </div>
            )}
          </>
        )}
        <div className="quick-picks">
          <span className="info-label">Quick picks:</span>
          <div className="quick-buttons">
            <button 
              className={`quick-btn ${selectedModel === 'qwen3-coder:latest' ? 'active' : ''}`}
              onClick={() => onSelect('qwen3-coder:latest')}
            >
              Qwen3 Coder
            </button>
            <button 
              className={`quick-btn ${selectedModel === 'deepseek-r1:14b' ? 'active' : ''}`}
              onClick={() => onSelect('deepseek-r1:14b')}
            >
              DeepSeek R1
            </button>
            <button 
              className={`quick-btn ${selectedModel === 'gemma3:27b' ? 'active' : ''}`}
              onClick={() => onSelect('gemma3:27b')}
            >
              Gemma3 27B
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
