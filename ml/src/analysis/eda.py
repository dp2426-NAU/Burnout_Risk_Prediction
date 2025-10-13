#!/usr/bin/env python3
"""
Exploratory Data Analysis CLI Tool
Created by Balaji Koneti

This script performs comprehensive exploratory data analysis on burnout prediction datasets.
It can be run as a standalone CLI tool or imported as a module.
"""

import argparse
import sys
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Set style for better visualizations
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class BurnoutEDA:
    """Exploratory Data Analysis for Burnout Prediction Dataset"""
    
    def __init__(self, data_path=None, output_dir='eda_output'):
        """
        Initialize EDA tool
        
        Args:
            data_path (str): Path to the dataset
            output_dir (str): Directory to save outputs
        """
        self.data_path = data_path
        self.output_dir = output_dir
        self.data = None
        self.create_output_dir()
    
    def create_output_dir(self):
        """Create output directory if it doesn't exist"""
        os.makedirs(self.output_dir, exist_ok=True)
        print(f"📁 Output directory: {self.output_dir}")
    
    def load_data(self, data_path=None):
        """
        Load dataset from CSV file
        
        Args:
            data_path (str): Path to the dataset file
        """
        if data_path:
            self.data_path = data_path
        
        if not self.data_path:
            print("❌ No data path provided")
            return False
        
        try:
            print(f"📊 Loading data from: {self.data_path}")
            self.data = pd.read_csv(self.data_path)
            print(f"✅ Data loaded successfully: {self.data.shape[0]} rows, {self.data.shape[1]} columns")
            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def generate_synthetic_data(self, n_samples=1000):
        """
        Generate synthetic burnout prediction dataset
        
        Args:
            n_samples (int): Number of samples to generate
        """
        print(f"🔧 Generating synthetic dataset with {n_samples} samples...")
        
        np.random.seed(42)
        
        # Generate features
        data = {
            'user_id': [f'user_{i:04d}' for i in range(n_samples)],
            'work_hours_per_week': np.random.normal(40, 10, n_samples).clip(20, 80),
            'meeting_hours_per_week': np.random.normal(8, 3, n_samples).clip(0, 20),
            'email_count_per_day': np.random.poisson(15, n_samples),
            'stress_level': np.random.uniform(1, 10, n_samples),
            'workload_score': np.random.uniform(1, 10, n_samples),
            'work_life_balance': np.random.uniform(1, 10, n_samples),
            'overtime_hours': np.random.exponential(5, n_samples).clip(0, 20),
            'deadline_pressure': np.random.uniform(1, 10, n_samples),
            'team_size': np.random.poisson(8, n_samples).clip(1, 20),
            'remote_work_percentage': np.random.uniform(0, 100, n_samples),
            'sleep_quality': np.random.uniform(1, 10, n_samples),
            'exercise_frequency': np.random.uniform(1, 10, n_samples),
            'social_support': np.random.uniform(1, 10, n_samples),
            'job_satisfaction': np.random.uniform(1, 10, n_samples)
        }
        
        # Generate target variable based on features
        burnout_score = (
            (data['work_hours_per_week'] - 40) / 40 * 0.2 +
            (data['stress_level'] - 5) / 5 * 0.25 +
            (data['workload_score'] - 5) / 5 * 0.2 +
            (5 - data['work_life_balance']) / 5 * 0.15 +
            data['overtime_hours'] / 20 * 0.1 +
            (data['deadline_pressure'] - 5) / 5 * 0.1
        )
        
        # Add noise and convert to binary
        burnout_score += np.random.normal(0, 0.1, n_samples)
        data['burnout_risk'] = (burnout_score > 0.5).astype(int)
        
        # Add categorical features
        data['department'] = np.random.choice(
            ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'], 
            n_samples
        )
        data['role'] = np.random.choice(['Individual Contributor', 'Manager', 'Director'], n_samples)
        data['experience_years'] = np.random.uniform(1, 20, n_samples)
        
        self.data = pd.DataFrame(data)
        print(f"✅ Synthetic dataset generated: {self.data.shape[0]} rows, {self.data.shape[1]} columns")
        return True
    
    def basic_info(self):
        """Display basic dataset information"""
        print("\n" + "="*50)
        print("📊 BASIC DATASET INFORMATION")
        print("="*50)
        
        print(f"Dataset shape: {self.data.shape}")
        print(f"Memory usage: {self.data.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
        
        print("\n📋 Column Information:")
        print(self.data.info())
        
        print("\n📈 First 5 rows:")
        print(self.data.head())
        
        print("\n🔍 Data Types:")
        print(self.data.dtypes.value_counts())
    
    def missing_data_analysis(self):
        """Analyze missing data patterns"""
        print("\n" + "="*50)
        print("🔍 MISSING DATA ANALYSIS")
        print("="*50)
        
        missing_data = self.data.isnull().sum()
        missing_percent = (missing_data / len(self.data)) * 100
        
        missing_df = pd.DataFrame({
            'Missing Count': missing_data,
            'Missing Percentage': missing_percent
        }).sort_values('Missing Count', ascending=False)
        
        print(missing_df[missing_df['Missing Count'] > 0])
        
        if missing_data.sum() == 0:
            print("✅ No missing data found!")
        else:
            # Visualize missing data
            plt.figure(figsize=(12, 6))
            missing_data[missing_data > 0].plot(kind='bar')
            plt.title('Missing Data by Column')
            plt.xlabel('Columns')
            plt.ylabel('Missing Count')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(f'{self.output_dir}/missing_data.png', dpi=300, bbox_inches='tight')
            plt.close()
            print(f"📊 Missing data plot saved to {self.output_dir}/missing_data.png")
    
    def target_analysis(self):
        """Analyze target variable distribution"""
        print("\n" + "="*50)
        print("🎯 TARGET VARIABLE ANALYSIS")
        print("="*50)
        
        if 'burnout_risk' not in self.data.columns:
            print("❌ Target variable 'burnout_risk' not found in dataset")
            return
        
        target_counts = self.data['burnout_risk'].value_counts()
        target_percentages = self.data['burnout_risk'].value_counts(normalize=True) * 100
        
        print("Target Distribution:")
        for value, count in target_counts.items():
            percentage = target_percentages[value]
            print(f"  {value}: {count} ({percentage:.1f}%)")
        
        # Visualize target distribution
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # Count plot
        target_counts.plot(kind='bar', ax=axes[0], color=['lightcoral', 'lightblue'])
        axes[0].set_title('Burnout Risk Distribution (Count)')
        axes[0].set_xlabel('Burnout Risk')
        axes[0].set_ylabel('Count')
        axes[0].tick_params(axis='x', rotation=0)
        
        # Pie chart
        axes[1].pie(target_counts.values, labels=target_counts.index, autopct='%1.1f%%', 
                   colors=['lightcoral', 'lightblue'])
        axes[1].set_title('Burnout Risk Distribution (Percentage)')
        
        plt.tight_layout()
        plt.savefig(f'{self.output_dir}/target_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print(f"📊 Target distribution plot saved to {self.output_dir}/target_distribution.png")
    
    def numerical_analysis(self):
        """Analyze numerical features"""
        print("\n" + "="*50)
        print("📊 NUMERICAL FEATURES ANALYSIS")
        print("="*50)
        
        numerical_cols = self.data.select_dtypes(include=[np.number]).columns
        numerical_cols = [col for col in numerical_cols if col != 'burnout_risk']
        
        print(f"Found {len(numerical_cols)} numerical features")
        
        # Descriptive statistics
        print("\n📈 Descriptive Statistics:")
        desc_stats = self.data[numerical_cols].describe()
        print(desc_stats)
        
        # Correlation analysis
        print("\n🔗 Correlation with Target:")
        correlations = self.data[numerical_cols + ['burnout_risk']].corr()['burnout_risk'].drop('burnout_risk')
        correlations = correlations.sort_values(key=abs, ascending=False)
        print(correlations)
        
        # Visualize correlations
        plt.figure(figsize=(12, 8))
        correlation_matrix = self.data[numerical_cols + ['burnout_risk']].corr()
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, 
                   square=True, fmt='.2f')
        plt.title('Feature Correlation Matrix')
        plt.tight_layout()
        plt.savefig(f'{self.output_dir}/correlation_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        print(f"📊 Correlation matrix saved to {self.output_dir}/correlation_matrix.png")
        
        # Feature distributions
        n_cols = 3
        n_rows = (len(numerical_cols) + n_cols - 1) // n_cols
        
        fig, axes = plt.subplots(n_rows, n_cols, figsize=(15, 5*n_rows))
        axes = axes.flatten() if n_rows > 1 else [axes] if n_rows == 1 else axes
        
        for i, col in enumerate(numerical_cols):
            if i < len(axes):
                self.data[col].hist(bins=30, ax=axes[i], alpha=0.7)
                axes[i].set_title(f'Distribution of {col}')
                axes[i].set_xlabel(col)
                axes[i].set_ylabel('Frequency')
        
        # Hide empty subplots
        for i in range(len(numerical_cols), len(axes)):
            axes[i].set_visible(False)
        
        plt.tight_layout()
        plt.savefig(f'{self.output_dir}/feature_distributions.png', dpi=300, bbox_inches='tight')
        plt.close()
        print(f"📊 Feature distributions saved to {self.output_dir}/feature_distributions.png")
    
    def categorical_analysis(self):
        """Analyze categorical features"""
        print("\n" + "="*50)
        print("📊 CATEGORICAL FEATURES ANALYSIS")
        print("="*50)
        
        categorical_cols = self.data.select_dtypes(include=['object']).columns
        
        if len(categorical_cols) == 0:
            print("No categorical features found")
            return
        
        print(f"Found {len(categorical_cols)} categorical features")
        
        for col in categorical_cols:
            print(f"\n📋 {col}:")
            value_counts = self.data[col].value_counts()
            print(f"  Unique values: {self.data[col].nunique()}")
            print(f"  Most frequent: {value_counts.index[0]} ({value_counts.iloc[0]} times)")
            print(f"  Distribution:")
            for value, count in value_counts.head().items():
                percentage = (count / len(self.data)) * 100
                print(f"    {value}: {count} ({percentage:.1f}%)")
    
    def feature_importance_analysis(self):
        """Analyze feature importance for burnout prediction"""
        print("\n" + "="*50)
        print("🎯 FEATURE IMPORTANCE ANALYSIS")
        print("="*50)
        
        if 'burnout_risk' not in self.data.columns:
            print("❌ Target variable 'burnout_risk' not found")
            return
        
        # Calculate correlation with target
        numerical_cols = self.data.select_dtypes(include=[np.number]).columns
        numerical_cols = [col for col in numerical_cols if col != 'burnout_risk']
        
        correlations = self.data[numerical_cols + ['burnout_risk']].corr()['burnout_risk'].drop('burnout_risk')
        correlations = correlations.sort_values(key=abs, ascending=False)
        
        print("Top 10 Features by Correlation with Burnout Risk:")
        for i, (feature, corr) in enumerate(correlations.head(10).items(), 1):
            print(f"  {i:2d}. {feature:25s}: {corr:6.3f}")
        
        # Visualize feature importance
        plt.figure(figsize=(12, 8))
        top_features = correlations.head(15)
        colors = ['red' if x < 0 else 'blue' for x in top_features.values]
        
        bars = plt.barh(range(len(top_features)), top_features.values, color=colors, alpha=0.7)
        plt.yticks(range(len(top_features)), top_features.index)
        plt.xlabel('Correlation with Burnout Risk')
        plt.title('Feature Importance (Correlation with Target)')
        plt.axvline(x=0, color='black', linestyle='-', alpha=0.3)
        
        # Add value labels on bars
        for i, (bar, value) in enumerate(zip(bars, top_features.values)):
            plt.text(value + (0.01 if value >= 0 else -0.01), i, f'{value:.3f}', 
                    va='center', ha='left' if value >= 0 else 'right')
        
        plt.tight_layout()
        plt.savefig(f'{self.output_dir}/feature_importance.png', dpi=300, bbox_inches='tight')
        plt.close()
        print(f"📊 Feature importance plot saved to {self.output_dir}/feature_importance.png")
    
    def generate_report(self):
        """Generate comprehensive EDA report"""
        print("\n" + "="*50)
        print("📄 GENERATING EDA REPORT")
        print("="*50)
        
        report_content = f"""
# Exploratory Data Analysis Report
**Generated by:** Balaji Koneti  
**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Dataset:** {self.data_path or 'Synthetic Dataset'}  
**Shape:** {self.data.shape[0]} rows × {self.data.shape[1]} columns

## Summary Statistics

### Dataset Overview
- **Total Records:** {self.data.shape[0]:,}
- **Total Features:** {self.data.shape[1]}
- **Memory Usage:** {self.data.memory_usage(deep=True).sum() / 1024**2:.2f} MB
- **Missing Values:** {self.data.isnull().sum().sum()}

### Target Variable Distribution
"""
        
        if 'burnout_risk' in self.data.columns:
            target_counts = self.data['burnout_risk'].value_counts()
            target_percentages = self.data['burnout_risk'].value_counts(normalize=True) * 100
            
            for value, count in target_counts.items():
                percentage = target_percentages[value]
                report_content += f"- **{value}:** {count:,} ({percentage:.1f}%)\n"
        
        report_content += f"""
### Feature Types
- **Numerical Features:** {len(self.data.select_dtypes(include=[np.number]).columns)}
- **Categorical Features:** {len(self.data.select_dtypes(include=['object']).columns)}

## Key Findings

1. **Dataset Quality:** {'Good' if self.data.isnull().sum().sum() == 0 else 'Has missing values'}
2. **Class Balance:** {'Balanced' if 'burnout_risk' in self.data.columns and abs(self.data['burnout_risk'].mean() - 0.5) < 0.1 else 'Imbalanced'}
3. **Feature Diversity:** {len(self.data.columns)} features available for analysis

## Generated Visualizations
- `missing_data.png` - Missing data analysis
- `target_distribution.png` - Target variable distribution
- `correlation_matrix.png` - Feature correlation matrix
- `feature_distributions.png` - Individual feature distributions
- `feature_importance.png` - Feature importance ranking

## Recommendations
1. Consider feature engineering for highly correlated features
2. Address class imbalance if present
3. Validate feature distributions for model assumptions
4. Consider dimensionality reduction for high-dimensional data

---
*Report generated by Burnout Risk Prediction EDA Tool*
"""
        
        # Save report
        report_path = f'{self.output_dir}/EDA_Report.md'
        with open(report_path, 'w') as f:
            f.write(report_content)
        
        print(f"📄 EDA report saved to {report_path}")
    
    def run_full_analysis(self):
        """Run complete EDA analysis"""
        print("🚀 Starting Comprehensive EDA Analysis...")
        print("="*60)
        
        # Load or generate data
        if self.data is None:
            if self.data_path and os.path.exists(self.data_path):
                if not self.load_data():
                    return False
            else:
                print("📊 No data file found, generating synthetic dataset...")
                if not self.generate_synthetic_data():
                    return False
        
        # Run all analyses
        self.basic_info()
        self.missing_data_analysis()
        self.target_analysis()
        self.numerical_analysis()
        self.categorical_analysis()
        self.feature_importance_analysis()
        self.generate_report()
        
        print("\n" + "="*60)
        print("✅ EDA Analysis Complete!")
        print(f"📁 All outputs saved to: {self.output_dir}")
        print("="*60)
        
        return True

def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(
        description='Exploratory Data Analysis for Burnout Prediction Dataset',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python eda.py --data data.csv --output eda_results
  python eda.py --synthetic --samples 2000 --output synthetic_eda
  python eda.py --data data.csv --quick
        """
    )
    
    parser.add_argument('--data', '-d', type=str, help='Path to dataset CSV file')
    parser.add_argument('--output', '-o', type=str, default='eda_output', 
                       help='Output directory for results (default: eda_output)')
    parser.add_argument('--synthetic', '-s', action='store_true', 
                       help='Generate synthetic dataset instead of loading from file')
    parser.add_argument('--samples', '-n', type=int, default=1000, 
                       help='Number of samples for synthetic dataset (default: 1000)')
    parser.add_argument('--quick', '-q', action='store_true', 
                       help='Run quick analysis (skip some visualizations)')
    
    args = parser.parse_args()
    
    # Initialize EDA tool
    eda = BurnoutEDA(data_path=args.data, output_dir=args.output)
    
    # Run analysis
    if args.synthetic:
        print("🔧 Generating synthetic dataset...")
        if not eda.generate_synthetic_data(args.samples):
            sys.exit(1)
    elif args.data:
        if not eda.load_data():
            sys.exit(1)
    else:
        print("❌ Please provide either --data or --synthetic option")
        sys.exit(1)
    
    # Run full analysis
    if not eda.run_full_analysis():
        sys.exit(1)
    
    print("\n🎉 Analysis completed successfully!")

if __name__ == '__main__':
    main()
