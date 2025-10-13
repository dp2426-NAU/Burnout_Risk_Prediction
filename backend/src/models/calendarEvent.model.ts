// Calendar Event model for MongoDB - Created by Balaji Koneti
import mongoose, { Document, Schema } from 'mongoose';

// Interface for Calendar Event document
export interface ICalendarEvent extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  eventType: 'meeting' | 'focus_time' | 'break' | 'overtime' | 'personal';
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  location?: string;
  attendees?: string[];
  isVirtual: boolean;
  stressLevel?: number; // 1-5 scale
  workload?: number; // 1-5 scale
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Calendar Event model with static methods
export interface ICalendarEventModel extends mongoose.Model<ICalendarEvent> {
  findByUserAndDateRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<ICalendarEvent[]>;
  calculateWorkPatterns(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any[]>;
}

// Calendar Event schema definition
const calendarEventSchema = new Schema<ICalendarEvent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Event description cannot exceed 1000 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(this: ICalendarEvent, value: Date) {
        // End time must be after start time
        return value > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  eventType: {
    type: String,
    enum: ['meeting', 'focus_time', 'break', 'overtime', 'personal'],
    required: [true, 'Event type is required']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: function(this: ICalendarEvent) {
      return this.isRecurring;
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  attendees: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isVirtual: {
    type: Boolean,
    default: false
  },
  stressLevel: {
    type: Number,
    min: [1, 'Stress level must be at least 1'],
    max: [5, 'Stress level cannot exceed 5']
  },
  workload: {
    type: Number,
    min: [1, 'Workload must be at least 1'],
    max: [5, 'Workload cannot exceed 5']
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for event duration in minutes
calendarEventSchema.virtual('duration').get(function() {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Virtual field for isOvertime
calendarEventSchema.virtual('isOvertime').get(function() {
  const startHour = this.startTime.getHours();
  const endHour = this.endTime.getHours();
  return startHour >= 18 || endHour >= 18; // After 6 PM
});

// Index for user and date range queries
calendarEventSchema.index({ userId: 1, startTime: 1, endTime: 1 });

// Index for event type filtering
calendarEventSchema.index({ eventType: 1 });

// Index for recurring events
calendarEventSchema.index({ isRecurring: 1 });

// Index for stress and workload analysis
calendarEventSchema.index({ stressLevel: 1, workload: 1 });

// Compound index for user events in date range
calendarEventSchema.index({ 
  userId: 1, 
  startTime: 1, 
  eventType: 1 
});

// Pre-save middleware to validate end time
calendarEventSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Static method to find events by user and date range
calendarEventSchema.statics.findByUserAndDateRange = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    startTime: { $gte: startDate },
    endTime: { $lte: endDate }
  }).sort({ startTime: 1 });
};

// Static method to calculate workload metrics
calendarEventSchema.statics.calculateWorkloadMetrics = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        userId,
        startTime: { $gte: startDate },
        endTime: { $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        totalDuration: { $sum: { $subtract: ['$endTime', '$startTime'] } },
        avgStressLevel: { $avg: '$stressLevel' },
        avgWorkload: { $avg: '$workload' },
        overtimeEvents: {
          $sum: {
            $cond: [
              { $gte: [{ $hour: '$startTime' }, 18] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Static method to find events by user and date range
calendarEventSchema.statics.findByUserAndDateRange = function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    startTime: { $gte: startDate },
    endTime: { $lte: endDate }
  }).sort({ startTime: 1 });
};

// Create and export the CalendarEvent model
export const CalendarEvent = mongoose.model<ICalendarEvent, ICalendarEventModel>('CalendarEvent', calendarEventSchema);
