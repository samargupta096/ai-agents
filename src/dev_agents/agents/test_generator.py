"""Test Generator Agent - Generate unit and integration tests."""

from crewai import Agent
from crewai_tools import FileReadTool

from dev_agents.llm_config import get_llm


class TestGeneratorAgent:
    """
    AI agent specialized in generating comprehensive tests.
    """
    
    def __init__(
        self,
        test_framework: str = "pytest",
        verbose: bool = True,
        custom_role: str = None,
        custom_goal: str = None,
        custom_backstory: str = None,
        **llm_kwargs,
    ):
        """
        Initialize the Test Generator Agent.
        
        Args:
            test_framework: Testing framework to use (default: pytest)
            verbose: Enable verbose output
            custom_role: Optional role override
            custom_goal: Optional goal override
            custom_backstory: Optional backstory override
            **llm_kwargs: Additional arguments for LLM initialization
        """
        self.test_framework = test_framework
        self.verbose = verbose
        self.custom_role = custom_role
        self.custom_goal = custom_goal
        self.custom_backstory = custom_backstory
        self.llm = get_llm(**llm_kwargs)
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role=self.custom_role or f"Quality Assurance Engineer specializing in {self.test_framework}",
            goal=self.custom_goal or (
                "Generate comprehensive unit and integration tests that achieve high code "
                "coverage and catch edge cases and potential bugs."
            ),
            backstory=self.custom_backstory or (
                "You are a testing expert who believes in test-driven development. You "
                "write tests that are clear, maintainable, and truly validate code "
                "behavior. You always consider edge cases, error conditions, and "
                "boundary values."
            ),
            tools=[FileReadTool()],
            llm=self.llm,
            verbose=self.verbose,
        )
    
    def generate_tests(
        self,
        file_path: str,
        code_content: str,
        language: str = "python",
    ) -> str:
        """
        Generate tests for the given code.
        
        Args:
            file_path: Path to the file to test
            code_content: The code to generate tests for
            language: Programming language
            
        Returns:
            Generated test code
        """
        from crewai import Task, Crew
        
        agent = self.create_agent()
        
        task = Task(
            description=f"""
            Generate comprehensive tests for the following code:
            
            File: {file_path}
            
            ```{language}
            {code_content}
            ```
            
            Test framework: {self.test_framework}
            
            Create tests that:
            - Cover all functions/methods
            - Test edge cases and error conditions
            - Include both unit and integration tests where appropriate
            """,
            expected_output=f"""
            Complete test file containing:
            - Unit tests for all public functions/methods
            - Edge case tests
            - Error handling tests
            - Mocking where appropriate
            Format: Valid {self.test_framework} test code
            """,
            agent=agent,
        )
        
        crew = Crew(agents=[agent], tasks=[task], verbose=self.verbose)
        result = crew.kickoff()
        
        return str(result)
