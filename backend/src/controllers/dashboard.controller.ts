// Dashboard Controller - Handles dashboard data requests with access control
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';
import { canAccessEmployeeDataSync, ROLES, UserRole } from '../middleware/rbac.middleware';
import { User } from '../models/user.model';
import {
  getEmployeeData,
  calculateDailySummary,
  EmployeeData
} from '../services/csvData.service';
import { logger } from '../utils/logger';

/**
 * Get employee dashboard data
 * Employees can only see their own data; managers/admins can see any
 */
export const getEmployeeDashboard = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Get target user ID from query param (for managers/admins) or use requester's ID
    const targetUserId = req.query.userId as string | undefined;
    const requesterId = req.user.userId;
    const requesterRole = req.user.role as UserRole;

    // Determine which user's data to fetch
    let userIdToFetch: string;
    
    // If targetUserId is provided, verify the requester has permission to access it
    if (targetUserId) {
      // Employees can only access their own data
      if (requesterRole === ROLES.USER && requesterId !== targetUserId) {
        logger.warn(`Access denied: Employee ${requesterId} trying to access ${targetUserId}`);
        res.status(403).json({
          success: false,
          message: 'Access denied - insufficient permissions'
        });
        return;
      }
      // Managers and admins can access any employee's data
      if (requesterRole === ROLES.MANAGER || requesterRole === ROLES.ADMIN) {
        userIdToFetch = targetUserId;
      } else {
        userIdToFetch = requesterId;
      }
    } else {
      userIdToFetch = requesterId;
    }

    // Get user from database first to check managerId
    const user = await User.findById(userIdToFetch);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify access control with managerId
    if (!canAccessEmployeeDataSync(requesterId, requesterRole, userIdToFetch, user.managerId?.toString() || null)) {
      logger.warn(`Access denied: User ${requesterId} (${requesterRole}) trying to access ${userIdToFetch}`);
      res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
      return;
    }

    // Get employee data from CSV
    const employeeData = getEmployeeData(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);

    if (!employeeData) {
      res.status(404).json({
        success: false,
        message: 'Employee data not found in CSV datasets'
      });
      return;
    }

    // Calculate daily summary
    const dailySummary = calculateDailySummary(employeeData);

    // Calculate risk score from employee data
    const riskScore = calculateRiskScore(employeeData);
    const riskLevel = getRiskLevel(riskScore);

    // Generate recommendations
    const recommendations = generateRecommendations(riskLevel, employeeData);

    // Return dashboard data
    res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        profile: {
          name: `${user.firstName} ${user.lastName}`,
          jobTitle: user.jobTitle || employeeData.jobRole || 'Employee',
          department: user.department || employeeData.department,
          role: user.role
        },
        dailySummary,
        riskLevel,
        riskScore: Math.round(riskScore * 100),
        confidence: 0.85, // Default confidence
        factors: {
          workload: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
          stressLevel: normalizeFactor(employeeData.stressLevel, 0, 10),
          workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
          socialSupport: 7, // Default if not in CSV
          jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10),
          physicalHealth: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
          mentalHealth: normalizeFactor(employeeData.stressLevel, 0, 10),
          sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
          exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
          nutritionQuality: 6 // Default if not in CSV
        },
        recommendations,
        workPatterns: {
          workHoursPerWeek: employeeData.workHoursPerWeek || 40,
          meetingHoursPerWeek: dailySummary.meetingsAttended * 5,
          emailCountPerDay: dailySummary.emailsResponded,
          stressLevel: employeeData.stressLevel || 5,
          workloadScore: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
          workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
          teamSize: employeeData.teamSize,
          remoteWorkPercentage: employeeData.remoteRatio || 0,
          overtimeHours: Math.max(0, (employeeData.workHoursPerWeek || 40) - 40),
          deadlinePressure: normalizeFactor(employeeData.stressLevel, 0, 10),
          sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
          exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
          nutritionQuality: 6,
          socialSupport: 7,
          jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10)
        },
        employeeData // Include raw employee data for reference
      }
    });

  } catch (error) {
    logger.error('Error in getEmployeeDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get employee dashboard by user ID (for managers/admins)
 */
export const getEmployeeDashboardById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const targetUserId = req.params.userId;
    const requesterId = req.user.userId;
    const requesterRole = req.user.role as UserRole;

    // Verify access control - only managers/admins can use this endpoint
    if (requesterRole !== ROLES.MANAGER && requesterRole !== ROLES.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Access denied - manager or admin role required'
      });
      return;
    }

    // Get user from database first to check managerId
    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify access control with managerId
    if (!canAccessEmployeeDataSync(requesterId, requesterRole, targetUserId, user.managerId?.toString() || null)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Get employee data from CSV
    const employeeData = getEmployeeData(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);

    if (!employeeData) {
      res.status(404).json({
        success: false,
        message: 'Employee data not found in CSV datasets'
      });
      return;
    }

    // Calculate daily summary
    const dailySummary = calculateDailySummary(employeeData);

    // Calculate risk score
    const riskScore = calculateRiskScore(employeeData);
    const riskLevel = getRiskLevel(riskScore);

    // Generate recommendations
    const recommendations = generateRecommendations(riskLevel, employeeData);

    // Return dashboard data
    res.status(200).json({
      success: true,
      data: {
        userId: user._id.toString(),
        profile: {
          name: `${user.firstName} ${user.lastName}`,
          jobTitle: user.jobTitle || employeeData.jobRole || 'Employee',
          department: user.department || employeeData.department,
          role: user.role
        },
        dailySummary,
        riskLevel,
        riskScore: Math.round(riskScore * 100),
        confidence: 0.85,
        factors: {
          workload: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
          stressLevel: normalizeFactor(employeeData.stressLevel, 0, 10),
          workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
          socialSupport: 7,
          jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10),
          physicalHealth: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
          mentalHealth: normalizeFactor(employeeData.stressLevel, 0, 10),
          sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
          exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
          nutritionQuality: 6
        },
        recommendations,
        workPatterns: {
          workHoursPerWeek: employeeData.workHoursPerWeek || 40,
          meetingHoursPerWeek: dailySummary.meetingsAttended * 5,
          emailCountPerDay: dailySummary.emailsResponded,
          stressLevel: employeeData.stressLevel || 5,
          workloadScore: normalizeFactor(employeeData.workHoursPerWeek, 40, 70),
          workLifeBalance: normalizeFactor(employeeData.workLifeBalanceScore, 0, 10),
          teamSize: employeeData.teamSize,
          remoteWorkPercentage: employeeData.remoteRatio || 0,
          overtimeHours: Math.max(0, (employeeData.workHoursPerWeek || 40) - 40),
          deadlinePressure: normalizeFactor(employeeData.stressLevel, 0, 10),
          sleepQuality: normalizeFactor(employeeData.sleepHours, 4, 9),
          exerciseFrequency: normalizeFactor(employeeData.physicalActivityHrs, 0, 10),
          nutritionQuality: 6,
          socialSupport: 7,
          jobSatisfaction: normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10)
        },
        employeeData
      }
    });

  } catch (error) {
    logger.error('Error in getEmployeeDashboardById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get profile overview with daily summary
 */
export const getProfileOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Get target user ID from query param (for managers/admins) or use requester's ID
    const targetUserId = req.query.userId as string | undefined;
    const requesterId = req.user.userId;
    const requesterRole = req.user.role as UserRole;

    // Determine which user's data to fetch
    let userIdToFetch: string;
    
    // If targetUserId is provided, verify the requester has permission to access it
    if (targetUserId) {
      // Employees can only access their own data
      if (requesterRole === ROLES.USER && requesterId !== targetUserId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }
      // Managers and admins can access any employee's data
      if (requesterRole === ROLES.MANAGER || requesterRole === ROLES.ADMIN) {
        userIdToFetch = targetUserId;
      } else {
        userIdToFetch = requesterId;
      }
    } else {
      userIdToFetch = requesterId;
    }

    // Get user from database first to check managerId
    const user = await User.findById(userIdToFetch);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify access control with managerId
    if (!canAccessEmployeeDataSync(requesterId, requesterRole, userIdToFetch, user.managerId?.toString() || null)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Get employee data from CSV
    const employeeData = getEmployeeData(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);

    if (!employeeData) {
      res.status(404).json({
        success: false,
        message: 'Employee data not found'
      });
      return;
    }

    // Calculate daily summary
    const dailySummary = calculateDailySummary(employeeData);

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: `${user.firstName} ${user.lastName}`,
          jobTitle: user.jobTitle || employeeData.jobRole || 'Employee',
          department: user.department || employeeData.department,
          role: user.role
        },
        dailySummary
      }
    });

  } catch (error) {
    logger.error('Error in getProfileOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Simulate burnout risk with adjusted parameters
 */
export const simulateBurnoutRisk = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const {
      meetingHours,
      workHours,
      sleepHours,
      stressLevel,
      workLifeBalance,
      exerciseFrequency,
      userId: targetUserId
    } = req.body;

    const requesterId = req.user.userId;
    const requesterRole = req.user.role as UserRole;

    // Determine which user's data to use
    let userIdToFetch: string;
    
    // If targetUserId is provided, verify the requester has permission to access it
    if (targetUserId) {
      // Employees can only simulate their own risk
      if (requesterRole === ROLES.USER && requesterId !== targetUserId) {
        res.status(403).json({
          success: false,
          message: 'Access denied - you can only simulate your own risk'
        });
        return;
      }
      // Managers and admins can simulate for any employee
      if (requesterRole === ROLES.MANAGER || requesterRole === ROLES.ADMIN) {
        userIdToFetch = targetUserId;
      } else {
        userIdToFetch = requesterId;
      }
    } else {
      userIdToFetch = requesterId;
    }

    // Get user from database first to check managerId
    const user = await User.findById(userIdToFetch);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify access control with managerId
    if (!canAccessEmployeeDataSync(requesterId, requesterRole, userIdToFetch, user.managerId?.toString() || null)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    const employeeData = getEmployeeData(user.employeeId, user.employeeName || `${user.firstName} ${user.lastName}`);
    if (!employeeData) {
      res.status(404).json({
        success: false,
        message: 'Employee data not found'
      });
      return;
    }

    // Calculate base risk score
    const baseRiskScore = calculateRiskScore(employeeData);

    // Calculate deltas
    const baseWorkHours = employeeData.workHoursPerWeek || 40;
    const baseSleepHours = employeeData.sleepHours || 7;
    const baseStressLevel = employeeData.stressLevel || 5;
    const baseWorkLifeBalance = normalizeFactor(employeeData.workLifeBalanceScore, 0, 10);
    const baseExerciseFrequency = normalizeFactor(employeeData.physicalActivityHrs, 0, 10);

    // workHours can be provided as hours per day (multiply by 5 for weekly) or hours per week
    // If workHours is <= 24, assume it's hours per day, otherwise assume hours per week
    const simulatedWorkHoursPerWeek = workHours !== undefined 
      ? (workHours <= 24 ? workHours * 5 : workHours)
      : baseWorkHours;
    const deltaWorkHours = workHours !== undefined ? (simulatedWorkHoursPerWeek - baseWorkHours) / 30 : 0;
    const deltaSleepHours = sleepHours !== undefined ? (sleepHours - baseSleepHours) / 5 : 0;
    const deltaStressLevel = stressLevel !== undefined ? (stressLevel - baseStressLevel) / 5 : 0;
    const deltaWorkLifeBalance = workLifeBalance !== undefined ? (workLifeBalance - baseWorkLifeBalance) / 5 : 0;
    const deltaExerciseFrequency = exerciseFrequency !== undefined ? (exerciseFrequency - baseExerciseFrequency) / 5 : 0;
    const deltaMeetingHours = meetingHours !== undefined ? (meetingHours - (baseWorkHours * 0.15)) / 20 : 0;

    // Apply predictive formula: newRisk = baseRisk + weighted deltas
    const newRiskScore = Math.max(0, Math.min(1, 
      baseRiskScore +
      (deltaWorkHours * 0.15) +
      (deltaMeetingHours * 0.15) -
      (deltaSleepHours * 0.2) +
      (deltaStressLevel * 0.25) -
      (deltaWorkLifeBalance * 0.1) -
      (deltaExerciseFrequency * 0.05)
    ));

    const newRiskLevel = getRiskLevel(newRiskScore);

    // Generate dynamic recommendations based on simulation
    const recommendations = generateSimulationRecommendations(
      newRiskLevel,
      {
        meetingHours,
        workHours: simulatedWorkHoursPerWeek,
        sleepHours,
        stressLevel,
        workLifeBalance,
        exerciseFrequency
      },
      {
        baseWorkHours,
        baseSleepHours,
        baseStressLevel,
        baseWorkLifeBalance,
        baseExerciseFrequency
      }
    );

    res.status(200).json({
      success: true,
      data: {
        baseRiskScore: Math.round(baseRiskScore * 100),
        baseRiskLevel: getRiskLevel(baseRiskScore),
        simulatedRiskScore: Math.round(newRiskScore * 100),
        simulatedRiskLevel: newRiskLevel,
        changes: {
          riskScoreChange: Math.round((newRiskScore - baseRiskScore) * 100),
          riskLevelChange: newRiskLevel !== getRiskLevel(baseRiskScore)
        },
        recommendations
      }
    });

  } catch (error) {
    logger.error('Error in simulateBurnoutRisk:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper functions

/**
 * Normalize factor to 0-10 scale
 */
function normalizeFactor(value: number | undefined, min: number, max: number): number {
  if (value === undefined || value === null) return 5;
  return Math.max(0, Math.min(10, ((value - min) / (max - min)) * 10));
}

/**
 * Calculate risk score from employee data
 */
function calculateRiskScore(employeeData: EmployeeData): number {
  const workHoursPerWeek = employeeData.workHoursPerWeek || 40;
  const stressLevel = normalizeFactor(employeeData.stressLevel, 0, 10);
  const workLifeBalance = normalizeFactor(employeeData.workLifeBalanceScore, 0, 10);
  const sleepHours = normalizeFactor(employeeData.sleepHours, 4, 9);
  const exerciseFrequency = normalizeFactor(employeeData.physicalActivityHrs, 0, 10);
  const jobSatisfaction = normalizeFactor(employeeData.jobSatisfaction || employeeData.satisfactionLevel, 0, 10);

  // Weighted risk calculation
  const riskFactors = [
    ((workHoursPerWeek - 40) / 30) * 0.15, // Overtime factor
    (stressLevel - 5) / 5 * 0.2, // Stress level
    (5 - workLifeBalance) / 5 * 0.15, // Poor work-life balance
    (5 - sleepHours) / 5 * 0.1, // Poor sleep
    (5 - exerciseFrequency) / 5 * 0.05, // Lack of exercise
    (5 - jobSatisfaction) / 5 * 0.1 // Low job satisfaction
  ];

  const riskScore = riskFactors.reduce((sum, factor) => sum + factor, 0.3); // Base risk of 0.3
  return Math.max(0, Math.min(1, riskScore));
}

/**
 * Get risk level from score
 */
function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore < 0.3) return 'low';
  if (riskScore < 0.6) return 'medium';
  if (riskScore < 0.8) return 'high';
  return 'critical';
}

/**
 * Generate recommendations based on risk level and employee data
 */
function generateRecommendations(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  employeeData: EmployeeData
): Array<{
  priority: 'low' | 'medium' | 'high';
  category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
  title: string;
  description: string;
  actionItems: string[];
}> {
  const recommendations = [];

  if (riskLevel === 'low') {
    recommendations.push({
      priority: 'low' as const,
      category: 'health' as const,
      title: 'Continue Healthy Habits',
      description: 'Keep maintaining your current work-life balance and stress management practices.',
      actionItems: ['Continue current routine', 'Monitor stress levels', 'Maintain work boundaries']
    });
  } else if (riskLevel === 'medium') {
    recommendations.push({
      priority: 'medium' as const,
      category: 'workload' as const,
      title: 'Reduce Workload Pressure',
      description: 'Consider reducing your workload or improving time management to prevent burnout.',
      actionItems: ['Prioritize tasks', 'Delegate when possible', 'Set realistic deadlines']
    });
  } else if (riskLevel === 'high') {
    recommendations.push({
      priority: 'high' as const,
      category: 'stress' as const,
      title: 'Immediate Stress Reduction',
      description: 'Your stress levels are concerning. Take immediate action to reduce pressure.',
      actionItems: ['Take time off', 'Reduce work hours', 'Seek support from manager']
    });
  } else {
    recommendations.push({
      priority: 'high' as const,
      category: 'health' as const,
      title: 'Critical Intervention Needed',
      description: 'You are at high risk of burnout. Immediate intervention is required.',
      actionItems: ['Contact HR immediately', 'Take extended leave', 'Seek professional help']
    });
  }

  // Add specific recommendations based on employee data
  if (employeeData.workHoursPerWeek && employeeData.workHoursPerWeek > 50) {
    recommendations.push({
      priority: 'high' as const,
      category: 'workload' as const,
      title: 'Reduce Work Hours',
      description: `You're working ${employeeData.workHoursPerWeek} hours per week. Consider reducing to 40-45 hours.`,
      actionItems: ['Set work hour limits', 'Avoid overtime', 'Improve efficiency']
    });
  }

  if (employeeData.stressLevel && employeeData.stressLevel > 7) {
    recommendations.push({
      priority: 'high' as const,
      category: 'stress' as const,
      title: 'Stress Management',
      description: 'Your stress level is high. Implement stress reduction techniques.',
      actionItems: ['Practice meditation', 'Take regular breaks', 'Exercise regularly']
    });
  }

  if (employeeData.workLifeBalanceScore && employeeData.workLifeBalanceScore < 4) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'lifestyle' as const,
      title: 'Improve Work-Life Balance',
      description: 'Your work-life balance needs attention. Set clear boundaries.',
      actionItems: ['Set work hours', 'Avoid after-hours emails', 'Schedule personal time']
    });
  }

  return recommendations;
}

/**
 * Generate simulation-specific recommendations
 */
function generateSimulationRecommendations(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  simulated: {
    meetingHours?: number;
    workHours?: number;
    sleepHours?: number;
    stressLevel?: number;
    workLifeBalance?: number;
    exerciseFrequency?: number;
  },
  base: {
    baseWorkHours: number;
    baseSleepHours: number;
    baseStressLevel: number;
    baseWorkLifeBalance: number;
    baseExerciseFrequency: number;
  }
): Array<{
  priority: 'low' | 'medium' | 'high';
  category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
  title: string;
  description: string;
  actionItems: string[];
}> {
  const recommendations = [];

  // Check for improvements
  if (simulated.sleepHours && simulated.sleepHours > base.baseSleepHours) {
    recommendations.push({
      priority: 'low' as const,
      category: 'health' as const,
      title: 'Sleep Improvement',
      description: `Increasing sleep from ${base.baseSleepHours} to ${simulated.sleepHours} hours will help reduce burnout risk.`,
      actionItems: ['Maintain consistent sleep schedule', 'Create bedtime routine', 'Limit screen time before bed']
    });
  }

  if (simulated.workHours && simulated.workHours < base.baseWorkHours) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'workload' as const,
      title: 'Work Hours Reduction',
      description: `Reducing work hours from ${base.baseWorkHours} to ${simulated.workHours} hours per week will lower burnout risk.`,
      actionItems: ['Set clear work boundaries', 'Prioritize essential tasks', 'Delegate non-critical work']
    });
  }

  if (simulated.stressLevel && simulated.stressLevel < base.baseStressLevel) {
    recommendations.push({
      priority: 'high' as const,
      category: 'stress' as const,
      title: 'Stress Reduction',
      description: `Reducing stress level from ${base.baseStressLevel} to ${simulated.stressLevel} will significantly improve your wellbeing.`,
      actionItems: ['Practice mindfulness', 'Take regular breaks', 'Seek support when needed']
    });
  }

  // Add general recommendations based on risk level
  if (riskLevel === 'high' || riskLevel === 'critical') {
    recommendations.push({
      priority: 'high' as const,
      category: 'health' as const,
      title: 'Immediate Action Required',
      description: 'Your simulated risk level indicates immediate intervention is needed.',
      actionItems: ['Consult with HR', 'Consider taking time off', 'Seek professional support']
    });
  }

  return recommendations;
}

