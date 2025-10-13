#!/usr/bin/env python3
"""
Feature Analysis CLI Tool
Created by Balaji Koneti

This script performs comprehensive feature analysis for burnout prediction models.
It analyzes feature importance, correlations, and provides recommendations.
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
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

# Set style for better visualizations
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class FeatureAnalyzer:
    """Feature Analysis for Burnout Prediction Models"""
    
    def __init__(self, data_path=None, output_dir='feature_analysis_output'):
        """
        Initialize Feature Analyzer
        
        Args:
            data_path (str): Path to the dataset
            output_dir (str): Directory to save outputs
        """
        self.data_path = data_path
        self.output_dir = output_dir
        self.data = None
        self.X = None
        self.y = None
        self.feature_names = None
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
            'job_satisfaction': np.random.uniform(1, 10, n_samples),
            'department': np.random.choice(
                ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'], 
                n_samples
            ),
            'experience_years': np.random.uniform(1, 20, n_samples)
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
        
        self.data = pd.DataFrame(data)
        print(f"✅ Synthetic dataset generated: {self.data.shape[0]} rows, {self.data.shape[1]} columns")
        return True
    
    def prepare_features(self):
        """Prepare features and target for analysis"""
        print("\n🔧 Preparing features for analysis...")
        
        if 'burnout_risk' not in self.data.columns:
            print("❌ Target variable 'burnout_risk' not found")
            return False
        
        # Select numerical features
        numerical_cols = self.data.select_dtypes(include=[np.number]).columns
        feature_cols = [col for col in numerical_cols if col not in ['burnout_risk', 'user_id']]
        
        # Handle categorical features
        categorical_cols = self.data.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            # One-hot encode categorical features
            categorical_data = pd.get_dummies(self.data[categorical_cols], drop_first=True)
            feature_cols.extend(categorical_data.columns)
            self.data = pd.concat([self.data, categorical_data], axis=1)
        
        # Prepare X and y
        self.X = self.data[feature_cols].fillna(0)  # Fill any remaining NaN values
        self.y = self.data['burnout_risk']
        self.feature_names = feature_cols
        
        print(f"✅ Features prepared: {self.X.shape[1]} features, {self.X.shape[0]} samples")
        print(f"   Target distribution: {self.y.value_counts().to_dict()}")
        
        return True
    
    def correlation_analysis(self):
        """Analyze feature correlations"""
        print("\n" + "="*50)
        print("🔗 CORRELATION ANALYSIS")
        print("="*50)
        
        # Calculate correlation matrix
        correlation_matrix = self.X.corr()
        
        # Find highly correlated pairs
        high_corr_pairs = []
        for i in range(len(correlation_matrix.columns)):
            for j in range(i+1, len(correlation_matrix.columns)):
                corr_value = correlation_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:  # High correlation threshold
                    high_corr_pairs.append({
                        'feature1': correlation_matrix.columns[i],
                        'feature2': correlation_matrix.columns[j],
                        'correlation': corr_value
                    })
        
        print(f"Found {len(high_corr_pairs)} highly correlated feature pairs (|r| > 0.7):")
        for pair in sorted(high_corr_pairs, key=lambda x: abs(x['correlation']), reverse=True):
            print(f"  {pair['feature1']} ↔ {pair['feature2']}: {pair['correlation']:.3f}")
        
        # Visualize correlation matrix
        plt.figure(figsize=(15, 12))
        mask = np.triu(np.ones_like(correlation_matrix, dtype=bool))
        sns.heatmap(correlation_matrix, mask=mask, annot=True, cmap='coolwarm', center=0,
                   square=True, fmt='.2f', cbar_kws={"shrink": .8})
        plt.title('Feature Correlation Matrix')
        plt.tight_layout()
        plt.savefig(f'{self.output_dir}/correlation_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        print(f"📊 Correlation matrix saved to {self.output_dir}/correlation_matrix.png")
        
        return high_corr_pairs
    
    def feature_importance_analysis(self):
        """Analyze feature importance using multiple methods"""
        print("\n" + "="*50)
        print("🎯 FEATURE IMPORTANCE ANALYSIS")
        print("="*50)
        
        # Split data for training
        X_train, X_test, y_train, y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42, stratify=self.y
        )
        
        # Standardize features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # 1. Random Forest Feature Importance
        print("🌲 Random Forest Feature Importance:")
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)
        rf_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': rf.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("Top 10 features by Random Forest:")
        for i, (_, row) in enumerate(rf_importance.head(10).iterrows(), 1):
            print(f"  {i:2d}. {row['feature']:25s}: {row['importance']:.4f}")
        
        # 2. Logistic Regression Coefficients
        print("\n📊 Logistic Regression Coefficients:")
        lr = LogisticRegression(random_state=42, max_iter=1000)
        lr.fit(X_train_scaled, y_train)
        lr_importance = pd.DataFrame({
            'feature': self.feature_names,
            'coefficient': lr.coef_[0]
        }).sort_values('coefficient', key=abs, ascending=False)
        
        print("Top 10 features by Logistic Regression:")
        for i, (_, row) in enumerate(lr_importance.head(10).iterrows(), 1):
            print(f"  {i:2d}. {row['feature']:25s}: {row['coefficient']:6.3f}")
        
        # 3. Statistical Feature Selection
        print("\n📈 Statistical Feature Selection (F-test):")
        selector_f = SelectKBest(score_func=f_classif, k='all')
        selector_f.fit(X_train, y_train)
        f_importance = pd.DataFrame({
            'feature': self.feature_names,
            'f_score': selector_f.scores_
        }).sort_values('f_score', ascending=False)
        
        print("Top 10 features by F-test:")
        for i, (_, row) in enumerate(f_importance.head(10).iterrows(), 1):
            print(f"  {i:2d}. {row['feature']:25s}: {row['f_score']:.2f}")
        
        # 4. Mutual Information
        print("\n🔍 Mutual Information:")
        mi_scores = mutual_info_classif(X_train, y_train, random_state=42)
        mi_importance = pd.DataFrame({
            'feature': self.feature_names,
            'mi_score': mi_scores
        }).sort_values('mi_score', ascending=False)
        
        print("Top 10 features by Mutual Information:")
        for i, (_, row) in enumerate(mi_importance.head(10).iterrows(), 1):
            print(f"  {i:2d}. {row['feature']:25s}: {row['mi_score']:.4f}")
        
        # Visualize feature importance comparison
        self._plot_feature_importance_comparison(rf_importance, lr_importance, f_importance, mi_importance)
        
        return {
            'random_forest': rf_importance,
            'logistic_regression': lr_importance,
            'f_test': f_importance,
            'mutual_information': mi_importance
        }
    
    def _plot_feature_importance_comparison(self, rf_importance, lr_importance, f_importance, mi_importance):
        """Plot comparison of different feature importance methods"""
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        
        # Random Forest
        top_rf = rf_importance.head(15)
        axes[0, 0].barh(range(len(top_rf)), top_rf['importance'], color='skyblue', alpha=0.7)
        axes[0, 0].set_yticks(range(len(top_rf)))
        axes[0, 0].set_yticklabels(top_rf['feature'])
        axes[0, 0].set_title('Random Forest Feature Importance')
        axes[0, 0].set_xlabel('Importance Score')
        
        # Logistic Regression
        top_lr = lr_importance.head(15)
        colors = ['red' if x < 0 else 'blue' for x in top_lr['coefficient']]
        axes[0, 1].barh(range(len(top_lr)), top_lr['coefficient'], color=colors, alpha=0.7)
        axes[0, 1].set_yticks(range(len(top_lr)))
        axes[0, 1].set_yticklabels(top_lr['feature'])
        axes[0, 1].set_title('Logistic Regression Coefficients')
        axes[0, 1].set_xlabel('Coefficient Value')
        axes[0, 1].axvline(x=0, color='black', linestyle='--', alpha=0.5)
        
        # F-test
        top_f = f_importance.head(15)
        axes[1, 0].barh(range(len(top_f)), top_f['f_score'], color='lightgreen', alpha=0.7)
        axes[1, 0].set_yticks(range(len(top_f)))
        axes[1, 0].set_yticklabels(top_f['feature'])
        axes[1, 0].set_title('F-test Feature Selection')
        axes[1, 0].set_xlabel('F-score')
        
        # Mutual Information
        top_mi = mi_importance.head(15)
        axes[1, 1].barh(range(len(top_mi)), top_mi['mi_score'], color='orange', alpha=0.7)
        axes[1, 1].set_yticks(range(len(top_mi)))
        axes[1, 1].set_yticklabels(top_mi['feature'])
        axes[1, 1].set_title('Mutual Information')
        axes[1, 1].set_xlabel('MI Score')
        
        plt.tight_layout()
        plt.savefig(f'{self.output_dir}/feature_importance_comparison.png', dpi=300, bbox_inches='tight')
        plt.close()
        print(f"📊 Feature importance comparison saved to {self.output_dir}/feature_importance_comparison.png")
    
    def feature_interaction_analysis(self):
        """Analyze feature interactions"""
        print("\n" + "="*50)
        print("🔄 FEATURE INTERACTION ANALYSIS")
        print("="*50)
        
        # Calculate pairwise feature interactions
        interactions = []
        for i, feature1 in enumerate(self.feature_names):
            for j, feature2 in enumerate(self.feature_names[i+1:], i+1):
                # Calculate interaction as product of standardized features
                interaction = self.X[feature1] * self.X[feature2]
                correlation = interaction.corr(self.y)
                
                if abs(correlation) > 0.1:  # Significant interaction threshold
                    interactions.append({
                        'feature1': feature1,
                        'feature2': feature2,
                        'correlation': correlation
                    })
        
        # Sort by absolute correlation
        interactions = sorted(interactions, key=lambda x: abs(x['correlation']), reverse=True)
        
        print(f"Found {len(interactions)} significant feature interactions (|r| > 0.1):")
        for i, interaction in enumerate(interactions[:10], 1):
            print(f"  {i:2d}. {interaction['feature1']} × {interaction['feature2']}: {interaction['correlation']:.3f}")
        
        return interactions
    
    def feature_recommendations(self, importance_results, high_corr_pairs, interactions):
        """Generate feature engineering recommendations"""
        print("\n" + "="*50)
        print("💡 FEATURE ENGINEERING RECOMMENDATIONS")
        print("="*50)
        
        recommendations = []
        
        # 1. Remove highly correlated features
        if high_corr_pairs:
            recommendations.append({
                'type': 'Remove Correlated Features',
                'description': f'Remove one feature from each of {len(high_corr_pairs)} highly correlated pairs',
                'priority': 'High',
                'features': [pair['feature1'] for pair in high_corr_pairs[:5]]
            })
        
        # 2. Feature selection based on importance
        top_features = importance_results['random_forest'].head(10)['feature'].tolist()
        recommendations.append({
            'type': 'Feature Selection',
            'description': 'Use top 10 most important features for model training',
            'priority': 'High',
            'features': top_features
        })
        
        # 3. Create interaction features
        if interactions:
            recommendations.append({
                'type': 'Create Interaction Features',
                'description': f'Create {min(5, len(interactions))} interaction features from top interactions',
                'priority': 'Medium',
                'features': [f"{int['feature1']}_x_{int['feature2']}" for int in interactions[:5]]
            })
        
        # 4. Feature scaling recommendations
        recommendations.append({
            'type': 'Feature Scaling',
            'description': 'Apply StandardScaler to all numerical features',
            'priority': 'High',
            'features': 'All numerical features'
        })
        
        # 5. Categorical encoding recommendations
        categorical_features = self.data.select_dtypes(include=['object']).columns.tolist()
        if categorical_features:
            recommendations.append({
                'type': 'Categorical Encoding',
                'description': f'Apply OneHotEncoder to categorical features',
                'priority': 'Medium',
                'features': categorical_features
            })
        
        print("Feature Engineering Recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec['type']} ({rec['priority']} Priority)")
            print(f"   Description: {rec['description']}")
            if isinstance(rec['features'], list):
                print(f"   Features: {', '.join(rec['features'][:5])}{'...' if len(rec['features']) > 5 else ''}")
            else:
                print(f"   Features: {rec['features']}")
        
        return recommendations
    
    def generate_report(self, importance_results, high_corr_pairs, interactions, recommendations):
        """Generate comprehensive feature analysis report"""
        print("\n" + "="*50)
        print("📄 GENERATING FEATURE ANALYSIS REPORT")
        print("="*50)
        
        report_content = f"""
# Feature Analysis Report
**Generated by:** Balaji Koneti  
**Date:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Dataset:** {self.data_path or 'Synthetic Dataset'}  
**Features Analyzed:** {len(self.feature_names)}

## Executive Summary

### Dataset Overview
- **Total Features:** {len(self.feature_names)}
- **Samples:** {self.X.shape[0]:,}
- **Target Distribution:** {dict(self.y.value_counts())}
- **High Correlations Found:** {len(high_corr_pairs)}
- **Significant Interactions:** {len(interactions)}

## Feature Importance Rankings

### Top 10 Features (Random Forest)
"""
        
        for i, (_, row) in enumerate(importance_results['random_forest'].head(10).iterrows(), 1):
            report_content += f"{i:2d}. {row['feature']:25s}: {row['importance']:.4f}\n"
        
        report_content += f"""
### Top 10 Features (Logistic Regression)
"""
        
        for i, (_, row) in enumerate(importance_results['logistic_regression'].head(10).iterrows(), 1):
            report_content += f"{i:2d}. {row['feature']:25s}: {row['coefficient']:6.3f}\n"
        
        report_content += f"""
## Correlation Analysis

### Highly Correlated Feature Pairs (|r| > 0.7)
"""
        
        for i, pair in enumerate(high_corr_pairs[:10], 1):
            report_content += f"{i:2d}. {pair['feature1']} ↔ {pair['feature2']}: {pair['correlation']:.3f}\n"
        
        report_content += f"""
## Feature Interactions

### Top 10 Significant Interactions (|r| > 0.1)
"""
        
        for i, interaction in enumerate(interactions[:10], 1):
            report_content += f"{i:2d}. {interaction['feature1']} × {interaction['feature2']}: {interaction['correlation']:.3f}\n"
        
        report_content += f"""
## Recommendations

"""
        
        for i, rec in enumerate(recommendations, 1):
            report_content += f"""
### {i}. {rec['type']} ({rec['priority']} Priority)
**Description:** {rec['description']}
**Features:** {', '.join(rec['features'][:5]) if isinstance(rec['features'], list) else rec['features']}{'...' if isinstance(rec['features'], list) and len(rec['features']) > 5 else ''}
"""
        
        report_content += f"""
## Generated Visualizations
- `correlation_matrix.png` - Feature correlation heatmap
- `feature_importance_comparison.png` - Comparison of different importance methods

## Next Steps
1. Implement feature selection based on importance rankings
2. Remove highly correlated features to reduce multicollinearity
3. Create interaction features for top interactions
4. Apply appropriate scaling and encoding
5. Validate feature engineering with cross-validation

---
*Report generated by Burnout Risk Prediction Feature Analysis Tool*
"""
        
        # Save report
        report_path = f'{self.output_dir}/Feature_Analysis_Report.md'
        with open(report_path, 'w') as f:
            f.write(report_content)
        
        print(f"📄 Feature analysis report saved to {report_path}")
    
    def run_full_analysis(self):
        """Run complete feature analysis"""
        print("🚀 Starting Comprehensive Feature Analysis...")
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
        
        # Prepare features
        if not self.prepare_features():
            return False
        
        # Run all analyses
        high_corr_pairs = self.correlation_analysis()
        importance_results = self.feature_importance_analysis()
        interactions = self.feature_interaction_analysis()
        recommendations = self.feature_recommendations(importance_results, high_corr_pairs, interactions)
        self.generate_report(importance_results, high_corr_pairs, interactions, recommendations)
        
        print("\n" + "="*60)
        print("✅ Feature Analysis Complete!")
        print(f"📁 All outputs saved to: {self.output_dir}")
        print("="*60)
        
        return True

def main():
    """Main CLI function"""
    parser = argparse.ArgumentParser(
        description='Feature Analysis for Burnout Prediction Models',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python feature_analysis.py --data data.csv --output feature_results
  python feature_analysis.py --synthetic --samples 2000 --output synthetic_features
  python feature_analysis.py --data data.csv --quick
        """
    )
    
    parser.add_argument('--data', '-d', type=str, help='Path to dataset CSV file')
    parser.add_argument('--output', '-o', type=str, default='feature_analysis_output', 
                       help='Output directory for results (default: feature_analysis_output)')
    parser.add_argument('--synthetic', '-s', action='store_true', 
                       help='Generate synthetic dataset instead of loading from file')
    parser.add_argument('--samples', '-n', type=int, default=1000, 
                       help='Number of samples for synthetic dataset (default: 1000)')
    parser.add_argument('--quick', '-q', action='store_true', 
                       help='Run quick analysis (skip some visualizations)')
    
    args = parser.parse_args()
    
    # Initialize Feature Analyzer
    analyzer = FeatureAnalyzer(data_path=args.data, output_dir=args.output)
    
    # Run analysis
    if args.synthetic:
        print("🔧 Generating synthetic dataset...")
        if not analyzer.generate_synthetic_data(args.samples):
            sys.exit(1)
    elif args.data:
        if not analyzer.load_data():
            sys.exit(1)
    else:
        print("❌ Please provide either --data or --synthetic option")
        sys.exit(1)
    
    # Run full analysis
    if not analyzer.run_full_analysis():
        sys.exit(1)
    
    print("\n🎉 Feature analysis completed successfully!")

if __name__ == '__main__':
    main()
