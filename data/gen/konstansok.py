"""konstansok.yaml → konstansok.json"""

import os

from .common import SOURCES_DIR, load_yaml, write_json


def generate_konstansok():
    """konstansok.yaml → konstansok.json"""
    data = load_yaml(os.path.join(SOURCES_DIR, 'konstansok.yaml'))
    write_json('konstansok.json', data)
