# SHAP Analysis - Created by Balaji Koneti
"""
SHAP (SHapley Additive exPlanations) analysis for model interpretability.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
import warnings
warnings.filterwarnings('ignore')

# Try to import SHAP
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP not available. Install with: pip install shap")

logger = logging.getLogger(__name__)

class SHAPAnalyzer:
    """SHAP analysis for model interpretability"""
    
    def __init__(self):
        self.explainer = None
        self.shap_values = None
        self.feature_names = []
        self.model = None
    
    def analyze_model(
        self,
        model: Any,
        X: Union[np.ndarray, pd.DataFrame],
        feature_names: Optional[List[str]] = None,
        explainer_type: str = 'auto'
    ) -> Dict[str, Any]:
        """
        Perform SHAP analysis on a model
        
        Args:
            model: Trained ML model
            X: Feature data for analysis
            feature_names: Names of features
            explainer_type: Type of SHAP explainer to use
            
        Returns:
            SHAP analysis results
        """
        if not SHAP_AVAILABLE:
            return {'error': 'SHAP not available. Install with: pip install shap'}
        
        try:
            logger.info("Starting SHAP analysis...")
            
            # Store model and feature names
            self.model = model
            self.feature_names = feature_names or [f'feature_{i}' for i in range(X.shape[1])]
            
            # Convert to numpy array if needed
            if isinstance(X, pd.DataFrame):
                X_array = X.values
            else:
                X_array = X
            
            # Create explainer
            self.explainer = self._create_explainer(model, X_array, explainer_type)
            
            # Calculate SHAP values
            self.shap_values = self.explainer.shap_values(X_array)
            
            # Perform various analyses
            results = {
                'shap_values': self.shap_values,
                'feature_names': self.feature_names,
                'explainer_type': explainer_type,
                'global_importance': self._calculate_global_importance(),
                'summary_plot_data': self._prepare_summary_plot_data(),
                'waterfall_plot_data': self._prepare_waterfall_plot_data(X_array),
                'dependence_plots': self._prepare_dependence_plots(X_array),
                'interaction_analysis': self._analyze_interactions(X_array)
            }
            
            logger.info("SHAP analysis completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"Error in SHAP analysis: {str(e)}")
            return {'error': str(e)}
    
    def _create_explainer(
        self, 
        model: Any, 
        X: np.ndarray, 
        explainer_type: str
    ) -> Any:
        """Create appropriate SHAP explainer"""
        try:
            model_type = type(model).__name__.lower()
            
            if explainer_type == 'auto':
                # Auto-select explainer based on model type
                if 'tree' in model_type or 'forest' in model_type or 'boost' in model_type:
                    explainer = shap.TreeExplainer(model)
                elif 'linear' in model_type or 'logistic' in model_type:
                    explainer = shap.LinearExplainer(model, X)
                else:
                    # Use KernelExplainer as fallback
                    explainer = shap.KernelExplainer(model.predict, X[:100])  # Sample for speed
            elif explainer_type == 'tree':
                explainer = shap.TreeExplainer(model)
            elif explainer_type == 'linear':
                explainer = shap.LinearExplainer(model, X)
            elif explainer_type == 'kernel':
                explainer = shap.KernelExplainer(model.predict, X[:100])
            else:
                raise ValueError(f"Unknown explainer type: {explainer_type}")
            
            return explainer
            
        except Exception as e:
            logger.error(f"Error creating SHAP explainer: {str(e)}")
            # Fallback to KernelExplainer
            return shap.KernelExplainer(model.predict, X[:50])
    
    def _calculate_global_importance(self) -> Dict[str, float]:
        """Calculate global feature importance from SHAP values"""
        try:
            if self.shap_values is None:
                return {}
            
            # Handle different SHAP value formats
            if isinstance(self.shap_values, list):
                # Multi-class case - use first class or average
                if len(self.shap_values) > 0:
                    shap_vals = np.abs(self.shap_values[0])
                else:
                    return {}
            else:
                # Binary or single class case
                shap_vals = np.abs(self.shap_values)
            
            # Calculate mean absolute SHAP values
            mean_shap_values = np.mean(shap_vals, axis=0)
            
            # Create feature importance dictionary
            importance = dict(zip(self.feature_names, mean_shap_values))
            
            # Sort by importance
            importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
            
            return importance
            
        except Exception as e:
            logger.error(f"Error calculating global importance: {str(e)}")
            return {}
    
    def _prepare_summary_plot_data(self) -> Dict[str, Any]:
        """Prepare data for SHAP summary plot"""
        try:
            if self.shap_values is None:
                return {}
            
            # Handle different SHAP value formats
            if isinstance(self.shap_values, list):
                shap_vals = self.shap_values[0] if len(self.shap_values) > 0 else None
            else:
                shap_vals = self.shap_values
            
            if shap_vals is None:
                return {}
            
            # Calculate feature importance for sorting
            mean_abs_shap = np.mean(np.abs(shap_vals), axis=0)
            feature_order = np.argsort(mean_abs_shap)[::-1]
            
            return {
                'shap_values': shap_vals.tolist(),
                'feature_names': self.feature_names,
                'feature_order': feature_order.tolist(),
                'mean_abs_shap': mean_abs_shap.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error preparing summary plot data: {str(e)}")
            return {}
    
    def _prepare_waterfall_plot_data(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """Prepare data for SHAP waterfall plots (for individual predictions)"""
        try:
            if self.shap_values is None or self.explainer is None:
                return []
            
            # Get base value
            base_value = self.explainer.expected_value
            
            # Handle different SHAP value formats
            if isinstance(self.shap_values, list):
                shap_vals = self.shap_values[0] if len(self.shap_values) > 0 else None
            else:
                shap_vals = self.shap_values
            
            if shap_vals is None:
                return []
            
            # Prepare data for first few samples
            waterfall_data = []
            n_samples = min(5, len(X))  # Limit to first 5 samples
            
            for i in range(n_samples):
                sample_data = {
                    'sample_index': i,
                    'base_value': float(base_value) if np.isscalar(base_value) else float(base_value[0]),
                    'prediction': float(self.model.predict([X[i]])[0]),
                    'feature_contributions': []
                }
                
                # Get SHAP values for this sample
                sample_shap = shap_vals[i]
                
                # Sort features by absolute SHAP value
                feature_importance = [(j, abs(val)) for j, val in enumerate(sample_shap)]
                feature_importance.sort(key=lambda x: x[1], reverse=True)
                
                # Get top contributing features
                for j, (feature_idx, importance) in enumerate(feature_importance[:10]):
                    sample_data['feature_contributions'].append({
                        'feature_name': self.feature_names[feature_idx],
                        'feature_value': float(X[i, feature_idx]),
                        'shap_value': float(sample_shap[feature_idx]),
                        'importance_rank': j + 1
                    })
                
                waterfall_data.append(sample_data)
            
            return waterfall_data
            
        except Exception as e:
            logger.error(f"Error preparing waterfall plot data: {str(e)}")
            return []
    
    def _prepare_dependence_plots(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """Prepare data for SHAP dependence plots"""
        try:
            if self.shap_values is None:
                return []
            
            # Handle different SHAP value formats
            if isinstance(self.shap_values, list):
                shap_vals = self.shap_values[0] if len(self.shap_values) > 0 else None
            else:
                shap_vals = self.shap_values
            
            if shap_vals is None:
                return []
            
            # Get top 5 most important features
            mean_abs_shap = np.mean(np.abs(shap_vals), axis=0)
            top_features = np.argsort(mean_abs_shap)[-5:][::-1]
            
            dependence_data = []
            
            for feature_idx in top_features:
                feature_data = {
                    'feature_name': self.feature_names[feature_idx],
                    'feature_values': X[:, feature_idx].tolist(),
                    'shap_values': shap_vals[:, feature_idx].tolist(),
                    'feature_importance': float(mean_abs_shap[feature_idx])
                }
                
                # Find most correlated feature for interaction
                correlations = []
                for other_idx in range(len(self.feature_names)):
                    if other_idx != feature_idx:
                        corr = np.corrcoef(X[:, feature_idx], X[:, other_idx])[0, 1]
                        correlations.append((other_idx, abs(corr)))
                
                if correlations:
                    correlations.sort(key=lambda x: x[1], reverse=True)
                    interaction_feature_idx = correlations[0][0]
                    feature_data['interaction_feature'] = {
                        'name': self.feature_names[interaction_feature_idx],
                        'values': X[:, interaction_feature_idx].tolist(),
                        'correlation': float(correlations[0][1])
                    }
                
                dependence_data.append(feature_data)
            
            return dependence_data
            
        except Exception as e:
            logger.error(f"Error preparing dependence plots: {str(e)}")
            return []
    
    def _analyze_interactions(self, X: np.ndarray) -> Dict[str, Any]:
        """Analyze feature interactions"""
        try:
            if self.shap_values is None:
                return {}
            
            # Handle different SHAP value formats
            if isinstance(self.shap_values, list):
                shap_vals = self.shap_values[0] if len(self.shap_values) > 0 else None
            else:
                shap_vals = self.shap_values
            
            if shap_vals is None:
                return {}
            
            # Calculate feature interactions (simplified approach)
            n_features = len(self.feature_names)
            interaction_matrix = np.zeros((n_features, n_features))
            
            # Calculate pairwise correlations between features and SHAP values
            for i in range(n_features):
                for j in range(i + 1, n_features):
                    # Correlation between feature i and SHAP values of feature j
                    corr_ij = np.corrcoef(X[:, i], shap_vals[:, j])[0, 1]
                    corr_ji = np.corrcoef(X[:, j], shap_vals[:, i])[0, 1]
                    
                    # Average interaction strength
                    interaction_strength = (abs(corr_ij) + abs(corr_ji)) / 2
                    interaction_matrix[i, j] = interaction_strength
                    interaction_matrix[j, i] = interaction_strength
            
            # Find top interactions
            top_interactions = []
            for i in range(n_features):
                for j in range(i + 1, n_features):
                    if interaction_matrix[i, j] > 0.1:  # Threshold for significant interaction
                        top_interactions.append({
                            'feature1': self.feature_names[i],
                            'feature2': self.feature_names[j],
                            'interaction_strength': float(interaction_matrix[i, j])
                        })
            
            # Sort by interaction strength
            top_interactions.sort(key=lambda x: x['interaction_strength'], reverse=True)
            
            return {
                'interaction_matrix': interaction_matrix.tolist(),
                'top_interactions': top_interactions[:10],  # Top 10 interactions
                'feature_names': self.feature_names
            }
            
        except Exception as e:
            logger.error(f"Error analyzing interactions: {str(e)}")
            return {}
    
    def explain_prediction(
        self, 
        X: Union[np.ndarray, pd.DataFrame], 
        sample_idx: int = 0
    ) -> Dict[str, Any]:
        """Explain a specific prediction"""
        try:
            if self.explainer is None or self.shap_values is None:
                return {'error': 'SHAP explainer not initialized'}
            
            # Convert to numpy array if needed
            if isinstance(X, pd.DataFrame):
                X_array = X.values
            else:
                X_array = X
            
            if sample_idx >= len(X_array):
                return {'error': f'Sample index {sample_idx} out of range'}
            
            # Get SHAP values for this sample
            if isinstance(self.shap_values, list):
                sample_shap = self.shap_values[0][sample_idx] if len(self.shap_values) > 0 else None
            else:
                sample_shap = self.shap_values[sample_idx]
            
            if sample_shap is None:
                return {'error': 'Could not get SHAP values for sample'}
            
            # Get base value and prediction
            base_value = self.explainer.expected_value
            if np.isscalar(base_value):
                base_value = base_value
            else:
                base_value = base_value[0]
            
            prediction = self.model.predict([X_array[sample_idx]])[0]
            
            # Sort features by absolute SHAP value
            feature_contributions = []
            for i, (feature_name, shap_val) in enumerate(zip(self.feature_names, sample_shap)):
                feature_contributions.append({
                    'feature_name': feature_name,
                    'feature_value': float(X_array[sample_idx, i]),
                    'shap_value': float(shap_val),
                    'contribution_rank': 0  # Will be set after sorting
                })
            
            # Sort by absolute SHAP value
            feature_contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
            for i, contrib in enumerate(feature_contributions):
                contrib['contribution_rank'] = i + 1
            
            return {
                'sample_index': sample_idx,
                'base_value': float(base_value),
                'prediction': float(prediction),
                'feature_contributions': feature_contributions,
                'top_positive_features': [c for c in feature_contributions[:5] if c['shap_value'] > 0],
                'top_negative_features': [c for c in feature_contributions[:5] if c['shap_value'] < 0]
            }
            
        except Exception as e:
            logger.error(f"Error explaining prediction: {str(e)}")
            return {'error': str(e)}
    
    def get_feature_importance_summary(self) -> Dict[str, Any]:
        """Get summary of feature importance from SHAP analysis"""
        try:
            if not self.shap_values or not self.feature_names:
                return {'error': 'SHAP analysis not completed'}
            
            global_importance = self._calculate_global_importance()
            
            if not global_importance:
                return {'error': 'Could not calculate global importance'}
            
            # Get top features
            top_features = list(global_importance.items())[:10]
            
            # Calculate importance statistics
            importance_values = list(global_importance.values())
            total_importance = sum(importance_values)
            
            # Normalize importance
            normalized_importance = {
                feature: importance / total_importance 
                for feature, importance in global_importance.items()
            }
            
            return {
                'top_features': top_features,
                'total_features': len(self.feature_names),
                'importance_statistics': {
                    'max_importance': max(importance_values),
                    'min_importance': min(importance_values),
                    'mean_importance': np.mean(importance_values),
                    'std_importance': np.std(importance_values)
                },
                'normalized_importance': normalized_importance,
                'cumulative_importance': {
                    feature: sum(list(normalized_importance.values())[:i+1])
                    for i, feature in enumerate(self.feature_names)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting feature importance summary: {str(e)}")
            return {'error': str(e)}

