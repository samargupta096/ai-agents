#!/usr/bin/env python
"""Main entry point for Dev Agents CLI."""

import sys
import argparse
from pathlib import Path

from dev_agents.agents import (
    CodeGeneratorAgent,
    CodeReviewerAgent,
    BugDetectiveAgent,
    TestGeneratorAgent,
    DocWriterAgent,
    RefactoringExpertAgent,
)
from dev_agents.tools.file_tools import read_file
from dev_agents.tools.code_tools import detect_language


def run():
    """Main entry point - parse args and dispatch to appropriate agent."""
    parser = argparse.ArgumentParser(
        description="AI Agents for Software Engineers",
        prog="dev-agents",
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate code from description")
    gen_parser.add_argument("description", help="Natural language description of code to generate")
    gen_parser.add_argument("-l", "--language", default="python", help="Programming language")
    gen_parser.add_argument("-o", "--output", help="Output file path")
    
    # Review command
    review_parser = subparsers.add_parser("review", help="Review code for issues")
    review_parser.add_argument("file", help="File to review")
    
    # Debug command
    debug_parser = subparsers.add_parser("debug", help="Debug code issues")
    debug_parser.add_argument("file", help="File to debug")
    debug_parser.add_argument("-e", "--error", required=True, help="Error description or message")
    debug_parser.add_argument("-t", "--trace", help="Stack trace (optional)")
    
    # Test command
    test_parser = subparsers.add_parser("test", help="Generate tests for code")
    test_parser.add_argument("file", help="File to generate tests for")
    test_parser.add_argument("-f", "--framework", default="pytest", help="Test framework")
    test_parser.add_argument("-o", "--output", help="Output file for tests")
    
    # Docs command
    docs_parser = subparsers.add_parser("docs", help="Generate documentation")
    docs_parser.add_argument("file", help="File to document")
    docs_parser.add_argument("-t", "--type", default="docstrings", choices=["docstrings", "readme", "api"])
    docs_parser.add_argument("-o", "--output", help="Output file")
    
    # Refactor command
    refactor_parser = subparsers.add_parser("refactor", help="Suggest refactoring improvements")
    refactor_parser.add_argument("file", help="File to refactor")
    refactor_parser.add_argument("-f", "--focus", default="general", help="Focus area (performance, readability, etc)")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Dispatch to appropriate handler
    if args.command == "generate":
        generate(args)
    elif args.command == "review":
        review(args)
    elif args.command == "debug":
        debug_code(args)
    elif args.command == "test":
        generate_tests(args)
    elif args.command == "docs":
        generate_docs(args)
    elif args.command == "refactor":
        refactor(args)


def generate(args=None):
    """Generate code from natural language description."""
    if args is None:
        print("Enter your code requirements:")
        description = input("> ")
        language = input("Language (python): ") or "python"
    else:
        description = args.description
        language = args.language
    
    print(f"\n🚀 Generating {language} code...\n")
    
    agent = CodeGeneratorAgent(language=language)
    result = agent.generate(description)
    
    print("\n" + "=" * 50)
    print("Generated Code:")
    print("=" * 50)
    print(result)
    
    if args and args.output:
        Path(args.output).write_text(result)
        print(f"\n✅ Saved to {args.output}")


def review(args=None):
    """Review code for issues and best practices."""
    if args is None:
        file_path = input("File to review: ")
    else:
        file_path = args.file
    
    code_content = read_file(file_path)
    language = detect_language(file_path) or "python"
    
    print(f"\n🔍 Reviewing {file_path}...\n")
    
    agent = CodeReviewerAgent()
    result = agent.review(file_path, code_content, language)
    
    print("\n" + "=" * 50)
    print("Code Review Report:")
    print("=" * 50)
    print(result)


def debug_code(args=None):
    """Debug code to find root cause of issues."""
    if args is None:
        file_path = input("File to debug: ")
        error = input("Error description: ")
        trace = input("Stack trace (optional, press Enter to skip): ") or ""
    else:
        file_path = args.file
        error = args.error
        trace = args.trace or ""
    
    code_content = read_file(file_path)
    language = detect_language(file_path) or "python"
    
    print(f"\n🐛 Debugging {file_path}...\n")
    
    agent = BugDetectiveAgent()
    result = agent.debug(error, file_path, code_content, language, trace)
    
    print("\n" + "=" * 50)
    print("Debugging Report:")
    print("=" * 50)
    print(result)


def generate_tests(args=None):
    """Generate tests for code."""
    if args is None:
        file_path = input("File to test: ")
        framework = input("Test framework (pytest): ") or "pytest"
    else:
        file_path = args.file
        framework = args.framework
    
    code_content = read_file(file_path)
    language = detect_language(file_path) or "python"
    
    print(f"\n🧪 Generating tests for {file_path}...\n")
    
    agent = TestGeneratorAgent(test_framework=framework)
    result = agent.generate_tests(file_path, code_content, language)
    
    print("\n" + "=" * 50)
    print("Generated Tests:")
    print("=" * 50)
    print(result)
    
    if args and args.output:
        Path(args.output).write_text(result)
        print(f"\n✅ Saved to {args.output}")


def generate_docs(args=None):
    """Generate documentation for code."""
    if args is None:
        file_path = input("File to document: ")
        doc_type = input("Doc type (docstrings/readme/api): ") or "docstrings"
    else:
        file_path = args.file
        doc_type = args.type
    
    code_content = read_file(file_path)
    language = detect_language(file_path) or "python"
    
    print(f"\n📚 Generating documentation for {file_path}...\n")
    
    agent = DocWriterAgent()
    result = agent.generate_docs(file_path, code_content, language, doc_type)
    
    print("\n" + "=" * 50)
    print("Generated Documentation:")
    print("=" * 50)
    print(result)
    
    if args and args.output:
        Path(args.output).write_text(result)
        print(f"\n✅ Saved to {args.output}")


def refactor(args=None):
    """Suggest refactoring improvements."""
    if args is None:
        file_path = input("File to refactor: ")
        focus = input("Focus area (general): ") or "general"
    else:
        file_path = args.file
        focus = args.focus
    
    code_content = read_file(file_path)
    language = detect_language(file_path) or "python"
    
    print(f"\n🔧 Analyzing {file_path} for refactoring...\n")
    
    agent = RefactoringExpertAgent()
    result = agent.refactor(file_path, code_content, language, focus)
    
    print("\n" + "=" * 50)
    print("Refactoring Report:")
    print("=" * 50)
    print(result)


if __name__ == "__main__":
    run()
