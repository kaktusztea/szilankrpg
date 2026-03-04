#!/usr/bin/env python3
import os
import re

def strip_markdown(text):
    # Remove headers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    # Remove bold/italic
    text = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', text)
    text = re.sub(r'_{1,3}([^_]+)_{1,3}', r'\1', text)
    # Remove links
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove code blocks
    text = re.sub(r'```[^`]*```', '', text, flags=re.DOTALL)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    # Remove horizontal rules
    text = re.sub(r'^[-*_]{3,}$', '', text, flags=re.MULTILINE)
    # Remove list markers
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
    # Remove blockquotes
    text = re.sub(r'^\s*>\s*', '', text, flags=re.MULTILINE)
    return text

def count_chars_in_md_files(directory):
    total_chars = 0
    file_count = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        stripped_content = strip_markdown(content)
                        char_count = len(stripped_content)
                        total_chars += char_count
                        file_count += 1
                        print(f"{file_path}: {char_count} chars")
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    print(f"\nTotal: {total_chars} characters in {file_count} markdown files")
    return total_chars

if __name__ == "__main__":
    directory = "/repo/github/szilank.code/md"
    count_chars_in_md_files(directory)
