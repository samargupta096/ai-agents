"""LLM Configuration for Ollama and fallback providers."""

import os
from typing import Optional
from dotenv import load_dotenv
from crewai import LLM

load_dotenv()


def get_ollama_llm(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    temperature: float = 0.7,
) -> LLM:
    """
    Get an Ollama LLM instance for CrewAI agents.
    
    Args:
        model: Ollama model name (default: from OLLAMA_MODEL env var or codellama:13b)
        base_url: Ollama server URL (default: from OLLAMA_BASE_URL env var or localhost:11434)
        temperature: Sampling temperature for generation
        
    Returns:
        LLM instance configured for Ollama
    """
    model = model or os.getenv("OLLAMA_MODEL", "codellama:13b")
    base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    return LLM(
        model=f"ollama/{model}",
        base_url=base_url,
        temperature=temperature,
    )


def get_openai_llm(
    model: str = "gpt-4o-mini",
    temperature: float = 0.7,
) -> Optional[LLM]:
    """
    Get OpenAI LLM as fallback when Ollama is unavailable.
    
    Args:
        model: OpenAI model name
        temperature: Sampling temperature for generation
        
    Returns:
        LLM instance configured for OpenAI, or None if API key not set
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
        
    return LLM(
        model=f"openai/{model}",
        temperature=temperature,
    )


def get_llm(prefer_local: bool = True) -> LLM:
    """
    Get the best available LLM based on configuration.
    
    Args:
        prefer_local: If True, prefer Ollama over OpenAI
        
    Returns:
        LLM instance (Ollama or OpenAI fallback)
    """
    if prefer_local:
        return get_ollama_llm()
    
    openai_llm = get_openai_llm()
    if openai_llm:
        return openai_llm
    
    return get_ollama_llm()
