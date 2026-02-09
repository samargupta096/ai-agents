import { useState } from 'react'
import './WorkflowBuilder.css'

export default function WorkflowBuilder({ 
  agents, 
  onExecuteWorkflow, 
  isExecuting,
  workflowProgress,
  onClose 
}) {
  const [workflow, setWorkflow] = useState([])
  const [workflowName, setWorkflowName] = useState('')
  const [savedWorkflows, setSavedWorkflows] = useState(() => {
    const saved = localStorage.getItem('devAgentsWorkflows')
    return saved ? JSON.parse(saved) : []
  })

  const addAgentToWorkflow = (agent) => {
    const step = {
      id: Date.now(),
      agent: agent,
      config: {
        useOutputAsinput: workflow.length > 0, // Default to using previous output
        customPrompt: '',
      }
    }
    setWorkflow([...workflow, step])
  }

  const removeStep = (stepId) => {
    setWorkflow(workflow.filter(step => step.id !== stepId))
  }

  const moveStep = (index, direction) => {
    const newWorkflow = [...workflow]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < workflow.length) {
      [newWorkflow[index], newWorkflow[newIndex]] = [newWorkflow[newIndex], newWorkflow[index]]
      setWorkflow(newWorkflow)
    }
  }

  const updateStepConfig = (stepId, config) => {
    setWorkflow(workflow.map(step => 
      step.id === stepId ? { ...step, config: { ...step.config, ...config } } : step
    ))
  }

  const saveWorkflow = () => {
    if (!workflowName.trim() || workflow.length === 0) return
    
    const newWorkflow = {
      id: Date.now(),
      name: workflowName,
      steps: workflow.map(step => ({
        agentId: step.agent.id,
        config: step.config
      })),
      createdAt: new Date().toISOString()
    }
    
    const updated = [...savedWorkflows, newWorkflow]
    setSavedWorkflows(updated)
    localStorage.setItem('devAgentsWorkflows', JSON.stringify(updated))
    setWorkflowName('')
  }

  const loadWorkflow = (savedWorkflow) => {
    const loadedSteps = savedWorkflow.steps.map((step, index) => {
      const agent = agents.find(a => a.id === step.agentId)
      return {
        id: Date.now() + index,
        agent: agent,
        config: step.config
      }
    }).filter(step => step.agent) // Filter out steps where agent wasn't found
    
    setWorkflow(loadedSteps)
  }

  const deleteWorkflow = (workflowId) => {
    const updated = savedWorkflows.filter(w => w.id !== workflowId)
    setSavedWorkflows(updated)
    localStorage.setItem('devAgentsWorkflows', JSON.stringify(updated))
  }

  const handleExecute = () => {
    if (workflow.length === 0) return
    onExecuteWorkflow(workflow)
  }

  const getStepStatus = (index) => {
    if (!workflowProgress) return 'pending'
    if (index < workflowProgress.currentStep) return 'complete'
    if (index === workflowProgress.currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="workflow-builder-overlay">
      <div className="workflow-builder">
        <div className="workflow-header">
          <h2>🔗 Workflow Builder</h2>
          <p>Chain multiple agents to work in sequence</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="workflow-content">
          {/* Agent Selection */}
          <div className="agent-selection">
            <h3>Available Agents</h3>
            <div className="agent-grid">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  className="agent-add-btn"
                  onClick={() => addAgentToWorkflow(agent)}
                  disabled={isExecuting}
                >
                  <span className="agent-icon">{agent.icon}</span>
                  <span className="agent-name">{agent.name}</span>
                  <span className="add-icon">+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Pipeline */}
          <div className="workflow-pipeline">
            <h3>Workflow Pipeline</h3>
            {workflow.length === 0 ? (
              <div className="empty-pipeline">
                <span className="empty-icon">📋</span>
                <p>Click on agents above to add them to your workflow</p>
              </div>
            ) : (
              <div className="pipeline-steps">
                {workflow.map((step, index) => (
                  <div key={step.id} className="pipeline-step-container">
                    <div className={`pipeline-step ${getStepStatus(index)}`}>
                      <div className="step-number">{index + 1}</div>
                      <div className="step-content">
                        <div className="step-header">
                          <span className="step-icon">{step.agent.icon}</span>
                          <span className="step-name">{step.agent.name}</span>
                        </div>
                        <div className="step-config">
                          {index > 0 && (
                            <label className="config-option">
                              <input
                                type="checkbox"
                                checked={step.config.useOutputAsinput}
                                onChange={(e) => updateStepConfig(step.id, { useOutputAsinput: e.target.checked })}
                                disabled={isExecuting}
                              />
                              <span>Use previous output as input</span>
                            </label>
                          )}
                          <input
                            type="text"
                            className="custom-prompt-input"
                            placeholder="Additional instructions (optional)"
                            value={step.config.customPrompt}
                            onChange={(e) => updateStepConfig(step.id, { customPrompt: e.target.value })}
                            disabled={isExecuting}
                          />
                        </div>
                      </div>
                      <div className="step-actions">
                        <button 
                          onClick={() => moveStep(index, 'up')} 
                          disabled={index === 0 || isExecuting}
                          title="Move up"
                        >↑</button>
                        <button 
                          onClick={() => moveStep(index, 'down')} 
                          disabled={index === workflow.length - 1 || isExecuting}
                          title="Move down"
                        >↓</button>
                        <button 
                          onClick={() => removeStep(step.id)} 
                          disabled={isExecuting}
                          className="remove-btn"
                          title="Remove"
                        >×</button>
                      </div>
                      {getStepStatus(index) === 'active' && (
                        <div className="step-progress">
                          <div className="progress-spinner"></div>
                          <span>Executing...</span>
                        </div>
                      )}
                      {getStepStatus(index) === 'complete' && (
                        <div className="step-complete">
                          <span>✓</span>
                        </div>
                      )}
                    </div>
                    {index < workflow.length - 1 && (
                      <div className="pipeline-connector">
                        <div className="connector-line"></div>
                        <div className="connector-arrow">▼</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Workflows */}
          <div className="saved-workflows">
            <h3>Saved Workflows</h3>
            <div className="save-workflow-form">
              <input
                type="text"
                placeholder="Workflow name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                disabled={isExecuting || workflow.length === 0}
              />
              <button 
                onClick={saveWorkflow}
                disabled={!workflowName.trim() || workflow.length === 0 || isExecuting}
              >
                💾 Save
              </button>
            </div>
            {savedWorkflows.length > 0 ? (
              <div className="workflow-list">
                {savedWorkflows.map(w => (
                  <div key={w.id} className="saved-workflow-item">
                    <span className="workflow-name">{w.name}</span>
                    <span className="workflow-steps">{w.steps.length} steps</span>
                    <button onClick={() => loadWorkflow(w)} disabled={isExecuting}>Load</button>
                    <button onClick={() => deleteWorkflow(w.id)} disabled={isExecuting} className="delete-btn">×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-workflows">No saved workflows yet</p>
            )}
          </div>
        </div>

        <div className="workflow-footer">
          <button 
            className="execute-workflow-btn"
            onClick={handleExecute}
            disabled={workflow.length === 0 || isExecuting}
          >
            {isExecuting ? (
              <>
                <span className="spinner"></span>
                Executing Workflow...
              </>
            ) : (
              <>
                ▶️ Execute Workflow ({workflow.length} steps)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
