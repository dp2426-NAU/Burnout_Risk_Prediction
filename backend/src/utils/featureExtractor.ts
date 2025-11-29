// Feature extraction utility for ML models - Created by Harish S & Team
import { CalendarEvent } from '../models/calendarEvent.model';
import { EmailMessage } from '../models/emailMessage.model';
import { logger } from './logger';

// Interface for extracted features
export interface ExtractedFeatures {
  // Time-based features
  workHours: number;
  overtimeHours: number;
  weekendWork: number;
  earlyMorningWork: number;
  lateNightWork: number;
  
  // Meeting features
  meetingCount: number;
  meetingDuration: number;
  backToBackMeetings: number;
  virtualMeetings: number;
  
  // Email features
  emailCount: number;
  avgEmailLength: number;
  stressEmailCount: number;
  urgentEmailCount: number;
  responseTime: number;
  
  // Workload features
  totalEvents: number;
  avgEventDuration: number;
  focusTimeRatio: number;
  breakTimeRatio: number;
  
  // Stress indicators
  stressLevel: number;
  workloadLevel: number;
  workLifeBalance: number;
  
  // Social features
  socialInteraction: number;
  teamCollaboration: number;
  
  // Health indicators
  sleepQuality: number;
  exerciseFrequency: number;
  nutritionQuality: number;
}

// Function to extract features from calendar events
export async function extractCalendarFeatures(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Partial<ExtractedFeatures>> {
  try {
    // Get calendar events for the date range
    const events = await CalendarEvent.findByUserAndDateRange(
      userId as any,
      startDate,
      endDate
    );
    
    // Initialize feature counters
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
    
    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const startTime = event.startTime;
      const endTime = event.endTime;
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Hours
      
      // Calculate work hours (9 AM to 6 PM)
      const startHour = startTime.getHours();
      const endHour = endTime.getHours();
      
      if (startHour >= 9 && endHour <= 18) {
        workHours += duration;
      } else if (startHour >= 18 || endHour >= 18) {
        overtimeHours += duration;
      }
      
      // Check for weekend work
      if (startTime.getDay() === 0 || startTime.getDay() === 6) {
        weekendWork += duration;
      }
      
      // Check for early morning work (before 7 AM)
      if (startHour < 7) {
        earlyMorningWork += duration;
      }
      
      // Check for late night work (after 10 PM)
      if (endHour > 22) {
        lateNightWork += duration;
      }
      
      // Count meetings
      if (event.eventType === 'meeting') {
        meetingCount++;
        meetingDuration += duration;
        
        // Check for virtual meetings
        if (event.isVirtual) {
          virtualMeetings++;
        }
        
        // Check for back-to-back meetings
        if (i > 0) {
          const prevEvent = events[i - 1];
          const timeBetween = (startTime.getTime() - prevEvent.endTime.getTime()) / (1000 * 60); // Minutes
          if (timeBetween <= 15) { // Less than 15 minutes between events
            backToBackMeetings++;
          }
        }
      }
      
      // Count focus time and breaks
      if (event.eventType === 'focus_time') {
        focusTime += duration;
      } else if (event.eventType === 'break') {
        breakTime += duration;
      }
      
      // Accumulate total duration
      totalDuration += duration;
      
      // Add stress and workload levels
      if (event.stressLevel) {
        stressLevel += event.stressLevel;
      }
      if (event.workload) {
        workloadLevel += event.workload;
      }
    }
    
    // Calculate averages
    const avgEventDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;
    const avgStressLevel = totalEvents > 0 ? stressLevel / totalEvents : 0;
    const avgWorkloadLevel = totalEvents > 0 ? workloadLevel / totalEvents : 0;
    
    // Calculate ratios
    const focusTimeRatio = totalDuration > 0 ? focusTime / totalDuration : 0;
    const breakTimeRatio = totalDuration > 0 ? breakTime / totalDuration : 0;
    
    // Calculate work-life balance (inverse of overtime and weekend work)
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
    
  } catch (error) {
    logger.error('Error extracting calendar features:', error);
    return {};
  }
}

// Function to extract features from email messages
export async function extractEmailFeatures(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Partial<ExtractedFeatures>> {
  try {
    // Get email messages for the date range
    const emails = await EmailMessage.findByUserAndDateRange(
      userId as any,
      startDate,
      endDate
    );
    
    // Initialize feature counters
    let emailCount = emails.length;
    let totalLength = 0;
    let stressEmailCount = 0;
    let urgentEmailCount = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    // Process each email
    for (const email of emails) {
      // Add to total length
      totalLength += email.wordCount;
      
      // Count stress emails
      if (email.emotionTags?.includes('stress') || 
          email.emotionTags?.includes('frustration') ||
          (email.sentimentScore && email.sentimentScore < -0.3)) {
        stressEmailCount++;
      }
      
      // Count urgent emails
      if (email.emotionTags?.includes('urgency') || 
          email.subject.toLowerCase().includes('urgent')) {
        urgentEmailCount++;
      }
      
      // Add response time if available
      if (email.responseTime) {
        totalResponseTime += email.responseTime;
        responseTimeCount++;
      }
    }
    
    // Calculate averages
    const avgEmailLength = emailCount > 0 ? totalLength / emailCount : 0;
    const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    return {
      emailCount,
      avgEmailLength,
      stressEmailCount,
      urgentEmailCount,
      responseTime: avgResponseTime
    };
    
  } catch (error) {
    logger.error('Error extracting email features:', error);
    return {};
  }
}

// Function to extract comprehensive features
export async function extractAllFeatures(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ExtractedFeatures> {
  try {
    // Extract features from different sources
    const calendarFeatures = await extractCalendarFeatures(userId, startDate, endDate);
    const emailFeatures = await extractEmailFeatures(userId, startDate, endDate);
    
    // Combine all features
    const features: ExtractedFeatures = {
      // Time-based features
      workHours: calendarFeatures.workHours || 0,
      overtimeHours: calendarFeatures.overtimeHours || 0,
      weekendWork: calendarFeatures.weekendWork || 0,
      earlyMorningWork: calendarFeatures.earlyMorningWork || 0,
      lateNightWork: calendarFeatures.lateNightWork || 0,
      
      // Meeting features
      meetingCount: calendarFeatures.meetingCount || 0,
      meetingDuration: calendarFeatures.meetingDuration || 0,
      backToBackMeetings: calendarFeatures.backToBackMeetings || 0,
      virtualMeetings: calendarFeatures.virtualMeetings || 0,
      
      // Email features
      emailCount: emailFeatures.emailCount || 0,
      avgEmailLength: emailFeatures.avgEmailLength || 0,
      stressEmailCount: emailFeatures.stressEmailCount || 0,
      urgentEmailCount: emailFeatures.urgentEmailCount || 0,
      responseTime: emailFeatures.responseTime || 0,
      
      // Workload features
      totalEvents: calendarFeatures.totalEvents || 0,
      avgEventDuration: calendarFeatures.avgEventDuration || 0,
      focusTimeRatio: calendarFeatures.focusTimeRatio || 0,
      breakTimeRatio: calendarFeatures.breakTimeRatio || 0,
      
      // Stress indicators
      stressLevel: calendarFeatures.stressLevel || 0,
      workloadLevel: calendarFeatures.workloadLevel || 0,
      workLifeBalance: calendarFeatures.workLifeBalance || 0,
      
      // Social features (placeholder - would need additional data)
      socialInteraction: 0,
      teamCollaboration: 0,
      
      // Health indicators (placeholder - would need additional data)
      sleepQuality: 0,
      exerciseFrequency: 0,
      nutritionQuality: 0
    };
    
    // Log feature extraction completion
    logger.info(`Extracted features for user ${userId}:`, {
      workHours: features.workHours,
      emailCount: features.emailCount,
      stressLevel: features.stressLevel
    });
    
    return features;
    
  } catch (error) {
    logger.error('Error extracting all features:', error);
    throw error;
  }
}

// Function to normalize features for ML models
export function normalizeFeatures(features: ExtractedFeatures): number[] {
  try {
    // Define normalization ranges for each feature
    const normalizationRanges = {
      workHours: [0, 12], // 0-12 hours
      overtimeHours: [0, 8], // 0-8 hours
      weekendWork: [0, 16], // 0-16 hours
      earlyMorningWork: [0, 4], // 0-4 hours
      lateNightWork: [0, 4], // 0-4 hours
      meetingCount: [0, 20], // 0-20 meetings
      meetingDuration: [0, 16], // 0-16 hours
      backToBackMeetings: [0, 10], // 0-10 back-to-back meetings
      virtualMeetings: [0, 20], // 0-20 virtual meetings
      emailCount: [0, 100], // 0-100 emails
      avgEmailLength: [0, 500], // 0-500 words
      stressEmailCount: [0, 50], // 0-50 stress emails
      urgentEmailCount: [0, 20], // 0-20 urgent emails
      responseTime: [0, 1440], // 0-1440 minutes (24 hours)
      totalEvents: [0, 50], // 0-50 events
      avgEventDuration: [0, 8], // 0-8 hours
      focusTimeRatio: [0, 1], // 0-1 ratio
      breakTimeRatio: [0, 1], // 0-1 ratio
      stressLevel: [0, 5], // 0-5 scale
      workloadLevel: [0, 5], // 0-5 scale
      workLifeBalance: [0, 1], // 0-1 ratio
      socialInteraction: [0, 10], // 0-10 scale
      teamCollaboration: [0, 10], // 0-10 scale
      sleepQuality: [0, 10], // 0-10 scale
      exerciseFrequency: [0, 10], // 0-10 scale
      nutritionQuality: [0, 10] // 0-10 scale
    };
    
    // Normalize each feature to 0-1 range
    const normalizedFeatures: number[] = [];
    
    for (const [key, value] of Object.entries(features)) {
      const range = normalizationRanges[key as keyof typeof normalizationRanges];
      if (range) {
        const normalized = (value - range[0]) / (range[1] - range[0]);
        normalizedFeatures.push(Math.max(0, Math.min(1, normalized)));
      } else {
        normalizedFeatures.push(0);
      }
    }
    
    return normalizedFeatures;
    
  } catch (error) {
    logger.error('Error normalizing features:', error);
    return new Array(25).fill(0); // Return array of zeros if error
  }
}
