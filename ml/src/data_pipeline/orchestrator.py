# Data Pipeline Orchestrator - Created by Balaji Koneti
"""
Main orchestrator for the data collection, processing, and storage pipeline.
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from .collectors import DataCollectionService
from .validate_data import DataValidator
from .storage import DataStorageManager

logger = logging.getLogger(__name__)

class DataPipelineOrchestrator:
    """Orchestrates the complete data pipeline from collection to storage"""
    
    def __init__(self, storage_base_path: str = "ml/data"):
        self.collection_service = DataCollectionService()
        self.validator = DataValidator()
        self.storage_manager = DataStorageManager(storage_base_path)
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize all pipeline components"""
        try:
            logger.info("Initializing Data Pipeline Orchestrator...")
            
            await self.collection_service.initialize()
            
            self.is_initialized = True
            logger.info("Data Pipeline Orchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Data Pipeline Orchestrator: {str(e)}")
            raise
    
    async def run_user_data_pipeline(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime,
        validate_data: bool = True
    ) -> Dict[str, Any]:
        """
        Run complete data pipeline for a single user
        
        Args:
            user_id: User identifier
            start_date: Start date for data collection
            end_date: End date for data collection
            validate_data: Whether to validate data quality
            
        Returns:
            Pipeline execution results
        """
        if not self.is_initialized:
            await self.initialize()
        
        pipeline_start = datetime.utcnow()
        results = {
            "user_id": user_id,
            "pipeline_start": pipeline_start.isoformat(),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "steps": {},
            "success": False,
            "errors": []
        }
        
        try:
            logger.info(f"Starting data pipeline for user {user_id} from {start_date} to {end_date}")
            
            # Step 1: Data Collection
            logger.info("Step 1: Collecting data from external sources...")
            collection_start = datetime.utcnow()
            
            collected_data = await self.collection_service.collect_user_data(
                user_id, start_date, end_date
            )
            
            collection_duration = (datetime.utcnow() - collection_start).total_seconds()
            results["steps"]["data_collection"] = {
                "status": "completed",
                "duration_seconds": collection_duration,
                "records_collected": {
                    "calendar_events": len(collected_data.get("calendar_events", [])),
                    "email_messages": len(collected_data.get("email_messages", []))
                }
            }
            
            # Step 2: Data Validation
            if validate_data:
                logger.info("Step 2: Validating data quality...")
                validation_start = datetime.utcnow()
                
                validation_results = self.validator.validate_collected_data(collected_data)
                validation_report = self.validator.get_validation_report(validation_results)
                
                validation_duration = (datetime.utcnow() - validation_start).total_seconds()
                results["steps"]["data_validation"] = {
                    "status": "completed",
                    "duration_seconds": validation_duration,
                    "validation_report": validation_report
                }
                
                # Check if validation passed
                if validation_report["overall_status"] == "FAIL":
                    error_msg = f"Data validation failed for user {user_id}"
                    logger.error(error_msg)
                    results["errors"].append(error_msg)
                    results["pipeline_end"] = datetime.utcnow().isoformat()
                    return results
            
            # Step 3: Data Storage
            logger.info("Step 3: Storing collected data...")
            storage_start = datetime.utcnow()
            
            # Store calendar events
            calendar_version_id = None
            if collected_data.get("calendar_events"):
                calendar_version_id = self.storage_manager.store_raw_data(
                    data=collected_data,
                    data_type="calendar",
                    user_id=user_id,
                    date_range={
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat()
                    }
                )
            
            # Store email messages
            email_version_id = None
            if collected_data.get("email_messages"):
                email_version_id = self.storage_manager.store_raw_data(
                    data=collected_data,
                    data_type="email",
                    user_id=user_id,
                    date_range={
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat()
                    }
                )
            
            storage_duration = (datetime.utcnow() - storage_start).total_seconds()
            results["steps"]["data_storage"] = {
                "status": "completed",
                "duration_seconds": storage_duration,
                "stored_versions": {
                    "calendar": calendar_version_id,
                    "email": email_version_id
                }
            }
            
            # Pipeline completed successfully
            pipeline_end = datetime.utcnow()
            total_duration = (pipeline_end - pipeline_start).total_seconds()
            
            results.update({
                "success": True,
                "pipeline_end": pipeline_end.isoformat(),
                "total_duration_seconds": total_duration,
                "stored_versions": {
                    "calendar": calendar_version_id,
                    "email": email_version_id
                }
            })
            
            logger.info(f"Data pipeline completed successfully for user {user_id} in {total_duration:.2f} seconds")
            
        except Exception as e:
            error_msg = f"Pipeline failed for user {user_id}: {str(e)}"
            logger.error(error_msg)
            results["errors"].append(error_msg)
            results["pipeline_end"] = datetime.utcnow().isoformat()
        
        return results
    
    async def run_batch_data_pipeline(
        self, 
        user_ids: List[str], 
        start_date: datetime, 
        end_date: datetime,
        max_concurrent: int = 5,
        validate_data: bool = True
    ) -> Dict[str, Any]:
        """
        Run data pipeline for multiple users in parallel
        
        Args:
            user_ids: List of user identifiers
            start_date: Start date for data collection
            end_date: End date for data collection
            max_concurrent: Maximum concurrent pipeline executions
            validate_data: Whether to validate data quality
            
        Returns:
            Batch pipeline execution results
        """
        if not self.is_initialized:
            await self.initialize()
        
        batch_start = datetime.utcnow()
        results = {
            "batch_start": batch_start.isoformat(),
            "user_count": len(user_ids),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "user_results": {},
            "summary": {
                "successful": 0,
                "failed": 0,
                "total_duration_seconds": 0
            }
        }
        
        try:
            logger.info(f"Starting batch data pipeline for {len(user_ids)} users from {start_date} to {end_date}")
            
            # Create semaphore to limit concurrent executions
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def run_user_pipeline_with_semaphore(user_id: str):
                async with semaphore:
                    return await self.run_user_data_pipeline(
                        user_id, start_date, end_date, validate_data
                    )
            
            # Execute all user pipelines in parallel
            user_tasks = [
                run_user_pipeline_with_semaphore(user_id)
                for user_id in user_ids
            ]
            
            user_results = await asyncio.gather(*user_tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(user_results):
                user_id = user_ids[i]
                if isinstance(result, Exception):
                    results["user_results"][user_id] = {
                        "success": False,
                        "error": str(result)
                    }
                    results["summary"]["failed"] += 1
                else:
                    results["user_results"][user_id] = result
                    if result["success"]:
                        results["summary"]["successful"] += 1
                    else:
                        results["summary"]["failed"] += 1
            
            # Calculate summary
            batch_end = datetime.utcnow()
            total_duration = (batch_end - batch_start).total_seconds()
            results["summary"]["total_duration_seconds"] = total_duration
            results["batch_end"] = batch_end.isoformat()
            
            logger.info(f"Batch pipeline completed: {results['summary']['successful']}/{len(user_ids)} successful in {total_duration:.2f} seconds")
            
        except Exception as e:
            error_msg = f"Batch pipeline failed: {str(e)}"
            logger.error(error_msg)
            results["batch_error"] = error_msg
            results["batch_end"] = datetime.utcnow().isoformat()
        
        return results
    
    async def run_scheduled_pipeline(
        self, 
        days_back: int = 7,
        user_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Run scheduled data pipeline for recent data
        
        Args:
            days_back: Number of days to collect data for
            user_ids: Specific user IDs to process (None for all users)
            
        Returns:
            Scheduled pipeline results
        """
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            logger.info(f"Running scheduled pipeline for last {days_back} days")
            
            # If no specific users provided, get all users from database
            if user_ids is None:
                # In production, this would query the user database
                # For now, we'll use a mock list
                user_ids = [f"user_{i}" for i in range(1, 11)]  # Mock 10 users
            
            # Run batch pipeline
            results = await self.run_batch_data_pipeline(
                user_ids=user_ids,
                start_date=start_date,
                end_date=end_date,
                max_concurrent=3,  # Conservative for scheduled runs
                validate_data=True
            )
            
            # Add scheduling metadata
            results["scheduled_run"] = {
                "days_back": days_back,
                "trigger": "scheduled",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Scheduled pipeline failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "scheduled_run": {
                    "days_back": days_back,
                    "trigger": "scheduled",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status and statistics"""
        try:
            # Get version statistics
            all_versions = self.storage_manager.list_versions()
            
            # Group by data type
            type_counts = {}
            total_size_mb = 0
            total_records = 0
            
            for version in all_versions:
                data_type = version.data_type
                type_counts[data_type] = type_counts.get(data_type, 0) + 1
                total_size_mb += version.file_size_mb
                total_records += version.record_count
            
            # Get recent activity (last 24 hours)
            recent_cutoff = datetime.utcnow() - timedelta(hours=24)
            recent_versions = [
                v for v in all_versions 
                if v.created_at > recent_cutoff
            ]
            
            status = {
                "pipeline_status": "operational" if self.is_initialized else "not_initialized",
                "storage_statistics": {
                    "total_versions": len(all_versions),
                    "total_size_mb": round(total_size_mb, 2),
                    "total_records": total_records,
                    "versions_by_type": type_counts
                },
                "recent_activity": {
                    "last_24h_versions": len(recent_versions),
                    "last_24h_size_mb": round(sum(v.file_size_mb for v in recent_versions), 2),
                    "last_24h_records": sum(v.record_count for v in recent_versions)
                },
                "latest_versions": [
                    {
                        "version_id": v.version_id,
                        "data_type": v.data_type,
                        "created_at": v.created_at.isoformat(),
                        "record_count": v.record_count,
                        "file_size_mb": round(v.file_size_mb, 2)
                    }
                    for v in sorted(all_versions, key=lambda x: x.created_at, reverse=True)[:5]
                ]
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting pipeline status: {str(e)}")
            return {
                "pipeline_status": "error",
                "error": str(e)
            }
    
    async def cleanup_old_data(self, keep_days: int = 30):
        """Clean up old data to save storage space"""
        try:
            logger.info(f"Cleaning up data older than {keep_days} days")
            
            # Clean up old versions
            self.storage_manager.cleanup_old_versions(keep_days)
            
            logger.info("Data cleanup completed successfully")
            
        except Exception as e:
            logger.error(f"Error during data cleanup: {str(e)}")
            raise

