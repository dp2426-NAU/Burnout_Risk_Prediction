# ML Service Main Application - Created by Balaji Koneti
"""
FastAPI application for the ML service component of the burnout risk prediction system.
This service handles model training, prediction, and evaluation.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
import asyncio
from datetime import datetime
import os
import sys
import redis

# Add the src directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import ML modules
from predict import PredictionService
from train import TrainingService
from evaluate import EvaluationService
from preprocess import PreprocessingService

# Import data pipeline modules
from data_pipeline.orchestrator import DataPipelineOrchestrator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app with enhanced security - Created by Balaji Koneti
app = FastAPI(
    title="Burnout Risk Prediction ML Service",
    description="Machine Learning service for burnout risk prediction in hybrid and remote teams",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json" if os.getenv("NODE_ENV") != "production" else None
)

# Add security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Enhanced CORS middleware - Created by Balaji Koneti
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com"  # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["X-Total-Count", "X-Page-Count"]
)

# Initialize services
prediction_service = PredictionService()
training_service = TrainingService()
evaluation_service = EvaluationService()
preprocessing_service = PreprocessingService()
data_pipeline = DataPipelineOrchestrator()

# Pydantic models for API requests/responses
class PredictionRequest(BaseModel):
    user_id: str
    features: Dict[str, Any]
    model_version: Optional[str] = "latest"

class PredictionResponse(BaseModel):
    prediction_id: str
    user_id: str
    risk_level: str
    risk_score: float
    confidence: float
    factors: Dict[str, Any]
    recommendations: List[str]
    model_version: str
    prediction_date: datetime

class TrainingRequest(BaseModel):
    dataset_path: str
    model_type: str = "baseline"
    hyperparameters: Optional[Dict[str, Any]] = None

class TrainingResponse(BaseModel):
    training_id: str
    status: str
    model_version: str
    metrics: Dict[str, float]
    training_date: datetime

class EvaluationRequest(BaseModel):
    model_version: str
    test_dataset_path: str

class EvaluationResponse(BaseModel):
    evaluation_id: str
    model_version: str
    metrics: Dict[str, float]
    evaluation_date: datetime

# Data pipeline request/response models
class DataCollectionRequest(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    data_types: List[str] = ["calendar", "email"]
    validate_data: bool = True

class BatchDataCollectionRequest(BaseModel):
    user_ids: List[str]
    start_date: str
    end_date: str
    data_types: List[str] = ["calendar", "email"]
    validate_data: bool = True
    max_concurrent: int = 5

class ScheduledCollectionRequest(BaseModel):
    days_back: int = 7
    user_ids: Optional[List[str]] = None

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint for the ML service."""
    return {
        "message": "Burnout Risk Prediction ML Service",
        "version": "1.0.0",
        "author": "Balaji Koneti",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "train": "/train",
            "evaluate": "/evaluate",
            "preprocess": "/preprocess",
            "models": "/models",
            "data-pipeline": "/data-pipeline",
            "docs": "/docs"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for the ML service."""
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Prediction endpoints with rate limiting - Created by Balaji Koneti
@app.post("/predict", response_model=PredictionResponse, dependencies=[RateLimiter(times=10, seconds=60)])
async def predict_burnout_risk(request: PredictionRequest):
    """Generate a burnout risk prediction for a user."""
    try:
        logger.info(f"Generating prediction for user {request.user_id}")
        
        # Validate input features
        if not request.features or len(request.features) == 0:
            raise HTTPException(status_code=400, detail="Features are required")
        
        # Generate prediction
        prediction = await prediction_service.predict(
            user_id=request.user_id,
            features=request.features,
            model_version=request.model_version
        )
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/predictions/{user_id}")
async def get_user_predictions(user_id: str, limit: int = 10):
    """Get prediction history for a user."""
    try:
        predictions = await prediction_service.get_user_predictions(user_id, limit)
        return {"predictions": predictions}
        
    except Exception as e:
        logger.error(f"Error retrieving predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve predictions: {str(e)}")

# Training endpoints
@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Train a new model with the provided dataset."""
    try:
        logger.info(f"Starting model training: {request.model_type}")
        
        # Start training in background
        training_id = await training_service.start_training(
            dataset_path=request.dataset_path,
            model_type=request.model_type,
            hyperparameters=request.hyperparameters
        )
        
        return TrainingResponse(
            training_id=training_id,
            status="started",
            model_version="pending",
            metrics={},
            training_date=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error starting training: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed to start: {str(e)}")

@app.get("/training/{training_id}")
async def get_training_status(training_id: str):
    """Get the status of a training job."""
    try:
        status = await training_service.get_training_status(training_id)
        return status
        
    except Exception as e:
        logger.error(f"Error retrieving training status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve training status: {str(e)}")

# Evaluation endpoints
@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_model(request: EvaluationRequest):
    """Evaluate a trained model."""
    try:
        logger.info(f"Evaluating model version: {request.model_version}")
        
        evaluation = await evaluation_service.evaluate(
            model_version=request.model_version,
            test_dataset_path=request.test_dataset_path
        )
        
        return evaluation
        
    except Exception as e:
        logger.error(f"Error evaluating model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

# Model management endpoints
@app.get("/models")
async def list_models():
    """List all available models."""
    try:
        models = await prediction_service.list_models()
        return {"models": models}
        
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@app.get("/models/{model_version}")
async def get_model_info(model_version: str):
    """Get information about a specific model."""
    try:
        model_info = await prediction_service.get_model_info(model_version)
        return model_info
        
    except Exception as e:
        logger.error(f"Error retrieving model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve model info: {str(e)}")

# Data preprocessing endpoints
@app.post("/preprocess")
async def preprocess_data(dataset_path: str, output_path: str):
    """Preprocess raw data for training."""
    try:
        logger.info(f"Preprocessing data from {dataset_path}")
        
        result = await preprocessing_service.preprocess(
            input_path=dataset_path,
            output_path=output_path
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error preprocessing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

# Data pipeline endpoints
@app.post("/data-pipeline/collect-user-data")
async def collect_user_data(request: DataCollectionRequest):
    """Collect data for a single user."""
    try:
        logger.info(f"Collecting data for user {request.user_id}")
        
        from datetime import datetime
        start_date = datetime.fromisoformat(request.start_date)
        end_date = datetime.fromisoformat(request.end_date)
        
        result = await data_pipeline.run_user_data_pipeline(
            user_id=request.user_id,
            start_date=start_date,
            end_date=end_date,
            validate_data=request.validate_data
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error collecting user data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data collection failed: {str(e)}")

@app.post("/data-pipeline/collect-batch-data")
async def collect_batch_data(request: BatchDataCollectionRequest):
    """Collect data for multiple users in batch."""
    try:
        logger.info(f"Collecting batch data for {len(request.user_ids)} users")
        
        from datetime import datetime
        start_date = datetime.fromisoformat(request.start_date)
        end_date = datetime.fromisoformat(request.end_date)
        
        result = await data_pipeline.run_batch_data_pipeline(
            user_ids=request.user_ids,
            start_date=start_date,
            end_date=end_date,
            max_concurrent=request.max_concurrent,
            validate_data=request.validate_data
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error collecting batch data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch data collection failed: {str(e)}")

@app.post("/data-pipeline/scheduled-collection")
async def run_scheduled_collection(request: ScheduledCollectionRequest):
    """Run scheduled data collection for recent data."""
    try:
        logger.info(f"Running scheduled collection for last {request.days_back} days")
        
        result = await data_pipeline.run_scheduled_pipeline(
            days_back=request.days_back,
            user_ids=request.user_ids
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in scheduled collection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scheduled collection failed: {str(e)}")

@app.get("/data-pipeline/status")
async def get_pipeline_status():
    """Get data pipeline status and statistics."""
    try:
        status = data_pipeline.get_pipeline_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting pipeline status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get pipeline status: {str(e)}")

@app.post("/data-pipeline/cleanup")
async def cleanup_old_data(keep_days: int = 30):
    """Clean up old data to save storage space."""
    try:
        logger.info(f"Cleaning up data older than {keep_days} days")
        
        await data_pipeline.cleanup_old_data(keep_days)
        
        return {
            "success": True,
            "message": f"Cleaned up data older than {keep_days} days",
            "keep_days": keep_days
        }
        
    except Exception as e:
        logger.error(f"Error during data cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data cleanup failed: {str(e)}")

@app.get("/data-pipeline/lineage/{version_id}")
async def get_data_lineage(version_id: str):
    """Get data lineage for a specific version."""
    try:
        lineage = data_pipeline.storage_manager.get_data_lineage(version_id)
        return lineage
        
    except Exception as e:
        logger.error(f"Error getting data lineage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get data lineage: {str(e)}")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting ML Service...")
    
    try:
        # Initialize prediction service
        await prediction_service.initialize()
        logger.info("Prediction service initialized")
        
        # Initialize training service
        await training_service.initialize()
        logger.info("Training service initialized")
        
        # Initialize evaluation service
        await evaluation_service.initialize()
        logger.info("Evaluation service initialized")
        
        # Initialize preprocessing service
        await preprocessing_service.initialize()
        logger.info("Preprocessing service initialized")
        
        # Initialize data pipeline
        await data_pipeline.initialize()
        logger.info("Data pipeline initialized")
        
        logger.info("ML Service startup completed successfully")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down ML Service...")
    
    try:
        # Cleanup services
        await prediction_service.cleanup()
        await training_service.cleanup()
        await evaluation_service.cleanup()
        await preprocessing_service.cleanup()
        # Note: data_pipeline doesn't have cleanup method yet
        
        logger.info("ML Service shutdown completed")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
