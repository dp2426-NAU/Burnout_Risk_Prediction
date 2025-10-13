// Dashboard component tests - Created by Balaji Koneti
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../../components/Dashboard';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the dashboard service
vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
    generatePrediction: vi.fn(),
  },
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  isActive: true,
  createdAt: new Date(),
};

const mockDashboardData = {
  user: mockUser,
  latestPrediction: {
    riskLevel: 'medium',
    riskScore: 0.65,
    confidence: 0.85,
    factors: {
      workload: 7,
      stressLevel: 6,
      workLifeBalance: 5,
    },
    recommendations: ['Take regular breaks'],
    predictionDate: new Date(),
  },
  statistics: {
    totalPredictions: 5,
    averageRiskScore: 0.6,
    riskTrend: 'stable',
  },
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard for authenticated user', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: false,
    });

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue(mockDashboardData);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: true,
    });

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      token: null,
      loading: false,
    });

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    // Should redirect to login (implementation depends on your routing setup)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should display user information correctly', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: false,
    });

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue(mockDashboardData);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display latest prediction when available', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: false,
    });

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue(mockDashboardData);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  it('should handle dashboard data loading error', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: false,
    });

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockRejectedValue(new Error('Failed to load data'));

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
    });
  });

  it('should display statistics when available', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: false,
    });

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue(mockDashboardData);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Predictions')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Average Risk Score')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('should handle empty dashboard data gracefully', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      token: 'auth-token',
      loading: false,
    });

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue({
      user: mockUser,
      latestPrediction: null,
      statistics: null,
    });

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No prediction data available')).toBeInTheDocument();
    });
  });

  it('should show different content for admin users', async () => {
    const adminUser = {
      ...mockUser,
      role: 'admin',
    };

    (useAuth as any).mockReturnValue({
      user: adminUser,
      token: 'auth-token',
      loading: false,
    });

    const adminDashboardData = {
      ...mockDashboardData,
      user: adminUser,
      adminStats: {
        totalUsers: 100,
        activeUsers: 95,
        systemHealth: 'good',
      },
    };

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue(adminDashboardData);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('should show different content for manager users', async () => {
    const managerUser = {
      ...mockUser,
      role: 'manager',
    };

    (useAuth as any).mockReturnValue({
      user: managerUser,
      token: 'auth-token',
      loading: false,
    });

    const managerDashboardData = {
      ...mockDashboardData,
      user: managerUser,
      teamStats: {
        teamSize: 8,
        highRiskMembers: 2,
        averageTeamRisk: 0.55,
      },
    };

    const { dashboardService } = await import('../../services/dashboardService');
    (dashboardService.getDashboardData as any).mockResolvedValue(managerDashboardData);

    render(
      <DashboardWrapper>
        <Dashboard />
      </DashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Team Size')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });
});
