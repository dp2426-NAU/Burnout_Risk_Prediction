import { Request, Response } from 'express';
import { mlApiClient } from '../services/mlApiClient.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';

export const retrainModels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const summary = await mlApiClient.triggerTabularTraining();
    logger.info('ML retraining triggered by user', { user: req.user?.email, trainedSamples: summary.trained_samples });
    res.status(202).json({
      success: true,
      message: 'Retraining started successfully',
      data: summary,
    });
  } catch (error) {
    logger.error('Error triggering ML retraining', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Retraining failed',
    });
  }
};

export const fetchEdaReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await mlApiClient.fetchEdaReport();
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error fetching EDA report from ML service', error);
    const status = error instanceof Error && (error as any).status ? (error as any).status : 500;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unable to fetch EDA report',
    });
  }
};

