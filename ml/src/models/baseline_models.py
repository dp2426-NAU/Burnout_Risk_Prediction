# Baseline Models - Created by Balaji Koneti
"""
Baseline machine learning models for burnout risk prediction.
Includes Logistic Regression, Decision Trees, and other simple models.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
import logging

logger = logging.getLogger(__name__)

class BaselineModelFactory:
    """Factory for creating baseline models"""
    
    @staticmethod
    def create_logistic_regression(**params) -> Pipeline:
        """Create Logistic Regression model with preprocessing"""
        default_params = {
            'C': 1.0,
            'random_state': 42,
            'max_iter': 1000,
            'class_weight': 'balanced'
        }
        default_params.update(params)
        
        return Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', LogisticRegression(**default_params))
        ])
    
    @staticmethod
    def create_decision_tree(**params) -> DecisionTreeClassifier:
        """Create Decision Tree model"""
        default_params = {
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'class_weight': 'balanced'
        }
        default_params.update(params)
        
        return DecisionTreeClassifier(**default_params)
    
    @staticmethod
    def create_naive_bayes(**params) -> Pipeline:
        """Create Naive Bayes model with preprocessing"""
        default_params = {}
        default_params.update(params)
        
        return Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', GaussianNB(**default_params))
        ])
    
    @staticmethod
    def create_svm(**params) -> Pipeline:
        """Create SVM model with preprocessing"""
        default_params = {
            'C': 1.0,
            'kernel': 'rbf',
            'random_state': 42,
            'class_weight': 'balanced',
            'probability': True
        }
        default_params.update(params)
        
        return Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', SVC(**default_params))
        ])
    
    @staticmethod
    def create_knn(**params) -> Pipeline:
        """Create K-Nearest Neighbors model with preprocessing"""
        default_params = {
            'n_neighbors': 5,
            'weights': 'distance'
        }
        default_params.update(params)
        
        return Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', KNeighborsClassifier(**default_params))
        ])
    
    @staticmethod
    def create_random_forest(**params) -> RandomForestClassifier:
        """Create Random Forest model"""
        default_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'class_weight': 'balanced'
        }
        default_params.update(params)
        
        return RandomForestClassifier(**default_params)

class BaselineModelTrainer:
    """Trainer for baseline models"""
    
    def __init__(self):
        self.models = {}
        self.trained_models = {}
        self.feature_names = []
        self.label_encoder = LabelEncoder()
    
    def initialize_models(self, model_configs: Dict[str, Dict[str, Any]]):
        """Initialize models with configurations"""
        self.models = {}
        
        for model_name, config in model_configs.items():
            model_type = config.get('type', 'logistic_regression')
            params = config.get('params', {})
            
            if model_type == 'logistic_regression':
                self.models[model_name] = BaselineModelFactory.create_logistic_regression(**params)
            elif model_type == 'decision_tree':
                self.models[model_name] = BaselineModelFactory.create_decision_tree(**params)
            elif model_type == 'naive_bayes':
                self.models[model_name] = BaselineModelFactory.create_naive_bayes(**params)
            elif model_type == 'svm':
                self.models[model_name] = BaselineModelFactory.create_svm(**params)
            elif model_type == 'knn':
                self.models[model_name] = BaselineModelFactory.create_knn(**params)
            elif model_type == 'random_forest':
                self.models[model_name] = BaselineModelFactory.create_random_forest(**params)
            else:
                logger.warning(f"Unknown model type: {model_type}")
    
    def train_models(self, X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame = None, y_val: pd.Series = None) -> Dict[str, Any]:
        """Train all initialized models"""
        if not self.models:
            raise ValueError("No models initialized. Call initialize_models() first.")
        
        # Store feature names
        self.feature_names = list(X_train.columns)
        
        # Encode labels if needed
        if y_train.dtype == 'object':
            y_train_encoded = self.label_encoder.fit_transform(y_train)
            if y_val is not None:
                y_val_encoded = self.label_encoder.transform(y_val)
        else:
            y_train_encoded = y_train
            y_val_encoded = y_val if y_val is not None else None
        
        training_results = {}
        
        for model_name, model in self.models.items():
            try:
                logger.info(f"Training {model_name}...")
                
                # Train model
                model.fit(X_train, y_train_encoded)
                
                # Store trained model
                self.trained_models[model_name] = model
                
                # Evaluate on training set
                train_score = model.score(X_train, y_train_encoded)
                
                # Evaluate on validation set if available
                val_score = None
                if X_val is not None and y_val_encoded is not None:
                    val_score = model.score(X_val, y_val_encoded)
                
                training_results[model_name] = {
                    'model': model,
                    'train_score': train_score,
                    'val_score': val_score,
                    'feature_names': self.feature_names,
                    'label_classes': self.label_encoder.classes_.tolist() if hasattr(self.label_encoder, 'classes_') else None
                }
                
                logger.info(f"{model_name} trained successfully. Train score: {train_score:.4f}, Val score: {val_score:.4f if val_score else 'N/A'}")
                
            except Exception as e:
                logger.error(f"Error training {model_name}: {str(e)}")
                training_results[model_name] = {
                    'error': str(e)
                }
        
        return training_results
    
    def predict(self, model_name: str, X: pd.DataFrame) -> np.ndarray:
        """Make predictions using a trained model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        predictions = model.predict(X)
        
        # Decode labels if needed
        if hasattr(self.label_encoder, 'classes_'):
            predictions = self.label_encoder.inverse_transform(predictions)
        
        return predictions
    
    def predict_proba(self, model_name: str, X: pd.DataFrame) -> np.ndarray:
        """Get prediction probabilities using a trained model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        
        # Check if model supports predict_proba
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X)
        elif hasattr(model, 'decision_function'):
            # For SVM without probability=True, use decision function
            decision_scores = model.decision_function(X)
            # Convert to probabilities using sigmoid
            probabilities = 1 / (1 + np.exp(-decision_scores))
            probabilities = np.column_stack([1 - probabilities, probabilities])
        else:
            raise ValueError(f"Model {model_name} does not support probability predictions")
        
        return probabilities
    
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
    
    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a trained model"""
        if model_name not in self.trained_models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.trained_models.keys())}")
        
        model = self.trained_models[model_name]
        
        info = {
            'model_name': model_name,
            'model_type': type(model).__name__,
            'feature_count': len(self.feature_names),
            'feature_names': self.feature_names,
            'label_classes': self.label_encoder.classes_.tolist() if hasattr(self.label_encoder, 'classes_') else None
        }
        
        # Add model-specific parameters
        if hasattr(model, 'get_params'):
            info['parameters'] = model.get_params()
        
        # Add feature importance if available
        feature_importance = self.get_feature_importance(model_name)
        if feature_importance:
            info['feature_importance'] = feature_importance
        
        return info
    
    def get_all_model_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all trained models"""
        return {model_name: self.get_model_info(model_name) for model_name in self.trained_models.keys()}
    
    def save_models(self, save_path: str):
        """Save all trained models"""
        import joblib
        
        model_data = {
            'trained_models': self.trained_models,
            'feature_names': self.feature_names,
            'label_encoder': self.label_encoder
        }
        
        joblib.dump(model_data, save_path)
        logger.info(f"Models saved to {save_path}")
    
    def load_models(self, load_path: str):
        """Load trained models"""
        import joblib
        
        model_data = joblib.load(load_path)
        self.trained_models = model_data['trained_models']
        self.feature_names = model_data['feature_names']
        self.label_encoder = model_data['label_encoder']
        
        logger.info(f"Models loaded from {load_path}")
    
    def get_best_model(self, metric: str = 'val_score') -> Optional[str]:
        """Get the name of the best performing model"""
        if not self.trained_models:
            return None
        
        best_model = None
        best_score = -np.inf
        
        for model_name in self.trained_models.keys():
            # This would need to be stored during training
            # For now, return the first model
            return model_name
        
        return best_model

