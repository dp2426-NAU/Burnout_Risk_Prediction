// Dashboard page tests - aligned with current DashboardPage implementation
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';
import { dashboardService, type DashboardData } from '../../services/dashboardService';
import { useAuth } from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
  },
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const mockDashboardData: DashboardData = {
  userId: '1',
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
    mentalHealth: 6,
    sleepQuality: 5,
    exerciseFrequency: 4,
    nutritionQuality: 6,
  },
  recommendations: [
    {
      priority: 'medium',
      category: 'workload',
      title: 'Reduce Meeting Load',
      description: 'Consider consolidating meetings to reduce overload.',
      actionItems: ['Audit your meetings', 'Cancel unnecessary meetings'],
    },
  ],
  workPatterns: {
    workHoursPerWeek: 42,
    meetingHoursPerWeek: 12,
    emailCountPerDay: 80,
    stressLevel: 6,
    workloadScore: 7,
    workLifeBalance: 5,
    remoteWorkPercentage: 60,
    overtimeHours: 5,
    deadlinePressure: 6,
    sleepQuality: 6,
    exerciseFrequency: 4,
    nutritionQuality: 6,
    socialSupport: 5,
    jobSatisfaction: 6,
  },
  dataPoints: {
    calendarEvents: 20,
    emailMessages: 120,
    meetings: 10,
    tasksCompleted: 18,
  },
};

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard content for an authenticated user', async () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
      loading: false,
    });
    (dashboardService.getDashboardData as vi.Mock).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });

    expect(screen.getByText('Burnout Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('65/100')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows loading state when data is being fetched', () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
      loading: true,
    });
    (dashboardService.getDashboardData as vi.Mock).mockResolvedValue(mockDashboardData);

    renderDashboard();

    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('renders an error state when data loading fails', async () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
      loading: false,
    });
    (dashboardService.getDashboardData as vi.Mock).mockRejectedValue(new Error('Network error'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });
});
