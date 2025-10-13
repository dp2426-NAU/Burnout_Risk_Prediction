# Feature Engineering Pipeline - Created by Balaji Koneti
"""
Complete feature engineering pipeline that processes raw data and generates ML-ready features.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import asyncio
from pathlib import Path

from .feature_engineer import FeatureEngineer
from ..data_pipeline.storage import DataStorageManager

logger = logging.getLogger(__name__)

class FeaturePipeline:
    """Complete feature engineering pipeline"""
    
    def __init__(self, storage_base_path: str = "ml/data"):
        self.feature_engineer = FeatureEngineer()
        self.storage_manager = DataStorageManager(storage_base_path)
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize the feature pipeline"""
        try:
            logger.info("Initializing Feature Pipeline...")
            self.is_initialized = True
            logger.info("Feature Pipeline initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Feature Pipeline: {str(e)}")
            raise
    
    async def process_user_features(
        self,
        user_id: str,
        lookback_days: int = 30,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Process features for a single user
        
        Args:
            user_id: User identifier
            lookback_days: Number of days to look back for features
            force_regenerate: Whether to regenerate features even if they exist
            
        Returns:
            Dictionary containing processed features and metadata
        """
        if not self.is_initialized:
            await self.initialize()
        
        try:
            logger.info(f"Processing features for user {user_id}")
            
            # Check if features already exist
            existing_features = self._get_existing_features(user_id)
            if existing_features and not force_regenerate:
                logger.info(f"Using existing features for user {user_id}")
                return existing_features
            
            # Load raw data
            calendar_data, email_data = await self._load_user_data(user_id, lookback_days)
            
            if calendar_data is None and email_data is None:
                logger.warning(f"No data found for user {user_id}")
                return self._create_empty_feature_result(user_id)
            
            # Engineer features
            features = self.feature_engineer.engineer_features(
                calendar_data=calendar_data,
                email_data=email_data,
                user_id=user_id,
                lookback_days=lookback_days
            )
            
            # Validate features
            validation_report = self.feature_engineer.validate_features(features)
            
            # Create feature result
            feature_result = {
                'user_id': user_id,
                'processing_date': datetime.utcnow().isoformat(),
                'lookback_days': lookback_days,
                'features': features,
                'validation_report': validation_report,
                'data_sources': {
                    'calendar_events': len(calendar_data) if calendar_data is not None else 0,
                    'email_messages': len(email_data) if email_data is not None else 0
                },
                'feature_categories': self.feature_engineer.get_feature_categories(),
                'feature_importance_weights': self.feature_engineer.get_feature_importance_weights()
            }
            
            # Store features
            feature_version_id = await self._store_features(feature_result)
            feature_result['feature_version_id'] = feature_version_id
            
            logger.info(f"Successfully processed {len(features)} features for user {user_id}")
            
            return feature_result
            
        except Exception as e:
            logger.error(f"Error processing features for user {user_id}: {str(e)}")
            return self._create_error_feature_result(user_id, str(e))
    
    async def process_batch_features(
        self,
        user_ids: List[str],
        lookback_days: int = 30,
        max_concurrent: int = 5,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Process features for multiple users in parallel
        
        Args:
            user_ids: List of user identifiers
            lookback_days: Number of days to look back for features
            max_concurrent: Maximum concurrent processing
            force_regenerate: Whether to regenerate features even if they exist
            
        Returns:
            Dictionary containing batch processing results
        """
        if not self.is_initialized:
            await self.initialize()
        
        try:
            logger.info(f"Processing features for {len(user_ids)} users")
            
            # Create semaphore to limit concurrent processing
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def process_user_with_semaphore(user_id: str):
                async with semaphore:
                    return await self.process_user_features(user_id, lookback_days, force_regenerate)
            
            # Process all users in parallel
            user_tasks = [
                process_user_with_semaphore(user_id)
                for user_id in user_ids
            ]
            
            user_results = await asyncio.gather(*user_tasks, return_exceptions=True)
            
            # Compile results
            batch_result = {
                'batch_processing_date': datetime.utcnow().isoformat(),
                'user_count': len(user_ids),
                'lookback_days': lookback_days,
                'user_results': {},
                'summary': {
                    'successful': 0,
                    'failed': 0,
                    'total_features_generated': 0
                }
            }
            
            for i, result in enumerate(user_results):
                user_id = user_ids[i]
                if isinstance(result, Exception):
                    batch_result['user_results'][user_id] = {
                        'success': False,
                        'error': str(result)
                    }
                    batch_result['summary']['failed'] += 1
                else:
                    batch_result['user_results'][user_id] = result
                    if 'features' in result:
                        batch_result['summary']['successful'] += 1
                        batch_result['summary']['total_features_generated'] += len(result['features'])
                    else:
                        batch_result['summary']['failed'] += 1
            
            logger.info(f"Batch feature processing completed: {batch_result['summary']['successful']}/{len(user_ids)} successful")
            
            return batch_result
            
        except Exception as e:
            logger.error(f"Error in batch feature processing: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'batch_processing_date': datetime.utcnow().isoformat()
            }
    
    async def _load_user_data(self, user_id: str, lookback_days: int) -> Tuple[Optional[pd.DataFrame], Optional[pd.DataFrame]]:
        """Load raw data for a user"""
        try:
            # Get latest data versions
            calendar_versions = self.storage_manager.list_versions(data_type='calendar', user_id=user_id)
            email_versions = self.storage_manager.list_versions(data_type='email', user_id=user_id)
            
            calendar_data = None
            email_data = None
            
            # Load calendar data
            if calendar_versions:
                latest_calendar = calendar_versions[0]
                calendar_data = self.storage_manager.load_data(latest_calendar.version_id)
                if isinstance(calendar_data, dict) and 'calendar_events' in calendar_data:
                    calendar_data = pd.DataFrame(calendar_data['calendar_events'])
                elif not isinstance(calendar_data, pd.DataFrame):
                    calendar_data = pd.DataFrame(calendar_data)
            
            # Load email data
            if email_versions:
                latest_email = email_versions[0]
                email_data = self.storage_manager.load_data(latest_email.version_id)
                if isinstance(email_data, dict) and 'email_messages' in email_data:
                    email_data = pd.DataFrame(email_data['email_messages'])
                elif not isinstance(email_data, pd.DataFrame):
                    email_data = pd.DataFrame(email_data)
            
            return calendar_data, email_data
            
        except Exception as e:
            logger.error(f"Error loading data for user {user_id}: {str(e)}")
            return None, None
    
    def _get_existing_features(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Check if features already exist for a user"""
        try:
            # Look for existing feature versions
            feature_versions = self.storage_manager.list_versions(data_type='features_engineered')
            
            # Find features for this user (this would need to be stored in metadata)
            for version in feature_versions:
                if version.user_id == user_id:
                    # Load existing features
                    existing_data = self.storage_manager.load_data(version.version_id)
                    return existing_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking existing features for user {user_id}: {str(e)}")
            return None
    
    async def _store_features(self, feature_result: Dict[str, Any]) -> str:
        """Store processed features"""
        try:
            # Convert features to DataFrame
            features_df = pd.DataFrame([feature_result['features']])
            features_df['user_id'] = feature_result['user_id']
            features_df['processing_date'] = feature_result['processing_date']
            
            # Store features
            feature_version_id = self.storage_manager.store_features(
                features=features_df,
                feature_type='engineered',
                source_version_ids=[],  # Would need to track source versions
                feature_engineering_steps=[
                    'time_series_extraction',
                    'text_analysis',
                    'aggregation',
                    'interaction_features',
                    'derived_features'
                ]
            )
            
            return feature_version_id
            
        except Exception as e:
            logger.error(f"Error storing features: {str(e)}")
            raise
    
    def _create_empty_feature_result(self, user_id: str) -> Dict[str, Any]:
        """Create empty feature result when no data is available"""
        return {
            'user_id': user_id,
            'processing_date': datetime.utcnow().isoformat(),
            'features': self.feature_engineer._get_default_features(),
            'validation_report': {
                'total_features': 0,
                'valid_features': 0,
                'invalid_features': 0,
                'missing_values': 0,
                'outliers': 0,
                'issues': ['No data available for feature extraction']
            },
            'data_sources': {
                'calendar_events': 0,
                'email_messages': 0
            },
            'feature_categories': self.feature_engineer.get_feature_categories(),
            'feature_importance_weights': self.feature_engineer.get_feature_importance_weights(),
            'status': 'no_data'
        }
    
    def _create_error_feature_result(self, user_id: str, error_message: str) -> Dict[str, Any]:
        """Create error feature result when processing fails"""
        return {
            'user_id': user_id,
            'processing_date': datetime.utcnow().isoformat(),
            'features': self.feature_engineer._get_default_features(),
            'validation_report': {
                'total_features': 0,
                'valid_features': 0,
                'invalid_features': 0,
                'missing_values': 0,
                'outliers': 0,
                'issues': [f'Feature extraction failed: {error_message}']
            },
            'data_sources': {
                'calendar_events': 0,
                'email_messages': 0
            },
            'feature_categories': self.feature_engineer.get_feature_categories(),
            'feature_importance_weights': self.feature_engineer.get_feature_importance_weights(),
            'status': 'error',
            'error': error_message
        }
    
    def get_feature_statistics(self) -> Dict[str, Any]:
        """Get statistics about processed features"""
        try:
            # Get all feature versions
            feature_versions = self.storage_manager.list_versions(data_type='features_engineered')
            
            if not feature_versions:
                return {
                    'total_feature_versions': 0,
                    'total_users_processed': 0,
                    'latest_processing_date': None,
                    'feature_categories': self.feature_engineer.get_feature_categories()
                }
            
            # Calculate statistics
            total_versions = len(feature_versions)
            unique_users = len(set(v.user_id for v in feature_versions if v.user_id))
            latest_date = max(v.created_at for v in feature_versions)
            
            return {
                'total_feature_versions': total_versions,
                'total_users_processed': unique_users,
                'latest_processing_date': latest_date.isoformat(),
                'feature_categories': self.feature_engineer.get_feature_categories(),
                'feature_importance_weights': self.feature_engineer.get_feature_importance_weights()
            }
            
        except Exception as e:
            logger.error(f"Error getting feature statistics: {str(e)}")
            return {
                'error': str(e),
                'feature_categories': self.feature_engineer.get_feature_categories()
            }
    
    async def cleanup_old_features(self, keep_days: int = 30):
        """Clean up old feature versions"""
        try:
            logger.info(f"Cleaning up feature versions older than {keep_days} days")
            
            # Use storage manager cleanup
            self.storage_manager.cleanup_old_versions(keep_days)
            
            logger.info("Feature cleanup completed successfully")
            
        except Exception as e:
            logger.error(f"Error during feature cleanup: {str(e)}")
            raise

