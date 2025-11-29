// Metadata routes - Created by Harish S & Team
import { Router } from 'express';
import {
  getHealthStatus,
  getApiInfo,
  getModelInfo
} from '../../controllers/metadata.controller';

// Create router instance
const router = Router();

// Health check endpoint
router.get('/health', getHealthStatus);

// API information endpoint
router.get('/info', getApiInfo);

// Model information endpoint
router.get('/models', getModelInfo);

// Export router
export default router;
