# Real-time Prediction Pipeline - Created by Balaji Koneti
"""
Real-time prediction pipeline for streaming data processing and instant predictions.
"""

import logging
import asyncio
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
import json
import queue
import threading
from collections import deque
import time

logger = logging.getLogger(__name__)

class RealTimePredictionPipeline:
    """Real-time prediction pipeline for streaming burnout risk predictions."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        self.feature_processor = None
        self.prediction_queue = queue.Queue()
        self.data_buffer = deque(maxlen=config.get("buffer_size", 1000))
        self.prediction_cache = {}
        self.is_running = False
        self.workers = []
        
        # Configuration
        self.batch_size = config.get("batch_size", 10)
        self.prediction_interval = config.get("prediction_interval", 1.0)  # seconds
        self.cache_ttl = config.get("cache_ttl", 300)  # 5 minutes
        self.max_workers = config.get("max_workers", 4)
        
        # Callbacks
        self.prediction_callbacks: List[Callable] = []
        self.alert_callbacks: List[Callable] = []
        
        # Statistics
        self.stats = {
            "predictions_processed": 0,
            "predictions_per_second": 0,
            "average_latency_ms": 0,
            "cache_hit_rate": 0,
            "error_rate": 0
        }
    
    async def initialize(self, model, feature_processor) -> None:
        """Initialize the real-time prediction pipeline."""
        try:
            logger.info("Initializing real-time prediction pipeline...")
            
            self.model = model
            self.feature_processor = feature_processor
            
            # Start background workers
            await self._start_workers()
            
            logger.info("Real-time prediction pipeline initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing real-time pipeline: {str(e)}")
            raise
    
    async def _start_workers(self) -> None:
        """Start background worker threads."""
        try:
            # Start prediction worker
            prediction_worker = threading.Thread(
                target=self._prediction_worker,
                daemon=True
            )
            prediction_worker.start()
            self.workers.append(prediction_worker)
            
            # Start cache cleanup worker
            cache_worker = threading.Thread(
                target=self._cache_cleanup_worker,
                daemon=True
            )
            cache_worker.start()
            self.workers.append(cache_worker)
            
            # Start statistics worker
            stats_worker = threading.Thread(
                target=self._statistics_worker,
                daemon=True
            )
            stats_worker.start()
            self.workers.append(stats_worker)
            
            logger.info(f"Started {len(self.workers)} background workers")
            
        except Exception as e:
            logger.error(f"Error starting workers: {str(e)}")
            raise
    
    def _prediction_worker(self) -> None:
        """Background worker for processing predictions."""
        while self.is_running:
            try:
                # Get batch of data from queue
                batch_data = []
                start_time = time.time()
                
                # Collect batch within time window
                while len(batch_data) < self.batch_size and (time.time() - start_time) < self.prediction_interval:
                    try:
                        data = self.prediction_queue.get(timeout=0.1)
                        batch_data.append(data)
                    except queue.Empty:
                        continue
                
                if batch_data:
                    # Process batch
                    asyncio.run(self._process_batch(batch_data))
                
                time.sleep(0.01)  # Small delay to prevent busy waiting
                
            except Exception as e:
                logger.error(f"Error in prediction worker: {str(e)}")
                time.sleep(1)
    
    def _cache_cleanup_worker(self) -> None:
        """Background worker for cleaning up expired cache entries."""
        while self.is_running:
            try:
                current_time = time.time()
                expired_keys = []
                
                for key, (prediction, timestamp) in self.prediction_cache.items():
                    if current_time - timestamp > self.cache_ttl:
                        expired_keys.append(key)
                
                for key in expired_keys:
                    del self.prediction_cache[key]
                
                if expired_keys:
                    logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
                
                time.sleep(60)  # Run every minute
                
            except Exception as e:
                logger.error(f"Error in cache cleanup worker: {str(e)}")
                time.sleep(60)
    
    def _statistics_worker(self) -> None:
        """Background worker for updating statistics."""
        while self.is_running:
            try:
                # Update statistics every 10 seconds
                time.sleep(10)
                
                # Calculate cache hit rate
                total_requests = self.stats["predictions_processed"]
                cache_hits = sum(1 for _, (_, timestamp) in self.prediction_cache.items() 
                               if time.time() - timestamp < self.cache_ttl)
                
                if total_requests > 0:
                    self.stats["cache_hit_rate"] = cache_hits / total_requests
                
                logger.debug(f"Updated statistics: {self.stats}")
                
            except Exception as e:
                logger.error(f"Error in statistics worker: {str(e)}")
                time.sleep(10)
    
    async def _process_batch(self, batch_data: List[Dict[str, Any]]) -> None:
        """Process a batch of prediction requests."""
        try:
            start_time = time.time()
            
            # Extract features for batch
            features_list = []
            request_metadata = []
            
            for data in batch_data:
                try:
                    # Process features
                    features = await self.feature_processor.process_features(data)
                    features_list.append(features)
                    request_metadata.append({
                        "user_id": data.get("user_id"),
                        "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
                        "request_id": data.get("request_id")
                    })
                except Exception as e:
                    logger.error(f"Error processing features for request: {str(e)}")
                    continue
            
            if not features_list:
                return
            
            # Convert to numpy array
            X_batch = np.array(features_list)
            
            # Generate predictions
            predictions = self.model.predict(X_batch)
            prediction_probabilities = self.model.predict_proba(X_batch) if hasattr(self.model, 'predict_proba') else None
            
            # Process results
            for i, (prediction, metadata) in enumerate(zip(predictions, request_metadata)):
                try:
                    result = {
                        "user_id": metadata["user_id"],
                        "request_id": metadata["request_id"],
                        "prediction": float(prediction),
                        "risk_level": self._determine_risk_level(prediction),
                        "confidence": float(max(prediction_probabilities[i])) if prediction_probabilities is not None else 0.5,
                        "timestamp": metadata["timestamp"],
                        "processing_time_ms": (time.time() - start_time) * 1000
                    }
                    
                    # Cache result
                    cache_key = f"{metadata['user_id']}_{metadata['timestamp']}"
                    self.prediction_cache[cache_key] = (result, time.time())
                    
                    # Update statistics
                    self.stats["predictions_processed"] += 1
                    
                    # Call prediction callbacks
                    for callback in self.prediction_callbacks:
                        try:
                            await callback(result)
                        except Exception as e:
                            logger.error(f"Error in prediction callback: {str(e)}")
                    
                    # Check for alerts
                    if result["risk_level"] in ["high", "critical"]:
                        await self._trigger_alert(result)
                    
                except Exception as e:
                    logger.error(f"Error processing prediction result: {str(e)}")
                    self.stats["error_rate"] += 1
            
            # Update latency statistics
            batch_latency = (time.time() - start_time) * 1000
            self.stats["average_latency_ms"] = (
                (self.stats["average_latency_ms"] * (self.stats["predictions_processed"] - len(batch_data)) + 
                 batch_latency * len(batch_data)) / self.stats["predictions_processed"]
            )
            
        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            self.stats["error_rate"] += 1
    
    def _determine_risk_level(self, prediction: float) -> str:
        """Determine risk level from prediction score."""
        if prediction < 0.3:
            return "low"
        elif prediction < 0.6:
            return "medium"
        elif prediction < 0.8:
            return "high"
        else:
            return "critical"
    
    async def _trigger_alert(self, prediction_result: Dict[str, Any]) -> None:
        """Trigger alert for high-risk predictions."""
        try:
            alert = {
                "type": "high_risk_prediction",
                "user_id": prediction_result["user_id"],
                "risk_level": prediction_result["risk_level"],
                "confidence": prediction_result["confidence"],
                "timestamp": prediction_result["timestamp"],
                "message": f"High burnout risk detected for user {prediction_result['user_id']}"
            }
            
            # Call alert callbacks
            for callback in self.alert_callbacks:
                try:
                    await callback(alert)
                except Exception as e:
                    logger.error(f"Error in alert callback: {str(e)}")
            
            logger.warning(f"Alert triggered: {alert['message']}")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {str(e)}")
    
    async def predict(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add prediction request to the pipeline."""
        try:
            # Check cache first
            cache_key = f"{user_data['user_id']}_{user_data.get('timestamp', datetime.utcnow().isoformat())}"
            if cache_key in self.prediction_cache:
                result, timestamp = self.prediction_cache[cache_key]
                if time.time() - timestamp < self.cache_ttl:
                    logger.debug(f"Cache hit for user {user_data['user_id']}")
                    return result
            
            # Add to queue
            request_data = {
                "user_id": user_data["user_id"],
                "data": user_data,
                "timestamp": user_data.get("timestamp", datetime.utcnow().isoformat()),
                "request_id": f"req_{int(time.time() * 1000)}"
            }
            
            self.prediction_queue.put(request_data)
            
            # Wait for result (with timeout)
            timeout = 30  # seconds
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                if cache_key in self.prediction_cache:
                    result, timestamp = self.prediction_cache[cache_key]
                    if time.time() - timestamp < self.cache_ttl:
                        return result
                await asyncio.sleep(0.1)
            
            # Timeout
            raise TimeoutError("Prediction request timed out")
            
        except Exception as e:
            logger.error(f"Error in predict method: {str(e)}")
            raise
    
    async def predict_batch(self, user_data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process multiple prediction requests in batch."""
        try:
            results = []
            
            for user_data in user_data_list:
                try:
                    result = await self.predict(user_data)
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error processing batch item: {str(e)}")
                    results.append({
                        "user_id": user_data.get("user_id", "unknown"),
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in predict_batch method: {str(e)}")
            raise
    
    def add_prediction_callback(self, callback: Callable) -> None:
        """Add callback function for prediction results."""
        self.prediction_callbacks.append(callback)
    
    def add_alert_callback(self, callback: Callable) -> None:
        """Add callback function for alerts."""
        self.alert_callbacks.append(callback)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get pipeline statistics."""
        return {
            **self.stats,
            "queue_size": self.prediction_queue.qsize(),
            "cache_size": len(self.prediction_cache),
            "buffer_size": len(self.data_buffer),
            "is_running": self.is_running,
            "workers_count": len(self.workers)
        }
    
    async def start(self) -> None:
        """Start the real-time prediction pipeline."""
        try:
            logger.info("Starting real-time prediction pipeline...")
            self.is_running = True
            logger.info("Real-time prediction pipeline started")
            
        except Exception as e:
            logger.error(f"Error starting pipeline: {str(e)}")
            raise
    
    async def stop(self) -> None:
        """Stop the real-time prediction pipeline."""
        try:
            logger.info("Stopping real-time prediction pipeline...")
            self.is_running = False
            
            # Wait for workers to finish
            for worker in self.workers:
                worker.join(timeout=5)
            
            logger.info("Real-time prediction pipeline stopped")
            
        except Exception as e:
            logger.error(f"Error stopping pipeline: {str(e)}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on the pipeline."""
        try:
            health_status = {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "statistics": self.get_statistics(),
                "issues": []
            }
            
            # Check queue size
            if self.prediction_queue.qsize() > 1000:
                health_status["issues"].append("Prediction queue is too large")
                health_status["status"] = "degraded"
            
            # Check error rate
            if self.stats["error_rate"] > 0.1:  # 10% error rate
                health_status["issues"].append("High error rate detected")
                health_status["status"] = "degraded"
            
            # Check latency
            if self.stats["average_latency_ms"] > 5000:  # 5 seconds
                health_status["issues"].append("High latency detected")
                health_status["status"] = "degraded"
            
            return health_status
            
        except Exception as e:
            logger.error(f"Error in health check: {str(e)}")
            return {
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }

