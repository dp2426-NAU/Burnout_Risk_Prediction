# Hyperparameter Tuning - Created by Balaji Koneti
"""
Hyperparameter optimization using Optuna and other methods for burnout risk prediction models.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Callable
import logging
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

# Try to import Optuna
try:
    import optuna
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    logger.warning("Optuna not available. Install with: pip install optuna")

logger = logging.getLogger(__name__)

class HyperparameterOptimizer:
    """Hyperparameter optimization using various methods"""
    
    def __init__(self, cv_folds: int = 5, random_state: int = 42):
        self.cv_folds = cv_folds
        self.random_state = random_state
        self.optimization_results = {}
        self.best_params = {}
        self.best_scores = {}
    
    def optimize_with_optuna(
        self,
        model_factory: Callable,
        X: pd.DataFrame,
        y: pd.Series,
        param_space: Dict[str, Any],
        n_trials: int = 100,
        direction: str = 'maximize',
        metric: str = 'f1_score',
        study_name: str = 'hyperparameter_optimization'
    ) -> Dict[str, Any]:
        """
        Optimize hyperparameters using Optuna
        
        Args:
            model_factory: Function that creates model with given parameters
            X: Training features
            y: Training targets
            param_space: Parameter search space
            n_trials: Number of optimization trials
            direction: Optimization direction ('maximize' or 'minimize')
            metric: Metric to optimize
            study_name: Name for the study
            
        Returns:
            Optimization results
        """
        if not OPTUNA_AVAILABLE:
            raise ImportError("Optuna not available. Install with: pip install optuna")
        
        try:
            logger.info(f"Starting Optuna optimization with {n_trials} trials...")
            
            # Create study
            study = optuna.create_study(
                direction=direction,
                study_name=study_name,
                sampler=optuna.samplers.TPESampler(seed=self.random_state)
            )
            
            # Define objective function
            def objective(trial):
                # Sample parameters
                params = self._sample_parameters(trial, param_space)
                
                # Create model with sampled parameters
                model = model_factory(**params)
                
                # Perform cross-validation
                cv_scores = cross_val_score(
                    model, X, y,
                    cv=StratifiedKFold(n_splits=self.cv_folds, shuffle=True, random_state=self.random_state),
                    scoring=metric,
                    n_jobs=-1
                )
                
                return cv_scores.mean()
            
            # Optimize
            study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
            
            # Store results
            self.optimization_results[study_name] = {
                'best_params': study.best_params,
                'best_score': study.best_value,
                'n_trials': len(study.trials),
                'study': study
            }
            
            self.best_params[study_name] = study.best_params
            self.best_scores[study_name] = study.best_value
            
            logger.info(f"Optimization completed. Best {metric}: {study.best_value:.4f}")
            logger.info(f"Best parameters: {study.best_params}")
            
            return self.optimization_results[study_name]
            
        except Exception as e:
            logger.error(f"Error in Optuna optimization: {str(e)}")
            raise
    
    def optimize_multiple_models(
        self,
        model_configs: Dict[str, Dict[str, Any]],
        X: pd.DataFrame,
        y: pd.Series,
        n_trials_per_model: int = 50
    ) -> Dict[str, Any]:
        """
        Optimize hyperparameters for multiple models
        
        Args:
            model_configs: Dictionary with model configurations
            X: Training features
            y: Training targets
            n_trials_per_model: Number of trials per model
            
        Returns:
            Optimization results for all models
        """
        all_results = {}
        
        for model_name, config in model_configs.items():
            try:
                logger.info(f"Optimizing {model_name}...")
                
                model_factory = config['factory']
                param_space = config['param_space']
                metric = config.get('metric', 'f1_score')
                
                result = self.optimize_with_optuna(
                    model_factory=model_factory,
                    X=X,
                    y=y,
                    param_space=param_space,
                    n_trials=n_trials_per_model,
                    metric=metric,
                    study_name=model_name
                )
                
                all_results[model_name] = result
                
            except Exception as e:
                logger.error(f"Error optimizing {model_name}: {str(e)}")
                all_results[model_name] = {'error': str(e)}
        
        return all_results
    
    def _sample_parameters(self, trial, param_space: Dict[str, Any]) -> Dict[str, Any]:
        """Sample parameters from search space"""
        params = {}
        
        for param_name, param_config in param_space.items():
            param_type = param_config.get('type', 'float')
            
            if param_type == 'float':
                if 'low' in param_config and 'high' in param_config:
                    if param_config.get('log', False):
                        params[param_name] = trial.suggest_float(
                            param_name, param_config['low'], param_config['high'], log=True
                        )
                    else:
                        params[param_name] = trial.suggest_float(
                            param_name, param_config['low'], param_config['high']
                        )
                else:
                    params[param_name] = trial.suggest_float(param_name, 0.0, 1.0)
            
            elif param_type == 'int':
                if 'low' in param_config and 'high' in param_config:
                    params[param_name] = trial.suggest_int(
                        param_name, param_config['low'], param_config['high']
                    )
                else:
                    params[param_name] = trial.suggest_int(param_name, 1, 100)
            
            elif param_type == 'categorical':
                params[param_name] = trial.suggest_categorical(
                    param_name, param_config['choices']
                )
            
            elif param_type == 'uniform':
                params[param_name] = trial.suggest_uniform(
                    param_name, param_config['low'], param_config['high']
                )
            
            elif param_type == 'loguniform':
                params[param_name] = trial.suggest_loguniform(
                    param_name, param_config['low'], param_config['high']
                )
            
            else:
                logger.warning(f"Unknown parameter type: {param_type}")
                params[param_name] = param_config.get('default', None)
        
        return params
    
    def get_best_model_config(self, study_name: str) -> Optional[Dict[str, Any]]:
        """Get best model configuration from optimization results"""
        if study_name not in self.optimization_results:
            return None
        
        return {
            'best_params': self.best_params[study_name],
            'best_score': self.best_scores[study_name]
        }
    
    def compare_models(self) -> pd.DataFrame:
        """Compare optimization results across models"""
        if not self.optimization_results:
            return pd.DataFrame()
        
        comparison_data = []
        for model_name, results in self.optimization_results.items():
            if 'error' not in results:
                comparison_data.append({
                    'model': model_name,
                    'best_score': results['best_score'],
                    'n_trials': results['n_trials']
                })
        
        return pd.DataFrame(comparison_data).sort_values('best_score', ascending=False)
    
    def get_optimization_history(self, study_name: str) -> Optional[pd.DataFrame]:
        """Get optimization history for a study"""
        if study_name not in self.optimization_results:
            return None
        
        study = self.optimization_results[study_name]['study']
        
        history_data = []
        for trial in study.trials:
            history_data.append({
                'trial': trial.number,
                'value': trial.value,
                'params': trial.params,
                'state': trial.state.name
            })
        
        return pd.DataFrame(history_data)

class BurnoutModelOptimizer:
    """Specialized optimizer for burnout risk prediction models"""
    
    def __init__(self, cv_folds: int = 5, random_state: int = 42):
        self.optimizer = HyperparameterOptimizer(cv_folds, random_state)
        self.model_configs = self._get_default_model_configs()
    
    def _get_default_model_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get default model configurations for burnout prediction"""
        configs = {}
        
        # XGBoost configuration
        if OPTUNA_AVAILABLE:
            try:
                import xgboost as xgb
                configs['xgboost'] = {
                    'factory': xgb.XGBClassifier,
                    'param_space': {
                        'n_estimators': {'type': 'int', 'low': 50, 'high': 500},
                        'max_depth': {'type': 'int', 'low': 3, 'high': 10},
                        'learning_rate': {'type': 'float', 'low': 0.01, 'high': 0.3, 'log': True},
                        'subsample': {'type': 'float', 'low': 0.6, 'high': 1.0},
                        'colsample_bytree': {'type': 'float', 'low': 0.6, 'high': 1.0},
                        'reg_alpha': {'type': 'float', 'low': 0.0, 'high': 1.0, 'log': True},
                        'reg_lambda': {'type': 'float', 'low': 0.0, 'high': 1.0, 'log': True}
                    },
                    'metric': 'f1_score'
                }
            except ImportError:
                pass
        
        # LightGBM configuration
        try:
            import lightgbm as lgb
            configs['lightgbm'] = {
                'factory': lgb.LGBMClassifier,
                'param_space': {
                    'n_estimators': {'type': 'int', 'low': 50, 'high': 500},
                    'max_depth': {'type': 'int', 'low': 3, 'high': 10},
                    'learning_rate': {'type': 'float', 'low': 0.01, 'high': 0.3, 'log': True},
                    'subsample': {'type': 'float', 'low': 0.6, 'high': 1.0},
                    'colsample_bytree': {'type': 'float', 'low': 0.6, 'high': 1.0},
                    'reg_alpha': {'type': 'float', 'low': 0.0, 'high': 1.0, 'log': True},
                    'reg_lambda': {'type': 'float', 'low': 0.0, 'high': 1.0, 'log': True}
                },
                'metric': 'f1_score'
            }
        except ImportError:
            pass
        
        # Random Forest configuration
        from sklearn.ensemble import RandomForestClassifier
        configs['random_forest'] = {
            'factory': RandomForestClassifier,
            'param_space': {
                'n_estimators': {'type': 'int', 'low': 50, 'high': 300},
                'max_depth': {'type': 'int', 'low': 5, 'high': 20},
                'min_samples_split': {'type': 'int', 'low': 2, 'high': 20},
                'min_samples_leaf': {'type': 'int', 'low': 1, 'high': 10},
                'max_features': {'type': 'categorical', 'choices': ['sqrt', 'log2', None]},
                'bootstrap': {'type': 'categorical', 'choices': [True, False]}
            },
            'metric': 'f1_score'
        }
        
        # Logistic Regression configuration
        from sklearn.linear_model import LogisticRegression
        configs['logistic_regression'] = {
            'factory': LogisticRegression,
            'param_space': {
                'C': {'type': 'float', 'low': 0.001, 'high': 100, 'log': True},
                'penalty': {'type': 'categorical', 'choices': ['l1', 'l2', 'elasticnet']},
                'solver': {'type': 'categorical', 'choices': ['liblinear', 'saga']},
                'max_iter': {'type': 'int', 'low': 100, 'high': 1000}
            },
            'metric': 'f1_score'
        }
        
        return configs
    
    def optimize_all_models(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        n_trials_per_model: int = 50,
        models_to_optimize: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Optimize all available models
        
        Args:
            X: Training features
            y: Training targets
            n_trials_per_model: Number of trials per model
            models_to_optimize: List of model names to optimize (None for all)
            
        Returns:
            Optimization results for all models
        """
        if models_to_optimize is None:
            models_to_optimize = list(self.model_configs.keys())
        
        # Filter configurations
        filtered_configs = {
            name: config for name, config in self.model_configs.items()
            if name in models_to_optimize
        }
        
        return self.optimizer.optimize_multiple_models(
            filtered_configs, X, y, n_trials_per_model
        )
    
    def get_best_model(self, X: pd.DataFrame, y: pd.Series) -> Tuple[str, Any, float]:
        """
        Get the best model after optimization
        
        Returns:
            Tuple of (model_name, best_params, best_score)
        """
        if not self.optimizer.optimization_results:
            raise ValueError("No optimization results found. Run optimization first.")
        
        best_model = None
        best_score = -np.inf
        
        for model_name, results in self.optimizer.optimization_results.items():
            if 'error' not in results and results['best_score'] > best_score:
                best_score = results['best_score']
                best_model = model_name
        
        if best_model is None:
            raise ValueError("No valid optimization results found")
        
        best_params = self.optimizer.best_params[best_model]
        
        return best_model, best_params, best_score
    
    def create_optimized_model(self, model_name: str) -> Any:
        """Create model with optimized parameters"""
        if model_name not in self.optimizer.best_params:
            raise ValueError(f"No optimization results for model {model_name}")
        
        best_params = self.optimizer.best_params[model_name]
        model_factory = self.model_configs[model_name]['factory']
        
        return model_factory(**best_params)
    
    def get_optimization_summary(self) -> Dict[str, Any]:
        """Get summary of optimization results"""
        if not self.optimizer.optimization_results:
            return {'error': 'No optimization results found'}
        
        summary = {
            'total_models_optimized': len(self.optimizer.optimization_results),
            'best_model': None,
            'best_score': -np.inf,
            'model_comparison': self.optimizer.compare_models().to_dict('records'),
            'optimization_details': {}
        }
        
        for model_name, results in self.optimizer.optimization_results.items():
            if 'error' not in results:
                summary['optimization_details'][model_name] = {
                    'best_score': results['best_score'],
                    'n_trials': results['n_trials'],
                    'best_params': results['best_params']
                }
                
                if results['best_score'] > summary['best_score']:
                    summary['best_score'] = results['best_score']
                    summary['best_model'] = model_name
        
        return summary

