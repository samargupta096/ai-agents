import './Header.css'

export default function Header({ 
  ollamaStatus, 
  backendStatus, 
  theme, 
  onToggleTheme,
  onToggleSidebar,
  sidebarOpen 
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'connected'
      case 'disconnected': return 'disconnected'
      default: return 'checking'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Online'
      case 'disconnected': return 'Offline'
      default: return 'Checking...'
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left-group">
          <button 
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {sidebarOpen ? (
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              ) : (
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              )}
            </svg>
          </button>
          
          <div className="header-brand">
            <div className="header-logo">
              <span className="logo-icon">🤖</span>
              <div className="logo-glow"></div>
            </div>
            <div className="header-title">
              <h1>Dev Agents</h1>
              <span className="header-subtitle">AI-Powered Development Tools</span>
            </div>
          </div>
        </div>

        <div className="header-status">
          <div className={`status-indicator ${getStatusColor(ollamaStatus)}`}>
            <span className="status-dot"></span>
            <span className="status-text">Ollama: {getStatusText(ollamaStatus)}</span>
          </div>
          <div className={`status-indicator ${getStatusColor(backendStatus)}`}>
            <span className="status-dot"></span>
            <span className="status-text">API: {getStatusText(backendStatus)}</span>
          </div>
          <div className="ollama-badge">
            <span className="badge-icon">🦙</span>
            <span>Local LLM</span>
          </div>
        </div>

        <nav className="header-nav">
          <button 
            className="nav-btn theme-toggle"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            )}
          </button>
          <a href="https://github.com/samargupta096" target="_blank" rel="noopener" className="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </nav>
      </div>
    </header>
  )
}
