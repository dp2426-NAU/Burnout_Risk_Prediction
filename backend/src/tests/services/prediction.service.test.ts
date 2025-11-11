// Prediction service tests - Created by Balaji Koneti
import { generatePrediction } from '../../services/prediction.service';
import { User } from '../../models/user.model';
import { CalendarEvent } from '../../models/calendarEvent.model';
import { EmailMessage } from '../../models/emailMessage.model';
import { PredictionResult } from '../../models/predictionResult.model';

// Mock the ML API client
jest.mock('../../services/mlApiClient.service', () => ({
  mlApiClient: {
    predictBurnoutRisk: jest.fn(),
  },
}));

describe('Prediction Service', () => {
  let testUser: any;
  let testUserId: string;

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await CalendarEvent.deleteMany({});
    await EmailMessage.deleteMany({});
    await PredictionResult.deleteMany({});

    // Create a test user
    const user = new User({
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
      // Create test calendar events
      const calendarEvents = [
        new CalendarEvent({
          userId: testUserId,
          title: 'Team Meeting',
          startTime: new Date('2024-01-01T09:00:00Z'),
          endTime: new Date('2024-01-01T10:00:00Z'),
          eventType: 'meeting',
          isVirtual: true,
          stressLevel: 3,
          workload: 4,
        }),
        new CalendarEvent({
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
      await CalendarEvent.insertMany(calendarEvents);

      // Create test email messages
      const emailMessages = [
        new EmailMessage({
          userId: testUserId,
          sender: 'test@example.com',
          recipient: 'colleague@example.com',
          subject: 'Project Update',
          body: 'Here is the latest project update. Everything is going well.',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          isOutgoing: true,
          isImportant: false,
          wordCount: 15,
          sentimentScore: 0.2,
        }),
      ];
      await EmailMessage.insertMany(emailMessages);

      // Mock ML API response
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

      const result = await generatePrediction(request);

      expect(result.success).toBe(true);
      expect(result.prediction).toBeDefined();
      expect(result.prediction?.userId.toString()).toBe(testUserId);
      expect(result.prediction?.riskLevel).toBe('medium');
      expect(result.prediction?.riskScore).toBe(0.65);
      expect(result.prediction?.confidence).toBe(0.85);
      expect(result.prediction?.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing calendar and email data', async () => {
      // Mock ML API response for user with no data
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

      const result = await generatePrediction(request);

      expect(result.success).toBe(true);
      expect(result.prediction).toBeDefined();
      expect(result.prediction?.riskLevel).toBe('low');
    });

    it('should handle ML service errors gracefully', async () => {
      // Mock ML API error
      const { mlApiClient } = require('../../services/mlApiClient.service');
      mlApiClient.predictBurnoutRisk.mockRejectedValue(
        new Error('ML service unavailable')
      );

      const request = {
        userId: testUserId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await generatePrediction(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to generate prediction');
    });

    it('should save prediction to database', async () => {
      // Mock ML API response
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

      await generatePrediction(request);

      // Check that prediction was saved to database
      const savedPrediction = await PredictionResult.findOne({
        userId: testUserId,
      });
      expect(savedPrediction).toBeDefined();
      expect(savedPrediction?.riskLevel).toBe('high');
      expect(savedPrediction?.riskScore).toBe(0.8);
    });

    it('should override features with additional data', async () => {
      // Mock ML API response
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

      const result = await generatePrediction(request);

      expect(result.success).toBe(true);
      expect(result.prediction).toBeDefined();

      // Verify that ML API was called with the additional data
      expect(mlApiClient.predictBurnoutRisk).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          sleepQuality: 9,
          exerciseFrequency: 8,
          nutritionQuality: 7,
          socialInteraction: 9, // socialSupport maps to socialInteraction
          workLifeBalance: 8, // jobSatisfaction maps to workLifeBalance
        }),
        'latest'
      );
    });
  });
});
