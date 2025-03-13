#!/usr/bin/env python3
# -*- coding: utf-8 -*-

## If you do a git history rewrite by "git rebase -i a1b2c3"
## you can use this script to retag the commits.

## - collects all detached tags
## - guesses the zero tag (last tag from the oldest to newest which is not detached yet)
## - iterates through all detached tags
##   - calculates distance from zero tag
##   - finds "active commit" (the same commit (same message, content) from the same distance from zero tag on active (master) branch)
##   - renames tag on detached commit to temp_*
##   - creates the actual tag on the active commit (on active branch)
##   - deletes temp tag on detached commit

## When the script is done execute this:
## > git push --tags -f

## On another working copy repo synchronize changes from remote
## git fetch --tags -f

import os
import git
import sys

class GitOps:
    def __init__(self, repo_path, work_branch_name):
        self.repo = git.Repo(repo_path)

        self.zero_tag = None
        self.distance_zero = 0
        if not work_branch_name:
            # 'master' if you are on default
            self.active_branch_name = self.repo.active_branch.name
        else:
            self.active_branch_name = work_branch_name
        self.rename_prefix = 'temp_'

        self.tags = []
        self.tags_detached = []

        print("Scanning tags...")
        if not self.get_tag_lists():
            print("No tags found in repo. Exiting.")
            sys.exit(1)

        if self.guess_zero_tag() is None:
            print("No detached tags found. Exiting.")
            sys.exit(1)

    def is_tag_on_active_branch(self, tag):
        active_branch_commit = self.repo.active_branch.commit
        return self.repo.merge_base(active_branch_commit, tag.commit)[0].hexsha == tag.commit.hexsha

    def get_tag_lists(self):
        self.tags = sorted(self.repo.tags, key=lambda t: t.commit.committed_date, reverse=False)
        self.tags_detached = [tag for tag in self.tags if not self.is_tag_on_active_branch(tag)]
        if not self.tags:
            return False
        else:
            print(f"Found tags: {len(self.tags)}")
            print(f"Found detached tags: {len(self.tags_detached)} ")
            return True

    def guess_zero_tag(self):
        if not self.is_tag_on_active_branch(self.tags[0]):
            print("First tag is not on active branch. Exiting.")
            return None
        previous_tag = None
        for tag in self.tags:
            if not self.is_tag_on_active_branch(tag):
                self.zero_tag = previous_tag
                return True
            else:
                previous_tag = tag
        return None     # if there was no detached tag

    def get_merge_commit_count_between_detached_tag_and_zero(self, tag):
        return self.repo.git.execute(["git", "rev-list", "--count", "--merges", f"{self.zero_tag.commit}..{tag.commit}"])

    # get commit which is on active branch AND is in distance from zero. Search direction: forward
    def get_commit_in_distance_from_zero(self, distance, merge_commit_shift=0):
        distance = int(distance - merge_commit_shift)       # Correction by merge commit counts on detached chain
                                                            # On rewritten master branch this is 0 (they disappear at history rewrite)
        zero_commit_hexsha = self.zero_tag.commit
        output = self.repo.git.execute(["git", "rev-list", "--ancestry-path", f"{zero_commit_hexsha}..HEAD"])
        target_commit = output.split("\n")[distance*-1].strip()
        return target_commit

    def get_commit_distance(self, commit1, commit2):
        output = self.repo.git.execute(["git", "rev-list", "--count", f"{commit1}..{commit2}"])
        return int(output.strip())

    def rename_tag_with_prefix(self, original_tagname):
        new_tag = f"{self.rename_prefix}{original_tagname}"
        commit = self.repo.commit(original_tagname)
        self.repo.create_tag(new_tag, commit)
        print(f"    - created tag '{new_tag}'")
        self.repo.delete_tag(original_tagname)
        print(f"    - deleted tag '{original_tagname}'")
        return new_tag

    def fix_all_detached_tags(self):
        print("Active branch: " + self.active_branch_name)
        print(f"ZERO tag: {self.zero_tag.name}, Zero tag commit hash: {self.zero_tag.commit.hexsha}")
        print("(this tag is the last on-branch tag before the first detached tag)")
        for tag in self.tags_detached:
            print("\n\n==========================================================================")
            print(f"Fixing detached tag: {tag.name} with message: '{tag.commit.message.strip()}'")
            print(f"  - detached tag commit: '{tag.commit.hexsha}'")

            actual_tagname = tag.name
            merge_commit_shift = int(self.get_merge_commit_count_between_detached_tag_and_zero(tag))
            print("  - merge commit count (shifting distance): " + str(merge_commit_shift))

            distance = self.get_commit_distance(self.zero_tag.commit, tag.commit)
            print("  - distance from zero tag: " + str(distance))

            print("  - guessing on-branch commit in distance from zero tag")
            onbranch_commit = self.get_commit_in_distance_from_zero(distance, merge_commit_shift)

            print(f"  - renaming detached tag to temporary name: {actual_tagname} → {self.rename_prefix}{actual_tagname}")
            prefixed_tagname = self.rename_tag_with_prefix(actual_tagname)

            print(f"  - creating tag '{actual_tagname}' to onbranch ({self.active_branch_name}) commit '{onbranch_commit}'")
            self.repo.git.tag(actual_tagname, onbranch_commit)

            print(f"  - deleting renamed temp tag '{self.rename_prefix}{actual_tagname}'")
            self.repo.git.tag('-d', prefixed_tagname)

    def dump_tag_infos(self):
        print("Printing all tags...")
        for tag in self.tags:
            print(f"tag: {tag.name}, Commit: {tag.commit}")
        print("\n-------------------------------------\nPrinting detached tags...")
        for tag in self.tags_detached:
            print(f"Detached tag: {tag.name}, Commit: {tag.commit}, typeof class: {type(tag)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <git-repo-path>")
        sys.exit(1)

    dirname = os.path.abspath(sys.argv[1])
    if not os.path.isdir(dirname):
        print(f"Error: directory does not exist: '{dirname}'")
        sys.exit(1)
    if not os.path.isdir(os.path.join(dirname, '.git')):
        print(f"Error: directory is not a git repo: '{dirname}'")
        sys.exit(1)

    gg = GitOps(repo_path=dirname, work_branch_name='master')
    gg.fix_all_detached_tags()
    # gg.dump_tag_infos()
