"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prediction_controller_1 = require("../../controllers/prediction.controller");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const router = (0, express_1.Router)();
const generatePredictionValidation = [
    (0, express_validator_1.body)('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('endDate')
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('additionalData.sleepQuality')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('Sleep quality must be between 0 and 10'),
    (0, express_validator_1.body)('additionalData.exerciseFrequency')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('Exercise frequency must be between 0 and 10'),
    (0, express_validator_1.body)('additionalData.nutritionQuality')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('Nutrition quality must be between 0 and 10'),
    (0, express_validator_1.body)('additionalData.socialSupport')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('Social support must be between 0 and 10'),
    (0, express_validator_1.body)('additionalData.jobSatisfaction')
        .optional()
        .isFloat({ min: 0, max: 10 })
        .withMessage('Job satisfaction must be between 0 and 10')
];
const historyQueryValidation = [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];
router.use(authenticate_middleware_1.authenticateRequest);
router.post('/', generatePredictionValidation, prediction_controller_1.generateNewPrediction);
router.get('/latest', prediction_controller_1.getLatestUserPrediction);
router.get('/history', historyQueryValidation, prediction_controller_1.getPredictionHistoryForUser);
router.get('/:id', prediction_controller_1.getPredictionById);
router.get('/stats/overview', prediction_controller_1.getPredictionStats);
exports.default = router;
//# sourceMappingURL=prediction.routes.js.map