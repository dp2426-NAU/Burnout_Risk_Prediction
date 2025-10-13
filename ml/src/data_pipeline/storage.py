# Data Storage and Versioning - Created by Balaji Koneti
"""
Data storage and versioning utilities for the ML pipeline using DVC and efficient file formats.
"""

import logging
import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
from pathlib import Path
import pickle
import gzip
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class DataVersion:
    """Data version information"""
    version_id: str
    created_at: datetime
    data_type: str
    user_id: Optional[str]
    date_range: Dict[str, str]
    record_count: int
    file_size_mb: float
    checksum: str
    metadata: Dict[str, Any]

class DataStorageManager:
    """Manages data storage, versioning, and retrieval"""
    
    def __init__(self, base_path: str = "ml/data"):
        self.base_path = Path(base_path)
        self.raw_path = self.base_path / "raw"
        self.processed_path = self.base_path / "processed"
        self.features_path = self.base_path / "features"
        self.metadata_path = self.base_path / "metadata"
        
        # Create directory structure
        self._create_directories()
        
        # Initialize version tracking
        self.version_file = self.metadata_path / "versions.json"
        self.versions = self._load_versions()
    
    def _create_directories(self):
        """Create necessary directory structure"""
        directories = [
            self.raw_path,
            self.processed_path,
            self.features_path,
            self.metadata_path,
            self.raw_path / "calendar",
            self.raw_path / "email",
            self.raw_path / "profiles",
            self.processed_path / "calendar",
            self.processed_path / "email",
            self.processed_path / "profiles",
            self.features_path / "engineered",
            self.features_path / "selected"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Created directory: {directory}")
    
    def _load_versions(self) -> Dict[str, DataVersion]:
        """Load version tracking information"""
        if self.version_file.exists():
            try:
                with open(self.version_file, 'r') as f:
                    version_data = json.load(f)
                
                versions = {}
                for version_id, data in version_data.items():
                    versions[version_id] = DataVersion(
                        version_id=data["version_id"],
                        created_at=datetime.fromisoformat(data["created_at"]),
                        data_type=data["data_type"],
                        user_id=data.get("user_id"),
                        date_range=data["date_range"],
                        record_count=data["record_count"],
                        file_size_mb=data["file_size_mb"],
                        checksum=data["checksum"],
                        metadata=data["metadata"]
                    )
                return versions
            except Exception as e:
                logger.error(f"Error loading versions: {str(e)}")
                return {}
        return {}
    
    def _save_versions(self):
        """Save version tracking information"""
        try:
            version_data = {}
            for version_id, version in self.versions.items():
                version_data[version_id] = {
                    "version_id": version.version_id,
                    "created_at": version.created_at.isoformat(),
                    "data_type": version.data_type,
                    "user_id": version.user_id,
                    "date_range": version.date_range,
                    "record_count": version.record_count,
                    "file_size_mb": version.file_size_mb,
                    "checksum": version.checksum,
                    "metadata": version.metadata
                }
            
            with open(self.version_file, 'w') as f:
                json.dump(version_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving versions: {str(e)}")
    
    def _generate_checksum(self, data: Union[Dict, List, pd.DataFrame]) -> str:
        """Generate checksum for data integrity"""
        import hashlib
        
        if isinstance(data, pd.DataFrame):
            # For DataFrames, use a combination of shape and sample of data
            data_str = f"{data.shape}_{data.head().to_string()}"
        else:
            data_str = json.dumps(data, sort_keys=True, default=str)
        
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def _get_file_size_mb(self, file_path: Path) -> float:
        """Get file size in MB"""
        if file_path.exists():
            return file_path.stat().st_size / (1024 * 1024)
        return 0.0
    
    def store_raw_data(
        self, 
        data: Dict[str, Any], 
        data_type: str, 
        user_id: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Store raw collected data with versioning
        
        Args:
            data: Raw data to store
            data_type: Type of data (calendar, email, profile)
            user_id: User identifier (optional)
            date_range: Date range for the data (optional)
            
        Returns:
            Version ID of stored data
        """
        try:
            # Generate version ID
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            version_id = f"{data_type}_{timestamp}"
            if user_id:
                version_id = f"{user_id}_{version_id}"
            
            # Determine storage path
            if data_type == "calendar":
                storage_path = self.raw_path / "calendar" / f"{version_id}.parquet"
            elif data_type == "email":
                storage_path = self.raw_path / "email" / f"{version_id}.parquet"
            elif data_type == "profile":
                storage_path = self.raw_path / "profiles" / f"{version_id}.json"
            else:
                storage_path = self.raw_path / f"{version_id}.json"
            
            # Store data
            if data_type in ["calendar", "email"] and "events" in data or "messages" in data:
                # Store as Parquet for tabular data
                if data_type == "calendar" and "calendar_events" in data:
                    df = pd.DataFrame(data["calendar_events"])
                elif data_type == "email" and "email_messages" in data:
                    df = pd.DataFrame(data["email_messages"])
                else:
                    df = pd.DataFrame(data)
                
                df.to_parquet(storage_path, compression='gzip')
                record_count = len(df)
            else:
                # Store as JSON for structured data
                with open(storage_path, 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                record_count = len(data) if isinstance(data, (list, dict)) else 1
            
            # Calculate metadata
            file_size_mb = self._get_file_size_mb(storage_path)
            checksum = self._generate_checksum(data)
            
            # Create version record
            version = DataVersion(
                version_id=version_id,
                created_at=datetime.utcnow(),
                data_type=data_type,
                user_id=user_id,
                date_range=date_range or {},
                record_count=record_count,
                file_size_mb=file_size_mb,
                checksum=checksum,
                metadata={
                    "storage_path": str(storage_path),
                    "compression": "gzip" if storage_path.suffix == ".parquet" else "none",
                    "format": "parquet" if storage_path.suffix == ".parquet" else "json"
                }
            )
            
            # Save version information
            self.versions[version_id] = version
            self._save_versions()
            
            logger.info(f"Stored raw {data_type} data: {version_id} ({record_count} records, {file_size_mb:.2f} MB)")
            return version_id
            
        except Exception as e:
            logger.error(f"Error storing raw data: {str(e)}")
            raise
    
    def store_processed_data(
        self, 
        data: Union[pd.DataFrame, Dict[str, Any]], 
        data_type: str, 
        processing_steps: List[str],
        source_version_id: str
    ) -> str:
        """
        Store processed data with lineage tracking
        
        Args:
            data: Processed data to store
            data_type: Type of data
            processing_steps: List of processing steps applied
            source_version_id: Version ID of source data
            
        Returns:
            Version ID of stored processed data
        """
        try:
            # Generate version ID
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            version_id = f"processed_{data_type}_{timestamp}"
            
            # Determine storage path
            storage_path = self.processed_path / data_type / f"{version_id}.parquet"
            
            # Store data
            if isinstance(data, pd.DataFrame):
                data.to_parquet(storage_path, compression='gzip')
                record_count = len(data)
            else:
                # Convert to DataFrame if possible
                if isinstance(data, dict) and any(isinstance(v, list) for v in data.values()):
                    # Try to convert dict with lists to DataFrame
                    df = pd.DataFrame(data)
                    df.to_parquet(storage_path, compression='gzip')
                    record_count = len(df)
                else:
                    # Store as JSON
                    storage_path = storage_path.with_suffix('.json')
                    with open(storage_path, 'w') as f:
                        json.dump(data, f, indent=2, default=str)
                    record_count = len(data) if isinstance(data, (list, dict)) else 1
            
            # Calculate metadata
            file_size_mb = self._get_file_size_mb(storage_path)
            checksum = self._generate_checksum(data)
            
            # Create version record
            version = DataVersion(
                version_id=version_id,
                created_at=datetime.utcnow(),
                data_type=f"processed_{data_type}",
                user_id=None,
                date_range={},
                record_count=record_count,
                file_size_mb=file_size_mb,
                checksum=checksum,
                metadata={
                    "storage_path": str(storage_path),
                    "source_version_id": source_version_id,
                    "processing_steps": processing_steps,
                    "compression": "gzip" if storage_path.suffix == ".parquet" else "none",
                    "format": "parquet" if storage_path.suffix == ".parquet" else "json"
                }
            )
            
            # Save version information
            self.versions[version_id] = version
            self._save_versions()
            
            logger.info(f"Stored processed {data_type} data: {version_id} ({record_count} records, {file_size_mb:.2f} MB)")
            return version_id
            
        except Exception as e:
            logger.error(f"Error storing processed data: {str(e)}")
            raise
    
    def store_features(
        self, 
        features: pd.DataFrame, 
        feature_type: str,
        source_version_ids: List[str],
        feature_engineering_steps: List[str]
    ) -> str:
        """
        Store engineered features with lineage tracking
        
        Args:
            features: Feature DataFrame
            feature_type: Type of features (engineered, selected, etc.)
            source_version_ids: List of source data version IDs
            feature_engineering_steps: List of feature engineering steps
            
        Returns:
            Version ID of stored features
        """
        try:
            # Generate version ID
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            version_id = f"features_{feature_type}_{timestamp}"
            
            # Determine storage path
            storage_path = self.features_path / feature_type / f"{version_id}.parquet"
            
            # Store features
            features.to_parquet(storage_path, compression='gzip')
            
            # Calculate metadata
            file_size_mb = self._get_file_size_mb(storage_path)
            checksum = self._generate_checksum(features)
            
            # Create version record
            version = DataVersion(
                version_id=version_id,
                created_at=datetime.utcnow(),
                data_type=f"features_{feature_type}",
                user_id=None,
                date_range={},
                record_count=len(features),
                file_size_mb=file_size_mb,
                checksum=checksum,
                metadata={
                    "storage_path": str(storage_path),
                    "source_version_ids": source_version_ids,
                    "feature_engineering_steps": feature_engineering_steps,
                    "feature_count": len(features.columns),
                    "sample_count": len(features),
                    "compression": "gzip",
                    "format": "parquet"
                }
            )
            
            # Save version information
            self.versions[version_id] = version
            self._save_versions()
            
            logger.info(f"Stored {feature_type} features: {version_id} ({len(features)} samples, {len(features.columns)} features, {file_size_mb:.2f} MB)")
            return version_id
            
        except Exception as e:
            logger.error(f"Error storing features: {str(e)}")
            raise
    
    def load_data(self, version_id: str) -> Union[pd.DataFrame, Dict[str, Any]]:
        """
        Load data by version ID
        
        Args:
            version_id: Version ID to load
            
        Returns:
            Loaded data (DataFrame or Dict)
        """
        try:
            if version_id not in self.versions:
                raise ValueError(f"Version {version_id} not found")
            
            version = self.versions[version_id]
            storage_path = Path(version.metadata["storage_path"])
            
            if not storage_path.exists():
                raise FileNotFoundError(f"Data file not found: {storage_path}")
            
            # Load data based on format
            if version.metadata["format"] == "parquet":
                data = pd.read_parquet(storage_path)
            else:
                with open(storage_path, 'r') as f:
                    data = json.load(f)
            
            # Verify checksum
            current_checksum = self._generate_checksum(data)
            if current_checksum != version.checksum:
                logger.warning(f"Checksum mismatch for version {version_id}")
            
            logger.info(f"Loaded data version {version_id}: {version.record_count} records")
            return data
            
        except Exception as e:
            logger.error(f"Error loading data version {version_id}: {str(e)}")
            raise
    
    def list_versions(
        self, 
        data_type: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[DataVersion]:
        """
        List available data versions with optional filtering
        
        Args:
            data_type: Filter by data type
            user_id: Filter by user ID
            
        Returns:
            List of matching DataVersion objects
        """
        filtered_versions = []
        
        for version in self.versions.values():
            if data_type and data_type not in version.data_type:
                continue
            if user_id and version.user_id != user_id:
                continue
            
            filtered_versions.append(version)
        
        # Sort by creation date (newest first)
        filtered_versions.sort(key=lambda v: v.created_at, reverse=True)
        
        return filtered_versions
    
    def get_data_lineage(self, version_id: str) -> Dict[str, Any]:
        """
        Get data lineage for a version
        
        Args:
            version_id: Version ID to trace
            
        Returns:
            Lineage information
        """
        if version_id not in self.versions:
            raise ValueError(f"Version {version_id} not found")
        
        version = self.versions[version_id]
        lineage = {
            "version_id": version_id,
            "data_type": version.data_type,
            "created_at": version.created_at.isoformat(),
            "record_count": version.record_count,
            "file_size_mb": version.file_size_mb,
            "metadata": version.metadata,
            "source_versions": [],
            "derived_versions": []
        }
        
        # Find source versions
        if "source_version_id" in version.metadata:
            lineage["source_versions"].append(version.metadata["source_version_id"])
        elif "source_version_ids" in version.metadata:
            lineage["source_versions"].extend(version.metadata["source_version_ids"])
        
        # Find derived versions
        for other_version_id, other_version in self.versions.items():
            if other_version_id != version_id:
                if "source_version_id" in other_version.metadata and other_version.metadata["source_version_id"] == version_id:
                    lineage["derived_versions"].append(other_version_id)
                elif "source_version_ids" in other_version.metadata and version_id in other_version.metadata["source_version_ids"]:
                    lineage["derived_versions"].append(other_version_id)
        
        return lineage
    
    def cleanup_old_versions(self, keep_days: int = 30):
        """
        Clean up old data versions to save space
        
        Args:
            keep_days: Number of days to keep versions
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=keep_days)
            versions_to_remove = []
            
            for version_id, version in self.versions.items():
                if version.created_at < cutoff_date:
                    versions_to_remove.append(version_id)
            
            for version_id in versions_to_remove:
                version = self.versions[version_id]
                storage_path = Path(version.metadata["storage_path"])
                
                # Remove file if it exists
                if storage_path.exists():
                    storage_path.unlink()
                    logger.info(f"Removed old data file: {storage_path}")
                
                # Remove version record
                del self.versions[version_id]
                logger.info(f"Removed old version: {version_id}")
            
            # Save updated versions
            self._save_versions()
            
            logger.info(f"Cleaned up {len(versions_to_remove)} old versions")
            
        except Exception as e:
            logger.error(f"Error cleaning up old versions: {str(e)}")
            raise

