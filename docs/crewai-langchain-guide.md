# CrewAI & LangChain: Complete Learning Guide 🤖

![AI Agents](https://img.shields.io/badge/AI-Agents-blue) ![CrewAI](https://img.shields.io/badge/CrewAI-Framework-green) ![LangChain](https://img.shields.io/badge/LangChain-Integration-orange)

A comprehensive guide to understanding and building AI agents using **CrewAI** and **LangChain** frameworks.

---

## 📚 Table of Contents

1. [Introduction to AI Agents](#introduction-to-ai-agents)
2. [LangChain Fundamentals](#langchain-fundamentals)
3. [CrewAI Deep Dive](#crewai-deep-dive)
4. [Integration: CrewAI + LangChain](#integration-crewai--langchain)
5. [Building Your First Multi-Agent System](#building-your-first-multi-agent-system)
6. [Project Reference: Dev Agents](#project-reference-dev-agents)
7. [Best Practices](#best-practices)
8. [Resources](#resources)

---

## 💡 Introduction to AI Agents

### What are AI Agents?

AI Agents are autonomous systems that leverage Large Language Models (LLMs) to:

- **Reason** about tasks and break them into steps
- **Take actions** using tools and APIs
- **Learn** from feedback and observations
- **Collaborate** with other agents

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌──────────┐     ┌──────────┐     ┌──────────────────┐       │
│    │  User    │────▶│   LLM    │────▶│  Tool Execution  │       │
│    │  Input   │     │  Brain   │     │  (APIs, Code)    │       │
│    └──────────┘     └──────────┘     └──────────────────┘       │
│          ▲               │                     │                 │
│          │               ▼                     ▼                 │
│          │        ┌──────────┐         ┌──────────┐             │
│          └────────│  Memory  │         │  Output  │             │
│                   │  System  │         │  Result  │             │
│                   └──────────┘         └──────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent vs Traditional LLM

| Aspect | Traditional LLM | AI Agent |
|--------|-----------------|----------|
| **Interaction** | Single prompt → response | Multi-step reasoning |
| **Tools** | None | Can use APIs, search, code |
| **Memory** | Stateless | Maintains context |
| **Autonomy** | Reactive only | Proactive decision making |

---

## 🔗 LangChain Fundamentals

### What is LangChain?

LangChain is a framework for developing LLM-powered applications. It provides:

- **Modular components** for building AI applications
- **Chains** for connecting components together
- **Agents** for dynamic decision-making
- **Memory** for maintaining conversation state

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangChain Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   Models    │  │   Prompts   │  │   Chains    │            │
│   │   (LLMs)    │  │ (Templates) │  │ (Workflows) │            │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│          │                │                │                     │
│          ▼                ▼                ▼                     │
│   ┌────────────────────────────────────────────────┐            │
│   │              LangChain Expression Language      │            │
│   │              (LCEL - Runnable Pipeline)         │            │
│   └────────────────────────────────────────────────┘            │
│          │                │                │                     │
│          ▼                ▼                ▼                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   Memory    │  │   Agents    │  │   Tools     │            │
│   │ (Context)   │  │ (Reasoning) │  │ (Actions)   │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Models & LLMs

```python
from langchain_openai import ChatOpenAI
from langchain_community.llms import Ollama

# OpenAI Model
openai_llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
)

# Local Ollama Model
ollama_llm = Ollama(
    model="codellama:13b",
    base_url="http://localhost:11434",
)
```

### 2. Prompts

Prompts are templates that structure inputs to LLMs.

```python
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate

# Simple prompt template
simple_prompt = PromptTemplate.from_template(
    "Write a {language} function that {task}"
)

# Chat prompt with roles
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a senior software engineer."),
    ("human", "Review this code:\n\n{code}"),
])

# Few-shot prompting
few_shot_prompt = PromptTemplate.from_template("""
Examples:
Input: add two numbers
Output: def add(a, b): return a + b

Input: {task}
Output:
""")
```

### 3. Chains (LCEL)

Chains connect components using the LangChain Expression Language (LCEL).

```python
from langchain_core.output_parsers import StrOutputParser

# Simple chain: prompt → model → output parser
chain = chat_prompt | openai_llm | StrOutputParser()

# Execute the chain
result = chain.invoke({
    "code": "def add(x,y): return x+y"
})

# Sequential chain
chain = (
    {"context": retriever, "question": lambda x: x}
    | prompt
    | model
    | StrOutputParser()
)
```

### 4. Memory

Memory enables conversations to maintain context.

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

# Buffer memory - stores all messages
memory = ConversationBufferMemory()

# Conversation chain with memory
conversation = ConversationChain(
    llm=openai_llm,
    memory=memory,
    verbose=True
)

# Multiple turns maintain context
response1 = conversation.predict(input="My name is Sam")
response2 = conversation.predict(input="What's my name?")
# Output: "Your name is Sam"
```

### 5. Tools & Agents

Tools extend agent capabilities.

```python
from langchain.agents import tool, create_structured_chat_agent
from langchain_community.tools import WikipediaQueryRun

# Custom tool using decorator
@tool
def calculate(expression: str) -> float:
    """Evaluate a mathematical expression."""
    return eval(expression)

# Built-in tools
wikipedia = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

# Create an agent with tools
tools = [calculate, wikipedia]
agent = create_structured_chat_agent(
    llm=openai_llm,
    tools=tools,
    prompt=prompt
)
```

---

## 🚀 CrewAI Deep Dive

### What is CrewAI?

CrewAI is a framework for orchestrating **role-playing, autonomous AI agents** that collaborate on complex tasks.

```
┌─────────────────────────────────────────────────────────────────┐
│                       CrewAI Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌────────────────────────────────────────────────────────┐   │
│    │                        CREW                             │   │
│    │  ┌──────────────────────────────────────────────────┐  │   │
│    │  │                    PROCESS                        │  │   │
│    │  │   Sequential │ Hierarchical │ Consensual          │  │   │
│    │  └──────────────────────────────────────────────────┘  │   │
│    │                          │                              │   │
│    │          ┌───────────────┼───────────────┐             │   │
│    │          ▼               ▼               ▼             │   │
│    │    ┌─────────┐     ┌─────────┐     ┌─────────┐        │   │
│    │    │ Agent 1 │     │ Agent 2 │     │ Agent 3 │        │   │
│    │    │ (Role)  │     │ (Role)  │     │ (Role)  │        │   │
│    │    ├─────────┤     ├─────────┤     ├─────────┤        │   │
│    │    │ Goal    │     │ Goal    │     │ Goal    │        │   │
│    │    │Backstory│     │Backstory│     │Backstory│        │   │
│    │    │ Tools   │     │ Tools   │     │ Tools   │        │   │
│    │    └────┬────┘     └────┬────┘     └────┬────┘        │   │
│    │         │               │               │              │   │
│    │         ▼               ▼               ▼              │   │
│    │    ┌─────────┐     ┌─────────┐     ┌─────────┐        │   │
│    │    │ Task 1  │────▶│ Task 2  │────▶│ Task 3  │        │   │
│    │    └─────────┘     └─────────┘     └─────────┘        │   │
│    │                                         │              │   │
│    └─────────────────────────────────────────┼──────────────┘   │
│                                              ▼                   │
│                                        ┌──────────┐             │
│                                        │  OUTPUT  │             │
│                                        └──────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Component | Description |
|-----------|-------------|
| **Agent** | Autonomous unit with role, goal, backstory, and tools |
| **Task** | Work item assigned to an agent with expected output |
| **Crew** | Collection of agents working together |
| **Process** | How agents collaborate (sequential/hierarchical) |
| **Tools** | Capabilities agents can use to complete tasks |

### Creating Agents

```python
from crewai import Agent
from crewai_tools import FileReadTool, SerperDevTool

# Define an agent with personality and capabilities
code_reviewer = Agent(
    role="Senior Code Reviewer",
    goal="Ensure code quality and identify potential issues",
    backstory="""
        You are an expert software engineer with 15+ years of experience.
        You've reviewed thousands of pull requests and have a keen eye for
        code quality, security vulnerabilities, and performance issues.
    """,
    tools=[FileReadTool()],
    llm="ollama/codellama:13b",  # or "openai/gpt-4"
    verbose=True,
    allow_delegation=False,  # Can delegate to other agents
    memory=True,  # Enable memory
)
```

### Creating Tasks

```python
from crewai import Task

# Define a task with clear description and expected output
review_task = Task(
    description="""
        Review the following Python code for:
        1. Code quality and best practices
        2. Potential bugs and edge cases
        3. Security vulnerabilities
        4. Performance optimizations
        
        Code to review:
        {code_content}
    """,
    expected_output="""
        A detailed code review report with:
        - Summary of findings
        - List of issues (severity, description, suggestion)
        - Overall code quality score (1-10)
    """,
    agent=code_reviewer,
    output_file="review_report.md",  # Optional: save to file
)
```

### Creating a Crew

```python
from crewai import Crew, Process

# Assemble the crew
dev_crew = Crew(
    agents=[code_reviewer, bug_detective, test_generator],
    tasks=[review_task, bug_task, test_task],
    process=Process.sequential,  # or Process.hierarchical
    verbose=True,
    memory=True,  # Shared crew memory
)

# Execute the crew
result = dev_crew.kickoff(inputs={
    "code_content": "def add(x, y): return x + y"
})

print(result)
```

### Process Types

```
┌────────────────────────────────────────────────────────────────┐
│                      Process Types                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SEQUENTIAL                   HIERARCHICAL                      │
│  ────────────                 ────────────                      │
│                                                                 │
│  Agent 1 ───▶ Agent 2         Manager Agent                     │
│      │           │                  │                           │
│      ▼           ▼            ┌─────┴─────┐                     │
│  Task 1 ───▶ Task 2          ▼           ▼                      │
│      │           │        Agent 1     Agent 2                   │
│      ▼           ▼           │           │                      │
│   Output ───▶ Final       Task 1      Task 2                    │
│                              │           │                      │
│                              └─────┬─────┘                      │
│                                    ▼                            │
│                               Final Result                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Using YAML Configuration

CrewAI supports YAML-based configuration for cleaner code:

**agents.yaml**
```yaml
code_reviewer:
  role: "Senior Code Reviewer"
  goal: "Ensure code quality and identify potential issues"
  backstory: |
    You are an expert software engineer with 15+ years of experience.

bug_detective:
  role: "Bug Detective"  
  goal: "Find and document all potential bugs"
  backstory: |
    You specialize in finding edge cases and bugs that others miss.
```

**tasks.yaml**
```yaml
review_code_task:
  description: |
    Review the code for quality issues and best practices.
    Code: {code_content}
  expected_output: |
    Detailed code review with actionable suggestions.

debug_code_task:
  description: |
    Analyze the code for potential bugs.
  expected_output: |
    List of potential bugs with severity ratings.
```

**crew.py**
```python
from crewai import Crew, Process
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class DevCrew:
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    
    @agent
    def code_reviewer(self) -> Agent:
        return Agent(config=self.agents_config["code_reviewer"])
    
    @task
    def review_task(self) -> Task:
        return Task(config=self.tasks_config["review_code_task"])
    
    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
        )
```

---

## 🔄 Integration: CrewAI + LangChain

### Why Combine Them?

| Feature | CrewAI | LangChain |
|---------|--------|-----------|
| **Focus** | Multi-agent orchestration | LLM application building |
| **Tools** | Built-in CrewAI tools | 300+ integrations |
| **Chains** | Task pipelines | LCEL chains |
| **Memory** | Agent/crew memory | Various memory types |

### Using LangChain Tools in CrewAI

```python
from crewai import Agent
from langchain.tools import Tool
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

# LangChain tool
wikipedia = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

# Wrap for CrewAI compatibility
wiki_tool = Tool(
    name="Wikipedia",
    func=wikipedia.run,
    description="Search Wikipedia for information"
)

# Use in CrewAI agent
research_agent = Agent(
    role="Researcher",
    goal="Find accurate information on any topic",
    backstory="Expert researcher with access to Wikipedia",
    tools=[wiki_tool],
)
```

### Using LangChain LLMs in CrewAI

```python
from crewai import Agent, LLM
from langchain_openai import ChatOpenAI

# Configure LLM for CrewAI
llm = LLM(
    model="openai/gpt-4",
    temperature=0.7,
)

# Or use Ollama
ollama_llm = LLM(
    model="ollama/codellama:13b",
    base_url="http://localhost:11434",
)

# Agent with custom LLM
agent = Agent(
    role="Developer",
    goal="Write efficient code",
    backstory="Senior developer",
    llm=llm,
)
```

---

## 🛠️ Building Your First Multi-Agent System

### Complete Example: Code Review Pipeline

```python
"""
Multi-Agent Code Review System
Uses CrewAI for orchestration and can integrate LangChain tools
"""

from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import FileReadTool

# Configure LLM (Local Ollama)
llm = LLM(
    model="ollama/codellama:13b",
    base_url="http://localhost:11434",
    temperature=0.7,
)

# Agent 1: Code Reviewer
reviewer = Agent(
    role="Senior Code Reviewer",
    goal="Review code for quality, style, and best practices",
    backstory="""
        Expert software engineer with 15+ years reviewing code.
        Known for thorough, constructive feedback.
    """,
    tools=[FileReadTool()],
    llm=llm,
    verbose=True,
)

# Agent 2: Security Analyst
security_analyst = Agent(
    role="Security Analyst",
    goal="Identify security vulnerabilities and risks",
    backstory="""
        Cybersecurity expert specialized in code security.
        Certified in OWASP and secure coding practices.
    """,
    llm=llm,
    verbose=True,
)

# Agent 3: Test Engineer
test_engineer = Agent(
    role="Test Engineer",
    goal="Generate comprehensive unit tests",
    backstory="""
        QA expert who believes in test-driven development.
        Expert in pytest and testing best practices.
    """,
    llm=llm,
    verbose=True,
)

# Task 1: Code Review
review_task = Task(
    description="""
        Review this Python code for:
        1. Code quality and readability
        2. Best practices compliance
        3. Potential improvements
        
        Code:
        {code}
    """,
    expected_output="Detailed review with suggestions",
    agent=reviewer,
)

# Task 2: Security Analysis
security_task = Task(
    description="""
        Analyze this code for security issues:
        - Input validation
        - SQL injection risks
        - Authentication issues
        
        Code:
        {code}
    """,
    expected_output="Security report with risk levels",
    agent=security_analyst,
)

# Task 3: Generate Tests
test_task = Task(
    description="""
        Generate pytest unit tests for:
        - Happy path scenarios
        - Edge cases
        - Error handling
        
        Code:
        {code}
    """,
    expected_output="Complete pytest test file",
    agent=test_engineer,
    output_file="tests.py",
)

# Assemble the Crew
code_review_crew = Crew(
    agents=[reviewer, security_analyst, test_engineer],
    tasks=[review_task, security_task, test_task],
    process=Process.sequential,
    verbose=True,
)

# Run the pipeline
if __name__ == "__main__":
    code_to_review = """
    def authenticate(username, password):
        query = f"SELECT * FROM users WHERE name='{username}'"
        user = db.execute(query)
        return user.password == password
    """
    
    result = code_review_crew.kickoff(inputs={"code": code_to_review})
    print(result)
```

---

## 📖 Project Reference: Dev Agents

This project implements a complete multi-agent system. Here's the architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dev Agents Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌────────────────────────────────────────────────────────┐   │
│    │                     CLI (main.py)                       │   │
│    │  generate | review | debug | test | docs | refactor    │   │
│    └────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│    ┌────────────────────────▼───────────────────────────────┐   │
│    │                    DevCrew (crew.py)                    │   │
│    │              Multi-Agent Orchestration                  │   │
│    └────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│    ┌───────────┬────────────┼────────────┬───────────┐          │
│    ▼           ▼            ▼            ▼           ▼          │
│ ┌──────┐  ┌──────┐    ┌──────────┐  ┌──────┐   ┌──────────┐    │
│ │Code  │  │Code  │    │   Bug    │  │Test  │   │   Doc    │    │
│ │Gen   │  │Review│    │Detective │  │ Gen  │   │ Writer   │    │
│ └──────┘  └──────┘    └──────────┘  └──────┘   └──────────┘    │
│                             │                                    │
│    ┌────────────────────────▼───────────────────────────────┐   │
│    │                   LLM Config                            │   │
│    │        Ollama (Local) │ OpenAI (Fallback)              │   │
│    └────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `crew.py` | DevCrew class with multi-agent orchestration |
| `llm_config.py` | LLM configuration (Ollama/OpenAI) |
| `agents/` | Individual agent implementations |
| `config/` | YAML configuration files |
| `main.py` | CLI entry point |

---

## ✅ Best Practices

### Agent Design

```
┌────────────────────────────────────────────────────────────┐
│                   Agent Design Principles                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Clear Role           "Senior Python Developer"          │
│  ✓ Specific Goal        "Generate bug-free FastAPI code"   │
│  ✓ Rich Backstory       Adds personality and expertise     │
│  ✓ Right Tools          Only what's needed                 │
│  ✓ Appropriate LLM      Match model to task complexity     │
│                                                             │
│  ✗ Vague roles          "Helper"                           │
│  ✗ Generic goals        "Do good work"                     │
│  ✗ Too many tools       Causes confusion                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Task Design

1. **Clear Description**: Detailed, unambiguous instructions
2. **Expected Output**: Define format and content expectations
3. **Context Variables**: Use `{placeholders}` for dynamic content
4. **Output Files**: Save important results to files

### Performance Tips

| Tip | Implementation |
|-----|----------------|
| **Use Local LLMs** | Ollama for cost savings |
| **Limit Tools** | 3-5 tools max per agent |
| **Sequential First** | Easier to debug than hierarchical |
| **Enable Verbose** | During development only |
| **Cache Results** | Implement caching for repeated tasks |

### Error Handling

```python
from crewai import Crew

try:
    result = crew.kickoff(inputs={"code": code})
except Exception as e:
    print(f"Crew execution failed: {e}")
    # Fallback to single agent or manual review
```

---

## 📚 Resources

### Official Documentation

| Resource | Link |
|----------|------|
| CrewAI Docs | https://docs.crewai.com |
| LangChain Docs | https://python.langchain.com |
| Ollama | https://ollama.ai |

### Learning Path

```
┌────────────────────────────────────────────────────────────┐
│                    Recommended Learning Path                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Week 1: LangChain Fundamentals                           │
│   ├── Models and Prompts                                   │
│   ├── Chains and LCEL                                      │
│   └── Simple agents with tools                             │
│                                                             │
│   Week 2: CrewAI Basics                                    │
│   ├── Agents, Tasks, and Crews                             │
│   ├── Process types                                        │
│   └── YAML configuration                                   │
│                                                             │
│   Week 3: Integration                                      │
│   ├── LangChain tools in CrewAI                           │
│   ├── Custom tool development                              │
│   └── Memory systems                                       │
│                                                             │
│   Week 4: Production                                       │
│   ├── Error handling and logging                           │
│   ├── Performance optimization                             │
│   └── Deployment strategies                                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Quick Reference

```python
# Install dependencies
pip install crewai crewai-tools langchain langchain-community

# Create a basic crew
from crewai import Agent, Task, Crew

agent = Agent(role="Assistant", goal="Help users", backstory="...")
task = Task(description="...", expected_output="...", agent=agent)
crew = Crew(agents=[agent], tasks=[task])
result = crew.kickoff()
```

---

## 🎯 Summary

| Framework | Best For |
|-----------|----------|
| **LangChain** | Building LLM chains, prompts, single agents with tools |
| **CrewAI** | Multi-agent collaboration, complex workflows |
| **Together** | Enterprise-grade AI agent systems |

Start simple, iterate, and build complexity gradually. Happy building! 🚀

---

*Last Updated: February 2026*
