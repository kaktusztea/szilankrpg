#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

if len(sys.argv) < 3:
    print(f"Usage: {sys.argv[0]} <szilank repo-path> <export-dir>")
    sys.exit(1)

directory_path = os.path.abspath(sys.argv[1])
export_path = os.path.abspath(sys.argv[2])

if not os.path.isdir(directory_path):
    print("Error: repo dir does not exist")
    sys.exit(1)

if not os.path.isdir(export_path):
    print("Error: export dir does not exist")
    sys.exit(1)

if not os.path.isdir(os.path.join(directory_path, 'md')):
    print("Error: 'md' directory is missing")
    sys.exit(1)

directory_path = os.path.join(directory_path, 'md')

combined_file = os.path.join(export_path, 'szilank.rpg.full.md')

for root, dirs, files in os.walk(directory_path):
    for file_name in files:
        full_path = os.path.join(root, file_name)
        with open(combined_file, 'a', encoding='utf-8') as cf:
            if full_path.endswith('.md'):
                with open(full_path, 'r', encoding='utf-8') as f:
                    cf.write(f.read())
                    cf.write('\n')
