import sys
import os
import numpy as np
import matplotlib.pyplot as plt

def throw_d100():
    d10_1 = np.random.randint(1, 11)
    d10_2 = np.random.randint(1, 11)
    return (d10_1 - 1) * 10 + d10_2

def simulate_one_trial(num_throws_per_trial, mode):
    throws = [throw_d100() for _ in range(num_throws_per_trial)]
    if mode == "highest":
        return max(throws)
    elif mode == "lowest":
        return min(throws)
    else:
        raise ValueError("Mode must be 'highest' or 'lowest'")

def main():
    if len(sys.argv) != 4:
        print("Usage: python script.py <number_of_throws_per_trial> <highest|lowest> <output_directory>")
        sys.exit(1)

    try:
        num_throws_per_trial = int(sys.argv[1])
        if num_throws_per_trial < 1:
            raise ValueError
    except ValueError:
        print("Error: number_of_throws_per_trial must be a positive integer")
        sys.exit(1)

    mode = sys.argv[2].lower()
    if mode not in ("highest", "lowest"):
        print("Error: mode must be 'highest' or 'lowest'")
        sys.exit(1)

    output_dir = sys.argv[3]
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    np.random.seed(42)  # for reproducibility

    num_trials = 10000  # fixed number of trials

    results = [simulate_one_trial(num_throws_per_trial, mode) for _ in range(num_trials)]
    median_result = np.median(results)

    plt.figure(figsize=(10, 6))
    counts, bins, patches = plt.hist(results, bins=range(1, 102), alpha=0.75, color='blue', edgecolor='black')
    plt.title(f"Distribution of {mode.capitalize()} Result from {num_throws_per_trial} d100 Throws per Trial ({num_trials} trials)")
    plt.xlabel("Dice Roll Result")
    plt.ylabel("Count")
    plt.grid(True)

    # Median line and annotation
    plt.axvline(median_result, color='red', linestyle='--', linewidth=2, label=f"Median: {int(median_result)}")
    max_count = counts.max()
    plt.text(median_result + 1, max_count * 0.9, f"Median: {int(median_result)}", color='red')

    plt.legend()
    plt.tight_layout()

    filename = f"d100_{mode}_result_count_{num_throws_per_trial}_throws_per_trial.png"
    filepath = os.path.join(output_dir, filename)
    plt.savefig(filepath)
    plt.close()

    print(f"Histogram saved as {filepath}")

if __name__ == "__main__":
    main()

