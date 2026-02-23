"""FastAPI Backend for Dev Agents Dashboard.

Provides REST API and SSE streaming for the React frontend.
"""

import asyncio
import json
import os
import sys
from typing import AsyncGenerator, Optional
from contextlib import redirect_stdout, redirect_stderr
import io

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from dev_agents.agents import (
    CodeGeneratorAgent,
    CodeReviewerAgent,
    BugDetectiveAgent,
    TestGeneratorAgent,
    DocWriterAgent,
    RefactoringExpertAgent,
)
from dev_agents.crew import run_crew_pipeline
from dev_agents.llm_config import get_ollama_llm

app = FastAPI(
    title="Dev Agents API",
    description="API for managing AI development agents",
    version="1.0.0",
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Models ============

class AgentRequest(BaseModel):
    """Request model for agent execution."""
    agent_type: str
    prompt: str
    model: str = "qwen3-coder:latest"
    language: str = "python"
    file_path: Optional[str] = None
    code_content: Optional[str] = None
    error_message: Optional[str] = None
    # Advanced LLM Parameters
    temperature: float = 0.7
    max_tokens: int = 2048
    top_p: float = 0.9
    repeat_penalty: float = 1.1
    # Advanced Agent Configuration Overrides
    agent_role: Optional[str] = None
    agent_goal: Optional[str] = None
    agent_backstory: Optional[str] = None


class PipelineRequest(BaseModel):
    """Request model for full pipeline execution."""
    prompt: str
    model: str = "qwen3-coder:latest"
    language: str = "python"
    file_path: Optional[str] = None
    code_content: Optional[str] = None
    pipeline_type: str = "sequential"
    # Advanced LLM Parameters
    temperature: float = 0.7
    max_tokens: int = 2048
    top_p: float = 0.9
    repeat_penalty: float = 1.1


class FileBrowseRequest(BaseModel):
    """Request model for browsing files/folders."""
    path: str


class FileWriteRequest(BaseModel):
    """Request model for writing files."""
    path: str
    content: str


class ModelInfo(BaseModel):
    """Model information."""
    name: str
    id: str
    size: str
    modified: str


class AgentInfo(BaseModel):
    """Agent information."""
    id: str
    name: str
    description: str
    icon: str
    color: str


# ============ Available Agents ============

AGENTS = [
    AgentInfo(
        id="generate",
        name="Code Generator",
        description="Generate production-ready code from natural language descriptions",
        icon="💻",
        color="#3B82F6",
    ),
    AgentInfo(
        id="review",
        name="Code Reviewer",
        description="Review code for bugs, security issues, and best practices",
        icon="🔍",
        color="#10B981",
    ),
    AgentInfo(
        id="debug",
        name="Bug Detective",
        description="Debug issues and find root causes of errors",
        icon="🐛",
        color="#EF4444",
    ),
    AgentInfo(
        id="test",
        name="Test Generator",
        description="Generate comprehensive unit and integration tests",
        icon="🧪",
        color="#8B5CF6",
    ),
    AgentInfo(
        id="docs",
        name="Doc Writer",
        description="Generate documentation, docstrings, and README files",
        icon="📚",
        color="#F59E0B",
    ),
    AgentInfo(
        id="refactor",
        name="Refactoring Expert",
        description="Suggest code improvements and refactoring opportunities",
        icon="⚙️",
        color="#EC4899",
    ),
    AgentInfo(
        id="pipeline",
        name="Full Dev Pipeline",
        description="Run the full CrewAI pipeline (Review -> Bug Check -> Tests -> Docs)",
        icon="🌊",
        color="#14B8A6",
    ),
]


# ============ Endpoints ============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Dev Agents API is running"}


@app.get("/api/agents")
async def list_agents():
    """List all available agents."""
    return {"agents": [a.model_dump() for a in AGENTS]}


@app.get("/api/models")
async def list_models():
    """List available Ollama models from local_models.txt."""
    models = []
    models_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "local_models.txt"
    )
    
    if os.path.exists(models_file):
        with open(models_file, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) >= 4:
                    models.append(ModelInfo(
                        name=parts[0],
                        id=parts[1],
                        size=parts[2] if parts[2] != "-" else "cloud",
                        modified=" ".join(parts[3:]),
                    ).model_dump())
    
    return {"models": models}


@app.get("/api/config")
async def get_config():
    """Get current configuration."""
    return {
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        "ollama_model": os.getenv("OLLAMA_MODEL", "qwen3-coder:latest"),
        "agent_verbose": os.getenv("AGENT_VERBOSE", "true") == "true",
    }


async def stream_agent_output(request: AgentRequest) -> AsyncGenerator[str, None]:
    """Stream agent output as SSE events."""
    
    # Send initial status
    yield f"data: {json.dumps({'type': 'status', 'message': 'Initializing agent...'})}\n\n"
    await asyncio.sleep(0.1)
    
    try:
        # Set the model in environment
        os.environ["OLLAMA_MODEL"] = request.model
        
        yield f"data: {json.dumps({'type': 'status', 'message': f'Using model: {request.model}'})}\n\n"
        await asyncio.sleep(0.1)
        
        yield f"data: {json.dumps({'type': 'thinking', 'message': 'Agent is thinking...'})}\n\n"
        
        # Execute agent based on type
        result = ""
        
        # Extract common kwargs for agent initialization
        agent_kwargs = {
            "verbose": False,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "top_p": request.top_p,
            "repeat_penalty": request.repeat_penalty,
            "custom_role": request.agent_role,
            "custom_goal": request.agent_goal,
            "custom_backstory": request.agent_backstory,
        }
        
        if request.agent_type == "generate":
            agent = CodeGeneratorAgent(language=request.language, **agent_kwargs)
            result = await asyncio.to_thread(agent.generate, request.prompt)
            
        elif request.agent_type == "review":
            if not request.code_content:
                raise ValueError("Code content is required for review")
            agent = CodeReviewerAgent(**agent_kwargs)
            result = await asyncio.to_thread(
                agent.review,
                request.file_path or "input.py",
                request.code_content,
                request.language,
            )
            
        elif request.agent_type == "debug":
            if not request.code_content or not request.error_message:
                raise ValueError("Code content and error message are required for debugging")
            agent = BugDetectiveAgent(**agent_kwargs)
            result = await asyncio.to_thread(
                agent.debug,
                request.error_message,
                request.file_path or "input.py",
                request.code_content,
                request.language,
                request.stack_trace or "",
            )
            
        elif request.agent_type == "test":
            if not request.code_content:
                raise ValueError("Code content is required for test generation")
            agent = TestGeneratorAgent(test_framework=getattr(request, "test_framework", "pytest"), **agent_kwargs)
            result = await asyncio.to_thread(
                agent.generate_tests,
                request.file_path or "input.py",
                request.code_content,
                request.language,
            )
            
        elif request.agent_type == "docs":
            if not request.code_content:
                raise ValueError("Code content is required for documentation")
            agent = DocWriterAgent(**agent_kwargs)
            result = await asyncio.to_thread(
                agent.generate_docs,
                request.file_path or "input.py",
                request.code_content,
                request.language,
                request.doc_type,
            )
            
        elif request.agent_type == "refactor":
            if not request.code_content:
                raise ValueError("Code content is required for refactoring")
            agent = RefactoringExpertAgent(**agent_kwargs)
            result = await asyncio.to_thread(
                agent.refactor,
                request.file_path or "input.py",
                request.code_content,
                request.language,
                request.focus,
            )
        else:
            raise ValueError(f"Unknown agent type: {request.agent_type}")
        
        # Stream the result in chunks for better UX
        chunk_size = 50
        for i in range(0, len(result), chunk_size):
            chunk = result[i:i + chunk_size]
            yield f"data: {json.dumps({'type': 'output', 'content': chunk})}\n\n"
            await asyncio.sleep(0.02)
        
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Agent completed successfully'})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@app.post("/api/execute")
async def execute_agent(request: AgentRequest):
    """Execute an agent with SSE streaming response."""
    return StreamingResponse(
        stream_agent_output(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def stream_pipeline_output(request: PipelineRequest) -> AsyncGenerator[str, None]:
    """Stream pipeline output as SSE events."""
    yield f"data: {json.dumps({'type': 'status', 'message': 'Initializing DEV Crew Pipeline...'})}\n\n"
    await asyncio.sleep(0.1)
    
    try:
        os.environ["OLLAMA_MODEL"] = request.model
        yield f"data: {json.dumps({'type': 'status', 'message': f'Using process: {request.pipeline_type}'})}\n\n"
        await asyncio.sleep(0.1)
        yield f"data: {json.dumps({'type': 'thinking', 'message': 'Crew is working...'})}\n\n"
        
        result = await asyncio.to_thread(
            run_crew_pipeline,
            file_path=request.file_path or "input.py",
            code_content=request.code_content or request.prompt,
            language=request.language,
            process_type=request.pipeline_type,
            verbose=False,
        )
        
        chunk_size = 50
        for i in range(0, len(result), chunk_size):
            chunk = result[i:i + chunk_size]
            yield f"data: {json.dumps({'type': 'output', 'content': chunk})}\n\n"
            await asyncio.sleep(0.02)
            
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Pipeline completed successfully'})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@app.post("/api/pipeline")
async def execute_pipeline(request: PipelineRequest):
    """Execute the full agent pipeline with SSE streaming response."""
    return StreamingResponse(
        stream_pipeline_output(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============ File Management Endpoints ============

@app.post("/api/files/browse")
async def browse_directory(request: FileBrowseRequest):
    """Browse a directory and return its contents."""
    path = os.path.expanduser(request.path)
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Path not found: {path}")
    
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Path is not a directory")
    
    items = []
    try:
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            stat = os.stat(item_path)
            items.append({
                "name": item,
                "path": item_path,
                "type": "directory" if os.path.isdir(item_path) else "file",
                "size": stat.st_size if os.path.isfile(item_path) else None,
                "modified": stat.st_mtime,
            })
        
        # Sort: directories first, then files
        items.sort(key=lambda x: (x["type"] == "file", x["name"].lower()))
        
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return {"path": path, "items": items}


@app.post("/api/files/read")
async def read_file(request: FileBrowseRequest):
    """Read a file's contents."""
    path = os.path.expanduser(request.path)
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    
    if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail="Path is not a file")
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        return {
            "path": path,
            "content": content,
            "size": os.path.getsize(path),
            "modified": os.path.getmtime(path),
        }
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Binary file cannot be read as text")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


@app.post("/api/files/write")
async def write_file(request: FileWriteRequest):
    """Write content to a file."""
    path = os.path.expanduser(request.path)
    
    # Create parent directories if they don't exist
    parent_dir = os.path.dirname(path)
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir)
    
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(request.content)
        
        return {
            "path": path,
            "success": True,
            "size": os.path.getsize(path),
        }
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

