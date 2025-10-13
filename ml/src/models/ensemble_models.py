# Ensemble Models - Created by Balaji Koneti
"""
Advanced ensemble models for burnout risk prediction.
Includes XGBoost, LightGBM, CatBoost, and ensemble methods.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
import logging
from sklearn.ensemble import VotingClassifier, StackingClassifier, BaggingClassifier
from sklearn.model_selection import cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

# Try to import advanced models
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available. Install with: pip install xgboost")

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    logger.warning("LightGBM not available. Install with: pip install lightgbm")

try:
    import catboost as cb
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False
    logger.warning("CatBoost not available. Install with: pip install catboost")

logger = logging.getLogger(__name__)

class AdvancedModelFactory:
    """Factory for creating advanced ensemble models"""
    
    @staticmethod
    def create_xgboost(**params) -> Optional[xgb.XGBClassifier]:
        """Create XGBoost model"""
        if not XGBOOST_AVAILABLE:
            logger.error("XGBoost not available")
            return None
        
        default_params = {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'eval_metric': 'logloss',
            'use_label_encoder': False
        }
        default_params.update(params)
        
        return xgb.XGBClassifier(**default_params)
    
    @staticmethod
    def create_lightgbm(**params) -> Optional[lgb.LGBMClassifier]:
        """Create LightGBM model"""
        if not LIGHTGBM_AVAILABLE:
            logger.error("LightGBM not available")
            return None
        
        default_params = {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'verbose': -1
        }
        default_params.update(params)
        
        return lgb.LGBMClassifier(**default_params)
    
    @staticmethod
    def create_catboost(**params) -> Optional[cb.CatBoostClassifier]:
        """Create CatBoost model"""
        if not CATBOOST_AVAILABLE:
            logger.error("CatBoost not available")
            return None
        
        default_params = {
            'iterations': 100,
            'depth': 6,
            'learning_rate': 0.1,
            'random_seed': 42,
            'verbose': False
        }
        default_params.update(params)
        
        return cb.CatBoostClassifier(**default_params)
    
    @staticmethod
    def create_voting_classifier(base_models: List[Tuple[str, Any]], voting: str = 'soft') -> VotingClassifier:
        """Create voting classifier"""
        return VotingClassifier(estimators=base_models, voting=voting)
    
    @staticmethod
    def create_stacking_classifier(
        base_models: List[Tuple[str, Any]], 
        meta_model: Any = None,
        cv: int = 5
    ) -> StackingClassifier:
        """Create stacking classifier"""
        if meta_model is None:
            from sklearn.linear_model import LogisticRegression
            meta_model = LogisticRegression(random_state=42)
        
        return StackingClassifier(
            estimators=base_models,
            final_estimator=meta_model,
            cv=cv,
            stack_method='predict_proba'
        )
    
    @staticmethod
    def create_bagging_classifier(base_model: Any, **params) -> BaggingClassifier:
        """Create bagging classifier"""
        default_params = {
            'n_estimators': 10,
            'random_state': 42,
            'bootstrap': True
        }
        default_params.update(params)
        
        return BaggingClassifier(base_estimator=base_model, **default_params)

class EnsembleModelTrainer:
    """Trainer for ensemble models"""
    
    def __init__(self):
        self.models = {}
        self.trained_models = {}
        self.feature_names = []
        self.model_scores = {}
        self.cv_scores = {}
    
    def initialize_models(self, model_configs: Dict[str, Dict[str, Any]]):
        """Initialize models with configurations"""
        self.models = {}
        
        for model_name, config in model_configs.items():
            model_type = config.get('type', 'xgboost')
            params = config.get('params', {})
            
            if model_type == 'xgboost':
                model = AdvancedModelFactory.create_xgboost(**params)
                if model is not None:
                    self.models[model_name] = model
            elif model_type == 'lightgbm':
                model = AdvancedModelFactory.create_lightgbm(**params)
                if model is not None:
                    self.models[model_name] = model
            elif model_type == 'catboost':
                model = AdvancedModelFactory.create_catboost(**params)
                if model is not None:
                    self.models[model_name] = model
            elif model_type == 'voting':
                base_models = config.get('base_models', [])
                voting = config.get('voting', 'soft')
                self.models[model_name] = AdvancedModelFactory.create_voting_classifier(base_models, voting)
            elif model_type == 'stacking':
                base_models = config.get('base_models', [])
                meta_model = config.get('meta_model', None)
                cv = config.get('cv', 5)
                self.models[model_name] = AdvancedModelFactory.create_stacking_classifier(base_models, meta_model, cv)
            elif model_type == 'bagging':
                base_model = config.get('base_model')
                if base_model is not None:
                    self.models[model_name] = AdvancedModelFactory.create_bagging_classifier(base_model, **params)
            else:
                logger.warning(f"Unknown model type: {model_type}")
    
    def train_models(
        self, 
        X_train: pd.DataFrame, 
        y_train: pd.Series, 
        X_val: pd.DataFrame = None, 
        y_val: pd.Series = None,
        eval_set: List[Tuple] = None
    ) -> Dict[str, Any]:
        """Train all initialized models"""
        if not self.models:
            raise ValueError("No models initialized. Call initialize_models() first.")
        
        # Store feature names
        self.feature_names = list(X_train.columns)
        
        training_results = {}
        
        for model_name, model in self.models.items():
            try:
                logger.info(f"Training {model_name}...")
                
                # Prepare evaluation set for gradient boosting models
                model_eval_set = None
                if eval_set is not None and hasattr(model, 'fit'):
                    # Check if model supports early stopping
                    if hasattr(model, 'early_stopping_rounds'):
                        model_eval_set = eval_set
                
                # Train model
                if model_eval_set is not None:
                    model.fit(
                        X_train, y_train,
                        eval_set=model_eval_set,
                        verbose=False
                    )
                else:
                    model.fit(X_train, y_train)
                
                # Store trained model
                self.trained_models[model_name] = model
                
                # Evaluate on training set
                train_pred = model.predict(X_train)
                train_score = accuracy_score(y_train, train_pred)
                
                # Evaluate on validation set if available
                val_score = None
                if X_val is not None and y_val is not None:
                    val_pred = model.predict(X_val)
                    val_score = accuracy_score(y_val, val_pred)
                
                # Store scores
                self.model_scores[model_name] = {
                    'train_score': train_score,
                    'val_score': val_score
                }
                
                training_results[model_name] = {
                    'model': model,
                    'train_score': train_score,
                    'val_score': val_score,
                    'feature_names': self.feature_names
                }
                
                logger.info(f"{model_name} trained successfully. Train score: {train_score:.4f}, Val score: {val_score:.4f if val_score else 'N/A'}")
                
            except Exception as e:
                logger.error(f"Error training {model_name}: {str(e)}")
                training_results[model_name] = {
                    'error': str(e)
                }
        
        return training_results
    
    def cross_validate_models(
        self, 
        X: pd.DataFrame, 
        y: pd.Series, 
        cv: int = 5,
        scoring: str = 'accuracy'
    ) -> Dict[str, Any]:
        """Perform cross-validation on all models"""
        if not self.trained_models:
            raise ValueError("No trained models found. Train models first.")
        
        cv_results = {}
        
        for model_name, model in self.trained_models.items():
            try:
                logger.info(f"Cross-validating {model_name}...")
                
                scores = cross_val_score(model, X, y, cv=cv, scoring=scoring)
                
                cv_results[model_name] = {
                    'scores': scores.tolist(),
                    'mean_score': scores.mean(),
                    'std_score': scores.std(),
                    'cv_folds': cv
                }
                
                self.cv_scores[model_name] = cv_results[model_name]
                
                logger.info(f"{model_name} CV {scoring}: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
                
            except Exception as e:
                logger.error(f"Error cross-validating {model_name}: {str(e)}")
                cv_results[model_name] = {
                    'error': str(e)
                }
        
        return cv_results
    
    def evaluate_models(
        self, 
        X_test: pd.DataFrame, 
        y_test: pd.Series
    ) -> Dict[str, Dict[str, float]]:
        """Evaluate all models on test set"""
        if not self.trained_models:
            raise ValueError("No trained models found. Train models first.")
        
        evaluation_results = {}
        
        for model_name, model in self.trained_models.items():
            try:
                logger.info(f"Evaluating {model_name}...")
                
                # Make predictions
                y_pred = model.predict(X_test)
                y_pred_proba = None
                
                if hasattr(model, 'predict_proba'):
                    y_pred_proba = model.predict_proba(X_test)
                
                # Calculate metrics
                metrics = {
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
                    'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
                    'f1_score': f1_score(y_test, y_pred, average='weighted', zero_division=0)
                }
                
                # Add ROC AUC if probabilities available
                if y_pred_proba is not None and len(np.unique(y_test)) == 2:
                    metrics['roc_auc'] = roc_auc_score(y_test, y_pred_proba[:, 1])
                elif y_pred_proba is not None:
                    metrics['roc_auc'] = roc_auc_score(y_test, y_pred_proba, multi_class='ovr', average='weighted')
                
                evaluation_results[model_name] = metrics
                
                logger.info(f"{model_name} evaluation completed. F1: {metrics['f1_score']:.4f}, ROC-AUC: {metrics.get('roc_auc', 'N/A')}")
                
            except Exception as e:
                logger.error(f"Error evaluating {model_name}: {str(e)}")
                evaluation_results[model_name] = {
                    'error': str(e)
                }
        
        return evaluation_results
    
    def predict(self, model_name: str, X: pd.DataFrame) -> np.ndarray:
        """Make predictions using a trained model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        return model.predict(X)
    
    def predict_proba(self, model_name: str, X: pd.DataFrame) -> np.ndarray:
        """Get prediction probabilities using a trained model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        
        if hasattr(model, 'predict_proba'):
            return model.predict_proba(X)
        else:
            raise ValueError(f"Model {model_name} does not support probability predictions")
    
    def get_feature_importance(self, model_name: str) -> Optional[Dict[str, float]]:
        """Get feature importance for a model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        
        # Handle different model types
        if hasattr(model, 'feature_importances_'):
            # Tree-based models
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            # Linear models
            importances = np.abs(model.coef_[0]) if len(model.coef_.shape) > 1 else np.abs(model.coef_)
        else:
            logger.warning(f"Model {model_name} does not support feature importance")
            return None
        
        # Create feature importance dictionary
        feature_importance = dict(zip(self.feature_names, importances))
        
        # Sort by importance
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
        
        return feature_importance
    
    def get_best_model(self, metric: str = 'val_score') -> Optional[str]:
        """Get the name of the best performing model"""
        if not self.model_scores:
            return None
        
        best_model = None
        best_score = -np.inf
        
        for model_name, scores in self.model_scores.items():
            score = scores.get(metric, -np.inf)
            if score > best_score:
                best_score = score
                best_model = model_name
        
        return best_model
    
    def get_model_rankings(self, metric: str = 'val_score') -> List[Tuple[str, float]]:
        """Get model rankings by metric"""
        if not self.model_scores:
            return []
        
        rankings = []
        for model_name, scores in self.model_scores.items():
            score = scores.get(metric, -np.inf)
            rankings.append((model_name, score))
        
        # Sort by score (descending)
        rankings.sort(key=lambda x: x[1], reverse=True)
        
        return rankings
    
    def create_ensemble_from_best_models(
        self, 
        top_n: int = 3, 
        ensemble_type: str = 'voting',
        metric: str = 'val_score'
    ) -> Any:
        """Create ensemble from top N models"""
        rankings = self.get_model_rankings(metric)
        
        if len(rankings) < top_n:
            logger.warning(f"Only {len(rankings)} models available, using all")
            top_n = len(rankings)
        
        # Get top N models
        top_models = rankings[:top_n]
        base_models = [(name, self.trained_models[name]) for name, _ in top_models]
        
        # Create ensemble
        if ensemble_type == 'voting':
            ensemble = AdvancedModelFactory.create_voting_classifier(base_models, voting='soft')
        elif ensemble_type == 'stacking':
            ensemble = AdvancedModelFactory.create_stacking_classifier(base_models)
        else:
            raise ValueError(f"Unknown ensemble type: {ensemble_type}")
        
        return ensemble
    
    def save_models(self, save_path: str):
        """Save all trained models"""
        import joblib
        
        model_data = {
            'trained_models': self.trained_models,
            'feature_names': self.feature_names,
            'model_scores': self.model_scores,
            'cv_scores': self.cv_scores
        }
        
        joblib.dump(model_data, save_path)
        logger.info(f"Models saved to {save_path}")
    
    def load_models(self, load_path: str):
        """Load trained models"""
        import joblib
        
        model_data = joblib.load(load_path)
        self.trained_models = model_data['trained_models']
        self.feature_names = model_data['feature_names']
        self.model_scores = model_data.get('model_scores', {})
        self.cv_scores = model_data.get('cv_scores', {})
        
        logger.info(f"Models loaded from {load_path}")
    
    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a trained model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        
        info = {
            'model_name': model_name,
            'model_type': type(model).__name__,
            'feature_count': len(self.feature_names),
            'feature_names': self.feature_names
        }
        
        # Add scores
        if model_name in self.model_scores:
            info['scores'] = self.model_scores[model_name]
        
        if model_name in self.cv_scores:
            info['cv_scores'] = self.cv_scores[model_name]
        
        # Add model-specific parameters
        if hasattr(model, 'get_params'):
            info['parameters'] = model.get_params()
        
        # Add feature importance if available
        feature_importance = self.get_feature_importance(model_name)
        if feature_importance:
            info['feature_importance'] = feature_importance
        
        return info

