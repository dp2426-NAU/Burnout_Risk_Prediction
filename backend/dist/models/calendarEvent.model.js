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
exports.CalendarEvent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const calendarEventSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (value) {
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
        required: function () {
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
calendarEventSchema.virtual('duration').get(function () {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});
calendarEventSchema.virtual('isOvertime').get(function () {
    const startHour = this.startTime.getHours();
    const endHour = this.endTime.getHours();
    return startHour >= 18 || endHour >= 18;
});
calendarEventSchema.index({ userId: 1, startTime: 1, endTime: 1 });
calendarEventSchema.index({ eventType: 1 });
calendarEventSchema.index({ isRecurring: 1 });
calendarEventSchema.index({ stressLevel: 1, workload: 1 });
calendarEventSchema.index({
    userId: 1,
    startTime: 1,
    eventType: 1
});
calendarEventSchema.pre('save', function (next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    }
    else {
        next();
    }
});
calendarEventSchema.statics.findByUserAndDateRange = function (userId, startDate, endDate) {
    return this.find({
        userId,
        startTime: { $gte: startDate },
        endTime: { $lte: endDate }
    }).sort({ startTime: 1 });
};
calendarEventSchema.statics.calculateWorkloadMetrics = function (userId, startDate, endDate) {
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
calendarEventSchema.statics.findByUserAndDateRange = function (userId, startDate, endDate) {
    return this.find({
        userId,
        startTime: { $gte: startDate },
        endTime: { $lte: endDate }
    }).sort({ startTime: 1 });
};
exports.CalendarEvent = mongoose_1.default.model('CalendarEvent', calendarEventSchema);
//# sourceMappingURL=calendarEvent.model.js.map