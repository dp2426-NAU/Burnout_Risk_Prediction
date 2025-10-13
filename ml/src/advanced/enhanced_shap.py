# Enhanced SHAP Analysis - Created by Balaji Koneti
"""
Enhanced SHAP analysis for comprehensive model explainability and interpretability.
"""

import logging
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any, List, Optional, Tuple, Union
import shap
import joblib
from datetime import datetime
import json
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class EnhancedSHAPAnalyzer:
    """Enhanced SHAP analyzer for comprehensive model explainability."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.explainer = None
        self.shap_values = None
        self.feature_names = None
        self.model = None
        self.background_data = None
        
        # Configuration
        self.max_features = self.config.get('max_features', 20)
        self.sample_size = self.config.get('sample_size', 1000)
        self.explainer_type = self.config.get('explainer_type', 'auto')
        
    def initialize(self, model: Any, X_background: np.ndarray, feature_names: List[str] = None) -> None:
        """Initialize the SHAP analyzer with model and background data."""
        try:
            logger.info("Initializing enhanced SHAP analyzer...")
            
            self.model = model
            self.feature_names = feature_names or [f"feature_{i}" for i in range(X_background.shape[1])]
            
            # Sample background data if too large
            if len(X_background) > self.sample_size:
                indices = np.random.choice(len(X_background), self.sample_size, replace=False)
                self.background_data = X_background[indices]
            else:
                self.background_data = X_background
            
            # Initialize SHAP explainer based on model type
            self.explainer = self._create_explainer()
            
            logger.info("Enhanced SHAP analyzer initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing SHAP analyzer: {str(e)}")
            raise
    
    def _create_explainer(self) -> shap.Explainer:
        """Create appropriate SHAP explainer based on model type."""
        try:
            model_type = type(self.model).__name__.lower()
            
            if 'tree' in model_type or 'forest' in model_type or 'xgboost' in model_type or 'lightgbm' in model_type:
                # Tree-based models
                explainer = shap.TreeExplainer(self.model)
                logger.info("Created TreeExplainer for tree-based model")
                
            elif 'linear' in model_type or 'logistic' in model_type:
                # Linear models
                explainer = shap.LinearExplainer(self.model, self.background_data)
                logger.info("Created LinearExplainer for linear model")
                
            elif 'neural' in model_type or 'mlp' in model_type:
                # Neural network models
                explainer = shap.DeepExplainer(self.model, self.background_data)
                logger.info("Created DeepExplainer for neural network model")
                
            else:
                # Generic explainer
                explainer = shap.Explainer(self.model, self.background_data)
                logger.info("Created generic Explainer")
            
            return explainer
            
        except Exception as e:
            logger.error(f"Error creating SHAP explainer: {str(e)}")
            # Fallback to generic explainer
            return shap.Explainer(self.model, self.background_data)
    
    def analyze_global_importance(self, X_test: np.ndarray) -> Dict[str, Any]:
        """Analyze global feature importance using SHAP values."""
        try:
            logger.info("Computing global SHAP importance...")
            
            # Sample test data if too large
            if len(X_test) > self.sample_size:
                indices = np.random.choice(len(X_test), self.sample_size, replace=False)
                X_sample = X_test[indices]
            else:
                X_sample = X_test
            
            # Compute SHAP values
            shap_values = self.explainer.shap_values(X_sample)
            
            # Handle multi-class case
            if isinstance(shap_values, list):
                # For multi-class, use the positive class (index 1)
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
            # Calculate global importance
            global_importance = np.abs(shap_values).mean(axis=0)
            
            # Create feature importance dataframe
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': global_importance
            }).sort_values('importance', ascending=False)
            
            # Get top features
            top_features = importance_df.head(self.max_features)
            
            result = {
                'global_importance': importance_df.to_dict('records'),
                'top_features': top_features.to_dict('records'),
                'feature_importance_scores': dict(zip(self.feature_names, global_importance)),
                'shap_values': shap_values.tolist(),
                'test_data': X_sample.tolist()
            }
            
            logger.info(f"Global importance analysis completed for {len(self.feature_names)} features")
            return result
            
        except Exception as e:
            logger.error(f"Error in global importance analysis: {str(e)}")
            return {'error': str(e)}
    
    def analyze_local_explanations(self, X_test: np.ndarray, instance_indices: List[int] = None) -> Dict[str, Any]:
        """Analyze local explanations for specific instances."""
        try:
            logger.info("Computing local SHAP explanations...")
            
            if instance_indices is None:
                # Analyze first 10 instances
                instance_indices = list(range(min(10, len(X_test))))
            
            # Compute SHAP values for selected instances
            X_selected = X_test[instance_indices]
            shap_values = self.explainer.shap_values(X_selected)
            
            # Handle multi-class case
            if isinstance(shap_values, list):
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
            # Get model predictions
            if hasattr(self.model, 'predict_proba'):
                predictions = self.model.predict_proba(X_selected)
                prediction_probs = predictions[:, 1] if predictions.shape[1] > 1 else predictions[:, 0]
            else:
                predictions = self.model.predict(X_selected)
                prediction_probs = predictions
            
            # Create local explanations
            local_explanations = []
            
            for i, idx in enumerate(instance_indices):
                # Get feature contributions for this instance
                feature_contributions = []
                for j, feature_name in enumerate(self.feature_names):
                    feature_contributions.append({
                        'feature': feature_name,
                        'shap_value': float(shap_values[i, j]),
                        'feature_value': float(X_selected[i, j]),
                        'contribution': float(shap_values[i, j])
                    })
                
                # Sort by absolute contribution
                feature_contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
                
                local_explanations.append({
                    'instance_index': int(idx),
                    'prediction': float(predictions[i]),
                    'prediction_probability': float(prediction_probs[i]),
                    'feature_contributions': feature_contributions[:self.max_features],
                    'top_positive_features': [f for f in feature_contributions[:5] if f['contribution'] > 0],
                    'top_negative_features': [f for f in feature_contributions[:5] if f['contribution'] < 0]
                })
            
            result = {
                'local_explanations': local_explanations,
                'shap_values': shap_values.tolist(),
                'predictions': predictions.tolist(),
                'prediction_probabilities': prediction_probs.tolist()
            }
            
            logger.info(f"Local explanations computed for {len(instance_indices)} instances")
            return result
            
        except Exception as e:
            logger.error(f"Error in local explanations analysis: {str(e)}")
            return {'error': str(e)}
    
    def analyze_feature_interactions(self, X_test: np.ndarray) -> Dict[str, Any]:
        """Analyze feature interactions using SHAP interaction values."""
        try:
            logger.info("Computing SHAP interaction values...")
            
            # Sample test data
            if len(X_test) > 500:  # Smaller sample for interaction analysis
                indices = np.random.choice(len(X_test), 500, replace=False)
                X_sample = X_test[indices]
            else:
                X_sample = X_test
            
            # Compute SHAP interaction values (if supported)
            try:
                interaction_values = self.explainer.shap_interaction_values(X_sample)
                
                # Handle multi-class case
                if isinstance(interaction_values, list):
                    interaction_values = interaction_values[1] if len(interaction_values) > 1 else interaction_values[0]
                
                # Calculate interaction strength
                interaction_strength = np.abs(interaction_values).mean(axis=0)
                
                # Find top interactions
                top_interactions = []
                for i in range(len(self.feature_names)):
                    for j in range(i + 1, len(self.feature_names)):
                        interaction_score = interaction_strength[i, j]
                        top_interactions.append({
                            'feature_1': self.feature_names[i],
                            'feature_2': self.feature_names[j],
                            'interaction_strength': float(interaction_score)
                        })
                
                # Sort by interaction strength
                top_interactions.sort(key=lambda x: x['interaction_strength'], reverse=True)
                
                result = {
                    'interaction_values': interaction_values.tolist(),
                    'top_interactions': top_interactions[:20],  # Top 20 interactions
                    'interaction_matrix': interaction_strength.tolist()
                }
                
                logger.info("Feature interaction analysis completed")
                return result
                
            except Exception as e:
                logger.warning(f"SHAP interaction values not supported: {str(e)}")
                return {'error': 'SHAP interaction values not supported for this model type'}
            
        except Exception as e:
            logger.error(f"Error in feature interaction analysis: {str(e)}")
            return {'error': str(e)}
    
    def analyze_model_behavior(self, X_test: np.ndarray, y_test: np.ndarray = None) -> Dict[str, Any]:
        """Analyze overall model behavior and patterns."""
        try:
            logger.info("Analyzing model behavior...")
            
            # Sample test data
            if len(X_test) > self.sample_size:
                indices = np.random.choice(len(X_test), self.sample_size, replace=False)
                X_sample = X_test[indices]
                y_sample = y_test[indices] if y_test is not None else None
            else:
                X_sample = X_test
                y_sample = y_test
            
            # Compute SHAP values
            shap_values = self.explainer.shap_values(X_sample)
            
            # Handle multi-class case
            if isinstance(shap_values, list):
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
            # Get predictions
            predictions = self.model.predict(X_sample)
            prediction_probs = self.model.predict_proba(X_sample)[:, 1] if hasattr(self.model, 'predict_proba') else predictions
            
            # Analyze prediction distribution
            prediction_distribution = {
                'mean_prediction': float(np.mean(predictions)),
                'std_prediction': float(np.std(predictions)),
                'min_prediction': float(np.min(predictions)),
                'max_prediction': float(np.max(predictions)),
                'prediction_range': float(np.max(predictions) - np.min(predictions))
            }
            
            # Analyze SHAP value distribution
            shap_distribution = {
                'mean_shap': float(np.mean(shap_values)),
                'std_shap': float(np.std(shap_values)),
                'min_shap': float(np.min(shap_values)),
                'max_shap': float(np.max(shap_values)),
                'shap_range': float(np.max(shap_values) - np.min(shap_values))
            }
            
            # Analyze feature stability (consistency of SHAP values)
            feature_stability = []
            for i, feature_name in enumerate(self.feature_names):
                feature_shap = shap_values[:, i]
                stability_score = 1.0 / (1.0 + np.std(feature_shap))  # Higher std = lower stability
                feature_stability.append({
                    'feature': feature_name,
                    'stability_score': float(stability_score),
                    'mean_contribution': float(np.mean(feature_shap)),
                    'std_contribution': float(np.std(feature_shap))
                })
            
            # Sort by stability
            feature_stability.sort(key=lambda x: x['stability_score'], reverse=True)
            
            # Analyze prediction confidence
            confidence_analysis = {
                'high_confidence_count': int(np.sum(prediction_probs > 0.8)),
                'medium_confidence_count': int(np.sum((prediction_probs > 0.5) & (prediction_probs <= 0.8))),
                'low_confidence_count': int(np.sum(prediction_probs <= 0.5)),
                'mean_confidence': float(np.mean(prediction_probs)),
                'confidence_std': float(np.std(prediction_probs))
            }
            
            result = {
                'prediction_distribution': prediction_distribution,
                'shap_distribution': shap_distribution,
                'feature_stability': feature_stability,
                'confidence_analysis': confidence_analysis,
                'model_consistency': {
                    'stable_features': [f['feature'] for f in feature_stability[:10]],
                    'unstable_features': [f['feature'] for f in feature_stability[-10:]],
                    'overall_stability': float(np.mean([f['stability_score'] for f in feature_stability]))
                }
            }
            
            # Add accuracy analysis if ground truth available
            if y_sample is not None:
                from sklearn.metrics import accuracy_score, classification_report
                accuracy = accuracy_score(y_sample, predictions)
                result['accuracy_analysis'] = {
                    'accuracy': float(accuracy),
                    'classification_report': classification_report(y_sample, predictions, output_dict=True)
                }
            
            logger.info("Model behavior analysis completed")
            return result
            
        except Exception as e:
            logger.error(f"Error in model behavior analysis: {str(e)}")
            return {'error': str(e)}
    
    def generate_explanation_report(self, X_test: np.ndarray, y_test: np.ndarray = None, 
                                  output_path: str = None) -> Dict[str, Any]:
        """Generate comprehensive explanation report."""
        try:
            logger.info("Generating comprehensive SHAP explanation report...")
            
            # Run all analyses
            global_importance = self.analyze_global_importance(X_test)
            local_explanations = self.analyze_local_explanations(X_test)
            feature_interactions = self.analyze_feature_interactions(X_test)
            model_behavior = self.analyze_model_behavior(X_test, y_test)
            
            # Compile comprehensive report
            report = {
                'timestamp': datetime.utcnow().isoformat(),
                'model_type': type(self.model).__name__,
                'feature_count': len(self.feature_names),
                'test_samples': len(X_test),
                'global_importance': global_importance,
                'local_explanations': local_explanations,
                'feature_interactions': feature_interactions,
                'model_behavior': model_behavior,
                'summary': self._generate_summary(global_importance, model_behavior)
            }
            
            # Save report if path provided
            if output_path:
                with open(output_path, 'w') as f:
                    json.dump(report, f, indent=2, default=str)
                logger.info(f"Explanation report saved to: {output_path}")
            
            logger.info("Comprehensive SHAP explanation report generated")
            return report
            
        except Exception as e:
            logger.error(f"Error generating explanation report: {str(e)}")
            return {'error': str(e)}
    
    def _generate_summary(self, global_importance: Dict[str, Any], model_behavior: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of SHAP analysis."""
        try:
            summary = {
                'key_insights': [],
                'recommendations': [],
                'model_interpretability_score': 0.0
            }
            
            # Extract key insights
            if 'top_features' in global_importance:
                top_features = global_importance['top_features'][:5]
                summary['key_insights'].append(f"Top 5 most important features: {[f['feature'] for f in top_features]}")
            
            if 'model_consistency' in model_behavior:
                stability = model_behavior['model_consistency']['overall_stability']
                summary['key_insights'].append(f"Model stability score: {stability:.3f}")
                
                if stability > 0.7:
                    summary['key_insights'].append("Model shows high consistency across predictions")
                elif stability > 0.5:
                    summary['key_insights'].append("Model shows moderate consistency")
                else:
                    summary['key_insights'].append("Model shows low consistency - consider retraining")
            
            # Generate recommendations
            if 'confidence_analysis' in model_behavior:
                low_conf_count = model_behavior['confidence_analysis']['low_confidence_count']
                total_samples = sum(model_behavior['confidence_analysis'].values())
                
                if low_conf_count / total_samples > 0.3:
                    summary['recommendations'].append("High proportion of low-confidence predictions - consider model improvement")
            
            if 'feature_stability' in model_behavior:
                unstable_features = model_behavior['model_consistency']['unstable_features']
                if len(unstable_features) > 0:
                    summary['recommendations'].append(f"Unstable features detected: {unstable_features[:3]} - investigate data quality")
            
            # Calculate interpretability score
            interpretability_score = 0.0
            
            # Feature importance clarity
            if 'top_features' in global_importance and len(global_importance['top_features']) > 0:
                interpretability_score += 0.3
            
            # Model stability
            if 'model_consistency' in model_behavior:
                stability = model_behavior['model_consistency']['overall_stability']
                interpretability_score += stability * 0.4
            
            # Feature interactions
            if 'feature_interactions' in model_behavior and 'error' not in model_behavior['feature_interactions']:
                interpretability_score += 0.3
            
            summary['model_interpretability_score'] = min(1.0, interpretability_score)
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {'error': str(e)}
    
    def create_visualizations(self, X_test: np.ndarray, output_dir: str = "shap_plots") -> Dict[str, str]:
        """Create SHAP visualizations."""
        try:
            import os
            os.makedirs(output_dir, exist_ok=True)
            
            logger.info("Creating SHAP visualizations...")
            
            # Sample test data
            if len(X_test) > 100:
                indices = np.random.choice(len(X_test), 100, replace=False)
                X_sample = X_test[indices]
            else:
                X_sample = X_test
            
            # Compute SHAP values
            shap_values = self.explainer.shap_values(X_sample)
            
            # Handle multi-class case
            if isinstance(shap_values, list):
                shap_values = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            
            plot_paths = {}
            
            try:
                # Summary plot
                plt.figure(figsize=(10, 8))
                shap.summary_plot(shap_values, X_sample, feature_names=self.feature_names, show=False)
                summary_path = os.path.join(output_dir, "shap_summary_plot.png")
                plt.savefig(summary_path, dpi=300, bbox_inches='tight')
                plt.close()
                plot_paths['summary_plot'] = summary_path
                
                # Waterfall plot for first instance
                plt.figure(figsize=(10, 6))
                shap.waterfall_plot(self.explainer.expected_value, shap_values[0], X_sample[0], 
                                  feature_names=self.feature_names, show=False)
                waterfall_path = os.path.join(output_dir, "shap_waterfall_plot.png")
                plt.savefig(waterfall_path, dpi=300, bbox_inches='tight')
                plt.close()
                plot_paths['waterfall_plot'] = waterfall_path
                
                # Bar plot
                plt.figure(figsize=(10, 8))
                shap.summary_plot(shap_values, X_sample, feature_names=self.feature_names, 
                                plot_type="bar", show=False)
                bar_path = os.path.join(output_dir, "shap_bar_plot.png")
                plt.savefig(bar_path, dpi=300, bbox_inches='tight')
                plt.close()
                plot_paths['bar_plot'] = bar_path
                
                logger.info(f"SHAP visualizations created in: {output_dir}")
                
            except Exception as e:
                logger.warning(f"Error creating some visualizations: {str(e)}")
            
            return plot_paths
            
        except Exception as e:
            logger.error(f"Error creating visualizations: {str(e)}")
            return {'error': str(e)}

