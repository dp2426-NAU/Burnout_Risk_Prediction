"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCalendarFeatures = extractCalendarFeatures;
exports.extractEmailFeatures = extractEmailFeatures;
exports.extractAllFeatures = extractAllFeatures;
exports.normalizeFeatures = normalizeFeatures;
const calendarEvent_model_1 = require("../models/calendarEvent.model");
const emailMessage_model_1 = require("../models/emailMessage.model");
const logger_1 = require("./logger");
async function extractCalendarFeatures(userId, startDate, endDate) {
    try {
        const events = await calendarEvent_model_1.CalendarEvent.findByUserAndDateRange(userId, startDate, endDate);
        let workHours = 0;
        let overtimeHours = 0;
        let weekendWork = 0;
        let earlyMorningWork = 0;
        let lateNightWork = 0;
        let meetingCount = 0;
        let meetingDuration = 0;
        let backToBackMeetings = 0;
        let virtualMeetings = 0;
        let totalEvents = events.length;
        let totalDuration = 0;
        let focusTime = 0;
        let breakTime = 0;
        let stressLevel = 0;
        let workloadLevel = 0;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const startTime = event.startTime;
            const endTime = event.endTime;
            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const startHour = startTime.getHours();
            const endHour = endTime.getHours();
            if (startHour >= 9 && endHour <= 18) {
                workHours += duration;
            }
            else if (startHour >= 18 || endHour >= 18) {
                overtimeHours += duration;
            }
            if (startTime.getDay() === 0 || startTime.getDay() === 6) {
                weekendWork += duration;
            }
            if (startHour < 7) {
                earlyMorningWork += duration;
            }
            if (endHour > 22) {
                lateNightWork += duration;
            }
            if (event.eventType === 'meeting') {
                meetingCount++;
                meetingDuration += duration;
                if (event.isVirtual) {
                    virtualMeetings++;
                }
                if (i > 0) {
                    const prevEvent = events[i - 1];
                    const timeBetween = (startTime.getTime() - prevEvent.endTime.getTime()) / (1000 * 60);
                    if (timeBetween <= 15) {
                        backToBackMeetings++;
                    }
                }
            }
            if (event.eventType === 'focus_time') {
                focusTime += duration;
            }
            else if (event.eventType === 'break') {
                breakTime += duration;
            }
            totalDuration += duration;
            if (event.stressLevel) {
                stressLevel += event.stressLevel;
            }
            if (event.workload) {
                workloadLevel += event.workload;
            }
        }
        const avgEventDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;
        const avgStressLevel = totalEvents > 0 ? stressLevel / totalEvents : 0;
        const avgWorkloadLevel = totalEvents > 0 ? workloadLevel / totalEvents : 0;
        const focusTimeRatio = totalDuration > 0 ? focusTime / totalDuration : 0;
        const breakTimeRatio = totalDuration > 0 ? breakTime / totalDuration : 0;
        const totalWorkTime = workHours + overtimeHours + weekendWork;
        const workLifeBalance = totalWorkTime > 0 ? workHours / totalWorkTime : 1;
        return {
            workHours,
            overtimeHours,
            weekendWork,
            earlyMorningWork,
            lateNightWork,
            meetingCount,
            meetingDuration,
            backToBackMeetings,
            virtualMeetings,
            totalEvents,
            avgEventDuration,
            focusTimeRatio,
            breakTimeRatio,
            stressLevel: avgStressLevel,
            workloadLevel: avgWorkloadLevel,
            workLifeBalance
        };
    }
    catch (error) {
        logger_1.logger.error('Error extracting calendar features:', error);
        return {};
    }
}
async function extractEmailFeatures(userId, startDate, endDate) {
    try {
        const emails = await emailMessage_model_1.EmailMessage.findByUserAndDateRange(userId, startDate, endDate);
        let emailCount = emails.length;
        let totalLength = 0;
        let stressEmailCount = 0;
        let urgentEmailCount = 0;
        let totalResponseTime = 0;
        let responseTimeCount = 0;
        for (const email of emails) {
            totalLength += email.wordCount;
            if (email.emotionTags?.includes('stress') ||
                email.emotionTags?.includes('frustration') ||
                (email.sentimentScore && email.sentimentScore < -0.3)) {
                stressEmailCount++;
            }
            if (email.emotionTags?.includes('urgency') ||
                email.subject.toLowerCase().includes('urgent')) {
                urgentEmailCount++;
            }
            if (email.responseTime) {
                totalResponseTime += email.responseTime;
                responseTimeCount++;
            }
        }
        const avgEmailLength = emailCount > 0 ? totalLength / emailCount : 0;
        const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
        return {
            emailCount,
            avgEmailLength,
            stressEmailCount,
            urgentEmailCount,
            responseTime: avgResponseTime
        };
    }
    catch (error) {
        logger_1.logger.error('Error extracting email features:', error);
        return {};
    }
}
async function extractAllFeatures(userId, startDate, endDate) {
    try {
        const calendarFeatures = await extractCalendarFeatures(userId, startDate, endDate);
        const emailFeatures = await extractEmailFeatures(userId, startDate, endDate);
        const features = {
            workHours: calendarFeatures.workHours || 0,
            overtimeHours: calendarFeatures.overtimeHours || 0,
            weekendWork: calendarFeatures.weekendWork || 0,
            earlyMorningWork: calendarFeatures.earlyMorningWork || 0,
            lateNightWork: calendarFeatures.lateNightWork || 0,
            meetingCount: calendarFeatures.meetingCount || 0,
            meetingDuration: calendarFeatures.meetingDuration || 0,
            backToBackMeetings: calendarFeatures.backToBackMeetings || 0,
            virtualMeetings: calendarFeatures.virtualMeetings || 0,
            emailCount: emailFeatures.emailCount || 0,
            avgEmailLength: emailFeatures.avgEmailLength || 0,
            stressEmailCount: emailFeatures.stressEmailCount || 0,
            urgentEmailCount: emailFeatures.urgentEmailCount || 0,
            responseTime: emailFeatures.responseTime || 0,
            totalEvents: calendarFeatures.totalEvents || 0,
            avgEventDuration: calendarFeatures.avgEventDuration || 0,
            focusTimeRatio: calendarFeatures.focusTimeRatio || 0,
            breakTimeRatio: calendarFeatures.breakTimeRatio || 0,
            stressLevel: calendarFeatures.stressLevel || 0,
            workloadLevel: calendarFeatures.workloadLevel || 0,
            workLifeBalance: calendarFeatures.workLifeBalance || 0,
            socialInteraction: 0,
            teamCollaboration: 0,
            sleepQuality: 0,
            exerciseFrequency: 0,
            nutritionQuality: 0
        };
        logger_1.logger.info(`Extracted features for user ${userId}:`, {
            workHours: features.workHours,
            emailCount: features.emailCount,
            stressLevel: features.stressLevel
        });
        return features;
    }
    catch (error) {
        logger_1.logger.error('Error extracting all features:', error);
        throw error;
    }
}
function normalizeFeatures(features) {
    try {
        const normalizationRanges = {
            workHours: [0, 12],
            overtimeHours: [0, 8],
            weekendWork: [0, 16],
            earlyMorningWork: [0, 4],
            lateNightWork: [0, 4],
            meetingCount: [0, 20],
            meetingDuration: [0, 16],
            backToBackMeetings: [0, 10],
            virtualMeetings: [0, 20],
            emailCount: [0, 100],
            avgEmailLength: [0, 500],
            stressEmailCount: [0, 50],
            urgentEmailCount: [0, 20],
            responseTime: [0, 1440],
            totalEvents: [0, 50],
            avgEventDuration: [0, 8],
            focusTimeRatio: [0, 1],
            breakTimeRatio: [0, 1],
            stressLevel: [0, 5],
            workloadLevel: [0, 5],
            workLifeBalance: [0, 1],
            socialInteraction: [0, 10],
            teamCollaboration: [0, 10],
            sleepQuality: [0, 10],
            exerciseFrequency: [0, 10],
            nutritionQuality: [0, 10]
        };
        const normalizedFeatures = [];
        for (const [key, value] of Object.entries(features)) {
            const range = normalizationRanges[key];
            if (range) {
                const normalized = (value - range[0]) / (range[1] - range[0]);
                normalizedFeatures.push(Math.max(0, Math.min(1, normalized)));
            }
            else {
                normalizedFeatures.push(0);
            }
        }
        return normalizedFeatures;
    }
    catch (error) {
        logger_1.logger.error('Error normalizing features:', error);
        return new Array(25).fill(0);
    }
}
//# sourceMappingURL=featureExtractor.js.map