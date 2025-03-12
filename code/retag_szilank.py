#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import git
import sys


class GitOps:
    def __init__(self, repo_path, work_branch_name):
        self.repo = git.Repo(repo_path)

        self.zero_tag = None
        self.distance_zero = 0
        if not work_branch_name:
            self.active_branch_name = self.repo.active_branch.name        # master if you are on default
        else:
            self.active_branch_name = work_branch_name
        self.rename_prefix = 'xx_'

        self.tags = []
        self.tags_detached = []

        self.get_tag_lists()

        if self.guess_zero_tag() is None:
            print("No detached tags found. Exiting.")
            sys.exit(1)

    def is_tag_on_active_branch(self, tag):                                                      # WORKS OK
        active_branch_commit = self.repo.active_branch.commit
        return self.repo.merge_base(active_branch_commit, tag.commit)[0].hexsha == tag.commit.hexsha

    def get_tag_lists(self):                                                                     # WORKS OK
        self.tags = sorted(self.repo.tags, key=lambda t: t.commit.committed_date, reverse=False)
        self.tags_detached = [tag for tag in self.tags if not self.is_tag_on_active_branch(tag)]

    def guess_zero_tag(self):                                                                    # WORKS OK
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

    # get commit which is on active branch AND is in distance from zero. Search direction: forward
    def get_commit_in_distance_from_zero(self, distance):                                         # ALMOST
        zero_commit_hexsha = self.zero_tag.commit
        output = self.repo.git.execute(["git", "rev-list", "--ancestry-path", "--skip", str(distance), f"{zero_commit_hexsha}..HEAD"])
        target_commit = output.split("\n")[distance*-1].strip()
        return target_commit


    def get_commit_distance(self, commit1, commit2):                # WORKS OK
        output = self.repo.git.execute(["git", "rev-list", "--count", f"{commit1}..{commit2}"])
        return int(output.strip())

    def rename_tag_with_prefix(self, original_tagname):              # WORKS OK
        new_tag = f"{self.rename_prefix}{original_tagname}"
        commit = self.repo.commit(original_tagname)
        self.repo.create_tag(new_tag, commit)
        self.repo.delete_tag(original_tagname)
        return new_tag

    def iterate_and_fix_on_detached_tags(self):

        print(f"ZERO tag: {self.zero_tag.name}, Zero tag commit hash: {self.zero_tag.commit.hexsha}")
        print("Printing detached tags:")                                        # DEBUG: remove
        for tag in gg.tags_detached:
            print(f"detached tag: {tag.name}")                                  # DEBUG: remove
            distance = self.get_commit_distance(self.zero_tag.commit, tag.commit)

            print(f"tag: {tag.name}, distance from zero tag: {distance}")
            actual_tagname = tag.name
            # prefixed_tagname = self.rename_tag_with_prefix(actual_tagname)    # DEBUG: put back, when commits are passing
            onbranch_commit = self.get_commit_in_distance_from_zero(distance)

            print(f"detached tag commit: '{tag.commit.hexsha}', message: '{tag.commit.message.strip()}'\n")
            print(f"onbranch commit: '{onbranch_commit}''\n")
            print("==========================================================================")

            # self.repo.git.create_tag(actual_tagname, onbranch_commit)         # DEBUG: put back, when commits are passing
            # self.repo.git.tag('-d', prefixed_tagname)                         # DEBUG: put back, when commits are passing

    def dump_tag_infos(self):                                       # WORKS OK
        print("Printing all tags...")
        for tag in self.tags:
            print(f"tag: {tag.name}, Commit: {tag.commit}")
        print("\n-------------------------------------\nPrinting detached tags...")
        for tag in self.tags_detached:
            print(f"Detached tag: {tag.name}, Commit: {tag.commit}, typeof class: {type(tag)}")


gg = GitOps(repo_path='/repo/github/szilank.code', work_branch_name='master')
gg.iterate_and_fix_on_detached_tags()
# gg.dump_tag_infos()
