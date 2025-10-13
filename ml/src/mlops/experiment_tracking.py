# MLflow Experiment Tracking - Created by Balaji Koneti
"""
MLflow experiment tracking for model training and evaluation.
"""

import logging
import os
import mlflow
import mlflow.sklearn
import mlflow.xgboost
import mlflow.lightgbm
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class MLflowExperimentTracker:
    """MLflow experiment tracking for burnout risk prediction models."""
    
    def __init__(self, experiment_name: str = "burnout-risk-prediction"):
        self.experiment_name = experiment_name
        self.experiment_id = None
        self.run_id = None
        
        # Set MLflow tracking URI
        mlflow_tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
        mlflow.set_tracking_uri(mlflow_tracking_uri)
        
        logger.info(f"MLflow tracking URI set to: {mlflow_tracking_uri}")
    
    def initialize_experiment(self) -> str:
        """Initialize or get existing experiment."""
        try:
            # Try to get existing experiment
            experiment = mlflow.get_experiment_by_name(self.experiment_name)
            
            if experiment is None:
                # Create new experiment
                self.experiment_id = mlflow.create_experiment(
                    name=self.experiment_name,
                    tags={
                        "project": "burnout-risk-prediction",
                        "team": "ml-engineering",
                        "created_by": "Balaji Koneti"
                    }
                )
                logger.info(f"Created new experiment: {self.experiment_name} (ID: {self.experiment_id})")
            else:
                self.experiment_id = experiment.experiment_id
                logger.info(f"Using existing experiment: {self.experiment_name} (ID: {self.experiment_id})")
            
            return self.experiment_id
            
        except Exception as e:
            logger.error(f"Error initializing experiment: {str(e)}")
            raise
    
    def start_run(self, run_name: Optional[str] = None, tags: Optional[Dict[str, str]] = None) -> str:
        """Start a new MLflow run."""
        try:
            if self.experiment_id is None:
                self.initialize_experiment()
            
            # Set default tags
            default_tags = {
                "model_type": "burnout_prediction",
                "dataset": "synthetic_workplace_data",
                "created_by": "Balaji Koneti"
            }
            
            if tags:
                default_tags.update(tags)
            
            # Start run
            with mlflow.start_run(
                experiment_id=self.experiment_id,
                run_name=run_name,
                tags=default_tags
            ) as run:
                self.run_id = run.info.run_id
                logger.info(f"Started MLflow run: {run_name} (ID: {self.run_id})")
                return self.run_id
                
        except Exception as e:
            logger.error(f"Error starting MLflow run: {str(e)}")
            raise
    
    def log_parameters(self, params: Dict[str, Any]) -> None:
        """Log model parameters."""
        try:
            for key, value in params.items():
                if isinstance(value, (int, float, str, bool)):
                    mlflow.log_param(key, value)
                else:
                    mlflow.log_param(key, str(value))
            
            logger.info(f"Logged {len(params)} parameters")
            
        except Exception as e:
            logger.error(f"Error logging parameters: {str(e)}")
    
    def log_metrics(self, metrics: Dict[str, float]) -> None:
        """Log model metrics."""
        try:
            for key, value in metrics.items():
                mlflow.log_metric(key, value)
            
            logger.info(f"Logged {len(metrics)} metrics")
            
        except Exception as e:
            logger.error(f"Error logging metrics: {str(e)}")
    
    def log_model(self, model: Any, model_name: str, signature=None, input_example=None) -> None:
        """Log trained model."""
        try:
            # Determine model type and use appropriate logging function
            model_type = type(model).__name__.lower()
            
            if 'xgboost' in model_type or 'xgb' in model_type:
                mlflow.xgboost.log_model(
                    xgb_model=model,
                    artifact_path=model_name,
                    signature=signature,
                    input_example=input_example
                )
            elif 'lgbm' in model_type or 'lightgbm' in model_type:
                mlflow.lightgbm.log_model(
                    lgb_model=model,
                    artifact_path=model_name,
                    signature=signature,
                    input_example=input_example
                )
            else:
                # Default to sklearn
                mlflow.sklearn.log_model(
                    sk_model=model,
                    artifact_path=model_name,
                    signature=signature,
                    input_example=input_example
                )
            
            logger.info(f"Logged model: {model_name} ({model_type})")
            
        except Exception as e:
            logger.error(f"Error logging model: {str(e)}")
    
    def log_dataset_info(self, dataset_info: Dict[str, Any]) -> None:
        """Log dataset information."""
        try:
            # Log dataset metadata
            mlflow.log_params({
                "dataset_size": dataset_info.get("size", 0),
                "dataset_features": dataset_info.get("n_features", 0),
                "dataset_classes": dataset_info.get("n_classes", 0),
                "train_size": dataset_info.get("train_size", 0),
                "test_size": dataset_info.get("test_size", 0),
                "validation_size": dataset_info.get("validation_size", 0)
            })
            
            # Log class distribution
            if "class_distribution" in dataset_info:
                mlflow.log_params({
                    f"class_{k}_count": v for k, v in dataset_info["class_distribution"].items()
                })
            
            logger.info("Logged dataset information")
            
        except Exception as e:
            logger.error(f"Error logging dataset info: {str(e)}")
    
    def log_feature_importance(self, feature_names: List[str], importance_scores: List[float]) -> None:
        """Log feature importance scores."""
        try:
            # Create feature importance dictionary
            feature_importance = dict(zip(feature_names, importance_scores))
            
            # Log top 10 features
            sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            for i, (feature, importance) in enumerate(sorted_features[:10]):
                mlflow.log_metric(f"feature_importance_{i+1}_{feature}", importance)
            
            # Log feature importance as artifact
            importance_df = pd.DataFrame({
                'feature': feature_names,
                'importance': importance_scores
            }).sort_values('importance', ascending=False)
            
            mlflow.log_table(
                data=importance_df,
                artifact_file="feature_importance.json"
            )
            
            logger.info("Logged feature importance")
            
        except Exception as e:
            logger.error(f"Error logging feature importance: {str(e)}")
    
    def log_evaluation_plots(self, plots: Dict[str, Any]) -> None:
        """Log evaluation plots and visualizations."""
        try:
            for plot_name, plot_data in plots.items():
                if isinstance(plot_data, str) and plot_data.endswith(('.png', '.jpg', '.jpeg')):
                    # Log image file
                    mlflow.log_artifact(plot_data, "plots")
                elif hasattr(plot_data, 'savefig'):
                    # Matplotlib figure
                    plot_data.savefig(f"/tmp/{plot_name}.png")
                    mlflow.log_artifact(f"/tmp/{plot_name}.png", "plots")
                else:
                    # Log as JSON
                    mlflow.log_text(
                        json.dumps(plot_data, indent=2),
                        f"plots/{plot_name}.json"
                    )
            
            logger.info(f"Logged {len(plots)} evaluation plots")
            
        except Exception as e:
            logger.error(f"Error logging evaluation plots: {str(e)}")
    
    def log_model_metadata(self, metadata: Dict[str, Any]) -> None:
        """Log additional model metadata."""
        try:
            # Log metadata as tags
            for key, value in metadata.items():
                if isinstance(value, (str, int, float, bool)):
                    mlflow.set_tag(key, str(value))
            
            # Log detailed metadata as artifact
            mlflow.log_text(
                json.dumps(metadata, indent=2),
                "model_metadata.json"
            )
            
            logger.info("Logged model metadata")
            
        except Exception as e:
            logger.error(f"Error logging model metadata: {str(e)}")
    
    def end_run(self, status: str = "FINISHED") -> None:
        """End the current MLflow run."""
        try:
            if self.run_id:
                mlflow.end_run(status=status)
                logger.info(f"Ended MLflow run: {self.run_id} (Status: {status})")
                self.run_id = None
            else:
                logger.warning("No active run to end")
                
        except Exception as e:
            logger.error(f"Error ending MLflow run: {str(e)}")
    
    def get_best_run(self, metric_name: str = "f1_score", ascending: bool = False) -> Optional[Dict[str, Any]]:
        """Get the best run based on a metric."""
        try:
            experiment = mlflow.get_experiment_by_name(self.experiment_name)
            if not experiment:
                return None
            
            runs = mlflow.search_runs(
                experiment_ids=[experiment.experiment_id],
                order_by=[f"metrics.{metric_name} {'ASC' if ascending else 'DESC'}"]
            )
            
            if runs.empty:
                return None
            
            best_run = runs.iloc[0]
            return {
                "run_id": best_run["run_id"],
                "metric_value": best_run[f"metrics.{metric_name}"],
                "model_uri": f"runs:/{best_run['run_id']}/model"
            }
            
        except Exception as e:
            logger.error(f"Error getting best run: {str(e)}")
            return None
    
    def register_model(self, model_name: str, model_version: str = None) -> str:
        """Register model in MLflow Model Registry."""
        try:
            if not self.run_id:
                raise ValueError("No active run to register model from")
            
            model_uri = f"runs:/{self.run_id}/model"
            
            # Register model
            registered_model = mlflow.register_model(
                model_uri=model_uri,
                name=model_name
            )
            
            logger.info(f"Registered model: {model_name} (Version: {registered_model.version})")
            return registered_model.version
            
        except Exception as e:
            logger.error(f"Error registering model: {str(e)}")
            raise
    
    def transition_model_stage(self, model_name: str, version: str, stage: str) -> None:
        """Transition model to a specific stage (Staging, Production, Archived)."""
        try:
            client = mlflow.tracking.MlflowClient()
            client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage=stage
            )
            
            logger.info(f"Transitioned model {model_name} v{version} to {stage}")
            
        except Exception as e:
            logger.error(f"Error transitioning model stage: {str(e)}")
            raise

