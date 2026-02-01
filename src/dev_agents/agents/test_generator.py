"""Test Generator Agent - Generate unit and integration tests."""

from crewai import Agent
from crewai_tools import FileReadTool

from dev_agents.llm_config import get_llm


class TestGeneratorAgent:
    """
    AI agent specialized in generating comprehensive tests.
    """
    
    def __init__(self, test_framework: str = "pytest", verbose: bool = True):
        """
        Initialize the Test Generator Agent.
        
        Args:
            test_framework: Testing framework to use (default: pytest)
            verbose: Enable verbose output
        """
        self.test_framework = test_framework
        self.verbose = verbose
        self.llm = get_llm()
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role=f"Quality Assurance Engineer specializing in {self.test_framework}",
            goal=(
                "Generate comprehensive unit and integration tests that achieve high code "
                "coverage and catch edge cases and potential bugs."
            ),
            backstory=(
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
