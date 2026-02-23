"""Documentation Writer Agent - Generate docs and README files."""

from crewai import Agent
from crewai_tools import FileReadTool

from dev_agents.llm_config import get_llm


class DocWriterAgent:
    """
    AI agent specialized in generating documentation.
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
        Initialize the Documentation Writer Agent.
        
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
            role=self.custom_role or "Technical Writer and Documentation Specialist",
            goal=self.custom_goal or (
                "Create clear, comprehensive documentation including docstrings, README "
                "files, and API documentation that developers will actually want to read."
            ),
            backstory=self.custom_backstory or (
                "You are a technical writer who bridges the gap between complex code and "
                "clear documentation. You write documentation that is accurate, concise, "
                "and helpful for both beginners and experienced developers."
            ),
            tools=[FileReadTool()],
            llm=self.llm,
            verbose=self.verbose,
        )
    
    def generate_docs(
        self,
        file_path: str,
        code_content: str,
        language: str = "python",
        doc_type: str = "docstrings",
    ) -> str:
        """
        Generate documentation for the given code.
        
        Args:
            file_path: Path to the file to document
            code_content: The code to document
            language: Programming language
            doc_type: Type of documentation (docstrings, readme, api)
            
        Returns:
            Generated documentation
        """
        from crewai import Task, Crew
        
        agent = self.create_agent()
        
        task = Task(
            description=f"""
            Generate documentation for the following code:
            
            File: {file_path}
            
            ```{language}
            {code_content}
            ```
            
            Documentation type: {doc_type}
            
            Create clear, comprehensive documentation.
            """,
            expected_output="""
            Documentation containing:
            - Module/class overview
            - Function/method docstrings
            - Usage examples
            - Parameter and return value descriptions
            Format: Appropriate format based on doc_type (docstrings/README/API docs)
            """,
            agent=agent,
        )
        
        crew = Crew(agents=[agent], tasks=[task], verbose=self.verbose)
        result = crew.kickoff()
        
        return str(result)
