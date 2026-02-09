import { useState, useMemo } from 'react'
import './ExecutionHistory.css'

export default function ExecutionHistory({ history, onClose, onSelect, onClear }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncate = (str, len = 100) => {
    if (!str) return ''
    if (str.length <= len) return str
    return str.substring(0, len) + '...'
  }

  // Get unique agents from history
  const uniqueAgents = useMemo(() => {
    const agents = new Map()
    history.forEach(item => {
      if (item.agent) {
        agents.set(item.agent.id, item.agent)
      }
    })
    return Array.from(agents.values())
  }, [history])

  // Filter history based on search and agent filter
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = !searchQuery || 
        item.input?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.output?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAgent = agentFilter === 'all' || item.agent?.id === agentFilter
      return matchesSearch && matchesAgent
    })
  }, [history, searchQuery, agentFilter])

  const exportHistory = () => {
    const data = JSON.stringify(history, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dev-agents-history-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>📜 Execution History</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="history-filters">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          
          <select 
            value={agentFilter} 
            onChange={(e) => setAgentFilter(e.target.value)}
            className="agent-filter"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.icon} {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="history-content">
          {filteredHistory.length === 0 ? (
            <div className="history-empty">
              <span className="empty-icon">
                {history.length === 0 ? '📭' : '🔍'}
              </span>
              <p>
                {history.length === 0 
                  ? 'No execution history yet' 
                  : 'No matches found'}
              </p>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((item) => (
                <button
                  key={item.id}
                  className="history-item"
                  onClick={() => onSelect(item)}
                  style={{ '--agent-color': item.agent?.color || '#3B82F6' }}
                >
                  <div className="item-header">
                    <span className="item-agent">
                      <span className="agent-icon">{item.agent?.icon || '🤖'}</span>
                      {item.agent?.name || 'Unknown'}
                    </span>
                    <span className="item-time">{formatDate(item.timestamp)}</span>
                  </div>
                  <div className="item-input">
                    {truncate(item.input, 80)}
                  </div>
                  <div className="item-meta">
                    <span className="meta-model">
                      <span className="meta-icon">🦙</span>
                      {item.model}
                    </span>
                    {item.language && (
                      <span className="meta-lang">
                        {item.language}
                      </span>
                    )}
                    <span className="meta-length">
                      {item.output?.length?.toLocaleString() || 0} chars
                    </span>
                    {item.duration && (
                      <span className="meta-duration">
                        {(item.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="history-footer">
          <span className="history-count">
            {filteredHistory.length === history.length 
              ? `${history.length} entries`
              : `${filteredHistory.length} of ${history.length} entries`}
          </span>
          <div className="footer-actions">
            {history.length > 0 && (
              <>
                <button 
                  className="export-btn"
                  onClick={exportHistory}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Export
                </button>
                <button 
                  className="clear-btn"
                  onClick={onClear}
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
