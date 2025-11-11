import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RiskCard from '../../components/RiskCard';

const baseData = {
  riskLevel: 'medium',
  riskScore: 65,
  confidence: 0.85,
  dataPoints: {
    calendarEvents: 10,
    emailMessages: 40,
    meetings: 8,
    tasksCompleted: 12,
  },
};

const renderRiskCard = (override: Partial<typeof baseData> = {}) => {
  const data = { ...baseData, ...override };

  return render(
    <MemoryRouter>
      <RiskCard data={data} />
    </MemoryRouter>
  );
};

describe('RiskCard', () => {
  it('renders core burnout metrics', () => {
    renderRiskCard();

    expect(screen.getByText('Burnout Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('65/100')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('calculates total data points analysed', () => {
    renderRiskCard({
      dataPoints: {
        calendarEvents: 5,
        emailMessages: 20,
        meetings: 5,
        tasksCompleted: 10,
      },
    });

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('analyzed')).toBeInTheDocument();
  });

  it('adapts styling for different risk levels', () => {
    renderRiskCard({ riskLevel: 'high', riskScore: 82 });

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('82/100')).toBeInTheDocument();
  });

  it('defaults to zero data points when none provided', () => {
    renderRiskCard({ dataPoints: undefined });

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
