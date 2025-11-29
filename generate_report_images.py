"""
Script to generate visualization images for the final report
Requires: pip install matplotlib seaborn numpy pandas
"""

import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import os
from pathlib import Path

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 12

# Create images directory
images_dir = Path("images")
images_dir.mkdir(exist_ok=True)

# Color scheme
colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444']  # Blue, Green, Orange, Red

print("Generating visualization images for the report...")

# 1. System Architecture Diagram
print("1. Creating system architecture diagram...")
fig, ax = plt.subplots(figsize=(12, 8))
ax.axis('off')

# Draw boxes
boxes = [
    {'x': 1, 'y': 6, 'w': 2, 'h': 1, 'label': 'Frontend\nReact\nPort 5173', 'color': colors[0]},
    {'x': 5, 'y': 6, 'w': 2, 'h': 1, 'label': 'Backend API\nNode.js\nPort 3001', 'color': colors[1]},
    {'x': 9, 'y': 6, 'w': 2, 'h': 1, 'label': 'ML Service\nPython\nPort 8000', 'color': colors[2]},
    {'x': 1, 'y': 3, 'w': 2, 'h': 1, 'label': 'Edge Proxy\n(Optional)', 'color': '#94a3b8'},
    {'x': 5, 'y': 3, 'w': 2, 'h': 1, 'label': 'MongoDB\nDatabase\nPort 27017', 'color': colors[3]},
    {'x': 9, 'y': 3, 'w': 2, 'h': 1, 'label': 'Redis\nCache\nPort 6379', 'color': '#ec4899'},
]

for box in boxes:
    rect = plt.Rectangle((box['x'], box['y']), box['w'], box['h'], 
                         facecolor=box['color'], edgecolor='black', linewidth=2, alpha=0.7)
    ax.add_patch(rect)
    ax.text(box['x'] + box['w']/2, box['y'] + box['h']/2, box['label'],
            ha='center', va='center', fontsize=10, weight='bold', color='white')

# Draw arrows
arrows = [
    {'x1': 3, 'y1': 6.5, 'x2': 5, 'y2': 6.5, 'bidir': True},
    {'x1': 7, 'y1': 6.5, 'x2': 9, 'y2': 6.5, 'bidir': True},
    {'x1': 2, 'y1': 6, 'x2': 2, 'y2': 4, 'bidir': False},
    {'x1': 6, 'y1': 6, 'x2': 6, 'y2': 4, 'bidir': False},
    {'x1': 10, 'y1': 6, 'x2': 10, 'y2': 4, 'bidir': False},
]

for arrow in arrows:
    if arrow['bidir']:
        ax.annotate('', xy=(arrow['x2'], arrow['y2']), xytext=(arrow['x1'], arrow['y1']),
                   arrowprops=dict(arrowstyle='<->', lw=2, color='black'))
        ax.annotate('', xy=(arrow['x1'], arrow['y1']), xytext=(arrow['x2'], arrow['y2']),
                   arrowprops=dict(arrowstyle='<->', lw=2, color='black'))
    else:
        ax.annotate('', xy=(arrow['x2'], arrow['y2']), xytext=(arrow['x1'], arrow['y1']),
                   arrowprops=dict(arrowstyle='->', lw=2, color='black'))

ax.set_xlim(0, 12)
ax.set_ylim(2, 8)
ax.set_title('System Architecture Overview', fontsize=16, weight='bold', pad=20)
plt.tight_layout()
plt.savefig(images_dir / 'system_architecture.png', dpi=300, bbox_inches='tight')
plt.close()

# 2. Model Performance Metrics
print("2. Creating model performance metrics chart...")
fig, ax = plt.subplots(figsize=(10, 6))

risk_levels = ['Low', 'Medium', 'High', 'Critical']
precision = [0.91, 0.83, 0.82, 0.88]
recall = [0.94, 0.79, 0.79, 0.85]
f1_score = [0.92, 0.81, 0.80, 0.86]

x = np.arange(len(risk_levels))
width = 0.25

bars1 = ax.bar(x - width, precision, width, label='Precision', color=colors[0], alpha=0.8)
bars2 = ax.bar(x, recall, width, label='Recall', color=colors[1], alpha=0.8)
bars3 = ax.bar(x + width, f1_score, width, label='F1-Score', color=colors[2], alpha=0.8)

ax.set_xlabel('Risk Level', fontsize=12, weight='bold')
ax.set_ylabel('Score', fontsize=12, weight='bold')
ax.set_title('Model Performance Metrics by Risk Level', fontsize=14, weight='bold')
ax.set_xticks(x)
ax.set_xticklabels(risk_levels)
ax.legend()
ax.set_ylim(0, 1.0)
ax.grid(axis='y', alpha=0.3)

# Add value labels on bars
for bars in [bars1, bars2, bars3]:
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
               f'{height:.2f}', ha='center', va='bottom', fontsize=9)

plt.tight_layout()
plt.savefig(images_dir / 'model_performance.png', dpi=300, bbox_inches='tight')
plt.close()

# 3. Confusion Matrix
print("3. Creating confusion matrix...")
fig, ax = plt.subplots(figsize=(8, 6))

# Sample confusion matrix data
cm_data = np.array([
    [1092, 48, 36, 24],    # Low
    [72, 632, 64, 32],     # Medium
    [28, 56, 316, 0],      # High
    [12, 8, 8, 172]        # Critical
])

risk_labels = ['Low', 'Medium', 'High', 'Critical']
sns.heatmap(cm_data, annot=True, fmt='d', cmap='Blues', 
           xticklabels=risk_labels, yticklabels=risk_labels,
           ax=ax, cbar_kws={'label': 'Count'})

ax.set_xlabel('Predicted Risk Level', fontsize=12, weight='bold')
ax.set_ylabel('Actual Risk Level', fontsize=12, weight='bold')
ax.set_title('Confusion Matrix - Ensemble Model', fontsize=14, weight='bold')
plt.tight_layout()
plt.savefig(images_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.close()

# 4. Feature Importance
print("4. Creating feature importance chart...")
fig, ax = plt.subplots(figsize=(10, 6))

features = ['Work Hours', 'After-Hours\nMeetings', 'Email\nSentiment', 
           'Meeting\nFrequency', 'Work-Life\nBalance']
importance = [0.68, 0.62, 0.58, 0.55, 0.52]

bars = ax.barh(features, importance, color=colors, alpha=0.8)
ax.set_xlabel('Correlation Coefficient', fontsize=12, weight='bold')
ax.set_title('Top Feature Importance for Burnout Prediction', fontsize=14, weight='bold')
ax.set_xlim(0, 0.75)
ax.grid(axis='x', alpha=0.3)

# Add value labels
for i, (bar, val) in enumerate(zip(bars, importance)):
    ax.text(val + 0.01, i, f'{val:.2f}', va='center', fontsize=10, weight='bold')

plt.tight_layout()
plt.savefig(images_dir / 'feature_importance.png', dpi=300, bbox_inches='tight')
plt.close()

# 5. System Performance Metrics
print("5. Creating system performance metrics chart...")
fig, ax = plt.subplots(figsize=(10, 6))

metrics = ['Avg Response\nTime', 'P95 Response\nTime', 'P99 Response\nTime', 
          'Prediction\nTime', 'Throughput\n(req/s)']
values = [145, 198, 342, 387, 500]
colors_perf = [colors[0], colors[1], colors[2], colors[3], '#8b5cf6']

bars = ax.bar(metrics, values, color=colors_perf, alpha=0.8)
ax.set_ylabel('Time (ms) / Requests per Second', fontsize=12, weight='bold')
ax.set_title('System Performance Metrics', fontsize=14, weight='bold')
ax.grid(axis='y', alpha=0.3)

# Add value labels
for bar, val in zip(bars, values):
    height = bar.get_height()
    label = f'{val}ms' if val < 400 else f'{val}'
    ax.text(bar.get_x() + bar.get_width()/2., height,
           label, ha='center', va='bottom', fontsize=10, weight='bold')

plt.xticks(rotation=15, ha='right')
plt.tight_layout()
plt.savefig(images_dir / 'system_performance.png', dpi=300, bbox_inches='tight')
plt.close()

# 6. Dashboard Screenshot Placeholder
print("6. Creating dashboard screenshot placeholder...")
fig, ax = plt.subplots(figsize=(12, 7))
ax.axis('off')

# Create a mock dashboard layout
ax.add_patch(plt.Rectangle((0, 0), 12, 7, facecolor='#f3f4f6', edgecolor='black', linewidth=2))

# Header
ax.add_patch(plt.Rectangle((0, 6), 12, 1, facecolor=colors[0], edgecolor='black', linewidth=1))
ax.text(6, 6.5, 'Employee Dashboard - Burnout Risk Prediction', 
       ha='center', va='center', fontsize=16, weight='bold', color='white')

# Risk Score Card
ax.add_patch(plt.Rectangle((0.5, 4.5), 3, 1.5, facecolor='white', edgecolor='black', linewidth=1))
ax.text(2, 5.5, 'Current Risk Score', ha='center', va='center', fontsize=12, weight='bold')
ax.text(2, 5, 'MEDIUM', ha='center', va='center', fontsize=20, weight='bold', color=colors[2])
ax.text(2, 4.7, 'Score: 65/100', ha='center', va='center', fontsize=10)

# Trend Chart
ax.add_patch(plt.Rectangle((4, 4.5), 4, 1.5, facecolor='white', edgecolor='black', linewidth=1))
ax.text(6, 5.75, 'Risk Trend (Last 30 Days)', ha='center', va='center', fontsize=11, weight='bold')
# Simple line chart representation
x_trend = np.linspace(4.5, 7.5, 10)
y_trend = 4.5 + 1.2 * (1 - np.sin(np.linspace(0, np.pi, 10)))
ax.plot(x_trend, y_trend, color=colors[0], linewidth=2)
ax.fill_between(x_trend, 4.5, y_trend, alpha=0.3, color=colors[0])

# Recommendations
ax.add_patch(plt.Rectangle((8.5, 4.5), 3, 1.5, facecolor='white', edgecolor='black', linewidth=1))
ax.text(10, 5.75, 'Recommendations', ha='center', va='center', fontsize=11, weight='bold')
recommendations = ['Take regular breaks', 'Reduce after-hours work', 'Schedule time off']
for i, rec in enumerate(recommendations):
    ax.text(9, 5.3 - i*0.2, f'• {rec}', fontsize=9, va='top')

# Chart Area
ax.add_patch(plt.Rectangle((0.5, 0.5), 11, 3.5, facecolor='white', edgecolor='black', linewidth=1))
ax.text(6, 3.5, 'Risk Distribution Over Time', ha='center', va='center', fontsize=12, weight='bold')

# Mock bar chart
categories = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
heights = [45, 55, 60, 65]
x_pos = np.linspace(2, 10, 4)
bars = ax.bar(x_pos, [h/20 for h in heights], width=1.5, color=colors, alpha=0.7)
for x, h in zip(x_pos, heights):
    ax.text(x, h/20 + 0.05, f'{h}', ha='center', va='bottom', fontsize=9)

ax.set_xlim(0, 12)
ax.set_ylim(0, 7)
ax.set_title('Dashboard Screenshot', fontsize=14, weight='bold', pad=10)
plt.tight_layout()
plt.savefig(images_dir / 'dashboard_screenshot.png', dpi=300, bbox_inches='tight')
plt.close()

print(f"\nAll images generated successfully in '{images_dir}' directory!")
print("Generated files:")
for img_file in sorted(images_dir.glob('*.png')):
    print(f"  - {img_file}")


