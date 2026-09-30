#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Utility functions used by the converter scripts.

Note: this version assumes natsort is available in the environment (per your request).
"""
import natsort
import json

def write_list_of_dicts_to_jsonfile(path_json, list_dicts):
    with open(path_json, 'w', encoding="utf-8") as fj:
        fj.seek(0)
        fj.truncate()
        json.dump(list_dicts, fj, ensure_ascii=False, indent=4)


def order_list_of_dicts_by_key(list_dicts, sortkey):
    """
    Order a list of dicts by the given sortkey.

    - If sortkey is falsy, returns the list as-is.
    - If some entries are missing the sortkey, they are treated as empty string
      for sorting; a warning with the count is printed.
    - Uses natsort.natsorted (no fallback).
    - If sorting fails for any unexpected reason, prints an error and returns the original list.
    """
    if not sortkey:
        return list_dicts

    missing_count = sum(1 for d in list_dicts if sortkey not in d)
    if missing_count:
        print(f"order_list_of_dicts_by_key(): 'sortkey' in dict is not present for {missing_count} entr{'y' if missing_count==1 else 'ies'}; those will be treated as empty string for sorting.")

    # use get() to avoid KeyError and str(...).lower() to avoid AttributeError
    keyfunc = lambda x: str(x.get(sortkey, "")).lower()

    try:
        return natsort.natsorted(list_dicts, key=keyfunc)
    except Exception as e:
        print(f"order_list_of_dicts_by_key(): error sorting by '{sortkey}': {e}")
        return list_dicts