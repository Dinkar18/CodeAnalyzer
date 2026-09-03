import pytest
from app.services.parser.chunker import code_chunker
from app.services.parser.ast_parser import ast_parser
from app.models.schemas import ChunkType

MARKDOWN_SAMPLE = """# Project Documentation

## Overview
This is a high performance architecture.

## Installation
Run `docker compose up`.
"""

def test_markdown_chunking():
    chunks = code_chunker.chunk_file(MARKDOWN_SAMPLE, "docs/README.md", "markdown", [])
    assert len(chunks) >= 2
    assert all(c.chunk_type == ChunkType.DOC_SECTION for c in chunks)

def test_code_chunking_with_symbols():
    java_code = """package com.test;

public class SampleClass {
    public void execute() {
        System.out.println("Hello");
    }
}"""
    symbols = ast_parser.parse_file(java_code, "java")
    chunks = code_chunker.chunk_file(java_code, "src/SampleClass.java", "java", symbols)
    assert len(chunks) > 0
