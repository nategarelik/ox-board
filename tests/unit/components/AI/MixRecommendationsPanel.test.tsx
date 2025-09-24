/**
 * Tests for MixRecommendationsPanel component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MixRecommendationsPanel } from "@/components/AI/MixRecommendationsPanel";
import { TransitionRecommendation } from "@/lib/ai/mixAssistant";

describe("MixRecommendationsPanel", () => {
  const mockRecommendations: TransitionRecommendation[] = [
    {
      fromTrack: "track1",
      toTrack: "track2",
      fromMixPoint: {
        time: 32.5,
        score: 0.9,
        type: "outro",
        phraseAlignment: 16,
        energy: 0.6,
        confidence: 0.8,
      },
      toMixPoint: {
        time: 0,
        score: 0.8,
        type: "intro",
        phraseAlignment: 16,
        energy: 0.5,
        confidence: 0.7,
      },
      tempoAdjustment: {
        originalBPM: 128,
        targetBPM: 132,
        adjustmentPercent: 0.03125,
        method: "pitch_shift",
        naturalRange: true,
      },
      effects: [
        {
          type: "highpass",
          intensity: 0.6,
          timing: "transition",
          duration: 8,
          automation: [
            {
              parameter: "frequency",
              startValue: 0,
              endValue: 0.3,
              curve: "exponential",
              startTime: 0,
              endTime: 4,
            },
          ],
        },
      ],
      crossfadeTime: 8.0,
      compatibility: {
        overall: 0.85,
        harmonic: 0.9,
        rhythmic: 0.8,
        energetic: 0.75,
        spectral: 0.9,
        details: {
          keyCompatibility: true,
          bpmDifference: 4,
          energyMatch: 0.8,
          frequencyClash: 0.1,
          compatibleMixPoints: [],
        },
      },
      confidence: 0.88,
    },
    {
      fromTrack: "track1",
      toTrack: "track3",
      fromMixPoint: {
        time: 48.0,
        score: 0.7,
        type: "breakdown",
        phraseAlignment: 32,
        energy: 0.3,
        confidence: 0.6,
      },
      toMixPoint: {
        time: 16,
        score: 0.6,
        type: "phrase_start",
        phraseAlignment: 32,
        energy: 0.4,
        confidence: 0.5,
      },
      tempoAdjustment: {
        originalBPM: 128,
        targetBPM: 140,
        adjustmentPercent: 0.09375,
        method: "time_stretch",
        naturalRange: false,
      },
      effects: [],
      crossfadeTime: 16.0,
      compatibility: {
        overall: 0.65,
        harmonic: 0.7,
        rhythmic: 0.6,
        energetic: 0.65,
        spectral: 0.65,
        details: {
          keyCompatibility: false,
          bpmDifference: 12,
          energyMatch: 0.65,
          frequencyClash: 0.2,
          compatibleMixPoints: [],
        },
      },
      confidence: 0.62,
    },
  ];

  const mockOnSelectRecommendation = jest.fn();

  beforeEach(() => {
    mockOnSelectRecommendation.mockClear();
  });

  it("should render mix recommendations panel", () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    expect(screen.getByText("Mix Recommendations")).toBeInTheDocument();
    expect(
      screen.getByText(
        "2 intelligent suggestions based on harmonic and rhythmic analysis",
      ),
    ).toBeInTheDocument();
  });

  it("should display individual recommendations", () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    expect(screen.getByText("Track track1 → Track track2")).toBeInTheDocument();
    expect(screen.getByText("Track track1 → Track track3")).toBeInTheDocument();
    expect(screen.getByText("85% compatibility")).toBeInTheDocument();
    expect(screen.getByText("65% compatibility")).toBeInTheDocument();
  });

  it("should show confidence scores with correct styling", () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const highConfidence = screen.getByText("88%");
    const mediumConfidence = screen.getByText("62%");

    expect(highConfidence).toHaveClass("text-green-400");
    expect(mediumConfidence).toHaveClass("text-yellow-400");
  });

  it("should expand recommendation details when clicked", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const firstRecommendation = screen
      .getByText("Track track1 → Track track2")
      .closest("div");
    expect(firstRecommendation).toBeInTheDocument();

    fireEvent.click(firstRecommendation!);

    await waitFor(() => {
      expect(screen.getByText("Tempo Adjustment")).toBeInTheDocument();
      expect(screen.getByText("pitch shift")).toBeInTheDocument();
      expect(screen.getByText("+3.1%")).toBeInTheDocument();
      expect(screen.getByText("128.0 → 132.0")).toBeInTheDocument();
    });
  });

  it("should show effect recommendations in expanded view", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const firstRecommendation = screen
      .getByText("Track track1 → Track track2")
      .closest("div");
    fireEvent.click(firstRecommendation!);

    await waitFor(() => {
      expect(screen.getByText("Recommended Effects")).toBeInTheDocument();
      expect(screen.getByText("highpass")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument(); // intensity
      expect(screen.getByText("transition")).toBeInTheDocument(); // timing
    });
  });

  it("should display compatibility breakdown in expanded view", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const firstRecommendation = screen
      .getByText("Track track1 → Track track2")
      .closest("div");
    fireEvent.click(firstRecommendation!);

    await waitFor(() => {
      expect(screen.getByText("Compatibility Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Harmonic:")).toBeInTheDocument();
      expect(screen.getByText("Rhythmic:")).toBeInTheDocument();
      expect(screen.getByText("Energetic:")).toBeInTheDocument();
      expect(screen.getByText("Spectral:")).toBeInTheDocument();
    });
  });

  it("should call onSelectRecommendation when clicking on recommendation", () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const firstRecommendation = screen
      .getByText("Track track1 → Track track2")
      .closest("div");
    fireEvent.click(firstRecommendation!);

    expect(mockOnSelectRecommendation).toHaveBeenCalledWith(
      mockRecommendations[0],
    );
  });

  it("should call onSelectRecommendation when clicking Apply This Mix button", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const firstRecommendation = screen
      .getByText("Track track1 → Track track2")
      .closest("div");
    fireEvent.click(firstRecommendation!);

    await waitFor(() => {
      const applyButton = screen.getByText("Apply This Mix");
      fireEvent.click(applyButton);
      expect(mockOnSelectRecommendation).toHaveBeenCalledWith(
        mockRecommendations[0],
      );
    });
  });

  it("should handle empty recommendations gracefully", () => {
    render(
      <MixRecommendationsPanel
        recommendations={[]}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    expect(
      screen.getByText("No mix recommendations available"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Analyze tracks to see intelligent mixing suggestions"),
    ).toBeInTheDocument();
  });

  it("should format time correctly", () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    expect(screen.getByText("0:32")).toBeInTheDocument(); // 32.5 seconds formatted
    expect(screen.getByText("0:08")).toBeInTheDocument(); // crossfade time
  });

  it("should display mix point icons correctly", () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    // Check for mix point type display
    expect(screen.getByText("outro")).toBeInTheDocument();
    expect(screen.getByText("breakdown")).toBeInTheDocument();
  });

  it("should show tempo adjustment colors correctly", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    // Expand first recommendation (pitch_shift method)
    const firstRec = screen
      .getByText("Track track1 → Track track2")
      .closest("div");
    fireEvent.click(firstRec!);

    await waitFor(() => {
      const pitchShiftElement = screen.getByText("pitch shift");
      expect(pitchShiftElement).toHaveClass("text-green-400");
    });

    // Collapse and expand second recommendation (time_stretch method)
    fireEvent.click(firstRec!);
    const secondRec = screen
      .getByText("Track track1 → Track track3")
      .closest("div");
    fireEvent.click(secondRec!);

    await waitFor(() => {
      const timeStretchElement = screen.getByText("time stretch");
      expect(timeStretchElement).toHaveClass("text-yellow-400");
    });
  });

  it("should apply custom className", () => {
    const { container } = render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
        className="custom-class"
      />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should toggle expanded state correctly", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    const firstRecommendation = screen
      .getByText("Track track1 → Track track2")
      .closest("div");

    // Initially collapsed
    expect(screen.queryByText("Tempo Adjustment")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(firstRecommendation!);
    await waitFor(() => {
      expect(screen.getByText("Tempo Adjustment")).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(firstRecommendation!);
    await waitFor(() => {
      expect(screen.queryByText("Tempo Adjustment")).not.toBeInTheDocument();
    });
  });

  it("should handle recommendations without effects", async () => {
    render(
      <MixRecommendationsPanel
        recommendations={mockRecommendations}
        onSelectRecommendation={mockOnSelectRecommendation}
      />,
    );

    // Expand second recommendation (no effects)
    const secondRecommendation = screen
      .getByText("Track track1 → Track track3")
      .closest("div");
    fireEvent.click(secondRecommendation!);

    await waitFor(() => {
      expect(screen.queryByText("Recommended Effects")).not.toBeInTheDocument();
    });
  });
});
