#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import random

def experiment(dice, throws):

    roll = [ random.randint(1, dice) for _ in range(throws) ]
    return max(roll)

num_experiments = 100000
num_throws = 4
num_dice = 100

results = [experiment(num_dice, num_throws) for _ in range(num_experiments)]
average = sum(results) / num_experiments

print(f"Average result after {num_experiments} experiments: {average}")



