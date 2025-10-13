# Comprehensive Evaluator - Created by Balaji Koneti
"""
Comprehensive evaluation service that integrates all evaluation components.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
from datetime import datetime
import asyncio
from pathlib import Path
import joblib

from .metrics import ComprehensiveMetrics
from .shap_analysis import SHAPAnalyzer

logger = logging.getLogger(__name__)

class ComprehensiveEvaluator:
    """Comprehensive model evaluator with all evaluation components"""
    
    def __init__(self):
        self.metrics_calculator = ComprehensiveMetrics()
        self.shap_analyzer = SHAPAnalyzer()
        self.evaluation_results = {}
    
    async def evaluate_model(
        self,
        model: Any,
        X_test: Union[np.ndarray, pd.DataFrame],
        y_test: Union[np.ndarray, pd.Series, List],
        feature_names: Optional[List[str]] = None,
        class_names: Optional[List[str]] = None,
        model_name: str = "model",
        include_shap: bool = True
    ) -> Dict[str, Any]:
        """
        Perform comprehensive model evaluation
        
        Args:
            model: Trained ML model
            X_test: Test features
            y_test: Test targets
            feature_names: Names of features
            class_names: Names of classes
            model_name: Name of the model
            include_shap: Whether to include SHAP analysis
            
        Returns:
            Comprehensive evaluation results
        """
        try:
            logger.info(f"Starting comprehensive evaluation for {model_name}")
            
            # Convert inputs to appropriate formats
            if isinstance(X_test, pd.DataFrame):
                X_test_array = X_test.values
                if feature_names is None:
                    feature_names = list(X_test.columns)
            else:
                X_test_array = X_test
                if feature_names is None:
                    feature_names = [f'feature_{i}' for i in range(X_test.shape[1])]
            
            y_test_array = np.array(y_test)
            
            # Make predictions
            y_pred = model.predict(X_test_array)
            y_pred_proba = None
            
            if hasattr(model, 'predict_proba'):
                y_pred_proba = model.predict_proba(X_test_array)
            
            # 1. Calculate comprehensive metrics
            logger.info("Calculating comprehensive metrics...")
            metrics_results = self.metrics_calculator.calculate_all_metrics(
                y_true=y_test_array,
                y_pred=y_pred,
                y_pred_proba=y_pred_proba,
                class_names=class_names
            )
            
            # 2. SHAP analysis (if enabled and model supports it)
            shap_results = {}
            if include_shap and hasattr(model, 'predict'):
                try:
                    logger.info("Performing SHAP analysis...")
                    shap_results = self.shap_analyzer.analyze_model(
                        model=model,
                        X=X_test_array,
                        feature_names=feature_names
                    )
                except Exception as e:
                    logger.warning(f"SHAP analysis failed: {str(e)}")
                    shap_results = {'error': str(e)}
            
            # 3. Generate evaluation report
            evaluation_report = self._generate_evaluation_report(
                model_name=model_name,
                metrics_results=metrics_results,
                shap_results=shap_results,
                feature_names=feature_names,
                class_names=class_names
            )
            
            # 4. Compile final results
            evaluation_results = {
                'model_name': model_name,
                'evaluation_date': datetime.utcnow().isoformat(),
                'data_info': {
                    'test_samples': len(y_test_array),
                    'features': len(feature_names),
                    'classes': len(np.unique(y_test_array)) if class_names is None else len(class_names)
                },
                'metrics': metrics_results,
                'shap_analysis': shap_results,
                'evaluation_report': evaluation_report,
                'summary': self._generate_summary(metrics_results, shap_results)
            }
            
            # Store results
            self.evaluation_results[model_name] = evaluation_results
            
            logger.info(f"Comprehensive evaluation completed for {model_name}")
            return evaluation_results
            
        except Exception as e:
            logger.error(f"Error in comprehensive evaluation: {str(e)}")
            return {
                'model_name': model_name,
                'evaluation_date': datetime.utcnow().isoformat(),
                'error': str(e)
            }
    
    def _generate_evaluation_report(
        self,
        model_name: str,
        metrics_results: Dict[str, Any],
        shap_results: Dict[str, Any],
        feature_names: List[str],
        class_names: Optional[List[str]]
    ) -> Dict[str, Any]:
        """Generate comprehensive evaluation report"""
        try:
            report = {
                'model_name': model_name,
                'evaluation_summary': {},
                'performance_analysis': {},
                'feature_analysis': {},
                'recommendations': [],
                'deployment_readiness': {}
            }
            
            # Performance analysis
            basic_metrics = metrics_results.get('basic_metrics', {})
            business_metrics = metrics_results.get('business_metrics', {})
            performance_assessment = metrics_results.get('performance_assessment', {})
            
            report['evaluation_summary'] = {
                'accuracy': basic_metrics.get('accuracy', 0.0),
                'f1_score': basic_metrics.get('f1_weighted', 0.0),
                'high_risk_recall': business_metrics.get('high_risk_recall', 0.0),
                'overall_score': performance_assessment.get('overall_score', 0.0)
            }
            
            # Performance analysis
            report['performance_analysis'] = {
                'strengths': self._identify_strengths(metrics_results),
                'weaknesses': self._identify_weaknesses(metrics_results),
                'target_achievement': performance_assessment.get('targets_met', {}),
                'performance_trends': self._analyze_performance_trends(metrics_results)
            }
            
            # Feature analysis
            if 'error' not in shap_results:
                feature_importance = shap_results.get('global_importance', {})
                report['feature_analysis'] = {
                    'top_features': list(feature_importance.items())[:10],
                    'feature_interactions': shap_results.get('interaction_analysis', {}).get('top_interactions', []),
                    'feature_insights': self._generate_feature_insights(feature_importance, feature_names)
                }
            else:
                report['feature_analysis'] = {
                    'error': 'SHAP analysis not available',
                    'top_features': [],
                    'feature_interactions': [],
                    'feature_insights': []
                }
            
            # Generate recommendations
            report['recommendations'] = self._generate_recommendations(
                metrics_results, shap_results, performance_assessment
            )
            
            # Deployment readiness assessment
            report['deployment_readiness'] = self._assess_deployment_readiness(
                metrics_results, performance_assessment
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating evaluation report: {str(e)}")
            return {'error': str(e)}
    
    def _identify_strengths(self, metrics_results: Dict[str, Any]) -> List[str]:
        """Identify model strengths"""
        strengths = []
        
        basic_metrics = metrics_results.get('basic_metrics', {})
        business_metrics = metrics_results.get('business_metrics', {})
        probability_metrics = metrics_results.get('probability_metrics', {})
        
        # Check accuracy
        accuracy = basic_metrics.get('accuracy', 0.0)
        if accuracy >= 0.8:
            strengths.append(f"High accuracy ({accuracy:.3f})")
        elif accuracy >= 0.7:
            strengths.append(f"Good accuracy ({accuracy:.3f})")
        
        # Check F1-score
        f1_score = basic_metrics.get('f1_weighted', 0.0)
        if f1_score >= 0.8:
            strengths.append(f"High F1-score ({f1_score:.3f})")
        elif f1_score >= 0.7:
            strengths.append(f"Good F1-score ({f1_score:.3f})")
        
        # Check high-risk recall
        high_risk_recall = business_metrics.get('high_risk_recall', 0.0)
        if high_risk_recall >= 0.8:
            strengths.append(f"Excellent high-risk recall ({high_risk_recall:.3f})")
        elif high_risk_recall >= 0.7:
            strengths.append(f"Good high-risk recall ({high_risk_recall:.3f})")
        
        # Check ROC-AUC
        roc_auc = probability_metrics.get('roc_auc', 0.0)
        if roc_auc >= 0.8:
            strengths.append(f"High ROC-AUC ({roc_auc:.3f})")
        elif roc_auc >= 0.7:
            strengths.append(f"Good ROC-AUC ({roc_auc:.3f})")
        
        # Check Matthews correlation coefficient
        mcc = basic_metrics.get('matthews_corrcoef', 0.0)
        if mcc >= 0.5:
            strengths.append(f"Strong correlation (MCC: {mcc:.3f})")
        
        return strengths
    
    def _identify_weaknesses(self, metrics_results: Dict[str, Any]) -> List[str]:
        """Identify model weaknesses"""
        weaknesses = []
        
        basic_metrics = metrics_results.get('basic_metrics', {})
        business_metrics = metrics_results.get('business_metrics', {})
        probability_metrics = metrics_results.get('probability_metrics', {})
        
        # Check accuracy
        accuracy = basic_metrics.get('accuracy', 0.0)
        if accuracy < 0.6:
            weaknesses.append(f"Low accuracy ({accuracy:.3f})")
        
        # Check F1-score
        f1_score = basic_metrics.get('f1_weighted', 0.0)
        if f1_score < 0.6:
            weaknesses.append(f"Low F1-score ({f1_score:.3f})")
        
        # Check high-risk recall
        high_risk_recall = business_metrics.get('high_risk_recall', 0.0)
        if high_risk_recall < 0.7:
            weaknesses.append(f"Low high-risk recall ({high_risk_recall:.3f})")
        
        # Check ROC-AUC
        roc_auc = probability_metrics.get('roc_auc', 0.0)
        if roc_auc < 0.7:
            weaknesses.append(f"Low ROC-AUC ({roc_auc:.3f})")
        
        # Check false positive rate
        fpr = business_metrics.get('false_positive_rate', 0.0)
        if fpr > 0.3:
            weaknesses.append(f"High false positive rate ({fpr:.3f})")
        
        # Check false negative rate
        fnr = business_metrics.get('false_negative_rate', 0.0)
        if fnr > 0.2:
            weaknesses.append(f"High false negative rate ({fnr:.3f})")
        
        return weaknesses
    
    def _analyze_performance_trends(self, metrics_results: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze performance trends (placeholder for future implementation)"""
        return {
            'trend_analysis': 'Not implemented',
            'performance_stability': 'Unknown',
            'degradation_risk': 'Unknown'
        }
    
    def _generate_feature_insights(
        self, 
        feature_importance: Dict[str, float], 
        feature_names: List[str]
    ) -> List[str]:
        """Generate insights about features"""
        insights = []
        
        if not feature_importance:
            return ['No feature importance data available']
        
        # Top feature insights
        top_features = list(feature_importance.items())[:5]
        if top_features:
            insights.append(f"Top contributing feature: {top_features[0][0]} ({top_features[0][1]:.3f})")
        
        # Feature distribution insights
        importance_values = list(feature_importance.values())
        if importance_values:
            max_importance = max(importance_values)
            min_importance = min(importance_values)
            insights.append(f"Feature importance range: {min_importance:.3f} - {max_importance:.3f}")
        
        # Burnout-specific insights
        burnout_keywords = ['work', 'stress', 'hours', 'meeting', 'email', 'sentiment']
        burnout_features = [f for f in feature_names if any(kw in f.lower() for kw in burnout_keywords)]
        
        if burnout_features:
            burnout_importance = sum(feature_importance.get(f, 0) for f in burnout_features)
            total_importance = sum(importance_values)
            burnout_ratio = burnout_importance / total_importance if total_importance > 0 else 0
            insights.append(f"Burnout-related features contribute {burnout_ratio:.1%} of total importance")
        
        return insights
    
    def _generate_recommendations(
        self,
        metrics_results: Dict[str, Any],
        shap_results: Dict[str, Any],
        performance_assessment: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Get recommendations from performance assessment
        assessment_recommendations = performance_assessment.get('recommendations', [])
        recommendations.extend(assessment_recommendations)
        
        # Additional recommendations based on metrics
        basic_metrics = metrics_results.get('basic_metrics', {})
        business_metrics = metrics_results.get('business_metrics', {})
        
        # High-risk recall recommendations
        high_risk_recall = business_metrics.get('high_risk_recall', 0.0)
        if high_risk_recall < 0.85:
            recommendations.append(
                "Consider adjusting classification threshold to improve high-risk recall. "
                "Current recall may miss critical burnout cases."
            )
        
        # Precision-recall balance
        precision = basic_metrics.get('precision_weighted', 0.0)
        recall = basic_metrics.get('recall_weighted', 0.0)
        if precision < 0.7 and recall < 0.7:
            recommendations.append(
                "Both precision and recall are low. Consider feature engineering, "
                "data quality improvements, or different algorithms."
            )
        
        # Feature engineering recommendations
        if 'error' not in shap_results:
            feature_importance = shap_results.get('global_importance', {})
            if feature_importance:
                top_features = list(feature_importance.items())[:3]
                recommendations.append(
                    f"Focus on top features: {', '.join([f[0] for f in top_features])}. "
                    "Consider creating additional features related to these."
                )
        
        # Data recommendations
        recommendations.append(
            "Ensure sufficient training data for all risk classes. "
            "Consider data augmentation or synthetic data generation for minority classes."
        )
        
        # Model recommendations
        recommendations.append(
            "Consider ensemble methods or model stacking to improve performance. "
            "Hyperparameter tuning may also yield improvements."
        )
        
        return recommendations
    
    def _assess_deployment_readiness(
        self,
        metrics_results: Dict[str, Any],
        performance_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess if model is ready for deployment"""
        readiness = {
            'ready_for_deployment': False,
            'confidence_level': 'low',
            'deployment_risks': [],
            'deployment_conditions': []
        }
        
        # Check overall performance score
        overall_score = performance_assessment.get('overall_score', 0.0)
        
        if overall_score >= 0.8:
            readiness['ready_for_deployment'] = True
            readiness['confidence_level'] = 'high'
        elif overall_score >= 0.6:
            readiness['ready_for_deployment'] = True
            readiness['confidence_level'] = 'medium'
        else:
            readiness['confidence_level'] = 'low'
        
        # Check specific targets
        targets_met = performance_assessment.get('targets_met', {})
        critical_targets = ['high_risk_recall', 'f1_score', 'roc_auc']
        
        for target in critical_targets:
            if target in targets_met:
                target_info = targets_met[target]
                if not target_info.get('met', False):
                    readiness['deployment_risks'].append(
                        f"{target} target not met: {target_info.get('achieved', 0):.3f} < {target_info.get('target', 0):.3f}"
                    )
        
        # Deployment conditions
        if readiness['ready_for_deployment']:
            if readiness['confidence_level'] == 'high':
                readiness['deployment_conditions'].append("Deploy with full monitoring")
            else:
                readiness['deployment_conditions'].append("Deploy with enhanced monitoring")
                readiness['deployment_conditions'].append("Set up A/B testing")
        else:
            readiness['deployment_conditions'].append("Do not deploy - significant improvements needed")
            readiness['deployment_conditions'].append("Focus on addressing critical weaknesses")
        
        return readiness
    
    def _generate_summary(
        self,
        metrics_results: Dict[str, Any],
        shap_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate evaluation summary"""
        try:
            basic_metrics = metrics_results.get('basic_metrics', {})
            business_metrics = metrics_results.get('business_metrics', {})
            performance_assessment = metrics_results.get('performance_assessment', {})
            
            summary = {
                'key_metrics': {
                    'accuracy': basic_metrics.get('accuracy', 0.0),
                    'f1_score': basic_metrics.get('f1_weighted', 0.0),
                    'high_risk_recall': business_metrics.get('high_risk_recall', 0.0),
                    'roc_auc': metrics_results.get('probability_metrics', {}).get('roc_auc', 0.0)
                },
                'performance_score': performance_assessment.get('overall_score', 0.0),
                'targets_met': sum(1 for target in performance_assessment.get('targets_met', {}).values() if target.get('met', False)),
                'total_targets': len(performance_assessment.get('targets_met', {})),
                'feature_analysis_available': 'error' not in shap_results,
                'top_features': list(shap_results.get('global_importance', {}).items())[:5] if 'error' not in shap_results else []
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {'error': str(e)}
    
    def save_evaluation_results(self, model_name: str, save_path: str):
        """Save evaluation results to file"""
        try:
            if model_name not in self.evaluation_results:
                raise ValueError(f"No evaluation results found for model {model_name}")
            
            results = self.evaluation_results[model_name]
            joblib.dump(results, save_path)
            logger.info(f"Evaluation results saved to {save_path}")
            
        except Exception as e:
            logger.error(f"Error saving evaluation results: {str(e)}")
            raise
    
    def load_evaluation_results(self, load_path: str) -> Dict[str, Any]:
        """Load evaluation results from file"""
        try:
            results = joblib.load(load_path)
            model_name = results.get('model_name', 'unknown')
            self.evaluation_results[model_name] = results
            logger.info(f"Evaluation results loaded from {load_path}")
            return results
            
        except Exception as e:
            logger.error(f"Error loading evaluation results: {str(e)}")
            raise
    
    def get_evaluation_summary(self, model_name: str) -> Dict[str, Any]:
        """Get summary of evaluation results"""
        if model_name not in self.evaluation_results:
            return {'error': f'No evaluation results found for model {model_name}'}
        
        return self.evaluation_results[model_name].get('summary', {})
    
    def compare_models(self, model_names: List[str]) -> Dict[str, Any]:
        """Compare multiple models"""
        try:
            if not model_names:
                return {'error': 'No model names provided'}
            
            comparison = {
                'models': {},
                'best_model': None,
                'comparison_metrics': {}
            }
            
            best_score = -1
            best_model = None
            
            for model_name in model_names:
                if model_name in self.evaluation_results:
                    results = self.evaluation_results[model_name]
                    summary = results.get('summary', {})
                    
                    comparison['models'][model_name] = {
                        'performance_score': summary.get('performance_score', 0.0),
                        'key_metrics': summary.get('key_metrics', {}),
                        'targets_met': summary.get('targets_met', 0),
                        'total_targets': summary.get('total_targets', 0)
                    }
                    
                    # Track best model
                    performance_score = summary.get('performance_score', 0.0)
                    if performance_score > best_score:
                        best_score = performance_score
                        best_model = model_name
            
            comparison['best_model'] = best_model
            
            # Generate comparison metrics
            if len(model_names) > 1:
                comparison['comparison_metrics'] = self._generate_comparison_metrics(comparison['models'])
            
            return comparison
            
        except Exception as e:
            logger.error(f"Error comparing models: {str(e)}")
            return {'error': str(e)}
    
    def _generate_comparison_metrics(self, models_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comparison metrics between models"""
        try:
            comparison_metrics = {}
            
            # Get all metric names
            all_metrics = set()
            for model_data in models_data.values():
                key_metrics = model_data.get('key_metrics', {})
                all_metrics.update(key_metrics.keys())
            
            # Compare each metric
            for metric in all_metrics:
                metric_values = {}
                for model_name, model_data in models_data.items():
                    key_metrics = model_data.get('key_metrics', {})
                    metric_values[model_name] = key_metrics.get(metric, 0.0)
                
                if metric_values:
                    best_model = max(metric_values, key=metric_values.get)
                    worst_model = min(metric_values, key=metric_values.get)
                    
                    comparison_metrics[metric] = {
                        'best_model': best_model,
                        'best_value': metric_values[best_model],
                        'worst_model': worst_model,
                        'worst_value': metric_values[worst_model],
                        'improvement_potential': metric_values[best_model] - metric_values[worst_model]
                    }
            
            return comparison_metrics
            
        except Exception as e:
            logger.error(f"Error generating comparison metrics: {str(e)}")
            return {}

