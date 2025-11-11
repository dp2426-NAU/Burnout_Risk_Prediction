"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prediction_service_1 = require("../../services/prediction.service");
const user_model_1 = require("../../models/user.model");
const calendarEvent_model_1 = require("../../models/calendarEvent.model");
const emailMessage_model_1 = require("../../models/emailMessage.model");
const predictionResult_model_1 = require("../../models/predictionResult.model");
jest.mock('../../services/mlApiClient.service', () => ({
    mlApiClient: {
        predictBurnoutRisk: jest.fn(),
    },
}));
describe('Prediction Service', () => {
    let testUser;
    let testUserId;
    beforeEach(async () => {
        await user_model_1.User.deleteMany({});
        await calendarEvent_model_1.CalendarEvent.deleteMany({});
        await emailMessage_model_1.EmailMessage.deleteMany({});
        await predictionResult_model_1.PredictionResult.deleteMany({});
        const user = new user_model_1.User({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'user',
        });
        testUser = await user.save();
        testUserId = testUser._id.toString();
    });
    describe('generatePrediction', () => {
        it('should generate prediction with calendar and email data', async () => {
            const calendarEvents = [
                new calendarEvent_model_1.CalendarEvent({
                    userId: testUserId,
                    title: 'Team Meeting',
                    startTime: new Date('2024-01-01T09:00:00Z'),
                    endTime: new Date('2024-01-01T10:00:00Z'),
                    eventType: 'meeting',
                    isVirtual: true,
                    stressLevel: 3,
                    workload: 4,
                }),
                new calendarEvent_model_1.CalendarEvent({
                    userId: testUserId,
                    title: 'Focus Time',
                    startTime: new Date('2024-01-01T14:00:00Z'),
                    endTime: new Date('2024-01-01T16:00:00Z'),
                    eventType: 'focus_time',
                    isVirtual: false,
                    stressLevel: 2,
                    workload: 3,
                }),
            ];
            await calendarEvent_model_1.CalendarEvent.insertMany(calendarEvents);
            const emailMessages = [
                new emailMessage_model_1.EmailMessage({
                    userId: testUserId,
                    sender: 'test@example.com',
                    recipients: ['colleague@example.com'],
                    subject: 'Project Update',
                    body: 'Here is the latest project update. Everything is going well.',
                    timestamp: new Date('2024-01-01T10:00:00Z'),
                    isSent: true,
                    isUrgent: false,
                    wordCount: 15,
                    sentimentScore: 0.2,
                }),
            ];
            await emailMessage_model_1.EmailMessage.insertMany(emailMessages);
            const { mlApiClient } = require('../../services/mlApiClient.service');
            mlApiClient.predictBurnoutRisk.mockResolvedValue({
                riskLevel: 'medium',
                riskScore: 0.65,
                confidence: 0.85,
                probabilities: {
                    low: 0.2,
                    medium: 0.5,
                    high: 0.2,
                    critical: 0.1,
                },
                features: {},
            });
            const request = {
                userId: testUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                additionalData: {
                    sleepQuality: 7,
                    exerciseFrequency: 5,
                    nutritionQuality: 6,
                    socialSupport: 8,
                    jobSatisfaction: 7,
                },
            };
            const result = await (0, prediction_service_1.generatePrediction)(request);
            expect(result.success).toBe(true);
            expect(result.prediction).toBeDefined();
            expect(result.prediction?.userId.toString()).toBe(testUserId);
            expect(result.prediction?.riskLevel).toBe('medium');
            expect(result.prediction?.riskScore).toBe(0.65);
            expect(result.prediction?.confidence).toBe(0.85);
            expect(result.prediction?.recommendations.length).toBeGreaterThan(0);
        });
        it('should handle missing calendar and email data', async () => {
            const { mlApiClient } = require('../../services/mlApiClient.service');
            mlApiClient.predictBurnoutRisk.mockResolvedValue({
                riskLevel: 'low',
                riskScore: 0.3,
                confidence: 0.7,
                probabilities: {
                    low: 0.6,
                    medium: 0.3,
                    high: 0.05,
                    critical: 0.05,
                },
                features: {},
            });
            const request = {
                userId: testUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            };
            const result = await (0, prediction_service_1.generatePrediction)(request);
            expect(result.success).toBe(true);
            expect(result.prediction).toBeDefined();
            expect(result.prediction?.riskLevel).toBe('low');
        });
        it('should handle ML service errors gracefully', async () => {
            const { mlApiClient } = require('../../services/mlApiClient.service');
            mlApiClient.predictBurnoutRisk.mockRejectedValue(new Error('ML service unavailable'));
            const request = {
                userId: testUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            };
            const result = await (0, prediction_service_1.generatePrediction)(request);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to generate prediction');
        });
        it('should save prediction to database', async () => {
            const { mlApiClient } = require('../../services/mlApiClient.service');
            mlApiClient.predictBurnoutRisk.mockResolvedValue({
                riskLevel: 'high',
                riskScore: 0.8,
                confidence: 0.9,
                probabilities: {
                    low: 0.1,
                    medium: 0.2,
                    high: 0.5,
                    critical: 0.2,
                },
                features: {},
            });
            const request = {
                userId: testUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            };
            await (0, prediction_service_1.generatePrediction)(request);
            const savedPrediction = await predictionResult_model_1.PredictionResult.findOne({
                userId: testUserId,
            });
            expect(savedPrediction).toBeDefined();
            expect(savedPrediction?.riskLevel).toBe('high');
            expect(savedPrediction?.riskScore).toBe(0.8);
        });
        it('should override features with additional data', async () => {
            const { mlApiClient } = require('../../services/mlApiClient.service');
            mlApiClient.predictBurnoutRisk.mockResolvedValue({
                riskLevel: 'medium',
                riskScore: 0.6,
                confidence: 0.8,
                probabilities: {
                    low: 0.2,
                    medium: 0.5,
                    high: 0.2,
                    critical: 0.1,
                },
                features: {},
            });
            const request = {
                userId: testUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                additionalData: {
                    sleepQuality: 9,
                    exerciseFrequency: 8,
                    nutritionQuality: 7,
                    socialSupport: 9,
                    jobSatisfaction: 8,
                },
            };
            const result = await (0, prediction_service_1.generatePrediction)(request);
            expect(result.success).toBe(true);
            expect(result.prediction).toBeDefined();
            expect(mlApiClient.predictBurnoutRisk).toHaveBeenCalledWith(testUserId, expect.objectContaining({
                sleepQuality: 9,
                exerciseFrequency: 8,
                nutritionQuality: 7,
                socialInteraction: 9,
                workLifeBalance: 8,
            }), 'latest');
        });
    });
});
//# sourceMappingURL=prediction.service.test.js.map