"""Code Generator Agent - Generate code from natural language descriptions."""

from crewai import Agent
from crewai_tools import FileReadTool, DirectoryReadTool

from dev_agents.llm_config import get_llm


class CodeGeneratorAgent:
    """
    AI agent specialized in generating code from natural language descriptions.
    
    Uses local LLM via Ollama to generate production-ready code following
    best practices and proper error handling.
    """
    
    def __init__(self, language: str = "python", verbose: bool = True):
        """
        Initialize the Code Generator Agent.
        
        Args:
            language: Primary programming language (default: python)
            verbose: Enable verbose output
        """
        self.language = language
        self.verbose = verbose
        self.llm = get_llm()
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role=f"Senior Software Developer specializing in {self.language}",
            goal=(
                "Generate high-quality, production-ready code based on natural language "
                "descriptions. Write clean, efficient, and well-documented code following "
                "best practices."
            ),
            backstory=(
                "You are an expert software developer with 15+ years of experience across "
                "multiple languages and frameworks. You excel at understanding requirements "
                "and translating them into elegant, maintainable code. You always consider "
                "edge cases, error handling, and performance."
            ),
            tools=[],
            llm=self.llm,
            verbose=self.verbose,
        )
    
    def generate(self, requirements: str) -> str:
        """
        Generate code based on natural language requirements.
        
        Args:
            requirements: Natural language description of what to generate
            
        Returns:
            Generated code as a string
        """
        from crewai import Task, Crew
        
        agent = self.create_agent()
        
        task = Task(
            description=f"""
            Generate {self.language} code based on the following requirements:
            
            {requirements}
            
            Ensure the code:
            - Is production-ready and follows best practices
            - Includes proper error handling
            - Has clear variable and function names
            - Includes inline comments for complex logic
            """,
            expected_output=f"""
            Well-structured {self.language} code that implements the requirements.
            Include any necessary imports and dependencies.
            """,
            agent=agent,
        )
        
        crew = Crew(agents=[agent], tasks=[task], verbose=self.verbose)
        result = crew.kickoff()
        
        return str(result)
