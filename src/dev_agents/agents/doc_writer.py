"""Documentation Writer Agent - Generate docs and README files."""

from crewai import Agent
from crewai_tools import FileReadTool

from dev_agents.llm_config import get_llm


class DocWriterAgent:
    """
    AI agent specialized in generating documentation.
    """
    
    def __init__(self, verbose: bool = True):
        """
        Initialize the Documentation Writer Agent.
        
        Args:
            verbose: Enable verbose output
        """
        self.verbose = verbose
        self.llm = get_llm()
        
    def create_agent(self) -> Agent:
        """Create and return the CrewAI agent instance."""
        return Agent(
            role="Technical Writer and Documentation Specialist",
            goal=(
                "Create clear, comprehensive documentation including docstrings, README "
                "files, and API documentation that developers will actually want to read."
            ),
            backstory=(
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
