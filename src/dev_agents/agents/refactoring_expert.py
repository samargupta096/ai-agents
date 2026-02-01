"""Refactoring Expert Agent - Suggest and implement code improvements."""

from crewai import Agent
from crewai_tools import FileReadTool, CodeDocsSearchTool

from dev_agents.llm_config import get_llm


class RefactoringExpertAgent:
    """
    AI agent specialized in code refactoring and improvement.
    """
    
    def __init__(self, verbose: bool = True):
        """
        Initialize the Refactoring Expert Agent.
        
        Args:
            verbose: Enable verbose output
        """
        self.verbose = verbose
        self.llm = get_llm()
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role="Software Architect and Refactoring Specialist",
            goal=(
                "Analyze code for improvement opportunities and suggest refactoring "
                "strategies that enhance maintainability, readability, and performance "
                "without changing behavior."
            ),
            backstory=(
                "You are a software architect who specializes in improving existing "
                "codebases. You recognize code smells, apply design patterns appropriately, "
                "and guide teams toward cleaner, more maintainable code. You always ensure "
                "refactoring is safe and incremental."
            ),
            tools=[FileReadTool(), CodeDocsSearchTool()],
            llm=self.llm,
            verbose=self.verbose,
        )
    
    def refactor(
        self,
        file_path: str,
        code_content: str,
        language: str = "python",
        focus_areas: str = "general",
    ) -> str:
        """
        Analyze code and suggest refactoring improvements.
        
        Args:
            file_path: Path to the file to refactor
            code_content: The code to refactor
            language: Programming language
            focus_areas: Specific areas to focus on (e.g., performance, readability)
            
        Returns:
            Refactoring report as markdown
        """
        from crewai import Task, Crew
        
        agent = self.create_agent()
        
        task = Task(
            description=f"""
            Analyze and suggest refactoring for the following code:
            
            File: {file_path}
            
            ```{language}
            {code_content}
            ```
            
            Focus areas: {focus_areas}
            
            Identify code smells and improvement opportunities.
            """,
            expected_output="""
            Refactoring report containing:
            - Identified code smells
            - Suggested improvements with explanations
            - Refactored code examples
            - Design pattern recommendations where applicable
            - Estimated effort and risk assessment
            Format: Markdown report with code examples
            """,
            agent=agent,
        )
        
        crew = Crew(agents=[agent], tasks=[task], verbose=self.verbose)
        result = crew.kickoff()
        
        return str(result)
