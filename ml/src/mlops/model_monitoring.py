# Model Monitoring and Drift Detection - Created by Balaji Koneti
"""
Model monitoring with drift detection for production models.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class ModelMonitor:
    """Model monitoring with drift detection capabilities."""
    
    def __init__(self, model_path: str, reference_data_path: str = None):
        self.model_path = model_path
        self.reference_data_path = reference_data_path
        self.model = None
        self.reference_data = None
        self.reference_stats = {}
        self.monitoring_history = []
        
        # Drift detection thresholds
        self.drift_thresholds = {
            "statistical_drift": 0.05,  # 5% threshold for statistical tests
            "performance_drift": 0.1,   # 10% performance degradation
            "data_drift": 0.1,          # 10% data distribution change
            "concept_drift": 0.15       # 15% concept drift threshold
        }
    
    def initialize(self) -> None:
        """Initialize the model monitor."""
        try:
            # Load model
            self.model = joblib.load(self.model_path)
            logger.info(f"Loaded model from: {self.model_path}")
            
            # Load reference data if provided
            if self.reference_data_path:
                self.reference_data = pd.read_csv(self.reference_data_path)
                self._calculate_reference_stats()
                logger.info(f"Loaded reference data from: {self.reference_data_path}")
            
            logger.info("Model monitor initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing model monitor: {str(e)}")
            raise
    
    def _calculate_reference_stats(self) -> None:
        """Calculate reference statistics for drift detection."""
        try:
            if self.reference_data is None:
                return
            
            # Calculate basic statistics
            self.reference_stats = {
                "mean": self.reference_data.mean().to_dict(),
                "std": self.reference_data.std().to_dict(),
                "min": self.reference_data.min().to_dict(),
                "max": self.reference_data.max().to_dict(),
                "median": self.reference_data.median().to_dict(),
                "skewness": self.reference_data.skew().to_dict(),
                "kurtosis": self.reference_data.kurtosis().to_dict()
            }
            
            # Calculate correlation matrix
            self.reference_stats["correlation"] = self.reference_data.corr().to_dict()
            
            # Calculate feature distributions (for categorical features)
            categorical_features = self.reference_data.select_dtypes(include=['object']).columns
            for feature in categorical_features:
                self.reference_stats[f"{feature}_distribution"] = self.reference_data[feature].value_counts(normalize=True).to_dict()
            
            logger.info("Calculated reference statistics")
            
        except Exception as e:
            logger.error(f"Error calculating reference stats: {str(e)}")
    
    def detect_statistical_drift(self, new_data: pd.DataFrame) -> Dict[str, Any]:
        """Detect statistical drift using Kolmogorov-Smirnov test."""
        try:
            drift_results = {
                "drift_detected": False,
                "drifted_features": [],
                "drift_scores": {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if self.reference_data is None:
                logger.warning("No reference data available for drift detection")
                return drift_results
            
            from scipy import stats
            
            # Test each numerical feature
            numerical_features = new_data.select_dtypes(include=[np.number]).columns
            
            for feature in numerical_features:
                if feature in self.reference_data.columns:
                    # Perform KS test
                    ks_statistic, p_value = stats.ks_2samp(
                        self.reference_data[feature].dropna(),
                        new_data[feature].dropna()
                    )
                    
                    drift_results["drift_scores"][feature] = {
                        "ks_statistic": float(ks_statistic),
                        "p_value": float(p_value),
                        "drift_detected": p_value < self.drift_thresholds["statistical_drift"]
                    }
                    
                    if p_value < self.drift_thresholds["statistical_drift"]:
                        drift_results["drifted_features"].append(feature)
                        drift_results["drift_detected"] = True
            
            logger.info(f"Statistical drift detection completed. Drift detected: {drift_results['drift_detected']}")
            return drift_results
            
        except Exception as e:
            logger.error(f"Error detecting statistical drift: {str(e)}")
            return {"drift_detected": False, "error": str(e)}
    
    def detect_data_drift(self, new_data: pd.DataFrame) -> Dict[str, Any]:
        """Detect data drift using distribution comparison."""
        try:
            drift_results = {
                "drift_detected": False,
                "drifted_features": [],
                "drift_scores": {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if not self.reference_stats:
                logger.warning("No reference statistics available for data drift detection")
                return drift_results
            
            # Compare distributions for each feature
            for feature in new_data.columns:
                if feature in self.reference_stats["mean"]:
                    # Compare mean and std
                    ref_mean = self.reference_stats["mean"][feature]
                    ref_std = self.reference_stats["std"][feature]
                    new_mean = new_data[feature].mean()
                    new_std = new_data[feature].std()
                    
                    # Calculate drift score (normalized difference)
                    mean_drift = abs(new_mean - ref_mean) / (ref_std + 1e-8)
                    std_drift = abs(new_std - ref_std) / (ref_std + 1e-8)
                    
                    drift_score = max(mean_drift, std_drift)
                    
                    drift_results["drift_scores"][feature] = {
                        "mean_drift": float(mean_drift),
                        "std_drift": float(std_drift),
                        "overall_drift": float(drift_score),
                        "drift_detected": drift_score > self.drift_thresholds["data_drift"]
                    }
                    
                    if drift_score > self.drift_thresholds["data_drift"]:
                        drift_results["drifted_features"].append(feature)
                        drift_results["drift_detected"] = True
            
            logger.info(f"Data drift detection completed. Drift detected: {drift_results['drift_detected']}")
            return drift_results
            
        except Exception as e:
            logger.error(f"Error detecting data drift: {str(e)}")
            return {"drift_detected": False, "error": str(e)}
    
    def detect_performance_drift(self, X_test: pd.DataFrame, y_test: pd.Series, 
                                reference_metrics: Dict[str, float]) -> Dict[str, Any]:
        """Detect performance drift by comparing current vs reference metrics."""
        try:
            drift_results = {
                "drift_detected": False,
                "performance_degradation": {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if self.model is None:
                logger.warning("No model available for performance drift detection")
                return drift_results
            
            # Generate predictions
            y_pred = self.model.predict(X_test)
            y_pred_proba = self.model.predict_proba(X_test) if hasattr(self.model, 'predict_proba') else None
            
            # Calculate current metrics
            current_metrics = {
                "accuracy": accuracy_score(y_test, y_pred),
                "precision": precision_score(y_test, y_pred, average='weighted', zero_division=0),
                "recall": recall_score(y_test, y_pred, average='weighted', zero_division=0),
                "f1_score": f1_score(y_test, y_pred, average='weighted', zero_division=0)
            }
            
            # Compare with reference metrics
            for metric_name, current_value in current_metrics.items():
                if metric_name in reference_metrics:
                    ref_value = reference_metrics[metric_name]
                    degradation = (ref_value - current_value) / ref_value
                    
                    drift_results["performance_degradation"][metric_name] = {
                        "reference": float(ref_value),
                        "current": float(current_value),
                        "degradation": float(degradation),
                        "drift_detected": degradation > self.drift_thresholds["performance_drift"]
                    }
                    
                    if degradation > self.drift_thresholds["performance_drift"]:
                        drift_results["drift_detected"] = True
            
            logger.info(f"Performance drift detection completed. Drift detected: {drift_results['drift_detected']}")
            return drift_results
            
        except Exception as e:
            logger.error(f"Error detecting performance drift: {str(e)}")
            return {"drift_detected": False, "error": str(e)}
    
    def detect_concept_drift(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
        """Detect concept drift using prediction confidence analysis."""
        try:
            drift_results = {
                "drift_detected": False,
                "confidence_analysis": {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if self.model is None or not hasattr(self.model, 'predict_proba'):
                logger.warning("Model does not support probability prediction for concept drift detection")
                return drift_results
            
            # Get prediction probabilities
            y_pred_proba = self.model.predict_proba(X_test)
            max_confidence = np.max(y_pred_proba, axis=1)
            
            # Analyze confidence distribution
            confidence_stats = {
                "mean_confidence": float(np.mean(max_confidence)),
                "std_confidence": float(np.std(max_confidence)),
                "min_confidence": float(np.min(max_confidence)),
                "max_confidence": float(np.max(max_confidence)),
                "low_confidence_ratio": float(np.sum(max_confidence < 0.7) / len(max_confidence))
            }
            
            drift_results["confidence_analysis"] = confidence_stats
            
            # Detect concept drift based on low confidence ratio
            if confidence_stats["low_confidence_ratio"] > self.drift_thresholds["concept_drift"]:
                drift_results["drift_detected"] = True
            
            logger.info(f"Concept drift detection completed. Drift detected: {drift_results['drift_detected']}")
            return drift_results
            
        except Exception as e:
            logger.error(f"Error detecting concept drift: {str(e)}")
            return {"drift_detected": False, "error": str(e)}
    
    def comprehensive_drift_detection(self, new_data: pd.DataFrame, X_test: pd.DataFrame = None, 
                                    y_test: pd.Series = None, reference_metrics: Dict[str, float] = None) -> Dict[str, Any]:
        """Perform comprehensive drift detection."""
        try:
            logger.info("Starting comprehensive drift detection...")
            
            results = {
                "timestamp": datetime.utcnow().isoformat(),
                "overall_drift_detected": False,
                "drift_types": {},
                "recommendations": []
            }
            
            # Statistical drift detection
            results["drift_types"]["statistical"] = self.detect_statistical_drift(new_data)
            
            # Data drift detection
            results["drift_types"]["data"] = self.detect_data_drift(new_data)
            
            # Performance drift detection (if test data provided)
            if X_test is not None and y_test is not None and reference_metrics is not None:
                results["drift_types"]["performance"] = self.detect_performance_drift(X_test, y_test, reference_metrics)
            
            # Concept drift detection (if test data provided)
            if X_test is not None and y_test is not None:
                results["drift_types"]["concept"] = self.detect_concept_drift(X_test, y_test)
            
            # Determine overall drift
            drift_detected = any(
                drift_result.get("drift_detected", False) 
                for drift_result in results["drift_types"].values()
            )
            results["overall_drift_detected"] = drift_detected
            
            # Generate recommendations
            if drift_detected:
                results["recommendations"].append("Model retraining recommended due to detected drift")
                
                if results["drift_types"].get("statistical", {}).get("drift_detected"):
                    results["recommendations"].append("Statistical drift detected - investigate data quality")
                
                if results["drift_types"].get("data", {}).get("drift_detected"):
                    results["recommendations"].append("Data drift detected - update feature preprocessing")
                
                if results["drift_types"].get("performance", {}).get("drift_detected"):
                    results["recommendations"].append("Performance drift detected - immediate retraining required")
                
                if results["drift_types"].get("concept", {}).get("drift_detected"):
                    results["recommendations"].append("Concept drift detected - consider model architecture changes")
            else:
                results["recommendations"].append("No significant drift detected - model performing well")
            
            # Store monitoring history
            self.monitoring_history.append(results)
            
            logger.info(f"Comprehensive drift detection completed. Overall drift: {drift_detected}")
            return results
            
        except Exception as e:
            logger.error(f"Error in comprehensive drift detection: {str(e)}")
            return {"overall_drift_detected": False, "error": str(e)}
    
    def get_monitoring_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get monitoring summary for the last N days."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            recent_history = [
                entry for entry in self.monitoring_history
                if datetime.fromisoformat(entry["timestamp"]) > cutoff_date
            ]
            
            if not recent_history:
                return {"message": f"No monitoring data found for the last {days} days"}
            
            # Calculate summary statistics
            drift_events = sum(1 for entry in recent_history if entry.get("overall_drift_detected", False))
            total_checks = len(recent_history)
            
            summary = {
                "period_days": days,
                "total_checks": total_checks,
                "drift_events": drift_events,
                "drift_rate": drift_events / total_checks if total_checks > 0 else 0,
                "last_check": recent_history[-1]["timestamp"],
                "recommendations": recent_history[-1].get("recommendations", [])
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting monitoring summary: {str(e)}")
            return {"error": str(e)}
    
    def save_monitoring_results(self, filepath: str) -> None:
        """Save monitoring results to file."""
        try:
            with open(filepath, 'w') as f:
                json.dump(self.monitoring_history, f, indent=2, default=str)
            
            logger.info(f"Monitoring results saved to: {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving monitoring results: {str(e)}")
    
    def load_monitoring_results(self, filepath: str) -> None:
        """Load monitoring results from file."""
        try:
            with open(filepath, 'r') as f:
                self.monitoring_history = json.load(f)
            
            logger.info(f"Monitoring results loaded from: {filepath}")
            
        except Exception as e:
            logger.error(f"Error loading monitoring results: {str(e)}")

