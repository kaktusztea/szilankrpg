#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from lib.JinjaHandler import JinjaHandler
import sys

template_dir =  sys.argv[1]
template_path =  sys.argv[2]
context = sys.argv[3]
outputfile = sys.argv[4]

jh = JinjaHandler.JinjaHandler(template_dir=template_dir, template_path=template_path, context=context)

jh.render_write(outputfile=outputfile)
