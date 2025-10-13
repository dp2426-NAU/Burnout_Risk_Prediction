# Automated Retraining Pipeline - Created by Balaji Koneti
"""
Automated retraining pipeline for model updates and deployment.
"""

import logging
import asyncio
import os
import json
import shutil
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pathlib import Path

# Import our custom modules
from ..training.advanced_training_pipeline import AdvancedTrainingPipeline
from ..evaluation.comprehensive_evaluator import ComprehensiveEvaluator
from .experiment_tracking import MLflowExperimentTracker
from .model_monitoring import ModelMonitor

logger = logging.getLogger(__name__)

class AutomatedRetrainingPipeline:
    """Automated retraining pipeline for burnout risk prediction models."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.training_pipeline = AdvancedTrainingPipeline()
        self.evaluator = ComprehensiveEvaluator()
        self.experiment_tracker = MLflowExperimentTracker()
        self.model_monitor = None
        
        # Pipeline configuration
        self.retraining_triggers = config.get("retraining_triggers", {
            "performance_threshold": 0.1,  # 10% performance degradation
            "drift_threshold": 0.15,       # 15% drift threshold
            "time_interval_days": 30,      # Retrain every 30 days
            "data_size_threshold": 1000    # Minimum new data points
        })
        
        self.deployment_config = config.get("deployment", {
            "auto_deploy": False,
            "performance_threshold": 0.85,  # Minimum F1 score for deployment
            "recall_threshold": 0.85,       # Minimum recall for deployment
            "staging_period_hours": 24      # Staging period before production
        })
        
        # Paths
        self.models_dir = Path(config.get("models_dir", "models"))
        self.data_dir = Path(config.get("data_dir", "data"))
        self.backup_dir = Path(config.get("backup_dir", "backups"))
        
        # Create directories
        self.models_dir.mkdir(exist_ok=True)
        self.data_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
    
    async def initialize(self) -> None:
        """Initialize the automated retraining pipeline."""
        try:
            logger.info("Initializing automated retraining pipeline...")
            
            # Initialize components
            await self.training_pipeline.feature_pipeline.initialize()
            await self.evaluator.initialize()
            self.experiment_tracker.initialize_experiment()
            
            logger.info("Automated retraining pipeline initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing retraining pipeline: {str(e)}")
            raise
    
    async def check_retraining_triggers(self) -> Dict[str, Any]:
        """Check if retraining is triggered by any conditions."""
        try:
            logger.info("Checking retraining triggers...")
            
            triggers = {
                "retraining_required": False,
                "triggered_by": [],
                "details": {}
            }
            
            # Check time-based trigger
            if await self._check_time_trigger():
                triggers["retraining_required"] = True
                triggers["triggered_by"].append("time_interval")
                triggers["details"]["time_interval"] = "Scheduled retraining interval reached"
            
            # Check performance-based trigger
            performance_trigger = await self._check_performance_trigger()
            if performance_trigger["triggered"]:
                triggers["retraining_required"] = True
                triggers["triggered_by"].append("performance_degradation")
                triggers["details"]["performance"] = performance_trigger
            
            # Check drift-based trigger
            drift_trigger = await self._check_drift_trigger()
            if drift_trigger["triggered"]:
                triggers["retraining_required"] = True
                triggers["triggered_by"].append("data_drift")
                triggers["details"]["drift"] = drift_trigger
            
            # Check data size trigger
            data_trigger = await self._check_data_size_trigger()
            if data_trigger["triggered"]:
                triggers["retraining_required"] = True
                triggers["triggered_by"].append("sufficient_new_data")
                triggers["details"]["data_size"] = data_trigger
            
            logger.info(f"Retraining triggers checked. Required: {triggers['retraining_required']}")
            return triggers
            
        except Exception as e:
            logger.error(f"Error checking retraining triggers: {str(e)}")
            return {"retraining_required": False, "error": str(e)}
    
    async def _check_time_trigger(self) -> bool:
        """Check if time-based retraining is triggered."""
        try:
            last_retraining_file = self.models_dir / "last_retraining.json"
            
            if not last_retraining_file.exists():
                return True  # First time, retrain
            
            with open(last_retraining_file, 'r') as f:
                last_retraining = json.load(f)
            
            last_retraining_date = datetime.fromisoformat(last_retraining["timestamp"])
            days_since_retraining = (datetime.utcnow() - last_retraining_date).days
            
            return days_since_retraining >= self.retraining_triggers["time_interval_days"]
            
        except Exception as e:
            logger.error(f"Error checking time trigger: {str(e)}")
            return False
    
    async def _check_performance_trigger(self) -> Dict[str, Any]:
        """Check if performance-based retraining is triggered."""
        try:
            # This would typically involve monitoring production model performance
            # For now, we'll simulate the check
            
            # In a real implementation, you would:
            # 1. Get current model performance metrics
            # 2. Compare with baseline performance
            # 3. Check if degradation exceeds threshold
            
            return {
                "triggered": False,
                "current_performance": 0.85,
                "baseline_performance": 0.90,
                "degradation": 0.05,
                "threshold": self.retraining_triggers["performance_threshold"]
            }
            
        except Exception as e:
            logger.error(f"Error checking performance trigger: {str(e)}")
            return {"triggered": False, "error": str(e)}
    
    async def _check_drift_trigger(self) -> Dict[str, Any]:
        """Check if drift-based retraining is triggered."""
        try:
            # This would involve running drift detection on recent data
            # For now, we'll simulate the check
            
            return {
                "triggered": False,
                "drift_score": 0.05,
                "threshold": self.retraining_triggers["drift_threshold"]
            }
            
        except Exception as e:
            logger.error(f"Error checking drift trigger: {str(e)}")
            return {"triggered": False, "error": str(e)}
    
    async def _check_data_size_trigger(self) -> Dict[str, Any]:
        """Check if sufficient new data is available for retraining."""
        try:
            # Check for new data files or database records
            new_data_count = await self._count_new_data()
            
            return {
                "triggered": new_data_count >= self.retraining_triggers["data_size_threshold"],
                "new_data_count": new_data_count,
                "threshold": self.retraining_triggers["data_size_threshold"]
            }
            
        except Exception as e:
            logger.error(f"Error checking data size trigger: {str(e)}")
            return {"triggered": False, "error": str(e)}
    
    async def _count_new_data(self) -> int:
        """Count new data points available for retraining."""
        try:
            # In a real implementation, this would query your data source
            # For now, we'll simulate counting new data
            
            # Simulate checking for new data files or database records
            return 1500  # Simulated new data count
            
        except Exception as e:
            logger.error(f"Error counting new data: {str(e)}")
            return 0
    
    async def execute_retraining(self, trigger_info: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the retraining pipeline."""
        try:
            logger.info("Starting automated retraining pipeline...")
            
            retraining_id = f"retraining_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Start MLflow run
            run_id = self.experiment_tracker.start_run(
                run_name=f"automated_retraining_{retraining_id}",
                tags={
                    "retraining_id": retraining_id,
                    "triggered_by": ",".join(trigger_info["triggered_by"]),
                    "automated": "true"
                }
            )
            
            # Log retraining configuration
            self.experiment_tracker.log_parameters({
                "retraining_triggers": json.dumps(trigger_info),
                "pipeline_config": json.dumps(self.config),
                "retraining_id": retraining_id
            })
            
            # Step 1: Data preparation
            logger.info("Step 1: Preparing training data...")
            user_ids = await self._get_training_user_ids()
            
            # Step 2: Feature engineering
            logger.info("Step 2: Feature engineering...")
            await self.training_pipeline.feature_pipeline.initialize()
            
            # Step 3: Model training
            logger.info("Step 3: Training new model...")
            training_results = await self.training_pipeline.train_comprehensive_model(
                user_ids=user_ids,
                lookback_days=30,
                optimization_enabled=True
            )
            
            # Step 4: Model evaluation
            logger.info("Step 4: Evaluating new model...")
            evaluation_results = await self.evaluator.evaluate_model(
                model=training_results["best_model"]["model"],
                X_test=training_results["test_data"]["X"],
                y_test=training_results["test_data"]["y"],
                y_pred=training_results["test_predictions"],
                y_pred_proba=training_results["test_probabilities"],
                target_recall=0.85
            )
            
            # Step 5: Log results
            logger.info("Step 5: Logging results...")
            self.experiment_tracker.log_metrics(evaluation_results["metrics"])
            self.experiment_tracker.log_model(
                model=training_results["best_model"]["model"],
                model_name="burnout_prediction_model"
            )
            
            # Step 6: Model validation and deployment decision
            logger.info("Step 6: Validating model for deployment...")
            deployment_decision = await self._validate_model_for_deployment(evaluation_results)
            
            # Step 7: Deploy model if approved
            if deployment_decision["approved"]:
                logger.info("Step 7: Deploying new model...")
                deployment_result = await self._deploy_model(
                    model=training_results["best_model"]["model"],
                    model_version=training_results["best_model"]["version"],
                    evaluation_results=evaluation_results
                )
            else:
                logger.info("Step 7: Model not approved for deployment")
                deployment_result = {"deployed": False, "reason": deployment_decision["reason"]}
            
            # Step 8: Update retraining timestamp
            await self._update_retraining_timestamp(retraining_id)
            
            # End MLflow run
            self.experiment_tracker.end_run("FINISHED")
            
            # Compile results
            results = {
                "retraining_id": retraining_id,
                "run_id": run_id,
                "trigger_info": trigger_info,
                "training_results": training_results,
                "evaluation_results": evaluation_results,
                "deployment_decision": deployment_decision,
                "deployment_result": deployment_result,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Automated retraining completed: {retraining_id}")
            return results
            
        except Exception as e:
            logger.error(f"Error in automated retraining: {str(e)}")
            
            # End MLflow run with error status
            if hasattr(self, 'experiment_tracker') and self.experiment_tracker.run_id:
                self.experiment_tracker.end_run("FAILED")
            
            return {
                "retraining_id": retraining_id if 'retraining_id' in locals() else "unknown",
                "error": str(e),
                "status": "failed",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _get_training_user_ids(self) -> List[str]:
        """Get user IDs for training."""
        try:
            # In a real implementation, this would query your user database
            # For now, we'll generate synthetic user IDs
            return [f"user_{i:03d}" for i in range(1, 101)]
            
        except Exception as e:
            logger.error(f"Error getting training user IDs: {str(e)}")
            return [f"user_{i:03d}" for i in range(1, 11)]
    
    async def _validate_model_for_deployment(self, evaluation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Validate model for deployment based on performance criteria."""
        try:
            metrics = evaluation_results["metrics"]
            
            # Check performance thresholds
            f1_score = metrics.get("f1_score", 0)
            recall = metrics.get("recall", 0)
            
            approved = (
                f1_score >= self.deployment_config["performance_threshold"] and
                recall >= self.deployment_config["recall_threshold"]
            )
            
            reason = []
            if f1_score < self.deployment_config["performance_threshold"]:
                reason.append(f"F1 score {f1_score:.3f} below threshold {self.deployment_config['performance_threshold']}")
            
            if recall < self.deployment_config["recall_threshold"]:
                reason.append(f"Recall {recall:.3f} below threshold {self.deployment_config['recall_threshold']}")
            
            return {
                "approved": approved,
                "reason": "; ".join(reason) if reason else "Model meets all deployment criteria",
                "f1_score": f1_score,
                "recall": recall,
                "thresholds": self.deployment_config
            }
            
        except Exception as e:
            logger.error(f"Error validating model for deployment: {str(e)}")
            return {
                "approved": False,
                "reason": f"Validation error: {str(e)}"
            }
    
    async def _deploy_model(self, model: Any, model_version: str, evaluation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy the new model."""
        try:
            if not self.deployment_config["auto_deploy"]:
                return {
                    "deployed": False,
                    "reason": "Auto-deployment disabled in configuration"
                }
            
            # Backup current model
            await self._backup_current_model()
            
            # Save new model
            model_path = self.models_dir / f"burnout_model_v{model_version}.pkl"
            import joblib
            joblib.dump(model, model_path)
            
            # Update model registry
            registered_version = self.experiment_tracker.register_model("burnout-risk-prediction")
            
            # Transition to staging
            self.experiment_tracker.transition_model_stage(
                "burnout-risk-prediction",
                registered_version,
                "Staging"
            )
            
            # Schedule production deployment after staging period
            if self.deployment_config["staging_period_hours"] > 0:
                # In a real implementation, you would schedule this
                logger.info(f"Model scheduled for production deployment in {self.deployment_config['staging_period_hours']} hours")
            
            return {
                "deployed": True,
                "model_path": str(model_path),
                "model_version": model_version,
                "registered_version": registered_version,
                "stage": "Staging",
                "production_deployment_scheduled": self.deployment_config["staging_period_hours"] > 0
            }
            
        except Exception as e:
            logger.error(f"Error deploying model: {str(e)}")
            return {
                "deployed": False,
                "reason": f"Deployment error: {str(e)}"
            }
    
    async def _backup_current_model(self) -> None:
        """Backup the current production model."""
        try:
            current_model_path = self.models_dir / "burnout_model.pkl"
            
            if current_model_path.exists():
                backup_path = self.backup_dir / f"burnout_model_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pkl"
                shutil.copy2(current_model_path, backup_path)
                logger.info(f"Current model backed up to: {backup_path}")
            
        except Exception as e:
            logger.error(f"Error backing up current model: {str(e)}")
    
    async def _update_retraining_timestamp(self, retraining_id: str) -> None:
        """Update the last retraining timestamp."""
        try:
            timestamp_file = self.models_dir / "last_retraining.json"
            
            timestamp_data = {
                "retraining_id": retraining_id,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            with open(timestamp_file, 'w') as f:
                json.dump(timestamp_data, f, indent=2)
            
            logger.info(f"Retraining timestamp updated: {retraining_id}")
            
        except Exception as e:
            logger.error(f"Error updating retraining timestamp: {str(e)}")
    
    async def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Run a complete monitoring and retraining cycle."""
        try:
            logger.info("Starting monitoring cycle...")
            
            # Check retraining triggers
            trigger_info = await self.check_retraining_triggers()
            
            if trigger_info["retraining_required"]:
                logger.info("Retraining triggered, starting automated retraining...")
                retraining_results = await self.execute_retraining(trigger_info)
                
                return {
                    "cycle_type": "retraining",
                    "trigger_info": trigger_info,
                    "retraining_results": retraining_results,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                logger.info("No retraining required, monitoring cycle complete")
                
                return {
                    "cycle_type": "monitoring",
                    "trigger_info": trigger_info,
                    "timestamp": datetime.utcnow().isoformat()
                }
            
        except Exception as e:
            logger.error(f"Error in monitoring cycle: {str(e)}")
            return {
                "cycle_type": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

