"""Bug Detective Agent - Debug and identify issues in code."""

from crewai import Agent
from crewai_tools import FileReadTool

from dev_agents.llm_config import get_llm


class BugDetectiveAgent:
    """
    AI agent specialized in debugging code and identifying root causes.
    """
    
    def __init__(
        self,
        verbose: bool = True,
        custom_role: str = None,
        custom_goal: str = None,
        custom_backstory: str = None,
        **llm_kwargs,
    ):
        """
        Initialize the Bug Detective Agent.
        
        Args:
            verbose: Enable verbose output
            custom_role: Optional role override
            custom_goal: Optional goal override
            custom_backstory: Optional backstory override
            **llm_kwargs: Additional arguments for LLM initialization
        """
        self.verbose = verbose
        self.custom_role = custom_role
        self.custom_goal = custom_goal
        self.custom_backstory = custom_backstory
        self.llm = get_llm(**llm_kwargs)
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role=self.custom_role or "Debugging Specialist and Root Cause Analyst",
            goal=self.custom_goal or (
                "Identify the root cause of bugs and issues by analyzing code, error "
                "messages, and stack traces. Provide clear explanations and solutions."
            ),
            backstory=self.custom_backstory or (
                "You are a debugging expert who thrives on solving complex problems. You "
                "systematically analyze symptoms, form hypotheses, and trace through code "
                "to find root causes. You've debugged everything from race conditions to "
                "memory leaks."
            ),
            tools=[FileReadTool()],
            llm=self.llm,
            verbose=self.verbose,
        )
    
    def debug(
        self,
        error_description: str,
        file_path: str,
        code_content: str,
        language: str = "python",
        stack_trace: str = "",
    ) -> str:
        """
        Debug code and identify root cause of issues.
        
        Args:
            error_description: Description of the error or problem
            file_path: Path to the file with the issue
            code_content: The code to debug
            language: Programming language
            stack_trace: Optional stack trace
            
        Returns:
            Debugging report as markdown
        """
        from crewai import Task, Crew
        
        agent = self.create_agent()
        
        task = Task(
            description=f"""
            Debug the following issue:
            
            Error/Problem: {error_description}
            
            File: {file_path}
            
            ```{language}
            {code_content}
            ```
            
            Stack Trace (if available):
            {stack_trace or "Not provided"}
            
            Analyze and identify the root cause.
            """,
            expected_output="""
            Debugging report containing:
            - Root cause analysis
            - Step-by-step explanation of what's happening
            - Recommended fix with code example
            - Prevention tips for similar issues
            Format: Markdown report
            """,
            agent=agent,
        )
        
        crew = Crew(agents=[agent], tasks=[task], verbose=self.verbose)
        result = crew.kickoff()
        
        return str(result)
