"""File handling tools for AI agents."""

import os
from pathlib import Path
from typing import List, Optional


def read_file(file_path: str) -> str:
    """
    Read contents of a file.
    
    Args:
        file_path: Path to the file to read
        
    Returns:
        File contents as string
        
    Raises:
        FileNotFoundError: If file doesn't exist
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    return path.read_text(encoding="utf-8")


def write_file(file_path: str, content: str, overwrite: bool = False) -> str:
    """
    Write content to a file.
    
    Args:
        file_path: Path to write to
        content: Content to write
        overwrite: If True, overwrite existing file
        
    Returns:
        Path to written file
        
    Raises:
        FileExistsError: If file exists and overwrite is False
    """
    path = Path(file_path)
    
    if path.exists() and not overwrite:
        raise FileExistsError(f"File already exists: {file_path}")
    
    # Create parent directories if needed
    path.parent.mkdir(parents=True, exist_ok=True)
    
    path.write_text(content, encoding="utf-8")
    return str(path.absolute())


def list_directory(
    directory: str,
    pattern: str = "*",
    recursive: bool = False,
) -> List[str]:
    """
    List files in a directory.
    
    Args:
        directory: Directory path to list
        pattern: Glob pattern to filter files (default: *)
        recursive: If True, search recursively
        
    Returns:
        List of file paths matching the pattern
    """
    path = Path(directory)
    
    if not path.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")
    
    if not path.is_dir():
        raise NotADirectoryError(f"Not a directory: {directory}")
    
    if recursive:
        files = path.rglob(pattern)
    else:
        files = path.glob(pattern)
    
    return [str(f) for f in files if f.is_file()]


def get_file_extension(file_path: str) -> Optional[str]:
    """
    Get the file extension.
    
    Args:
        file_path: Path to the file
        
    Returns:
        File extension without the dot, or None if no extension
    """
    path = Path(file_path)
    suffix = path.suffix
    return suffix[1:] if suffix else None
