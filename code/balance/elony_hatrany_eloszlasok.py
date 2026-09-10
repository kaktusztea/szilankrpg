import sys
import os
import numpy as np
import matplotlib.pyplot as plt
import json

def throw_dice(dice_type):
    if dice_type == 'd6':
        return np.random.randint(1, 7)
    elif dice_type == 'd10':
        return np.random.randint(1, 11)
    elif dice_type == 'd20':
        return np.random.randint(1, 21)
    elif dice_type == 'd100':
        d10_1 = np.random.randint(1, 11)
        d10_2 = np.random.randint(1, 11)
        return (d10_1 - 1) * 10 + d10_2
    else:
        raise ValueError("Unsupported dice type")

def simulate_one_trial(num_throws_per_trial, mode, dice_type):
    throws = [throw_dice(dice_type) for _ in range(num_throws_per_trial)]
    if mode == "highest":
        return max(throws)
    elif mode == "lowest":
        return min(throws)
    else:
        raise ValueError("Mode must be 'highest' or 'lowest'")

def generate_statistics_json(results, dice_type, mode, num_throws_per_trial, num_trials):
    stats = {
        "dice_type": dice_type,
        "mode": mode,
        "num_throws_per_trial": num_throws_per_trial,
        "num_trials": num_trials,
        "min_result": int(min(results)),
        "max_result": int(max(results)),
        "mean_result": float(np.mean(results)),
        "median_result": float(np.median(results)),
        "std_dev_result": float(np.std(results))
    }
    return json.dumps(stats, indent=4)

def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <output_directory>")
        sys.exit(1)

    output_dir = sys.argv[1]
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    json_dir = os.path.join(output_dir, "jsons")
    if not os.path.exists(json_dir):
        os.makedirs(json_dir)

    np.random.seed(42)  # for reproducibility

    dice_types = ['d6', 'd10', 'd20', 'd100']
    modes = ['highest', 'lowest']
    num_throws_list = [2, 3]
    num_trials = 100000  # fixed number of trials

    for dice_type in dice_types:
        for num_throws_per_trial in num_throws_list:
            for mode in modes:
                results = [simulate_one_trial(num_throws_per_trial, mode, dice_type) for _ in range(num_trials)]
                median_result = np.median(results)

                # Save JSON statistics in jsons subdir
                json_stats = generate_statistics_json(results, dice_type, mode, num_throws_per_trial, num_trials)
                json_filename = f"{dice_type}_{mode}_stats_{num_throws_per_trial}_throws_per_trial.json"
                json_filepath = os.path.join(json_dir, json_filename)
                with open(json_filepath, "w") as json_file:
                    json_file.write(json_stats)
                print(f"Statistics JSON saved as {json_filepath}")

                # Plot histogram (saved directly in output_dir)
                plt.figure(figsize=(10, 6))
                max_bin = {'d6': 7, 'd10': 11, 'd20': 21, 'd100': 102}[dice_type]
                counts, bins, patches = plt.hist(results, bins=range(1, max_bin), alpha=0.75, color='blue', edgecolor='black')
                plt.title(f"Distribution of {mode.capitalize()} Result from {num_throws_per_trial} {dice_type} Throws per Trial ({num_trials} trials)")
                plt.xlabel("Dice Roll Result")
                plt.ylabel("Count")
                plt.grid(True)

                plt.axvline(median_result, color='red', linestyle='--', linewidth=2, label=f"Median: {int(median_result)}")
                max_count = counts.max()
                plt.text(median_result + 1, max_count * 0.9, f"Median: {int(median_result)}", color='red')

                plt.legend()
                plt.tight_layout()

                filename = f"{dice_type}_{mode}_result_count_{num_throws_per_trial}_throws_per_trial.png"
                filepath = os.path.join(output_dir, filename)
                plt.savefig(filepath)
                plt.close()

                print(f"Histogram saved as {filepath}")

if __name__ == "__main__":
    main()
