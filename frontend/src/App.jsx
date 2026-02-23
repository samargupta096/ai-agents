import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import "./App.css";
import Header from "./components/Header";
import AgentSelector from "./components/AgentSelector";
import ModelSelector from "./components/ModelSelector";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";
import ExecutionHistory from "./components/ExecutionHistory";
import SettingsPanel from "./components/SettingsPanel";
import WorkflowBuilder from "./components/WorkflowBuilder";
import Toast from "./components/Toast";
import {
  checkOllamaConnection,
  fetchOllamaModels,
  generateWithOllama,
  formatDuration,
  calculateTokensPerSecond,
} from "./utils/ollama";

const BACKEND_API = "http://localhost:8000";
const OLLAMA_API = "http://localhost:11434";

// Toast Context
export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// Default settings
const DEFAULT_SETTINGS = {
  temperature: 0.7,
  maxTokens: 2048,
  contextWindow: 4096,
  topP: 0.9,
  repeatPenalty: 1.1,
  ollamaUrl: "http://localhost:11434",
  useDirectOllama: true,
  outputDirectory: "", // For file system output
  autoSaveOutput: false,
  pipelineFlow: "sequential",
};

function App() {
  // Core state
  const [agents, setAgents] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedModel, setSelectedModel] = useState("qwen3-coder:latest");
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  // Input state
  const [input, setInput] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Output state
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [agentPrompts, setAgentPrompts] = useState({});

  // History & UI state
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Workflow state
  const [workflowProgress, setWorkflowProgress] = useState(null);

  // Connection state
  const [ollamaStatus, setOllamaStatus] = useState("checking");
  const [backendStatus, setBackendStatus] = useState("checking");

  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("devAgentsSettings");
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  });

  // Toast state
  const [toasts, setToasts] = useState([]);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("devAgentsTheme") || "dark";
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("devAgentsTheme", theme);
  }, [theme]);

  // Save settings
  useEffect(() => {
    localStorage.setItem("devAgentsSettings", JSON.stringify(settings));
  }, [settings]);

  // Toast functions
  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check connections on mount and periodically
  useEffect(() => {
    const checkConnections = async () => {
      const ollamaConnected = await checkOllamaConnection();
      setOllamaStatus(ollamaConnected ? "connected" : "disconnected");

      try {
        const res = await fetch(`${BACKEND_API}/`, {
          signal: AbortSignal.timeout(3000),
        });
        setBackendStatus(res.ok ? "connected" : "disconnected");
      } catch {
        setBackendStatus("disconnected");
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch agents and models on mount
  useEffect(() => {
    fetchAgents();
    fetchModels();
    loadHistory();
  }, []);

  // Refetch models when Ollama connects
  useEffect(() => {
    if (ollamaStatus === "connected") {
      fetchModels();
    }
  }, [ollamaStatus]);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${BACKEND_API}/api/agents`);
      const data = await res.json();
      setAgents(data.agents);
      if (data.agents.length > 0) {
        setSelectedAgent(data.agents[0]);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      const fallbackAgents = [
        {
          id: "generate",
          name: "Code Generator",
          description:
            "Generate production-ready code from natural language descriptions",
          icon: "💻",
          color: "#3B82F6",
        },
        {
          id: "review",
          name: "Code Reviewer",
          description:
            "Review code for bugs, security issues, and best practices",
          icon: "🔍",
          color: "#10B981",
        },
        {
          id: "debug",
          name: "Bug Detective",
          description: "Debug issues and find root causes of errors",
          icon: "🐛",
          color: "#EF4444",
        },
        {
          id: "test",
          name: "Test Generator",
          description: "Generate comprehensive unit and integration tests",
          icon: "🧪",
          color: "#8B5CF6",
        },
        {
          id: "docs",
          name: "Doc Writer",
          description: "Generate documentation, docstrings, and README files",
          icon: "📚",
          color: "#F59E0B",
        },
        {
          id: "refactor",
          name: "Refactoring Expert",
          description:
            "Suggest code improvements and refactoring opportunities",
          icon: "⚙️",
          color: "#EC4899",
        },
        {
          id: "pipeline",
          name: "Full Dev Pipeline",
          description: "Run the full CrewAI pipeline (Review -> Bug Check -> Tests -> Docs)",
          icon: "🌊",
          color: "#14B8A6",
        },
      ];
      setAgents(fallbackAgents);
      setSelectedAgent(fallbackAgents[0]);
    }
  };

  const fetchModels = async () => {
    const ollamaModels = await fetchOllamaModels();
    if (ollamaModels.length > 0) {
      setModels(ollamaModels);
      if (!ollamaModels.find((m) => m.name === selectedModel)) {
        setSelectedModel(ollamaModels[0].name);
      }
      return;
    }

    try {
      const res = await fetch(`${BACKEND_API}/api/models`);
      const data = await res.json();
      setModels(data.models);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      const fallbackModels = [
        { name: "qwen3-coder:latest", size: "18 GB" },
        { name: "deepseek-r1:14b", size: "9.0 GB" },
        { name: "deepcoder:latest", size: "9.0 GB" },
        { name: "gemma3:27b", size: "17 GB" },
        { name: "phi4:14b", size: "9.1 GB" },
      ];
      setModels(fallbackModels);
    }
  };

  const loadHistory = () => {
    const saved = localStorage.getItem("devAgentsHistory");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const saveToHistory = (entry) => {
    const newHistory = [entry, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem("devAgentsHistory", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("devAgentsHistory");
    showToast("History cleared", "success");
  };

  const buildSystemPrompt = (agent = selectedAgent) => {
    if (!agent) return "";

    const agentPrompts = {
      generate: `You are a senior software developer specializing in ${selectedLanguage}. Generate high-quality, production-ready code based on the user's requirements. Always include proper error handling, comments, and follow best practices.`,
      review: `You are a code reviewer. Analyze the provided code for bugs, security issues, performance problems, and best practice violations. Provide specific, actionable feedback.`,
      debug: `You are a debugging expert. Analyze the provided code and error message to identify the root cause and suggest fixes. Explain the issue clearly.`,
      test: `You are a test engineer. Generate comprehensive unit tests for the provided code using ${selectedLanguage} testing frameworks. Cover edge cases and error conditions.`,
      docs: `You are a technical writer. Generate clear, comprehensive documentation for the provided code including docstrings, usage examples, and explanations.`,
      refactor: `You are a refactoring expert. Analyze the provided code and suggest improvements for readability, performance, and maintainability. Provide refactored code.`,
      pipeline: `You are the manager for the full dev pipeline.`,
    };

    return agentPrompts[agent.id] || "";
  };

  const buildPrompt = (
    customInput = input,
    customCode = codeContent,
    customError = errorMessage,
  ) => {
    let prompt = customInput;
    if (customCode) {
      prompt += `\n\n### Code:\n\`\`\`${selectedLanguage}\n${customCode}\n\`\`\``;
    }
    if (customError) {
      prompt += `\n\n### Error Message:\n\`\`\`\n${customError}\n\`\`\``;
    }
    return prompt;
  };

  // Single agent execution
  const executeAgent = async () => {
    if (!selectedAgent || !input.trim()) return;

    setIsExecuting(true);
    setOutput("");
    setMetadata(null);
    setStatus("Connecting...");

    try {
      if (selectedAgent.id === "pipeline") {
        await executePipelineWithBackend();
      } else if (settings.useDirectOllama && ollamaStatus === "connected") {
        await executeWithOllama();
      } else {
        await executeWithBackend();
      }
    } catch (err) {
      setStatus("❌ Error: " + err.message);
      showToast("Execution failed: " + err.message, "error");
    } finally {
      setIsExecuting(false);
    }
  };

  // Execute a single step (used by both single agent and workflow)
  const executeStep = async (agent, promptText, systemPrompt) => {
    let fullOutput = "";
    const startTime = Date.now();
    let stepMetadata = null;

    const stream = generateWithOllama({
      model: selectedModel,
      prompt: promptText,
      system: systemPrompt,
      options: {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        contextWindow: settings.contextWindow,
        topP: settings.topP,
        repeatPenalty: settings.repeatPenalty,
      },
    });

    for await (const chunk of stream) {
      if (chunk.type === "token") {
        fullOutput += chunk.content;
        setOutput(fullOutput);
      } else if (chunk.type === "complete") {
        const meta = chunk.metadata;
        stepMetadata = {
          promptTokens: meta.promptTokens,
          generatedTokens: meta.generatedTokens,
          totalDuration: formatDuration(meta.totalDuration),
          tokensPerSecond: calculateTokensPerSecond(
            meta.generatedTokens,
            meta.evalDuration,
          ),
          contextUsed: `${meta.promptTokens + meta.generatedTokens}/${settings.contextWindow}`,
        };
      }
    }

    return {
      output: fullOutput,
      metadata: stepMetadata,
      duration: Date.now() - startTime,
    };
  };

  // Workflow execution - execute agents in sequence
  const executeWorkflow = async (workflow) => {
    if (workflow.length === 0 || !input.trim()) {
      showToast("Please enter input and add agents to workflow", "warning");
      return;
    }

    setIsExecuting(true);
    setOutput("");
    setMetadata(null);
    setWorkflowProgress({ currentStep: 0, totalSteps: workflow.length });
    setShowWorkflowBuilder(false);

    let previousOutput = "";
    const allOutputs = [];

    try {
      for (let i = 0; i < workflow.length; i++) {
        const step = workflow[i];
        setWorkflowProgress({ currentStep: i, totalSteps: workflow.length });
        setStatus(`🔄 Step ${i + 1}/${workflow.length}: ${step.agent.name}`);

        // Build prompt for this step
        let stepPrompt = step.config.customPrompt || input;
        if (step.config.useOutputAsInput && previousOutput) {
          stepPrompt = `${stepPrompt}\n\n### Previous Output:\n${previousOutput}`;
        }
        if (codeContent) {
          stepPrompt += `\n\n### Code:\n\`\`\`${selectedLanguage}\n${codeContent}\n\`\`\``;
        }

        // Apply prompt overrides if configured
        let systemPrompt = buildSystemPrompt(step.agent)
        const overrides = agentPrompts[step.agent.id]
        if (overrides) {
            if (overrides.role) systemPrompt = `You are ${overrides.role}. ` + systemPrompt
            if (overrides.goal) systemPrompt += `\n\nYour Goal: ${overrides.goal}`
            if (overrides.backstory) systemPrompt += `\n\nBackstory: ${overrides.backstory}`
        }

        const result = await executeStep(step.agent, stepPrompt, systemPrompt);

        previousOutput = result.output;
        allOutputs.push({
          agent: step.agent,
          output: result.output,
          metadata: result.metadata,
          duration: result.duration,
        });

        setMetadata(result.metadata);
      }

      // Combine all outputs for final display
      const combinedOutput = allOutputs
        .map(
          (o, i) =>
            `## Step ${i + 1}: ${o.agent.icon} ${o.agent.name}\n\n${o.output}`,
        )
        .join("\n\n---\n\n");

      setOutput(combinedOutput);
      setStatus("✅ Workflow Complete");
      showToast(
        `Workflow completed! ${workflow.length} steps executed.`,
        "success",
      );

      // Save to history
      saveToHistory({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        agent: { id: "workflow", name: "Workflow", icon: "🔗" },
        model: selectedModel,
        input: input,
        output: combinedOutput,
        language: selectedLanguage,
        workflowSteps: workflow.map((s) => s.agent.name),
      });
    } catch (err) {
      setStatus("❌ Workflow Error: " + err.message);
      showToast("Workflow failed: " + err.message, "error");
    } finally {
      setIsExecuting(false);
      setWorkflowProgress(null);
    }
  };

  const executeWithOllama = async () => {
    setStatus("🦙 Using Ollama directly...");

    // Apply prompt overrides
    let systemPrompt = buildSystemPrompt()
    const overrides = agentPrompts[selectedAgent.id]
    if (overrides) {
        if (overrides.role) systemPrompt = `You are ${overrides.role}. ` + systemPrompt
        if (overrides.goal) systemPrompt += `\n\nYour Goal: ${overrides.goal}`
        if (overrides.backstory) systemPrompt += `\n\nBackstory: ${overrides.backstory}`
    }

    const result = await executeStep(
      selectedAgent,
      buildPrompt(),
      systemPrompt
    );

    setMetadata(result.metadata);
    setStatus("✅ Complete");

    saveToHistory({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      agent: selectedAgent,
      model: selectedModel,
      input: input,
      output: result.output,
      language: selectedLanguage,
      duration: result.duration,
    });

    showToast("Generation complete!", "success");
  };

  const executePipelineWithBackend = async () => {
    setStatus("📡 Using pipeline API...");

    const requestBody = {
      prompt: input,
      model: selectedModel,
      language: selectedLanguage,
      code_content: codeContent || undefined,
      pipeline_type: settings.pipelineFlow || "sequential",
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      repeat_penalty: settings.repeatPenalty,
    };

    const response = await fetch(`${BACKEND_API}/api/pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "status") {
              setStatus(data.message);
            } else if (data.type === "thinking") {
              setStatus("🧠 " + data.message);
            } else if (data.type === "output") {
              fullOutput += data.content;
              setOutput(fullOutput);
              setStatus("Crew is working...");
            } else if (data.type === "complete") {
              setStatus("✅ Complete");
            } else if (data.type === 'error') {
              setStatus('❌ Error: ' + data.message)
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    saveToHistory({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      agent: selectedAgent,
      model: selectedModel,
      input: input,
      output: fullOutput,
      language: selectedLanguage,
    });
  };

  const executeWithBackend = async () => {
    setStatus("📡 Using backend API...");

    const requestBody = {
      agent_type: selectedAgent.id,
      prompt: input,
      model: selectedModel,
      language: selectedLanguage,
      code_content: codeContent || undefined,
      error_message: errorMessage || undefined,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      repeat_penalty: settings.repeatPenalty,
      agent_role: agentPrompts[selectedAgent.id]?.role || undefined,
      agent_goal: agentPrompts[selectedAgent.id]?.goal || undefined,
      agent_backstory: agentPrompts[selectedAgent.id]?.backstory || undefined,
    };

    const response = await fetch(`${BACKEND_API}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "status") {
              setStatus(data.message);
            } else if (data.type === "thinking") {
              setStatus("🧠 " + data.message);
            } else if (data.type === "output") {
              fullOutput += data.content;
              setOutput(fullOutput);
              setStatus("Generating...");
            } else if (data.type === "complete") {
              setStatus("✅ Complete");
            } else if (data.type === 'error') {
              setStatus('❌ Error: ' + data.message)
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    saveToHistory({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      agent: selectedAgent,
      model: selectedModel,
      input: input,
      output: fullOutput,
      language: selectedLanguage,
    });
  };

  const clearInput = () => {
    setInput("");
    setCodeContent("");
    setErrorMessage("");
  };

  const clearOutput = () => {
    setOutput('');
    setMetadata(null);
    setStatus('');
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      showToast("Copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const needsCodeInput =
    selectedAgent &&
    ["review", "debug", "test", "docs", "refactor", "pipeline"].includes(selectedAgent.id);
  const needsErrorInput = selectedAgent && selectedAgent.id === "debug";

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className={`app ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>
        <Header
          ollamaStatus={ollamaStatus}
          backendStatus={backendStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="main-content">
          <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <AgentSelector
              agents={agents}
              selectedAgent={selectedAgent}
              onSelect={setSelectedAgent}
            />

            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
              onRefresh={fetchModels}
              ollamaStatus={ollamaStatus}
            />

            <SettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              isOpen={showSettings}
              onToggle={() => setShowSettings(!showSettings)}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              agentPrompts={agentPrompts}
              onAgentPromptsChange={setAgentPrompts}
              selectedAgent={selectedAgent}
            />

            {/* Workflow Builder Toggle */}
            <button
              className="workflow-toggle"
              onClick={() => setShowWorkflowBuilder(true)}
            >
              🔗 Workflow Builder
            </button>

            <button
              className="history-toggle"
              onClick={() => setShowHistory(!showHistory)}
            >
              📜 History ({history.length})
            </button>
          </div>

          <div className="workspace">
            <InputPanel
              input={input}
              setInput={setInput}
              codeContent={codeContent}
              setCodeContent={setCodeContent}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              needsCodeInput={needsCodeInput}
              needsErrorInput={needsErrorInput}
              selectedAgent={selectedAgent}
              selectedLanguage={selectedLanguage}
              onExecute={executeAgent}
              isExecuting={isExecuting}
              onClear={clearInput}
            />

            <OutputPanel
              output={output}
              status={status}
              isExecuting={isExecuting}
              selectedAgent={selectedAgent}
              metadata={metadata}
              onCopy={copyOutput}
              onClear={clearOutput}
            />
          </div>
        </main>

        {showHistory && (
          <ExecutionHistory
            history={history}
            onClose={() => setShowHistory(false)}
            onSelect={(item) => {
              setInput(item.input);
              setOutput(item.output);
              setSelectedAgent(item.agent);
              setSelectedModel(item.model);
              if (item.language) setSelectedLanguage(item.language);
              setShowHistory(false);
            }}
            onClear={clearHistory}
          />
        )}

        {/* Workflow Builder Modal */}
        {showWorkflowBuilder && (
          <WorkflowBuilder
            agents={agents}
            onExecuteWorkflow={executeWorkflow}
            isExecuting={isExecuting}
            workflowProgress={workflowProgress}
            onClose={() => setShowWorkflowBuilder(false)}
          />
        )}

        {/* Toast Container */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export default App;
