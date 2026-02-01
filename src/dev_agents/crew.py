"""DevCrew - Multi-agent orchestration for software development tasks."""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

from dev_agents.llm_config import get_llm
from dev_agents.agents import (
    CodeGeneratorAgent,
    CodeReviewerAgent,
    BugDetectiveAgent,
    TestGeneratorAgent,
    DocWriterAgent,
    RefactoringExpertAgent,
)


@CrewBase
class DevCrew:
    """
    Multi-agent crew for comprehensive software development workflows.
    
    Orchestrates multiple specialized agents to work together on complex
    development tasks like full code reviews, test-driven development, etc.
    """
    
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    
    def __init__(self, verbose: bool = True):
        """
        Initialize the DevCrew.
        
        Args:
            verbose: Enable verbose output for all agents
        """
        self.verbose = verbose
        self.llm = get_llm()
    
    @agent
    def code_reviewer(self) -> Agent:
        """Create the Code Reviewer agent."""
        return CodeReviewerAgent(verbose=self.verbose).create_agent()
    
    @agent
    def bug_detective(self) -> Agent:
        """Create the Bug Detective agent."""
        return BugDetectiveAgent(verbose=self.verbose).create_agent()
    
    @agent
    def test_generator(self) -> Agent:
        """Create the Test Generator agent."""
        return TestGeneratorAgent(verbose=self.verbose).create_agent()
    
    @agent
    def doc_writer(self) -> Agent:
        """Create the Documentation Writer agent."""
        return DocWriterAgent(verbose=self.verbose).create_agent()
    
    @task
    def review_task(self) -> Task:
        """Create a code review task."""
        return Task(
            config=self.tasks_config["review_code_task"],
        )
    
    @task
    def bug_check_task(self) -> Task:
        """Create a bug detection task."""
        return Task(
            config=self.tasks_config["debug_code_task"],
        )
    
    @task
    def generate_tests_task(self) -> Task:
        """Create a test generation task."""
        return Task(
            config=self.tasks_config["generate_tests_task"],
        )
    
    @task
    def generate_docs_task(self) -> Task:
        """Create a documentation generation task."""
        return Task(
            config=self.tasks_config["generate_docs_task"],
        )
    
    @crew
    def crew(self) -> Crew:
        """Create the DevCrew with sequential processing."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=self.verbose,
        )


def run_full_review_pipeline(
    file_path: str,
    code_content: str,
    language: str = "python",
    verbose: bool = True,
) -> dict:
    """
    Run a full code review pipeline with multiple agents.
    
    Pipeline:
    1. Code Review - Check for issues and best practices
    2. Bug Detection - Look for potential bugs
    3. Test Generation - Create tests for the code
    4. Documentation - Generate docs for the code
    
    Args:
        file_path: Path to the file being reviewed
        code_content: The code content
        language: Programming language
        verbose: Enable verbose output
        
    Returns:
        Dictionary with results from each agent
    """
    results = {}
    
    # Step 1: Code Review
    reviewer = CodeReviewerAgent(verbose=verbose)
    results["review"] = reviewer.review(file_path, code_content, language)
    
    # Step 2: Bug Detection
    bug_detective = BugDetectiveAgent(verbose=verbose)
    results["bugs"] = bug_detective.debug(
        "Analyze for potential bugs",
        file_path,
        code_content,
        language,
    )
    
    # Step 3: Test Generation
    test_gen = TestGeneratorAgent(verbose=verbose)
    results["tests"] = test_gen.generate_tests(file_path, code_content, language)
    
    # Step 4: Documentation
    doc_writer = DocWriterAgent(verbose=verbose)
    results["docs"] = doc_writer.generate_docs(file_path, code_content, language)
    
    return results
