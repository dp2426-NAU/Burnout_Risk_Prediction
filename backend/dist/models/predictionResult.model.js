"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionResult = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const predictionResultSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
predictionResultSchema.virtual('overallHealthScore').get(function () {
    const healthFactors = [
        this.factors.physicalHealth,
        this.factors.mentalHealth,
        this.factors.sleepQuality,
        this.factors.exerciseFrequency,
        this.factors.nutritionQuality
    ];
    return healthFactors.reduce((sum, factor) => sum + factor, 0) / healthFactors.length;
});
predictionResultSchema.virtual('workSatisfactionScore').get(function () {
    const workFactors = [
        this.factors.workload,
        this.factors.stressLevel,
        this.factors.workLifeBalance,
        this.factors.jobSatisfaction
    ];
    return workFactors.reduce((sum, factor) => sum + factor, 0) / workFactors.length;
});
predictionResultSchema.index({ userId: 1, predictionDate: -1 });
predictionResultSchema.index({ riskLevel: 1 });
predictionResultSchema.index({ isActive: 1 });
predictionResultSchema.index({ modelVersion: 1 });
predictionResultSchema.index({
    userId: 1,
    riskLevel: 1,
    predictionDate: -1
});
predictionResultSchema.statics.findLatestByUser = function (userId) {
    return this.findOne({ userId, isActive: true }).sort({ predictionDate: -1 });
};
predictionResultSchema.statics.findByRiskLevel = function (riskLevel, limit = 50) {
    return this.find({ riskLevel, isActive: true })
        .sort({ predictionDate: -1 })
        .limit(limit);
};
predictionResultSchema.statics.calculateRiskTrends = function (userId, startDate, endDate) {
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
exports.PredictionResult = mongoose_1.default.model('PredictionResult', predictionResultSchema);
//# sourceMappingURL=predictionResult.model.js.map