"""Code analysis tools for AI agents."""

from pathlib import Path
from typing import Optional

# Language detection based on file extension
LANGUAGE_MAP = {
    "py": "python",
    "js": "javascript",
    "ts": "typescript",
    "jsx": "javascript",
    "tsx": "typescript",
    "java": "java",
    "cpp": "cpp",
    "c": "c",
    "h": "c",
    "hpp": "cpp",
    "cs": "csharp",
    "go": "go",
    "rs": "rust",
    "rb": "ruby",
    "php": "php",
    "swift": "swift",
    "kt": "kotlin",
    "scala": "scala",
    "sh": "bash",
    "bash": "bash",
    "sql": "sql",
    "html": "html",
    "css": "css",
    "yaml": "yaml",
    "yml": "yaml",
    "json": "json",
    "xml": "xml",
    "md": "markdown",
}


def detect_language(file_path: str) -> Optional[str]:
    """
    Detect the programming language based on file extension.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Detected language name, or None if unknown
    """
    path = Path(file_path)
    extension = path.suffix[1:].lower() if path.suffix else ""
    
    return LANGUAGE_MAP.get(extension)


def count_lines(content: str) -> dict:
    """
    Count lines in code content.
    
    Args:
        content: Code content as string
        
    Returns:
        Dictionary with total, code, blank, and comment line counts
    """
    lines = content.split("\n")
    total = len(lines)
    blank = sum(1 for line in lines if not line.strip())
    
    # Simple comment detection (works for most languages)
    comment = sum(
        1 for line in lines
        if line.strip().startswith(("#", "//", "/*", "*", "'''", '"""'))
    )
    
    code = total - blank - comment
    
    return {
        "total": total,
        "code": code,
        "blank": blank,
        "comment": comment,
    }


def extract_functions(content: str, language: str = "python") -> list:
    """
    Extract function/method definitions from code.
    
    Args:
        content: Code content as string
        language: Programming language
        
    Returns:
        List of function names found
    """
    import re
    
    functions = []
    
    if language == "python":
        pattern = r"def\s+(\w+)\s*\("
    elif language in ("javascript", "typescript"):
        pattern = r"(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()"
    elif language == "java":
        pattern = r"(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\("
    else:
        return functions
    
    matches = re.findall(pattern, content)
    
    # Flatten matches and filter empty strings
    for match in matches:
        if isinstance(match, tuple):
            functions.extend([m for m in match if m])
        else:
            functions.append(match)
    
    return functions
