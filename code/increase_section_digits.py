import os
import re

def rename_files(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.md'):

            match = re.match(r'^(\d{2})(.*)$', filename)
            if match:
                old_number = int(match.group(1))
                if old_number < 8:
                    continue
                print(f"Renaming file: {filename}")
                new_number = old_number + 1
                new_filename = f"{new_number:02}{match.group(2)}"
                os.rename(os.path.join(directory, filename), os.path.join(directory, new_filename))

rename_files('/repo/szilank.code/md')
