import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)  # For reproducibility

# Function to simulate one throw of 2 d10 dice (forming a d100)
def throw_d100():
    d10_1 = np.random.randint(1, 11)
    d10_2 = np.random.randint(1, 11)
    return (d10_1 - 1) * 10 + d10_2

# Simulate two throws and take the higher result
def simulate_two_throws():
    throw1 = throw_d100()
    throw2 = throw_d100()
    return max(throw1, throw2)

# Repeat 10,000 times
results = [simulate_two_throws() for _ in range(100000)]

median_result = np.median(results)

plt.figure(figsize=(10, 6))
counts, bins, patches = plt.hist(results, bins=range(1, 102), alpha=0.75, color='blue', edgecolor='black')
plt.title('Distribution of Higher Result from Two d100 Throws (10,000 repeats)')
plt.xlabel('Dice Roll Result')
plt.ylabel('Count')
plt.grid(True)

# Draw vertical line for median
plt.axvline(median_result, color='red', linestyle='--', linewidth=2, label=f'Median: {int(median_result)}')

# Annotate median line
max_count = counts.max()
plt.text(median_result + 1, max_count * 0.9, f'Median: {int(median_result)}', color='red')

plt.legend()
plt.tight_layout()
plt.savefig('2d100_higher_count_median.png')
plt.close()

