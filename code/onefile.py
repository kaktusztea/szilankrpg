#!/usr/bin/env python3
# -*- coding: utf-8 -*-

## Usage: python3 onefile.py <szilank repo-path> <export-dir>

import os
import sys
import shutil
import tempfile
from pathlib import Path


def get_directories(path, blacklist=None):
    """Return alphabetically sorted list of full paths to all directories in the given path."""
    return sorted([str(d.resolve()) for d in Path(path).iterdir()
                   if d.is_dir() and (blacklist is None or d.name not in blacklist)])


def get_md_files(directory, recursive=False):
    """
    Returns list: Alphabetically sorted list of full paths to .md files
    """
    path = Path(directory)
    if recursive:
        md_files = sorted([str(f.resolve()) for f in path.rglob('*.md')])
    else:
        md_files = sorted([str(f.resolve()) for f in path.glob('*.md')])
    return md_files


def concat_md_files_in_dir(dir_path):
    dirname = os.path.basename(dir_path)
    dir_combined = os.path.join(tmp_dir, f"__szilank.{dirname}.md")

    md_files_abc = get_md_files(dir_path, recursive=True)
    with open(dir_combined, 'w', encoding='utf-8') as outfile:
        for md_file in md_files_abc:
            with open(md_file, 'r', encoding='utf-8') as infile:
                outfile.write('## File: ' + md_file + '\n')
                outfile.write(infile.read())
                outfile.write('\n\n')  # Separate files by two newlines
    print(f"Created combined file for directory '{dirname}': {dir_combined}")
    return dir_combined



########## CHECKS and INIT ##########

# Check input arguments and directories
if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} <szilank repo-path>")
    sys.exit(1)

path_arg1 = os.path.abspath(sys.argv[1])
path_rootdir = os.path.join(path_arg1, 'md')
if not os.path.isdir(path_rootdir):
    print("Error: repo dir does not exist")
    sys.exit(1)

tmp_dir = tempfile.mkdtemp()
script_dir = os.path.dirname(os.path.abspath(__file__))
# Exported combined file path in szilank repo
combined_file = os.path.join(script_dir, '..', 'work', 'szilank.rpg.full.txt')


# if not os.path.isdir(os.path.join(path_rootdir, 'md')):
#     print("Error: 'md' directory is missing")
#     sys.exit(1)

inject_points = {
    '021_faj_hatterek.md': 'hatterek.faji',
    '030_01_kepzettseglista.md': 'kepzettsegek',
    '046_slan_fortelyok.md': 'fortelyok',
    '160_szituaciok.md': 'szituaciok'
    }

blacklist=['views', 'template', 'images', '.obsidian', 'diszciplinak.pszi', 'fortelyok.misztikus', 'magia.papi.varazslatok']
combined_dir_files = []




######### START PROCESSING ##########

# Get all .md files in root dir (non-recursive) in alphabetical order. Full paths.
list_rootdir_files = [str(Path(path_rootdir).parent / 'README.md')]
list_rootdir_files.append(str(Path(path_rootdir).parent / 'LICENSE'))
list_rootdir_files.append(os.path.join(path_rootdir, 'szabalyrendszer.md'))
list_rootdir_files.extend(get_md_files(path_rootdir, recursive=False))

# Combine all subdir's .md files into separate combined files
list_dirs = get_directories(path=path_rootdir, blacklist=blacklist)
for dir_path in list_dirs:
    combined_file_path = concat_md_files_in_dir(dir_path)
    combined_dir_files.append(combined_file_path)

# DEBUG: list tmp dir files
print("Combined temporary subdir markdown files:")
for f in os.listdir(tmp_dir):
    print(f" - {f}")


# Combine all files into one big file
if os.path.exists(combined_file):
    os.remove(combined_file)
    print(f"Deleted existing combined file: {combined_file}")

print(f"Creating combined markdown file: {combined_file}")
with open(combined_file, 'w', encoding='utf-8') as outfile:
    # First add the root dir files
    for md_file in list_rootdir_files:
        with open(md_file, 'r', encoding='utf-8') as infile:
            print(f"Adding file: {md_file}")
            outfile.write('## File: ' + md_file + '\n')
            outfile.write(infile.read())
            outfile.write('\n\n---')  # Separate files by two newlines
        ## If infile is identical with a key from inject_points, inject all matching combined dir file here: "__szilank.<inject_point>*.md"
        basename = os.path.basename(md_file)
        if basename in inject_points:
            inject_point = inject_points[basename]
            for combined_dir_file in combined_dir_files:
                if f"__szilank.{inject_point}" in os.path.basename(combined_dir_file):
                    with open(combined_dir_file, 'r', encoding='utf-8') as injectfile:
                        print(f"Adding combined dirfile: {combined_dir_file} at inject point: {inject_point}")
                        outfile.write(injectfile.read())
                        outfile.write('\n\n')  # Separate files by two newlines

# Clean up temp dir
if os.path.exists(tmp_dir):
    shutil.rmtree(tmp_dir)
    print(f"Deleted temp directory: {tmp_dir}")

print("END")
