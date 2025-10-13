# Advanced Training Pipeline - Created by Balaji Koneti
"""
Comprehensive training pipeline that replaces the simple model with advanced ML approaches.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
from datetime import datetime
import asyncio
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

# Import our modules
from ..models.baseline_models import BaselineModelTrainer
from ..models.ensemble_models import EnsembleModelTrainer
from ..optimization.hyperparam_tuning import BurnoutModelOptimizer
from ..features.feature_pipeline import FeaturePipeline
from ..data_pipeline.storage import DataStorageManager

logger = logging.getLogger(__name__)

class AdvancedTrainingPipeline:
    """Advanced training pipeline for burnout risk prediction"""
    
    def __init__(self, storage_base_path: str = "ml/data"):
        self.storage_manager = DataStorageManager(storage_base_path)
        self.feature_pipeline = FeaturePipeline(storage_base_path)
        self.baseline_trainer = BaselineModelTrainer()
        self.ensemble_trainer = EnsembleModelTrainer()
        self.optimizer = BurnoutModelOptimizer()
        
        # Training configuration
        self.training_config = {
            'test_size': 0.2,
            'val_size': 0.2,
            'random_state': 42,
            'cv_folds': 5,
            'optimization_trials': 100
        }
        
        # Model configurations
        self.model_configs = self._get_model_configs()
        
        # Training results
        self.training_results = {}
        self.best_model = None
        self.best_model_name = None
        self.feature_names = []
        self.label_encoder = LabelEncoder()
    
    def _get_model_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get model configurations for training"""
        configs = {
            'baseline_models': {
                'logistic_regression': {
                    'type': 'logistic_regression',
                    'params': {
                        'C': 1.0,
                        'class_weight': 'balanced',
                        'max_iter': 1000
                    }
                },
                'random_forest': {
                    'type': 'random_forest',
                    'params': {
                        'n_estimators': 100,
                        'max_depth': 10,
                        'class_weight': 'balanced'
                    }
                },
                'decision_tree': {
                    'type': 'decision_tree',
                    'params': {
                        'max_depth': 10,
                        'class_weight': 'balanced'
                    }
                }
            },
            'ensemble_models': {
                'xgboost': {
                    'type': 'xgboost',
                    'params': {
                        'n_estimators': 100,
                        'max_depth': 6,
                        'learning_rate': 0.1,
                        'subsample': 0.8,
                        'colsample_bytree': 0.8
                    }
                },
                'lightgbm': {
                    'type': 'lightgbm',
                    'params': {
                        'n_estimators': 100,
                        'max_depth': 6,
                        'learning_rate': 0.1,
                        'subsample': 0.8,
                        'colsample_bytree': 0.8
                    }
                }
            }
        }
        return configs
    
    async def train_comprehensive_model(
        self,
        user_ids: List[str],
        lookback_days: int = 30,
        target_column: str = 'burnout_risk',
        optimization_enabled: bool = True
    ) -> Dict[str, Any]:
        """
        Train comprehensive model with advanced features
        
        Args:
            user_ids: List of user IDs to train on
            lookback_days: Number of days to look back for features
            target_column: Name of target column
            optimization_enabled: Whether to use hyperparameter optimization
            
        Returns:
            Training results
        """
        try:
            logger.info(f"Starting comprehensive model training for {len(user_ids)} users")
            
            # Step 1: Generate features for all users
            logger.info("Step 1: Generating features...")
            feature_results = await self.feature_pipeline.process_batch_features(
                user_ids=user_ids,
                lookback_days=lookback_days,
                max_concurrent=5
            )
            
            if not feature_results.get('success', False):
                raise ValueError("Feature generation failed")
            
            # Step 2: Prepare training data
            logger.info("Step 2: Preparing training data...")
            X, y = await self._prepare_training_data(feature_results, target_column)
            
            if X is None or y is None:
                raise ValueError("Failed to prepare training data")
            
            # Step 3: Split data
            logger.info("Step 3: Splitting data...")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=self.training_config['test_size'],
                random_state=self.training_config['random_state'],
                stratify=y
            )
            
            X_train, X_val, y_train, y_val = train_test_split(
                X_train, y_train,
                test_size=self.training_config['val_size'],
                random_state=self.training_config['random_state'],
                stratify=y_train
            )
            
            # Step 4: Train baseline models
            logger.info("Step 4: Training baseline models...")
            baseline_results = await self._train_baseline_models(X_train, y_train, X_val, y_val)
            
            # Step 5: Train ensemble models
            logger.info("Step 5: Training ensemble models...")
            ensemble_results = await self._train_ensemble_models(X_train, y_train, X_val, y_val)
            
            # Step 6: Hyperparameter optimization (if enabled)
            optimization_results = {}
            if optimization_enabled:
                logger.info("Step 6: Hyperparameter optimization...")
                optimization_results = await self._optimize_models(X_train, y_train)
            
            # Step 7: Evaluate all models
            logger.info("Step 7: Evaluating models...")
            evaluation_results = await self._evaluate_all_models(X_test, y_test)
            
            # Step 8: Select best model
            logger.info("Step 8: Selecting best model...")
            best_model_info = self._select_best_model(evaluation_results)
            
            # Step 9: Save models and results
            logger.info("Step 9: Saving models and results...")
            save_results = await self._save_training_results(
                baseline_results, ensemble_results, optimization_results, 
                evaluation_results, best_model_info
            )
            
            # Compile final results
            training_results = {
                'training_date': datetime.utcnow().isoformat(),
                'user_count': len(user_ids),
                'lookback_days': lookback_days,
                'feature_count': len(self.feature_names),
                'feature_names': self.feature_names,
                'data_split': {
                    'train_size': len(X_train),
                    'val_size': len(X_val),
                    'test_size': len(X_test)
                },
                'baseline_results': baseline_results,
                'ensemble_results': ensemble_results,
                'optimization_results': optimization_results,
                'evaluation_results': evaluation_results,
                'best_model': best_model_info,
                'save_results': save_results
            }
            
            self.training_results = training_results
            
            logger.info("Comprehensive model training completed successfully")
            return training_results
            
        except Exception as e:
            logger.error(f"Error in comprehensive model training: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'training_date': datetime.utcnow().isoformat()
            }
    
    async def _prepare_training_data(
        self, 
        feature_results: Dict[str, Any], 
        target_column: str
    ) -> Tuple[Optional[pd.DataFrame], Optional[pd.Series]]:
        """Prepare training data from feature results"""
        try:
            # Collect features from all users
            all_features = []
            all_targets = []
            
            for user_id, user_result in feature_results.get('user_results', {}).items():
                if 'features' in user_result and user_result.get('status') != 'error':
                    features = user_result['features']
                    all_features.append(features)
                    
                    # For now, we'll create synthetic targets based on features
                    # In production, this would come from actual burnout labels
                    target = self._generate_synthetic_target(features)
                    all_targets.append(target)
            
            if not all_features:
                logger.error("No valid features found")
                return None, None
            
            # Convert to DataFrame
            X = pd.DataFrame(all_features)
            y = pd.Series(all_targets)
            
            # Store feature names
            self.feature_names = list(X.columns)
            
            # Encode target if needed
            if y.dtype == 'object':
                y = self.label_encoder.fit_transform(y)
            
            logger.info(f"Prepared training data: {X.shape[0]} samples, {X.shape[1]} features")
            return X, y
            
        except Exception as e:
            logger.error(f"Error preparing training data: {str(e)}")
            return None, None
    
    def _generate_synthetic_target(self, features: Dict[str, float]) -> str:
        """Generate synthetic burnout risk target based on features"""
        # This is a simplified rule-based approach for demonstration
        # In production, this would use actual burnout labels
        
        burnout_score = 0.0
        
        # High work hours increase risk
        work_hours = features.get('avg_work_hours_per_day', 0)
        if work_hours > 10:
            burnout_score += 0.3
        elif work_hours > 8:
            burnout_score += 0.2
        
        # High meeting ratio increases risk
        meeting_ratio = features.get('meeting_ratio', 0)
        if meeting_ratio > 0.8:
            burnout_score += 0.2
        elif meeting_ratio > 0.6:
            burnout_score += 0.1
        
        # After-hours work increases risk
        after_hours = features.get('after_hours_events_ratio', 0)
        if after_hours > 0.3:
            burnout_score += 0.2
        elif after_hours > 0.1:
            burnout_score += 0.1
        
        # Weekend work increases risk
        weekend_work = features.get('weekend_work_ratio', 0)
        if weekend_work > 0.2:
            burnout_score += 0.15
        elif weekend_work > 0.1:
            burnout_score += 0.05
        
        # Negative sentiment increases risk
        negative_sentiment = features.get('negative_sentiment_ratio', 0)
        if negative_sentiment > 0.3:
            burnout_score += 0.15
        elif negative_sentiment > 0.1:
            burnout_score += 0.05
        
        # Urgent emails increase risk
        urgent_emails = features.get('urgent_email_ratio', 0)
        if urgent_emails > 0.2:
            burnout_score += 0.1
        elif urgent_emails > 0.1:
            burnout_score += 0.05
        
        # Determine risk level
        if burnout_score >= 0.6:
            return 'high_risk'
        elif burnout_score >= 0.3:
            return 'medium_risk'
        else:
            return 'low_risk'
    
    async def _train_baseline_models(
        self, 
        X_train: pd.DataFrame, 
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series
    ) -> Dict[str, Any]:
        """Train baseline models"""
        try:
            # Initialize baseline models
            self.baseline_trainer.initialize_models(self.model_configs['baseline_models'])
            
            # Train models
            results = self.baseline_trainer.train_models(X_train, y_train, X_val, y_val)
            
            return {
                'success': True,
                'models_trained': len(results),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error training baseline models: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _train_ensemble_models(
        self, 
        X_train: pd.DataFrame, 
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series
    ) -> Dict[str, Any]:
        """Train ensemble models"""
        try:
            # Initialize ensemble models
            self.ensemble_trainer.initialize_models(self.model_configs['ensemble_models'])
            
            # Train models
            results = self.ensemble_trainer.train_models(X_train, y_train, X_val, y_val)
            
            return {
                'success': True,
                'models_trained': len(results),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error training ensemble models: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _optimize_models(
        self, 
        X_train: pd.DataFrame, 
        y_train: pd.Series
    ) -> Dict[str, Any]:
        """Optimize model hyperparameters"""
        try:
            # Run optimization
            results = self.optimizer.optimize_all_models(
                X=X_train,
                y=y_train,
                n_trials_per_model=50
            )
            
            return {
                'success': True,
                'optimization_results': results,
                'summary': self.optimizer.get_optimization_summary()
            }
            
        except Exception as e:
            logger.error(f"Error in hyperparameter optimization: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _evaluate_all_models(
        self, 
        X_test: pd.DataFrame, 
        y_test: pd.Series
    ) -> Dict[str, Any]:
        """Evaluate all trained models"""
        try:
            evaluation_results = {}
            
            # Evaluate baseline models
            if self.baseline_trainer.trained_models:
                baseline_eval = {}
                for model_name in self.baseline_trainer.trained_models.keys():
                    try:
                        y_pred = self.baseline_trainer.predict(model_name, X_test)
                        y_pred_proba = self.baseline_trainer.predict_proba(model_name, X_test)
                        
                        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba)
                        baseline_eval[model_name] = metrics
                    except Exception as e:
                        logger.error(f"Error evaluating baseline model {model_name}: {str(e)}")
                        baseline_eval[model_name] = {'error': str(e)}
                
                evaluation_results['baseline_models'] = baseline_eval
            
            # Evaluate ensemble models
            if self.ensemble_trainer.trained_models:
                ensemble_eval = {}
                for model_name in self.ensemble_trainer.trained_models.keys():
                    try:
                        y_pred = self.ensemble_trainer.predict(model_name, X_test)
                        y_pred_proba = self.ensemble_trainer.predict_proba(model_name, X_test)
                        
                        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba)
                        ensemble_eval[model_name] = metrics
                    except Exception as e:
                        logger.error(f"Error evaluating ensemble model {model_name}: {str(e)}")
                        ensemble_eval[model_name] = {'error': str(e)}
                
                evaluation_results['ensemble_models'] = ensemble_eval
            
            return {
                'success': True,
                'evaluation_results': evaluation_results
            }
            
        except Exception as e:
            logger.error(f"Error evaluating models: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_metrics(
        self, 
        y_true: pd.Series, 
        y_pred: np.ndarray, 
        y_pred_proba: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """Calculate evaluation metrics"""
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_true, y_pred, average='weighted', zero_division=0)
        }
        
        # Add ROC AUC if probabilities available
        if y_pred_proba is not None:
            try:
                if len(np.unique(y_true)) == 2:
                    metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba[:, 1])
                else:
                    metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba, multi_class='ovr', average='weighted')
            except Exception as e:
                logger.warning(f"Could not calculate ROC AUC: {str(e)}")
                metrics['roc_auc'] = 0.0
        
        return metrics
    
    def _select_best_model(self, evaluation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Select the best performing model"""
        try:
            best_model = None
            best_score = -np.inf
            best_model_type = None
            
            # Check baseline models
            if 'baseline_models' in evaluation_results.get('evaluation_results', {}):
                for model_name, metrics in evaluation_results['evaluation_results']['baseline_models'].items():
                    if 'error' not in metrics:
                        f1_score = metrics.get('f1_score', 0)
                        if f1_score > best_score:
                            best_score = f1_score
                            best_model = model_name
                            best_model_type = 'baseline'
            
            # Check ensemble models
            if 'ensemble_models' in evaluation_results.get('evaluation_results', {}):
                for model_name, metrics in evaluation_results['evaluation_results']['ensemble_models'].items():
                    if 'error' not in metrics:
                        f1_score = metrics.get('f1_score', 0)
                        if f1_score > best_score:
                            best_score = f1_score
                            best_model = model_name
                            best_model_type = 'ensemble'
            
            if best_model is None:
                raise ValueError("No valid models found")
            
            # Store best model
            self.best_model_name = best_model
            if best_model_type == 'baseline':
                self.best_model = self.baseline_trainer.trained_models[best_model]
            else:
                self.best_model = self.ensemble_trainer.trained_models[best_model]
            
            return {
                'model_name': best_model,
                'model_type': best_model_type,
                'f1_score': best_score,
                'metrics': evaluation_results['evaluation_results'][f'{best_model_type}_models'][best_model]
            }
            
        except Exception as e:
            logger.error(f"Error selecting best model: {str(e)}")
            return {
                'error': str(e)
            }
    
    async def _save_training_results(
        self,
        baseline_results: Dict[str, Any],
        ensemble_results: Dict[str, Any],
        optimization_results: Dict[str, Any],
        evaluation_results: Dict[str, Any],
        best_model_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save training results and models"""
        try:
            save_results = {}
            
            # Save baseline models
            if self.baseline_trainer.trained_models:
                baseline_path = f"ml/models/baseline_models_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.joblib"
                self.baseline_trainer.save_models(baseline_path)
                save_results['baseline_models_path'] = baseline_path
            
            # Save ensemble models
            if self.ensemble_trainer.trained_models:
                ensemble_path = f"ml/models/ensemble_models_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.joblib"
                self.ensemble_trainer.save_models(ensemble_path)
                save_results['ensemble_models_path'] = ensemble_path
            
            # Save best model
            if self.best_model is not None:
                best_model_path = f"ml/models/best_model_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.joblib"
                joblib.dump({
                    'model': self.best_model,
                    'model_name': self.best_model_name,
                    'feature_names': self.feature_names,
                    'label_encoder': self.label_encoder,
                    'training_date': datetime.utcnow().isoformat(),
                    'best_model_info': best_model_info
                }, best_model_path)
                save_results['best_model_path'] = best_model_path
            
            # Save training results
            results_path = f"ml/models/training_results_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.joblib"
            joblib.dump(self.training_results, results_path)
            save_results['training_results_path'] = results_path
            
            return {
                'success': True,
                'saved_files': save_results
            }
            
        except Exception as e:
            logger.error(f"Error saving training results: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_training_summary(self) -> Dict[str, Any]:
        """Get summary of training results"""
        if not self.training_results:
            return {'error': 'No training results available'}
        
        return {
            'training_date': self.training_results.get('training_date'),
            'user_count': self.training_results.get('user_count'),
            'feature_count': self.training_results.get('feature_count'),
            'best_model': self.training_results.get('best_model'),
            'data_split': self.training_results.get('data_split'),
            'model_performance': {
                'baseline_models': len(self.training_results.get('baseline_results', {}).get('results', {})),
                'ensemble_models': len(self.training_results.get('ensemble_results', {}).get('results', {}))
            }
        }

