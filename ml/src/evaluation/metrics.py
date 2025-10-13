# Evaluation Metrics - Created by Balaji Koneti
"""
Comprehensive evaluation metrics for burnout risk prediction models.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, precision_recall_curve, auc,
    confusion_matrix, classification_report, log_loss,
    matthews_corrcoef, cohen_kappa_score
)
import logging

logger = logging.getLogger(__name__)

class ComprehensiveMetrics:
    """Comprehensive metrics calculator for burnout risk prediction"""
    
    def __init__(self):
        self.target_recall = 0.85  # Target recall for high-risk class
        self.target_f1 = 0.75      # Target F1-score
        self.target_roc_auc = 0.80 # Target ROC-AUC
    
    def calculate_all_metrics(
        self, 
        y_true: Union[np.ndarray, pd.Series, List],
        y_pred: Union[np.ndarray, pd.Series, List],
        y_pred_proba: Optional[Union[np.ndarray, pd.Series, List]] = None,
        class_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive evaluation metrics
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Prediction probabilities
            class_names: Names of classes
            
        Returns:
            Dictionary containing all metrics
        """
        try:
            # Convert to numpy arrays
            y_true = np.array(y_true)
            y_pred = np.array(y_pred)
            
            if y_pred_proba is not None:
                y_pred_proba = np.array(y_pred_proba)
            
            # Get unique classes
            unique_classes = np.unique(y_true)
            n_classes = len(unique_classes)
            
            # Set default class names
            if class_names is None:
                if n_classes == 2:
                    class_names = ['low_risk', 'high_risk']
                else:
                    class_names = [f'class_{i}' for i in range(n_classes)]
            
            metrics = {}
            
            # 1. Basic Classification Metrics
            metrics['basic_metrics'] = self._calculate_basic_metrics(y_true, y_pred)
            
            # 2. Per-Class Metrics
            metrics['per_class_metrics'] = self._calculate_per_class_metrics(
                y_true, y_pred, class_names
            )
            
            # 3. Probability-based Metrics
            if y_pred_proba is not None:
                metrics['probability_metrics'] = self._calculate_probability_metrics(
                    y_true, y_pred_proba, class_names
                )
            
            # 4. Business Metrics
            metrics['business_metrics'] = self._calculate_business_metrics(
                y_true, y_pred, class_names
            )
            
            # 5. Model Performance Assessment
            metrics['performance_assessment'] = self._assess_model_performance(metrics)
            
            # 6. Confusion Matrix
            metrics['confusion_matrix'] = self._calculate_confusion_matrix(
                y_true, y_pred, class_names
            )
            
            # 7. Classification Report
            metrics['classification_report'] = self._generate_classification_report(
                y_true, y_pred, class_names
            )
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_basic_metrics(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """Calculate basic classification metrics"""
        return {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'precision_macro': float(precision_score(y_true, y_pred, average='macro', zero_division=0)),
            'precision_weighted': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
            'recall_macro': float(recall_score(y_true, y_pred, average='macro', zero_division=0)),
            'recall_weighted': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
            'f1_macro': float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
            'f1_weighted': float(f1_score(y_true, y_pred, average='weighted', zero_division=0)),
            'matthews_corrcoef': float(matthews_corrcoef(y_true, y_pred)),
            'cohen_kappa': float(cohen_kappa_score(y_true, y_pred))
        }
    
    def _calculate_per_class_metrics(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray,
        class_names: List[str]
    ) -> Dict[str, Dict[str, float]]:
        """Calculate per-class metrics"""
        per_class_metrics = {}
        
        for i, class_name in enumerate(class_names):
            # Binary classification for this class
            y_true_binary = (y_true == i).astype(int)
            y_pred_binary = (y_pred == i).astype(int)
            
            # Calculate metrics
            precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
            recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
            f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
            
            per_class_metrics[class_name] = {
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'support': int(np.sum(y_true == i))
            }
        
        return per_class_metrics
    
    def _calculate_probability_metrics(
        self, 
        y_true: np.ndarray, 
        y_pred_proba: np.ndarray,
        class_names: List[str]
    ) -> Dict[str, Any]:
        """Calculate probability-based metrics"""
        metrics = {}
        
        try:
            n_classes = len(class_names)
            
            if n_classes == 2:
                # Binary classification
                if y_pred_proba.ndim == 1:
                    y_proba = y_pred_proba
                else:
                    y_proba = y_pred_proba[:, 1]  # Probability of positive class
                
                # ROC AUC
                roc_auc = roc_auc_score(y_true, y_proba)
                metrics['roc_auc'] = float(roc_auc)
                
                # ROC Curve
                fpr, tpr, roc_thresholds = roc_curve(y_true, y_proba)
                metrics['roc_curve'] = {
                    'fpr': fpr.tolist(),
                    'tpr': tpr.tolist(),
                    'thresholds': roc_thresholds.tolist()
                }
                
                # Precision-Recall Curve
                precision, recall, pr_thresholds = precision_recall_curve(y_true, y_proba)
                pr_auc = auc(recall, precision)
                metrics['pr_auc'] = float(pr_auc)
                metrics['pr_curve'] = {
                    'precision': precision.tolist(),
                    'recall': recall.tolist(),
                    'thresholds': pr_thresholds.tolist()
                }
                
                # Log Loss
                logloss = log_loss(y_true, y_proba)
                metrics['log_loss'] = float(logloss)
                
            else:
                # Multi-class classification
                # ROC AUC (one-vs-rest)
                roc_auc = roc_auc_score(y_true, y_pred_proba, multi_class='ovr', average='weighted')
                metrics['roc_auc'] = float(roc_auc)
                
                # Log Loss
                logloss = log_loss(y_true, y_pred_proba)
                metrics['log_loss'] = float(logloss)
                
                # Per-class ROC AUC
                per_class_auc = {}
                for i, class_name in enumerate(class_names):
                    y_true_binary = (y_true == i).astype(int)
                    if y_pred_proba.ndim == 2:
                        y_proba_class = y_pred_proba[:, i]
                    else:
                        y_proba_class = y_pred_proba
                    
                    try:
                        class_auc = roc_auc_score(y_true_binary, y_proba_class)
                        per_class_auc[class_name] = float(class_auc)
                    except ValueError:
                        per_class_auc[class_name] = 0.0
                
                metrics['per_class_roc_auc'] = per_class_auc
            
        except Exception as e:
            logger.error(f"Error calculating probability metrics: {str(e)}")
            metrics['error'] = str(e)
        
        return metrics
    
    def _calculate_business_metrics(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray,
        class_names: List[str]
    ) -> Dict[str, Any]:
        """Calculate business-relevant metrics"""
        metrics = {}
        
        try:
            # Find high-risk class index
            high_risk_class = None
            for i, class_name in enumerate(class_names):
                if 'high' in class_name.lower() or 'risk' in class_name.lower():
                    high_risk_class = i
                    break
            
            if high_risk_class is not None:
                # High-risk class metrics
                y_true_binary = (y_true == high_risk_class).astype(int)
                y_pred_binary = (y_pred == high_risk_class).astype(int)
                
                # True Positives, False Positives, etc.
                tp = np.sum((y_true_binary == 1) & (y_pred_binary == 1))
                fp = np.sum((y_true_binary == 0) & (y_pred_binary == 1))
                fn = np.sum((y_true_binary == 1) & (y_pred_binary == 0))
                tn = np.sum((y_true_binary == 0) & (y_pred_binary == 0))
                
                # Business metrics
                metrics['high_risk_recall'] = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
                metrics['high_risk_precision'] = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
                metrics['false_positive_rate'] = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
                metrics['false_negative_rate'] = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
                
                # Cost metrics (assuming costs)
                cost_per_false_negative = 10000  # Cost of missing a burnout case
                cost_per_false_positive = 1000   # Cost of false alarm
                
                total_cost = (fn * cost_per_false_negative) + (fp * cost_per_false_positive)
                metrics['total_cost'] = float(total_cost)
                metrics['cost_per_prediction'] = float(total_cost / len(y_true))
                
                # Early detection rate (if we can predict 30+ days in advance)
                # This would need additional data about when burnout actually occurred
                metrics['early_detection_rate'] = 0.0  # Placeholder
                
            else:
                # If no high-risk class identified, use general metrics
                metrics['high_risk_recall'] = 0.0
                metrics['high_risk_precision'] = 0.0
                metrics['false_positive_rate'] = 0.0
                metrics['false_negative_rate'] = 0.0
                metrics['total_cost'] = 0.0
                metrics['cost_per_prediction'] = 0.0
                metrics['early_detection_rate'] = 0.0
            
            # Model reliability metrics
            metrics['prediction_confidence'] = 0.0  # Would need probability data
            metrics['model_stability'] = 0.0  # Would need multiple predictions
            
        except Exception as e:
            logger.error(f"Error calculating business metrics: {str(e)}")
            metrics['error'] = str(e)
        
        return metrics
    
    def _assess_model_performance(self, all_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall model performance against targets"""
        assessment = {
            'overall_score': 0.0,
            'targets_met': {},
            'recommendations': []
        }
        
        try:
            # Check if targets are met
            basic_metrics = all_metrics.get('basic_metrics', {})
            business_metrics = all_metrics.get('business_metrics', {})
            probability_metrics = all_metrics.get('probability_metrics', {})
            
            # High-risk recall target
            high_risk_recall = business_metrics.get('high_risk_recall', 0.0)
            recall_target_met = high_risk_recall >= self.target_recall
            assessment['targets_met']['high_risk_recall'] = {
                'achieved': high_risk_recall,
                'target': self.target_recall,
                'met': recall_target_met
            }
            
            # F1-score target
            f1_score = basic_metrics.get('f1_weighted', 0.0)
            f1_target_met = f1_score >= self.target_f1
            assessment['targets_met']['f1_score'] = {
                'achieved': f1_score,
                'target': self.target_f1,
                'met': f1_target_met
            }
            
            # ROC-AUC target
            roc_auc = probability_metrics.get('roc_auc', 0.0)
            roc_auc_target_met = roc_auc >= self.target_roc_auc
            assessment['targets_met']['roc_auc'] = {
                'achieved': roc_auc,
                'target': self.target_roc_auc,
                'met': roc_auc_target_met
            }
            
            # Calculate overall score
            targets_met_count = sum(1 for target in assessment['targets_met'].values() if target['met'])
            total_targets = len(assessment['targets_met'])
            assessment['overall_score'] = targets_met_count / total_targets if total_targets > 0 else 0.0
            
            # Generate recommendations
            if not recall_target_met:
                assessment['recommendations'].append(
                    f"High-risk recall ({high_risk_recall:.3f}) is below target ({self.target_recall}). "
                    "Consider adjusting classification threshold or improving feature engineering."
                )
            
            if not f1_target_met:
                assessment['recommendations'].append(
                    f"F1-score ({f1_score:.3f}) is below target ({self.target_f1}). "
                    "Consider balancing precision and recall or using different algorithms."
                )
            
            if not roc_auc_target_met:
                assessment['recommendations'].append(
                    f"ROC-AUC ({roc_auc:.3f}) is below target ({self.target_roc_auc}). "
                    "Consider feature selection or model ensemble methods."
                )
            
            if assessment['overall_score'] >= 0.8:
                assessment['recommendations'].append("Model performance is good. Consider deployment.")
            elif assessment['overall_score'] >= 0.6:
                assessment['recommendations'].append("Model performance is acceptable but could be improved.")
            else:
                assessment['recommendations'].append("Model performance is poor. Significant improvements needed.")
            
        except Exception as e:
            logger.error(f"Error assessing model performance: {str(e)}")
            assessment['error'] = str(e)
        
        return assessment
    
    def _calculate_confusion_matrix(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray,
        class_names: List[str]
    ) -> Dict[str, Any]:
        """Calculate confusion matrix"""
        try:
            cm = confusion_matrix(y_true, y_pred)
            
            return {
                'matrix': cm.tolist(),
                'class_names': class_names,
                'normalized': (cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]).tolist()
            }
        except Exception as e:
            logger.error(f"Error calculating confusion matrix: {str(e)}")
            return {'error': str(e)}
    
    def _generate_classification_report(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray,
        class_names: List[str]
    ) -> Dict[str, Any]:
        """Generate classification report"""
        try:
            report = classification_report(
                y_true, y_pred, 
                target_names=class_names, 
                output_dict=True,
                zero_division=0
            )
            
            return report
        except Exception as e:
            logger.error(f"Error generating classification report: {str(e)}")
            return {'error': str(e)}
    
    def get_metric_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Get a summary of key metrics"""
        try:
            basic = metrics.get('basic_metrics', {})
            business = metrics.get('business_metrics', {})
            probability = metrics.get('probability_metrics', {})
            assessment = metrics.get('performance_assessment', {})
            
            summary = {
                'accuracy': basic.get('accuracy', 0.0),
                'f1_score': basic.get('f1_weighted', 0.0),
                'high_risk_recall': business.get('high_risk_recall', 0.0),
                'roc_auc': probability.get('roc_auc', 0.0),
                'overall_score': assessment.get('overall_score', 0.0),
                'targets_met': sum(1 for target in assessment.get('targets_met', {}).values() if target.get('met', False)),
                'total_targets': len(assessment.get('targets_met', {})),
                'recommendations_count': len(assessment.get('recommendations', []))
            }
            
            return summary
        except Exception as e:
            logger.error(f"Error generating metric summary: {str(e)}")
            return {'error': str(e)}

