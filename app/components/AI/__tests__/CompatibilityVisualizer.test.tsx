/**
 * Tests for CompatibilityVisualizer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompatibilityVisualizer } from '../CompatibilityVisualizer';
import { CompatibilityScore } from '../../../lib/ai/mixAssistant';

describe('CompatibilityVisualizer', () => {
  const mockCompatibility: CompatibilityScore = {
    overall: 0.85,
    harmonic: 0.9,
    rhythmic: 0.8,
    energetic: 0.75,
    spectral: 0.9,
    details: {
      keyCompatibility: true,
      bpmDifference: 4.2,
      energyMatch: 0.8,
      frequencyClash: 0.1,
      compatibleMixPoints: []
    }
  };

  it('should render track compatibility correctly', () => {
    render(<CompatibilityVisualizer compatibility={mockCompatibility} />);

    expect(screen.getByText('Track Compatibility')).toBeInTheDocument();
    expect(screen.getByText('85% - Excellent')).toBeInTheDocument();
  });

  it('should display individual compatibility scores', () => {
    render(<CompatibilityVisualizer compatibility={mockCompatibility} />);

    expect(screen.getByText('Harmonic')).toBeInTheDocument();
    expect(screen.getByText('Rhythmic')).toBeInTheDocument();
    expect(screen.getByText('Energetic')).toBeInTheDocument();
    expect(screen.getByText('Spectral')).toBeInTheDocument();

    expect(screen.getByText('90%')).toBeInTheDocument(); // Harmonic
    expect(screen.getByText('80%')).toBeInTheDocument(); // Rhythmic
    expect(screen.getByText('75%')).toBeInTheDocument(); // Energetic
  });

  it('should show compatibility details', () => {
    render(<CompatibilityVisualizer compatibility={mockCompatibility} />);

    expect(screen.getByText('Compatibility Details')).toBeInTheDocument();
    expect(screen.getByText('Key Compatible:')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('BPM Difference:')).toBeInTheDocument();
    expect(screen.getByText('4.2 BPM')).toBeInTheDocument();
  });

  it('should apply correct color coding for scores', () => {
    const { rerender } = render(<CompatibilityVisualizer compatibility={mockCompatibility} />);

    // Test excellent score (green)
    let overallElement = screen.getByText('85% - Excellent');
    expect(overallElement).toHaveClass('text-green-400');

    // Test good score (yellow)
    const goodCompatibility = { ...mockCompatibility, overall: 0.65 };
    rerender(<CompatibilityVisualizer compatibility={goodCompatibility} />);
    overallElement = screen.getByText('65% - Good');
    expect(overallElement).toHaveClass('text-yellow-400');

    // Test fair score (orange)
    const fairCompatibility = { ...mockCompatibility, overall: 0.45 };
    rerender(<CompatibilityVisualizer compatibility={fairCompatibility} />);
    overallElement = screen.getByText('45% - Fair');
    expect(overallElement).toHaveClass('text-orange-400');

    // Test poor score (red)
    const poorCompatibility = { ...mockCompatibility, overall: 0.25 };
    rerender(<CompatibilityVisualizer compatibility={poorCompatibility} />);
    overallElement = screen.getByText('25% - Poor');
    expect(overallElement).toHaveClass('text-red-400');
  });

  it('should render progress bars with correct widths', () => {
    render(<CompatibilityVisualizer compatibility={mockCompatibility} />);

    const overallBar = screen.getByRole('progressbar', { hidden: true });
    expect(overallBar).toHaveStyle({ width: '85%' });
  });

  it('should handle edge case values correctly', () => {
    const edgeCompatibility: CompatibilityScore = {
      overall: 0,
      harmonic: 1,
      rhythmic: 0.5,
      energetic: 0,
      spectral: 1,
      details: {
        keyCompatibility: false,
        bpmDifference: 0,
        energyMatch: 0.5,
        frequencyClash: 0.8,
        compatibleMixPoints: []
      }
    };

    render(<CompatibilityVisualizer compatibility={edgeCompatibility} />);

    expect(screen.getByText('0% - Poor')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // Harmonic and Spectral
    expect(screen.getByText('50%')).toBeInTheDocument(); // Rhythmic
    expect(screen.getByText('No')).toBeInTheDocument(); // Key compatible
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CompatibilityVisualizer compatibility={mockCompatibility} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show frequency clash status correctly', () => {
    render(<CompatibilityVisualizer compatibility={mockCompatibility} />);

    expect(screen.getByText('Frequency Clash:')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();

    const highClashCompatibility = {
      ...mockCompatibility,
      details: { ...mockCompatibility.details, frequencyClash: 0.4 }
    };

    const { rerender } = render(<CompatibilityVisualizer compatibility={highClashCompatibility} />);
    rerender(<CompatibilityVisualizer compatibility={highClashCompatibility} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should display mix points count', () => {
    const compatibilityWithMixPoints = {
      ...mockCompatibility,
      details: {
        ...mockCompatibility.details,
        compatibleMixPoints: [
          { time: 0, score: 0.8, type: 'intro' as const, phraseAlignment: 16, energy: 0.5, confidence: 0.8 },
          { time: 32, score: 0.9, type: 'outro' as const, phraseAlignment: 16, energy: 0.6, confidence: 0.9 }
        ]
      }
    };

    render(<CompatibilityVisualizer compatibility={compatibilityWithMixPoints} />);

    expect(screen.getByText('Mix Points:')).toBeInTheDocument();
    expect(screen.getByText('2 compatible')).toBeInTheDocument();
  });
});