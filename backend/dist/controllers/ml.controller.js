"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEdaReport = exports.retrainModels = void 0;
const mlApiClient_service_1 = require("../services/mlApiClient.service");
const logger_1 = require("../utils/logger");
const retrainModels = async (req, res) => {
    try {
        const summary = await mlApiClient_service_1.mlApiClient.triggerTabularTraining();
        logger_1.logger.info('ML retraining triggered by user', { user: req.user?.email, trainedSamples: summary.trained_samples });
        res.status(202).json({
            success: true,
            message: 'Retraining started successfully',
            data: summary,
        });
    }
    catch (error) {
        logger_1.logger.error('Error triggering ML retraining', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Retraining failed',
        });
    }
};
exports.retrainModels = retrainModels;
const fetchEdaReport = async (_req, res) => {
    try {
        const report = await mlApiClient_service_1.mlApiClient.fetchEdaReport();
        res.status(200).json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching EDA report from ML service', error);
        const status = error instanceof Error && error.status ? error.status : 500;
        res.status(status).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unable to fetch EDA report',
        });
    }
};
exports.fetchEdaReport = fetchEdaReport;
//# sourceMappingURL=ml.controller.js.map