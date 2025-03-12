#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import git
import sys
import subprocess

class GitOps:
    def __init__(self, repo_path, work_branch_name):
        self.repo = git.Repo(repo_path)

        self.zero_tag = None
        self.distance_zero = 0
        if not work_branch_name:
            self.active_branch_name = self.repo.active_branch.name        # master if you are on default
        else:
            self.active_branch_name = work_branch_name
        self.rename_prefix = 'temp_'

        self.tags = []
        self.tags_detached = []

        self.get_tag_lists()

        if self.guess_zero_tag() is None:
            print("No detached tags found. Exiting.")
            sys.exit(1)

    def is_tag_on_active_branch(self, tag):
        active_branch_commit = self.repo.active_branch.commit
        return self.repo.merge_base(active_branch_commit, tag.commit)[0].hexsha == tag.commit.hexsha

    def get_tag_lists(self):
        self.tags = sorted(self.repo.tags, key=lambda t: t.commit.committed_date, reverse=False)
        self.tags_detached = [tag for tag in self.tags if not self.is_tag_on_active_branch(tag)]

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
        print(f"tag: {tag.name}, merge_commit_count: {self.repo.git.execute(["git", "rev-list", "--count", "--merges", f"{self.zero_tag.commit}..{tag.commit}"]).strip()}")    # DEBUG: remove
        return self.repo.git.execute(["git", "rev-list", "--count", "--merges", f"{self.zero_tag.commit}..{tag.commit}"])

    # get commit which is on active branch AND is in distance from zero. Search direction: forward
    def get_commit_in_distance_from_zero(self, distance, merge_commit_shift=0):
        distance = int(distance - merge_commit_shift)       # correction by merge commit counts on detached chain
                                                            # on rewritten master branch this is 0 (they disappear at rewrite)
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
        print(f"Renamed tag '{original_tagname}' to '{new_tag}'")                                # DEBUG: remove
        self.repo.delete_tag(original_tagname)
        print(f"Deleted tag '{original_tagname}'")                                               # DEBUG: remove
        return new_tag

    def iterate_and_fix_on_detached_tags(self):

        print(f"ZERO tag: {self.zero_tag.name}, Zero tag commit hash: {self.zero_tag.commit.hexsha}")
        print("Printing detached tags:")                                                        # DEBUG: remove
        for tag in gg.tags_detached:
            print(f"detached tag: {tag.name}")                                                  # DEBUG: remove
            merge_commit_shift = int(self.get_merge_commit_count_between_detached_tag_and_zero(tag))
            distance = self.get_commit_distance(self.zero_tag.commit, tag.commit)

            print(f"tag: {tag.name}, distance from zero tag: {distance}")
            actual_tagname = tag.name
            # prefixed_tagname = self.rename_tag_with_prefix(actual_tagname)                    # DEBUG: put back, when commits are passing
            onbranch_commit = self.get_commit_in_distance_from_zero(distance, merge_commit_shift)

            print(f"detached tag commit: '{tag.commit.hexsha}', message: '{tag.commit.message.strip()}'\n")
            print(f"onbranch commit: '{onbranch_commit}''\n")
            print("==========================================================================")

            # print(f"Renaming tag '{actual_tagname}' to '{prefixed_tagname}'")                 # DEBUG: remove
            # self.repo.git.create_tag(actual_tagname, onbranch_commit)                         # DEBUG: put back, when commits are passing
            # self.repo.git.tag('-d', prefixed_tagname)                                         # DEBUG: put back, when commits are passing

    def dump_tag_infos(self):
        print("Printing all tags...")
        for tag in self.tags:
            print(f"tag: {tag.name}, Commit: {tag.commit}")
        print("\n-------------------------------------\nPrinting detached tags...")
        for tag in self.tags_detached:
            print(f"Detached tag: {tag.name}, Commit: {tag.commit}, typeof class: {type(tag)}")


gg = GitOps(repo_path='/repo/github/szilank.code', work_branch_name='master')
gg.iterate_and_fix_on_detached_tags()
gg.dump_tag_infos()
