import { useState } from 'react'
import './SettingsPanel.css'

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'go', name: 'Go', icon: '🐹' },
  { id: 'rust', name: 'Rust', icon: '🦀' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'csharp', name: 'C#', icon: '💜' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'swift', name: 'Swift', icon: '🍎' },
  { id: 'kotlin', name: 'Kotlin', icon: '🤖' },
]

const CONTEXT_OPTIONS = [
  { value: 2048, label: '2K' },
  { value: 4096, label: '4K' },
  { value: 8192, label: '8K' },
  { value: 16384, label: '16K' },
  { value: 32768, label: '32K' },
]

export default function SettingsPanel({ 
  settings, 
  onSettingsChange, 
  isOpen, 
  onToggle,
  selectedLanguage,
  onLanguageChange 
}) {
  const updateSetting = (key, value) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <button className="settings-toggle" onClick={onToggle}>
        <span className="toggle-icon">⚙️</span>
        <span className="toggle-text">Settings</span>
        <svg 
          className={`toggle-arrow ${isOpen ? 'rotated' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </button>

      {isOpen && (
        <div className="settings-content">
          {/* Language Selector */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">🌐</span>
              Language
            </label>
            <div className="language-grid">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  className={`language-btn ${selectedLanguage === lang.id ? 'active' : ''}`}
                  onClick={() => onLanguageChange(lang.id)}
                  title={lang.name}
                >
                  <span className="lang-icon">{lang.icon}</span>
                  <span className="lang-name">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">🌡️</span>
              Temperature
              <span className="setting-value">{settings.temperature.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
              className="setting-slider"
            />
            <div className="slider-labels">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">📊</span>
              Max Tokens
            </label>
            <input
              type="number"
              min="128"
              max="32768"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value) || 2048)}
              className="setting-input"
            />
          </div>

          {/* Context Window */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">📐</span>
              Context Window
            </label>
            <div className="context-buttons">
              {CONTEXT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`context-btn ${settings.contextWindow === opt.value ? 'active' : ''}`}
                  onClick={() => updateSetting('contextWindow', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Top-P */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">🎯</span>
              Top-P
              <span className="setting-value">{settings.topP.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.topP}
              onChange={(e) => updateSetting('topP', parseFloat(e.target.value))}
              className="setting-slider"
            />
          </div>

          {/* Repeat Penalty */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">🔄</span>
              Repeat Penalty
              <span className="setting-value">{settings.repeatPenalty.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              value={settings.repeatPenalty}
              onChange={(e) => updateSetting('repeatPenalty', parseFloat(e.target.value))}
              className="setting-slider"
            />
          </div>

          {/* Use Direct Ollama */}
          <div className="setting-group">
            <label className="setting-label checkbox-label">
              <input
                type="checkbox"
                checked={settings.useDirectOllama}
                onChange={(e) => updateSetting('useDirectOllama', e.target.checked)}
                className="setting-checkbox"
              />
              <span className="label-icon">🦙</span>
              Use Direct Ollama API
            </label>
            <p className="setting-hint">
              Bypass CrewAI backend and use Ollama directly for faster responses
            </p>
          </div>

          {/* Ollama URL */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="label-icon">🔗</span>
              Ollama URL
            </label>
            <input
              type="text"
              value={settings.ollamaUrl}
              onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
              className="setting-input"
              placeholder="http://localhost:11434"
            />
          </div>
        </div>
      )}
    </div>
  )
}
