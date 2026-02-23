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
    
    def __init__(self, verbose: bool = True, process_type: str = "sequential"):
        """
        Initialize the DevCrew.
        
        Args:
            verbose: Enable verbose output for all agents
            process_type: The process flow for the crew (sequential or hierarchical)
        """
        self.verbose = verbose
        self.process_type = process_type
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
        """Create the DevCrew with specified process."""
        process = Process.hierarchical if self.process_type == "hierarchical" else Process.sequential
        
        crew_kwargs = {
            "agents": self.agents,
            "tasks": self.tasks,
            "process": process,
            "verbose": self.verbose,
        }
        
        if process == Process.hierarchical:
            crew_kwargs["manager_llm"] = self.llm
            
        return Crew(**crew_kwargs)


def run_crew_pipeline(
    file_path: str,
    code_content: str,
    language: str = "python",
    process_type: str = "sequential",
    verbose: bool = True,
) -> str:
    """
    Run the full CrewAI pipeline.
    
    Args:
        file_path: Path to the file being reviewed
        code_content: The code content
        language: Programming language
        process_type: 'sequential' or 'hierarchical'
        verbose: Enable verbose output
        
    Returns:
        String result from the crew execution
    """
    inputs = {
        "file_path": file_path,
        "code_content": code_content,
        "language": language,
        "error_description": "Analyze for potential bugs",
        "stack_trace": "None",
        "test_framework": "pytest",
        "doc_type": "docstrings",
    }
    
    dev_crew = DevCrew(verbose=verbose, process_type=process_type)
    result = dev_crew.crew().kickoff(inputs=inputs)
    return str(result)


def run_full_review_pipeline(
    file_path: str,
    code_content: str,
    language: str = "python",
    verbose: bool = True,
) -> dict:
    """
    Run a full code review pipeline with multiple agents using direct calls.
    
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
