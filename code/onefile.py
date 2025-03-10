#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os

directory_path = '/repo/szilank.code/md'

combined_file = '/repo/szilank.code/md/szilank.rpg.full.md'

for root, dirs, files in os.walk(directory_path):
    for file_name in files:
        full_path = os.path.join(root, file_name)
        with open(combined_file, 'a', encoding='utf-8') as cf:
            if full_path.endswith('.md'):
                with open(full_path, 'r', encoding='utf-8') as f:
                    cf.write(f.read())
                    cf.write('\n')
