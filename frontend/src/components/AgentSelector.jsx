import './AgentSelector.css'

export default function AgentSelector({ agents, selectedAgent, onSelect }) {
  return (
    <div className="agent-selector">
      <div className="selector-header">
        <h3>🤖 Select Agent</h3>
        <span className="agent-count">{agents.length} available</span>
      </div>
      
      <div className="agents-grid">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
            onClick={() => onSelect(agent)}
            style={{ '--agent-color': agent.color }}
          >
            <div className="agent-icon">{agent.icon}</div>
            <div className="agent-info">
              <h4 className="agent-name">{agent.name}</h4>
              <p className="agent-desc">{agent.description}</p>
            </div>
            <div className="agent-indicator">
              {selectedAgent?.id === agent.id && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
