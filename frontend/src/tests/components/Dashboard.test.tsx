// Dashboard page tests - aligned with current DashboardPage implementation
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';
import { dashboardService, type DashboardData } from '../../services/dashboardService';
import { useAuth } from '../../hooks/useAuth';
import { ThemeProvider } from '../../contexts/ThemeContext';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
    getProfileOverview: vi.fn(),
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
      <ThemeProvider>
      <DashboardPage />
      </ThemeProvider>
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
    (dashboardService.getProfileOverview as vi.Mock).mockResolvedValue({
      profile: {
        name: 'John Doe',
        jobTitle: 'Software Engineer',
        department: 'Engineering',
        role: 'user',
      },
      dailySummary: {
        meetingsAttended: 5,
        emailsResponded: 20,
        workHoursLogged: 8,
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });

    expect(screen.getByText('Burnout Risk Assessment')).toBeInTheDocument();
    // Use getAllByText since MEDIUM appears multiple times (in RiskCard and Quick Stats)
    const mediumElements = screen.getAllByText('MEDIUM');
    expect(mediumElements.length).toBeGreaterThan(0);
    // Use getAllByText since 65/100 appears multiple times (in RiskCard and Quick Stats)
    const scoreElements = screen.getAllByText('65/100');
    expect(scoreElements.length).toBeGreaterThan(0);
    // Use getAllByText since 85% appears multiple times (in RiskCard and Quick Stats)
    const confidenceElements = screen.getAllByText('85%');
    expect(confidenceElements.length).toBeGreaterThan(0);
  });

  it('shows loading state when data is being fetched', () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
      loading: false,
    });
    (dashboardService.getDashboardData as vi.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );
    (dashboardService.getProfileOverview as vi.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

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
    (dashboardService.getProfileOverview as vi.Mock).mockResolvedValue(null);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
