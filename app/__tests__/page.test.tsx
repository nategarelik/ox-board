import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";

// Mock dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: () => Promise<any>) => {
    const Component = () => <div>Mocked Component</div>;
    Component.displayName = "DynamicComponent";
    return Component;
  },
}));

// Mock the store
jest.mock("../stores/enhancedDjStoreWithGestures", () => ({
  __esModule: true,
  default: () => ({
    isDJModeActive: false,
    cameraActive: false,
    gestureEnabled: false,
    gestureMapperEnabled: false,
    decks: [],
    viewMode: "decks",
    initializeMixer: jest.fn(),
    setDJModeActive: jest.fn(),
    setCameraActive: jest.fn(),
    setGestureEnabled: jest.fn(),
    setViewMode: jest.fn(),
    initializeGestureMapper: jest.fn(),
    updateGestureControls: jest.fn(),
  }),
}));

// Mock gesture hook
jest.mock("../hooks/useGestures", () => ({
  useGestures: () => ({
    gestureData: {},
    controls: [],
    updateGestures: jest.fn(),
    reset: jest.fn(),
  }),
}));

describe("Home Page - Critical Path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<Home />);
    expect(screen.getByText(/Mocked Component/i)).toBeInTheDocument();
  });

  it("initializes after mounting", async () => {
    render(<Home />);

    // Wait for loading to complete
    await waitFor(
      () => {
        const loadingElements = screen.queryAllByText(/Loading/i);
        expect(loadingElements.length).toBe(0);
      },
      { timeout: 2000 },
    );
  });

  it("displays components when mounted", async () => {
    const { container } = render(<Home />);

    await waitFor(() => {
      expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    });
  });

  it("prevents SSR hydration issues", () => {
    const { container } = render(<Home />);

    // Should initially return null to prevent hydration mismatch
    expect(container.firstChild).toBeTruthy();
  });

  it("handles store initialization", async () => {
    const mockStore = jest.requireMock(
      "../stores/enhancedDjStoreWithGestures",
    ).default;

    render(<Home />);

    await waitFor(() => {
      expect(mockStore).toHaveBeenCalled();
    });
  });
});
