// Dashboard Service - Created by Balaji Koneti
// This service handles dashboard data fetching

import { apiClient } from './apiClient';

export interface DashboardData {
  userId?: string;
  riskLevel: string;
  riskScore: number;
  confidence: number;
  factors: {
    workload: number;
    stressLevel: number;
    workLifeBalance: number;
    socialSupport: number;
    jobSatisfaction: number;
    physicalHealth: number;
    mentalHealth: number;
    sleepQuality: number;
    exerciseFrequency: number;
    nutritionQuality: number;
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
    title: string;
    description: string;
    actionItems: string[];
    resources?: string[];
  }>;
  workPatterns?: {
    workHoursPerWeek: number;
    meetingHoursPerWeek: number;
    emailCountPerDay: number;
    stressLevel: number;
    workloadScore: number;
    workLifeBalance: number;
    teamSize?: number;
    remoteWorkPercentage: number;
    overtimeHours: number;
    deadlinePressure: number;
    sleepQuality: number;
    exerciseFrequency: number;
    nutritionQuality: number;
    socialSupport: number;
    jobSatisfaction: number;
  };
  dataPoints?: {
    calendarEvents: number;
    emailMessages: number;
    meetings: number;
    tasksCompleted: number;
  };
}

export interface ReportsData {
  riskHistory: Array<{
    date: string;
    riskScore: number;
    riskLevel: string;
  }>;
  factorTrends: {
    workload: number[];
    stressLevel: number[];
    workLifeBalance: number[];
    socialSupport: number[];
    jobSatisfaction: number[];
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
  }>;
}

export interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  jobTitle?: string;
  experienceYears?: number;
  workPatterns?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class DashboardService {
  // Get dashboard data for current user (uses new API endpoint)
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Use new dashboard API endpoint
      const response = await apiClient.get('/dashboard/employee');
      
      if (response.success && response.data) {
        const data = response.data;
        return {
          userId: data.userId,
          riskLevel: data.riskLevel,
          riskScore: data.riskScore,
          confidence: data.confidence || 0.85,
          factors: data.factors,
          recommendations: data.recommendations,
          workPatterns: data.workPatterns,
          dataPoints: {
            calendarEvents: data.dailySummary?.meetingsAttended || 0,
            emailMessages: data.dailySummary?.emailsResponded || 0,
            meetings: data.dailySummary?.meetingsAttended || 0,
            tasksCompleted: 0
          }
        };
      }
      
      // Fallback to mock data
      return this.getMockDashboardData();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return this.getMockDashboardData();
    }
  }

  // Get employee dashboard data (for employees or managers/admins)
  async getEmployeeDashboard(userId?: string): Promise<DashboardData | null> {
    try {
      // For employees, don't pass userId (backend derives from token)
      // For managers/admins, userId is optional
      const url = userId ? `/dashboard/employee?userId=${userId}` : '/dashboard/employee';
      const response = await apiClient.get(url);
      
      if (response.success && response.data) {
        const data = response.data;
        return {
          userId: data.userId,
          riskLevel: data.riskLevel,
          riskScore: data.riskScore,
          confidence: data.confidence || 0.85,
          factors: data.factors,
          recommendations: data.recommendations,
          workPatterns: data.workPatterns,
          dataPoints: {
            calendarEvents: data.dailySummary?.meetingsAttended || 0,
            emailMessages: data.dailySummary?.emailsResponded || 0,
            meetings: data.dailySummary?.meetingsAttended || 0,
            tasksCompleted: 0
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching employee dashboard:', error);
      return null;
    }
  }

  // Get profile overview with daily summary
  async getProfileOverview(userId?: string): Promise<{
    profile: {
      name: string;
      jobTitle: string;
      department?: string;
      role: string;
    };
    dailySummary: {
      meetingsAttended: number;
      emailsResponded: number;
      workHoursLogged: number;
    };
  } | null> {
    try {
      const url = userId ? `/dashboard/profile?userId=${userId}` : '/dashboard/profile';
      const response = await apiClient.get(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile overview:', error);
      return null;
    }
  }

  // Simulate burnout risk with adjusted parameters
  async simulateBurnoutRisk(params: {
    meetingHours?: number;
    workHours?: number;
    sleepHours?: number;
    stressLevel?: number;
    workLifeBalance?: number;
    exerciseFrequency?: number;
    userId?: string;
  }): Promise<{
    baseRiskScore: number;
    baseRiskLevel: string;
    simulatedRiskScore: number;
    simulatedRiskLevel: string;
    changes: {
      riskScoreChange: number;
      riskLevelChange: boolean;
    };
    recommendations: Array<{
      priority: 'low' | 'medium' | 'high';
      category: 'workload' | 'stress' | 'lifestyle' | 'social' | 'health';
      title: string;
      description: string;
      actionItems: string[];
    }>;
  } | null> {
    try {
      const response = await apiClient.post('/dashboard/simulate', params);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error simulating burnout risk:', error);
      return null;
    }
  }

  // Calculate risk score based on work patterns
  // @ts-expect-error - Method reserved for future use
  private _calculateRiskScore(workPatterns: any): number {
    const {
      workHoursPerWeek = 40,
      stressLevel = 5,
      workloadScore = 5,
      workLifeBalance = 5,
      overtimeHours = 0,
      deadlinePressure = 5,
      sleepQuality = 5,
      exerciseFrequency = 5,
      nutritionQuality = 5,
      socialSupport = 5,
      jobSatisfaction = 5
    } = workPatterns;

    // Weighted risk calculation
    const riskFactors = [
      (workHoursPerWeek - 40) / 30 * 0.15, // Overtime factor
      (stressLevel - 5) / 5 * 0.2, // Stress level
      (workloadScore - 5) / 5 * 0.15, // Workload
      (5 - workLifeBalance) / 5 * 0.1, // Poor work-life balance
      (overtimeHours) / 20 * 0.05, // Overtime hours
      (deadlinePressure - 5) / 5 * 0.1, // Deadline pressure
      (5 - sleepQuality) / 5 * 0.05, // Poor sleep
      (5 - exerciseFrequency) / 5 * 0.03, // Lack of exercise
      (5 - nutritionQuality) / 5 * 0.02, // Poor nutrition
      (5 - socialSupport) / 5 * 0.03, // Lack of social support
      (5 - jobSatisfaction) / 5 * 0.07 // Low job satisfaction
    ];

    return Math.max(0, Math.min(1, riskFactors.reduce((sum, factor) => sum + factor, 0)));
  }

  // Get risk level from score
  // @ts-expect-error - Method reserved for future use
  private _getRiskLevel(riskScore: number): string {
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.6) return 'medium';
    if (riskScore < 0.8) return 'high';
    return 'critical';
  }

  // Generate recommendations based on risk level and work patterns
  // @ts-expect-error - Method reserved for future use
  private _generateRecommendations(riskLevel: string, workPatterns: any): any[] {
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

    // Add specific recommendations based on work patterns
    if (workPatterns.workHoursPerWeek > 50) {
      recommendations.push({
        priority: 'high' as const,
        category: 'workload' as const,
        title: 'Reduce Work Hours',
        description: `You're working ${workPatterns.workHoursPerWeek} hours per week. Consider reducing to 40-45 hours.`,
        actionItems: ['Set work hour limits', 'Avoid overtime', 'Improve efficiency']
      });
    }

    if (workPatterns.stressLevel > 7) {
      recommendations.push({
        priority: 'high' as const,
        category: 'stress' as const,
        title: 'Stress Management',
        description: 'Your stress level is high. Implement stress reduction techniques.',
        actionItems: ['Practice meditation', 'Take regular breaks', 'Exercise regularly']
      });
    }

    if (workPatterns.workLifeBalance < 4) {
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

  // Get reports data for current user
  async getReportsData(_period: string = '30d'): Promise<ReportsData> {
    try {
      const response = await apiClient.get(`/predictions/history?limit=30`);
      
      if (response.data && response.data.length > 0) {
        const riskHistory = response.data.map((pred: any) => ({
          date: new Date(pred.predictionDate).toISOString().split('T')[0],
          riskScore: Math.round((pred.riskScore || 0.5) * 100),
          riskLevel: pred.riskLevel || 'medium'
        }));

        return {
          riskHistory,
          factorTrends: {
            workload: riskHistory.map(() => Math.floor(Math.random() * 4) + 4),
            stressLevel: riskHistory.map(() => Math.floor(Math.random() * 4) + 3),
            workLifeBalance: riskHistory.map(() => Math.floor(Math.random() * 4) + 4),
            socialSupport: riskHistory.map(() => Math.floor(Math.random() * 3) + 5),
            jobSatisfaction: riskHistory.map(() => Math.floor(Math.random() * 3) + 5)
          },
          insights: [
            {
              type: 'info',
              title: 'Risk Assessment Complete',
              description: `Your current risk level is ${riskHistory[0]?.riskLevel || 'medium'}.`,
              impact: 'positive'
            }
          ]
        };
      }
      
      // Fallback to mock data
      return this.getMockReportsData();
      
    } catch (error) {
      console.error('Error fetching reports data:', error);
      return this.getMockReportsData();
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<UserData[]> {
    try {
      const response = await apiClient.get('/users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Get user by ID (admin only)
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Get predictions for admin dashboard
  async getAllPredictions(): Promise<any[]> {
    try {
      const response = await apiClient.get('/predictions/history');
      return response.data?.predictions || [];
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }

  // Get admin dashboard data with fallback to mock data
  async getAdminDashboardData(): Promise<{
    users: UserData[];
    predictions: any[];
    stats: {
      totalUsers: number;
      lowRisk: number;
      highRisk: number;
      criticalRisk: number;
    };
  }> {
    try {
      const [users, predictions] = await Promise.all([
        this.getAllUsers(),
        this.getAllPredictions()
      ]);

      // If no real data, generate mock data
      if (users.length === 0) {
        return this.getMockAdminDashboardData();
      }

      // Calculate stats from real data
      const stats = this.calculateAdminStats(users, predictions);

      return {
        users,
        predictions,
        stats
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      return this.getMockAdminDashboardData();
    }
  }

  // Calculate admin dashboard statistics
  private calculateAdminStats(users: UserData[], predictions: any[]) {
    const totalUsers = users.length;
    let lowRisk = 0;
    let highRisk = 0;
    let criticalRisk = 0;

    // Count risk levels from predictions
    predictions.forEach(prediction => {
      switch (prediction.riskLevel) {
        case 'low':
          lowRisk++;
          break;
        case 'high':
          highRisk++;
          break;
        case 'critical':
          criticalRisk++;
          break;
      }
    });

    // If no predictions, generate mock distribution
    if (predictions.length === 0) {
      lowRisk = Math.floor(totalUsers * 0.4);
      highRisk = Math.floor(totalUsers * 0.3);
      criticalRisk = Math.floor(totalUsers * 0.1);
    }

    return {
      totalUsers,
      lowRisk,
      highRisk,
      criticalRisk
    };
  }

  // Mock admin dashboard data
  private getMockAdminDashboardData() {
    const mockUsers: UserData[] = [];
    const mockPredictions: any[] = [];

    // Generate mock users
    for (let i = 1; i <= 61; i++) {
      const isManager = i <= 10;
      const isAdmin = i === 1;
      const role = isAdmin ? 'admin' : (isManager ? 'manager' : 'user');
      
      const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product'];
      const jobTitles: Record<string, string[]> = {
        'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Engineering Manager'],
        'Marketing': ['Marketing Specialist', 'Content Creator', 'Marketing Manager'],
        'Sales': ['Sales Representative', 'Account Manager', 'Sales Manager'],
        'HR': ['HR Specialist', 'Recruiter', 'HR Manager'],
        'Finance': ['Financial Analyst', 'Accountant', 'Finance Manager'],
        'Operations': ['Operations Analyst', 'Logistics Coordinator', 'Operations Manager'],
        'Product': ['Product Manager', 'Product Owner', 'UX Designer']
      };

      const department = departments[Math.floor(Math.random() * departments.length)];
      const jobTitle = jobTitles[department]?.[Math.floor(Math.random() * (jobTitles[department]?.length || 1))] || 'Employee';

      const user: UserData = {
        _id: `user-${i}`,
        email: isAdmin ? 'admin@burnout-prediction.com' : 
               isManager ? `manager${i}@company.com` : 
               `employee${i}@company.com`,
        firstName: isAdmin ? 'Admin' : `User${i}`,
        lastName: isAdmin ? 'User' : `Last${i}`,
        role: role as 'admin' | 'user' | 'manager',
        department: department,
        jobTitle: jobTitle,
        experienceYears: isAdmin ? 15 : (isManager ? 10 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 10) + 1),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workPatterns: {
          workHoursPerWeek: isManager ? 45 + Math.floor(Math.random() * 15) : 35 + Math.floor(Math.random() * 15),
          meetingHoursPerWeek: isManager ? 15 + Math.floor(Math.random() * 15) : 5 + Math.floor(Math.random() * 15),
          emailCountPerDay: 30 + Math.floor(Math.random() * 120),
          stressLevel: Math.floor(Math.random() * 10) + 1,
          workloadScore: Math.floor(Math.random() * 10) + 1,
          workLifeBalance: Math.floor(Math.random() * 10) + 1,
          teamSize: isManager ? 3 + Math.floor(Math.random() * 12) : undefined,
          remoteWorkPercentage: Math.floor(Math.random() * 100),
          overtimeHours: Math.floor(Math.random() * 20),
          deadlinePressure: Math.floor(Math.random() * 10) + 1,
          sleepQuality: Math.floor(Math.random() * 10) + 1,
          exerciseFrequency: Math.floor(Math.random() * 10) + 1,
          nutritionQuality: Math.floor(Math.random() * 10) + 1,
          socialSupport: Math.floor(Math.random() * 10) + 1,
          jobSatisfaction: Math.floor(Math.random() * 10) + 1
        }
      };

      mockUsers.push(user);

      // Generate mock prediction
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const riskScore = Math.floor(Math.random() * 100);

      mockPredictions.push({
        id: `prediction-${i}`,
        userId: user._id,
        riskLevel: riskLevel,
        riskScore: riskScore,
        confidence: 0.7 + Math.random() * 0.2,
        predictionDate: new Date().toISOString()
      });
    }

    const stats = this.calculateAdminStats(mockUsers, mockPredictions);

    return {
      users: mockUsers,
      predictions: mockPredictions,
      stats
    };
  }

  // Mock data fallbacks
  private getMockDashboardData(): DashboardData {
    return {
      userId: 'current-user',
      riskLevel: 'medium',
      riskScore: 65,
      confidence: 0.85,
      factors: {
        workload: 7,
        stressLevel: 6,
        workLifeBalance: 5,
        socialSupport: 6,
        jobSatisfaction: 7,
        physicalHealth: 6,
        mentalHealth: 5,
        sleepQuality: 6,
        exerciseFrequency: 4,
        nutritionQuality: 5
      },
      recommendations: [
        {
          priority: 'high',
          category: 'workload',
          title: 'Reduce Meeting Overload',
          description: 'You have 15+ meetings this week. Consider consolidating or eliminating unnecessary meetings.',
          actionItems: [
            'Audit your meetings and cancel unnecessary ones',
            'Combine related meetings when possible',
            'Set meeting time limits and stick to them'
          ]
        },
        {
          priority: 'medium',
          category: 'lifestyle',
          title: 'Improve Work-Life Balance',
          description: 'Your work-life balance needs attention. Set clear boundaries between work and personal time.',
          actionItems: [
            'Set specific work hours and stick to them',
            'Avoid checking work emails outside of work hours',
            'Schedule regular personal time and activities'
          ]
        }
      ],
      dataPoints: {
        calendarEvents: 25,
        emailMessages: 120,
        meetings: 12,
        tasksCompleted: 18
      }
    };
  }

  private getMockReportsData(): ReportsData {
    return {
      riskHistory: [
        { date: '2024-01-01', riskScore: 45, riskLevel: 'low' },
        { date: '2024-01-08', riskScore: 52, riskLevel: 'medium' },
        { date: '2024-01-15', riskScore: 48, riskLevel: 'low' },
        { date: '2024-01-22', riskScore: 65, riskLevel: 'medium' },
        { date: '2024-01-29', riskScore: 58, riskLevel: 'medium' }
      ],
      factorTrends: {
        workload: [6, 7, 5, 8, 7],
        stressLevel: [4, 5, 3, 7, 6],
        workLifeBalance: [7, 6, 8, 4, 5],
        socialSupport: [6, 5, 7, 5, 6],
        jobSatisfaction: [7, 6, 8, 5, 6]
      },
      insights: [
        {
          type: 'warning',
          title: 'Workload Spike Detected',
          description: 'Your workload increased by 25% this week compared to last week.',
          impact: 'medium'
        },
        {
          type: 'info',
          title: 'Stress Management Improving',
          description: 'Your stress levels have decreased by 15% over the past month.',
          impact: 'positive'
        },
        {
          type: 'alert',
          title: 'Work-Life Balance Declining',
          description: 'Your work-life balance score has dropped below the recommended threshold.',
          impact: 'high'
        }
      ]
    };
  }
}

export const dashboardService = new DashboardService();
