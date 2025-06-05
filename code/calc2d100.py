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


plt.figure(figsize=(10, 6))
plt.hist(results, bins=range(1, 102), alpha=0.75, color='blue', edgecolor='black')  # Remove 'density=True'
plt.title('Distribution of Higher Result from Two d100 Throws (100,000 repeats)')
plt.xlabel('Dice Roll Result')
plt.ylabel('Count')  # Change Y label to 'Count'
plt.grid(True)
plt.tight_layout()
plt.savefig('2d100_higher_count.png')
plt.close()

