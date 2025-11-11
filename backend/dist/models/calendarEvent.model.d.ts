import mongoose, { Document } from 'mongoose';
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
    stressLevel?: number;
    workload?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICalendarEventModel extends mongoose.Model<ICalendarEvent> {
    findByUserAndDateRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<ICalendarEvent[]>;
    calculateWorkPatterns(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any[]>;
}
export declare const CalendarEvent: ICalendarEventModel;
//# sourceMappingURL=calendarEvent.model.d.ts.map