import mongoose, { Document } from 'mongoose';
export interface IEmailMessage extends Document {
    userId: mongoose.Types.ObjectId;
    subject: string;
    body: string;
    sender: string;
    recipient: string;
    timestamp: Date;
    isRead: boolean;
    isImportant: boolean;
    sentimentScore?: number;
    emotionTags?: string[];
    wordCount: number;
    responseTime?: number;
    threadId?: string;
    isOutgoing: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IEmailMessageModel extends mongoose.Model<IEmailMessage> {
    findByUserAndDateRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<IEmailMessage[]>;
    calculateEmailMetrics(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<any[]>;
}
export declare const EmailMessage: IEmailMessageModel;
//# sourceMappingURL=emailMessage.model.d.ts.map