// Prediction Result model for MongoDB - Created by Harish S & Team
import mongoose, { Document, Schema } from 'mongoose';

// Interface for Prediction Result document
export interface IPredictionResult extends Document {
  userId: mongoose.Types.ObjectId;
  predictionDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100 scale
  confidence: number; // 0-1 scale
  factors: {
    workload: number;
    stressLevel: number;
    workLifeBalance: number;
    socialSupport: number;
    jobSatisfaction: number;
    physicalHealth: number;
    mentalHealth: number;
    sleepQuality: number;
    exerciseFrequency: number;
    nutritionQuality: number;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
    title: string;
    description: string;
    actionItems: string[];
    resources?: string[];
  }[];
  dataPoints: {
    calendarEvents: number;
    emailMessages: number;
    surveyResponses: number;
    biometricData: number;
  };
  modelVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Prediction Result model with static methods
export interface IPredictionResultModel extends mongoose.Model<IPredictionResult> {
  findLatestByUser(userId: mongoose.Types.ObjectId): Promise<IPredictionResult | null>;
  findByRiskLevel(riskLevel: 'low' | 'medium' | 'high' | 'critical', limit?: number): Promise<IPredictionResult[]>;
  calculateRiskTrends(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any[]>;
}

// Prediction Result schema definition
const predictionResultSchema = new Schema<IPredictionResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  predictionDate: {
    type: Date,
    required: [true, 'Prediction date is required'],
    default: Date.now
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Risk level is required']
  },
  riskScore: {
    type: Number,
    required: [true, 'Risk score is required'],
    min: [0, 'Risk score cannot be less than 0'],
    max: [100, 'Risk score cannot exceed 100']
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be less than 0'],
    max: [1, 'Confidence cannot exceed 1']
  },
  factors: {
    workload: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    stressLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    workLifeBalance: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    socialSupport: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    jobSatisfaction: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    physicalHealth: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    mentalHealth: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    sleepQuality: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    exerciseFrequency: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    nutritionQuality: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    }
  },
  recommendations: [{
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    },
    category: {
      type: String,
      enum: ['workload', 'stress', 'lifestyle', 'social', 'health'],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Recommendation title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: true,
      maxlength: [1000, 'Recommendation description cannot exceed 1000 characters']
    },
    actionItems: [{
      type: String,
      maxlength: [500, 'Action item cannot exceed 500 characters']
    }],
    resources: [{
      type: String,
      maxlength: [500, 'Resource URL cannot exceed 500 characters']
    }]
  }],
  dataPoints: {
    calendarEvents: {
      type: Number,
      required: true,
      min: 0
    },
    emailMessages: {
      type: Number,
      required: true,
      min: 0
    },
    surveyResponses: {
      type: Number,
      required: true,
      min: 0
    },
    biometricData: {
      type: Number,
      required: true,
      min: 0
    }
  },
  modelVersion: {
    type: String,
    required: [true, 'Model version is required'],
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for overall health score
predictionResultSchema.virtual('overallHealthScore').get(function() {
  const healthFactors = [
    this.factors.physicalHealth,
    this.factors.mentalHealth,
    this.factors.sleepQuality,
    this.factors.exerciseFrequency,
    this.factors.nutritionQuality
  ];
  return healthFactors.reduce((sum, factor) => sum + factor, 0) / healthFactors.length;
});

// Virtual field for work satisfaction score
predictionResultSchema.virtual('workSatisfactionScore').get(function() {
  const workFactors = [
    this.factors.workload,
    this.factors.stressLevel,
    this.factors.workLifeBalance,
    this.factors.jobSatisfaction
  ];
  return workFactors.reduce((sum, factor) => sum + factor, 0) / workFactors.length;
});

// Index for user and prediction date
predictionResultSchema.index({ userId: 1, predictionDate: -1 });

// Index for risk level filtering
predictionResultSchema.index({ riskLevel: 1 });

// Index for active predictions
predictionResultSchema.index({ isActive: 1 });

// Index for model version tracking
predictionResultSchema.index({ modelVersion: 1 });

// Compound index for user risk analysis
predictionResultSchema.index({ 
  userId: 1, 
  riskLevel: 1, 
  predictionDate: -1 
});

// Static method to find latest prediction for user
predictionResultSchema.statics.findLatestByUser = function(userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId, isActive: true }).sort({ predictionDate: -1 });
};

// Static method to find predictions by risk level
predictionResultSchema.statics.findByRiskLevel = function(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  limit: number = 50
) {
  return this.find({ riskLevel, isActive: true })
    .sort({ predictionDate: -1 })
    .limit(limit);
};

// Static method to calculate risk trends
predictionResultSchema.statics.calculateRiskTrends = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        userId,
        predictionDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$predictionDate' }
        },
        avgRiskScore: { $avg: '$riskScore' },
        avgConfidence: { $avg: '$confidence' },
        riskLevels: { $push: '$riskLevel' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Create and export the PredictionResult model
export const PredictionResult = mongoose.model<IPredictionResult, IPredictionResultModel>('PredictionResult', predictionResultSchema);
