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
exports.EmailMessage = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const emailMessageSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    subject: {
        type: String,
        required: [true, 'Email subject is required'],
        trim: true,
        maxlength: [500, 'Email subject cannot exceed 500 characters']
    },
    body: {
        type: String,
        required: [true, 'Email body is required'],
        maxlength: [50000, 'Email body cannot exceed 50,000 characters']
    },
    sender: {
        type: String,
        required: [true, 'Sender email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid sender email']
    },
    recipient: {
        type: String,
        required: [true, 'Recipient email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid recipient email']
    },
    timestamp: {
        type: Date,
        required: [true, 'Email timestamp is required'],
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    sentimentScore: {
        type: Number,
        min: [-1, 'Sentiment score must be at least -1'],
        max: [1, 'Sentiment score cannot exceed 1']
    },
    emotionTags: [{
            type: String,
            enum: ['stress', 'urgency', 'positive', 'negative', 'neutral', 'frustration', 'excitement', 'concern'],
            trim: true
        }],
    wordCount: {
        type: Number,
        required: [true, 'Word count is required'],
        min: [0, 'Word count cannot be negative']
    },
    responseTime: {
        type: Number,
        min: [0, 'Response time cannot be negative']
    },
    threadId: {
        type: String,
        trim: true,
        index: true
    },
    isOutgoing: {
        type: Boolean,
        required: [true, 'Outgoing status is required']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
emailMessageSchema.virtual('lengthCategory').get(function () {
    if (this.wordCount < 50)
        return 'short';
    if (this.wordCount < 200)
        return 'medium';
    return 'long';
});
emailMessageSchema.virtual('sentimentCategory').get(function () {
    if (!this.sentimentScore)
        return 'unknown';
    if (this.sentimentScore > 0.2)
        return 'positive';
    if (this.sentimentScore < -0.2)
        return 'negative';
    return 'neutral';
});
emailMessageSchema.index({ userId: 1, timestamp: -1 });
emailMessageSchema.index({ threadId: 1, timestamp: 1 });
emailMessageSchema.index({ sentimentScore: 1 });
emailMessageSchema.index({ emotionTags: 1 });
emailMessageSchema.index({ isImportant: 1 });
emailMessageSchema.index({
    userId: 1,
    sentimentScore: 1,
    timestamp: -1
});
emailMessageSchema.pre('save', function (next) {
    if (this.isModified('body')) {
        this.wordCount = this.body.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    next();
});
emailMessageSchema.statics.findByUserAndDateRange = function (userId, startDate, endDate) {
    return this.find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 });
};
emailMessageSchema.statics.calculateEmailMetrics = function (userId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                userId,
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalEmails: { $sum: 1 },
                outgoingEmails: {
                    $sum: { $cond: ['$isOutgoing', 1, 0] }
                },
                incomingEmails: {
                    $sum: { $cond: ['$isOutgoing', 0, 1] }
                },
                avgSentimentScore: { $avg: '$sentimentScore' },
                avgWordCount: { $avg: '$wordCount' },
                avgResponseTime: { $avg: '$responseTime' },
                importantEmails: {
                    $sum: { $cond: ['$isImportant', 1, 0] }
                },
                stressEmails: {
                    $sum: {
                        $cond: [{ $in: ['stress', '$emotionTags'] }, 1, 0]
                    }
                }
            }
        }
    ]);
};
emailMessageSchema.statics.findStressEmails = function (userId, startDate, endDate) {
    return this.find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate },
        $or: [
            { emotionTags: 'stress' },
            { emotionTags: 'frustration' },
            { sentimentScore: { $lt: -0.3 } }
        ]
    }).sort({ timestamp: -1 });
};
exports.EmailMessage = mongoose_1.default.model('EmailMessage', emailMessageSchema);
//# sourceMappingURL=emailMessage.model.js.map