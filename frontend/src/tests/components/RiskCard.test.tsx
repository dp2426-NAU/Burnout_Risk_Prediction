// RiskCard component tests - Created by Balaji Koneti
import { render, screen } from '@testing-library/react';
import { RiskCard } from '../../components/RiskCard';

describe('RiskCard Component', () => {
  const mockPrediction = {
    riskLevel: 'medium' as const,
    riskScore: 0.65,
    confidence: 0.85,
    factors: {
      workload: 7,
      stressLevel: 6,
      workLifeBalance: 5,
      socialSupport: 4,
      jobSatisfaction: 6,
      physicalHealth: 7,
      mentalHealth: 6,
      sleepQuality: 5,
      exerciseFrequency: 4,
      nutritionQuality: 6,
    },
    recommendations: [
      'Take regular breaks during work',
      'Consider reducing meeting frequency',
      'Improve work-life balance',
    ],
    predictionDate: new Date('2024-01-15T10:00:00Z'),
  };

  it('should render risk level correctly', () => {
    render(<RiskCard prediction={mockPrediction} />);
    
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('should display risk factors', () => {
    render(<RiskCard prediction={mockPrediction} />);
    
    expect(screen.getByText('Workload')).toBeInTheDocument();
    expect(screen.getByText('Stress Level')).toBeInTheDocument();
    expect(screen.getByText('Work-Life Balance')).toBeInTheDocument();
  });

  it('should display recommendations', () => {
    render(<RiskCard prediction={mockPrediction} />);
    
    expect(screen.getByText('Take regular breaks during work')).toBeInTheDocument();
    expect(screen.getByText('Consider reducing meeting frequency')).toBeInTheDocument();
    expect(screen.getByText('Improve work-life balance')).toBeInTheDocument();
  });

  it('should show correct styling for different risk levels', () => {
    const highRiskPrediction = {
      ...mockPrediction,
      riskLevel: 'high' as const,
      riskScore: 0.85,
    };

    render(<RiskCard prediction={highRiskPrediction} />);
    
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should show correct styling for low risk', () => {
    const lowRiskPrediction = {
      ...mockPrediction,
      riskLevel: 'low' as const,
      riskScore: 0.25,
    };

    render(<RiskCard prediction={lowRiskPrediction} />);
    
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('should handle missing recommendations gracefully', () => {
    const predictionWithoutRecommendations = {
      ...mockPrediction,
      recommendations: [],
    };

    render(<RiskCard prediction={predictionWithoutRecommendations} />);
    
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.queryByText('Take regular breaks during work')).not.toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(<RiskCard prediction={mockPrediction} />);
    
    // The exact format depends on your date formatting implementation
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should display factor scores with proper formatting', () => {
    render(<RiskCard prediction={mockPrediction} />);
    
    // Check that factor scores are displayed (exact implementation may vary)
    expect(screen.getByText('7')).toBeInTheDocument(); // workload score
    expect(screen.getByText('6')).toBeInTheDocument(); // stress level score
  });

  it('should handle edge case with very high confidence', () => {
    const highConfidencePrediction = {
      ...mockPrediction,
      confidence: 0.99,
    };

    render(<RiskCard prediction={highConfidencePrediction} />);
    
    expect(screen.getByText('99% confidence')).toBeInTheDocument();
  });

  it('should handle edge case with very low confidence', () => {
    const lowConfidencePrediction = {
      ...mockPrediction,
      confidence: 0.1,
    };

    render(<RiskCard prediction={lowConfidencePrediction} />);
    
    expect(screen.getByText('10% confidence')).toBeInTheDocument();
  });
});
