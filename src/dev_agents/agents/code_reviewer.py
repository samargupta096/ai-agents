"""Code Reviewer Agent - Review code for issues and best practices."""

from crewai import Agent
from crewai_tools import FileReadTool, CodeDocsSearchTool

from dev_agents.llm_config import get_llm


class CodeReviewerAgent:
    """
    AI agent specialized in reviewing code for bugs, security issues, 
    and adherence to best practices.
    """
    
    def __init__(self, verbose: bool = True):
        """
        Initialize the Code Reviewer Agent.
        
        Args:
            verbose: Enable verbose output
        """
        self.verbose = verbose
        self.llm = get_llm()
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role="Senior Code Reviewer and Security Expert",
            goal=(
                "Thoroughly review code for bugs, security vulnerabilities, performance "
                "issues, and adherence to best practices. Provide actionable, constructive "
                "feedback."
            ),
            backstory=(
                "You are a meticulous code reviewer who has reviewed thousands of pull "
                "requests. You have a keen eye for spotting potential issues, from subtle "
                "bugs to security vulnerabilities. You provide feedback that is specific, "
                "actionable, and educational."
            ),
            tools=[FileReadTool(), CodeDocsSearchTool()],
            llm=self.llm,
            verbose=self.verbose,
        )
    
    def review(self, file_path: str, code_content: str, language: str = "python") -> str:
        """
        Review code and provide feedback.
        
        Args:
            file_path: Path to the file being reviewed
            code_content: The code to review
            language: Programming language
            
        Returns:
            Code review report as markdown
        """
        from crewai import Task, Crew
        
        agent = self.create_agent()
        
        task = Task(
            description=f"""
            Review the following code for issues and improvements:
            
            File: {file_path}
            
            ```{language}
            {code_content}
            ```
            
            Check for:
            - Bugs and logic errors
            - Security vulnerabilities
            - Performance issues
            - Code style and best practices
            - Missing error handling
            """,
            expected_output="""
            Detailed code review report containing:
            - Summary of findings (Critical/High/Medium/Low)
            - Specific issues with line numbers
            - Suggested fixes with code examples
            - Overall code quality score (1-10)
            Format: Markdown report
            """,
            agent=agent,
        )
        
        crew = Crew(agents=[agent], tasks=[task], verbose=self.verbose)
        result = crew.kickoff()
        
        return str(result)
