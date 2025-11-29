// Email Message model for MongoDB - Created by Harish S & Team
import mongoose, { Document, Schema } from 'mongoose';

// Interface for Email Message document
export interface IEmailMessage extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
  sentimentScore?: number; // -1 to 1 scale
  emotionTags?: string[]; // ['stress', 'urgency', 'positive', 'negative']
  wordCount: number;
  responseTime?: number; // Time to respond in minutes
  threadId?: string; // For grouping related emails
  isOutgoing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Email Message model with static methods
export interface IEmailMessageModel extends mongoose.Model<IEmailMessage> {
  findByUserAndDateRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<IEmailMessage[]>;
  calculateEmailMetrics(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any[]>;
}

// Email Message schema definition
const emailMessageSchema = new Schema<IEmailMessage>({
  userId: {
    type: Schema.Types.ObjectId,
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
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for email length category
emailMessageSchema.virtual('lengthCategory').get(function() {
  if (this.wordCount < 50) return 'short';
  if (this.wordCount < 200) return 'medium';
  return 'long';
});

// Virtual field for sentiment category
emailMessageSchema.virtual('sentimentCategory').get(function() {
  if (!this.sentimentScore) return 'unknown';
  if (this.sentimentScore > 0.2) return 'positive';
  if (this.sentimentScore < -0.2) return 'negative';
  return 'neutral';
});

// Index for user and timestamp queries
emailMessageSchema.index({ userId: 1, timestamp: -1 });

// Index for thread grouping
emailMessageSchema.index({ threadId: 1, timestamp: 1 });

// Index for sentiment analysis
emailMessageSchema.index({ sentimentScore: 1 });

// Index for emotion tags
emailMessageSchema.index({ emotionTags: 1 });

// Index for important emails
emailMessageSchema.index({ isImportant: 1 });

// Compound index for user sentiment analysis
emailMessageSchema.index({ 
  userId: 1, 
  sentimentScore: 1, 
  timestamp: -1 
});

// Pre-save middleware to calculate word count
emailMessageSchema.pre('save', function(next) {
  if (this.isModified('body')) {
    // Calculate word count by splitting on whitespace and filtering empty strings
    this.wordCount = this.body.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Static method to find emails by user and date range
emailMessageSchema.statics.findByUserAndDateRange = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

// Static method to calculate email metrics
emailMessageSchema.statics.calculateEmailMetrics = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
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

// Static method to find stress-related emails
emailMessageSchema.statics.findStressEmails = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
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

// Create and export the EmailMessage model
export const EmailMessage = mongoose.model<IEmailMessage, IEmailMessageModel>('EmailMessage', emailMessageSchema);
