import type { StateCreator } from "zustand";
import type {
  UIState,
  EnhancedStemPlayerState,
} from "../../types/enhanced-state";

export interface UIStateSlice extends UIState {
  // Panel actions
  togglePanel: (panel: keyof UIState["panels"]) => void;
  setPanelState: (panel: keyof UIState["panels"], visible: boolean) => void;

  // Modal actions
  setModalState: (modal: keyof UIState["modals"], open: boolean) => void;
  openModal: (modal: keyof UIState["modals"]) => void;
  closeModal: (modal: keyof UIState["modals"]) => void;
  closeAllModals: () => void;

  // Drawer actions
  setDrawerState: (drawer: keyof UIState["drawers"], open: boolean) => void;
  toggleDrawer: (drawer: keyof UIState["drawers"]) => void;

  // Theme actions
  setTheme: (theme: Partial<UIState["theme"]>) => void;
  setThemeMode: (mode: UIState["theme"]["mode"]) => void;
  setAccentColor: (color: string) => void;
  toggleTheme: () => void;

  // Preferences actions
  setPreferences: (preferences: Partial<UIState["preferences"]>) => void;
  togglePreference: (preference: keyof UIState["preferences"]) => void;

  // Tutorial actions
  setTutorialStep: (step: number) => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  completeTutorialStep: (step: number) => void;
  resetTutorial: () => void;
  setTutorialActive: (active: boolean) => void;
  updateTutorialProgress: (progress: number) => void;

  // Responsive actions
  setResponsiveState: (state: Partial<UIState["responsive"]>) => void;
  updateScreenSize: () => void;

  // Debug actions
  setDebugSettings: (settings: Partial<UIState["debug"]>) => void;
  toggleDebugMode: () => void;
  setLogLevel: (level: UIState["debug"]["logLevel"]) => void;

  // Utility actions
  resetUI: () => void;
  exportUISettings: () => Partial<UIState>;
  importUISettings: (settings: Partial<UIState>) => void;
}

const initialPanelsState = {
  stemMixer: true,
  gestureControl: true,
  performanceMonitor: false,
  aiAssistant: false,
  effectsRack: false,
  trackBrowser: false,
  settings: false,
};

const initialModalsState = {
  trackUpload: false,
  stemSeparation: false,
  gestureCalibration: false,
  settings: false,
  help: false,
  confirmation: false,
};

const initialDrawersState = {
  left: false,
  right: false,
  bottom: false,
};

const initialThemeState = {
  mode: "auto" as const,
  accentColor: "#3b82f6",
  fontSize: "medium" as const,
  animations: true,
  highContrast: false,
};

const initialPreferencesState = {
  autoSave: true,
  confirmActions: true,
  showTooltips: true,
  gestureFeedback: true,
  audioVisualization: true,
  keyboardShortcuts: true,
};

const initialTutorialState = {
  currentStep: 0,
  totalSteps: 5,
  completedSteps: [],
  isActive: false,
  progress: 0,
};

const initialResponsiveState = {
  isMobile: false,
  isTablet: false,
  screenSize: "lg" as const,
  orientation: "landscape" as const,
  touchDevice: false,
};

const initialDebugState = {
  showFPS: false,
  showLatency: false,
  showGestureData: false,
  showAudioBuffer: false,
  showStoreState: false,
  logLevel: "warn" as const,
};

export const createUIStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  UIStateSlice
> = (set, get) => ({
  // Initial state
  panels: { ...initialPanelsState },
  modals: { ...initialModalsState },
  drawers: { ...initialDrawersState },
  theme: { ...initialThemeState },
  preferences: { ...initialPreferencesState },
  tutorial: { ...initialTutorialState },
  responsive: { ...initialResponsiveState },
  debug: { ...initialDebugState },

  // Panel actions
  togglePanel: (panel) => {
    set((state) => ({
      ui: {
        ...state.ui,
        panels: {
          ...state.ui.panels,
          [panel]: !state.ui.panels[panel],
        },
      },
    }));
  },

  setPanelState: (panel, visible) => {
    set((state) => ({
      ui: {
        ...state.ui,
        panels: {
          ...state.ui.panels,
          [panel]: visible,
        },
      },
    }));
  },

  // Modal actions
  setModalState: (modal, open) => {
    set((state) => ({
      ui: {
        ...state.ui,
        modals: {
          ...state.ui.modals,
          [modal]: open,
        },
      },
    }));
  },

  openModal: (modal) => {
    set((state) => ({
      ui: {
        ...state.ui,
        modals: {
          ...state.ui.modals,
          [modal]: true,
        },
      },
    }));
  },

  closeModal: (modal) => {
    set((state) => ({
      ui: {
        ...state.ui,
        modals: {
          ...state.ui.modals,
          [modal]: false,
        },
      },
    }));
  },

  closeAllModals: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        modals: { ...initialModalsState },
      },
    }));
  },

  // Drawer actions
  setDrawerState: (drawer, open) => {
    set((state) => ({
      ui: {
        ...state.ui,
        drawers: {
          ...state.ui.drawers,
          [drawer]: open,
        },
      },
    }));
  },

  toggleDrawer: (drawer) => {
    set((state) => ({
      ui: {
        ...state.ui,
        drawers: {
          ...state.ui.drawers,
          [drawer]: !state.ui.drawers[drawer],
        },
      },
    }));
  },

  // Theme actions
  setTheme: (theme) => {
    set((state) => ({
      ui: {
        ...state.ui,
        theme: {
          ...state.ui.theme,
          ...theme,
        },
      },
    }));
  },

  setThemeMode: (mode) => {
    set((state) => ({
      ui: {
        ...state.ui,
        theme: {
          ...state.ui.theme,
          mode,
        },
      },
    }));
  },

  setAccentColor: (color) => {
    set((state) => ({
      ui: {
        ...state.ui,
        theme: {
          ...state.ui.theme,
          accentColor: color,
        },
      },
    }));
  },

  toggleTheme: () => {
    set((state) => {
      const currentMode = state.ui.theme.mode;
      const newMode =
        currentMode === "light"
          ? "dark"
          : currentMode === "dark"
            ? "light"
            : "dark";

      return {
        ui: {
          ...state.ui,
          theme: {
            ...state.ui.theme,
            mode: newMode,
          },
        },
      };
    });
  },

  // Preferences actions
  setPreferences: (preferences) => {
    set((state) => ({
      ui: {
        ...state.ui,
        preferences: {
          ...state.ui.preferences,
          ...preferences,
        },
      },
    }));
  },

  togglePreference: (preference) => {
    set((state) => ({
      ui: {
        ...state.ui,
        preferences: {
          ...state.ui.preferences,
          [preference]: !state.ui.preferences[preference],
        },
      },
    }));
  },

  // Tutorial actions
  setTutorialStep: (step) => {
    const clampedStep = Math.max(
      0,
      Math.min(get().ui.tutorial.totalSteps - 1, step),
    );

    set((state) => ({
      ui: {
        ...state.ui,
        tutorial: {
          ...state.ui.tutorial,
          currentStep: clampedStep,
          progress: (clampedStep / state.ui.tutorial.totalSteps) * 100,
        },
      },
    }));
  },

  nextTutorialStep: () => {
    set((state) => {
      const currentStep = state.ui.tutorial.currentStep;
      const clampedStep = Math.max(
        0,
        Math.min(state.ui.tutorial.totalSteps - 1, currentStep + 1),
      );

      return {
        ui: {
          ...state.ui,
          tutorial: {
            ...state.ui.tutorial,
            currentStep: clampedStep,
            progress: (clampedStep / state.ui.tutorial.totalSteps) * 100,
          },
        },
      };
    });
  },

  prevTutorialStep: () => {
    set((state) => {
      const currentStep = state.ui.tutorial.currentStep;
      const clampedStep = Math.max(
        0,
        Math.min(state.ui.tutorial.totalSteps - 1, currentStep - 1),
      );

      return {
        ui: {
          ...state.ui,
          tutorial: {
            ...state.ui.tutorial,
            currentStep: clampedStep,
            progress: (clampedStep / state.ui.tutorial.totalSteps) * 100,
          },
        },
      };
    });
  },

  completeTutorialStep: (step) => {
    set((state) => ({
      ui: {
        ...state.ui,
        tutorial: {
          ...state.ui.tutorial,
          completedSteps: [
            ...new Set([...state.ui.tutorial.completedSteps, step]),
          ],
        },
      },
    }));
  },

  resetTutorial: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        tutorial: { ...initialTutorialState },
      },
    }));
  },

  setTutorialActive: (active) => {
    set((state) => ({
      ui: {
        ...state.ui,
        tutorial: {
          ...state.ui.tutorial,
          isActive: active,
        },
      },
    }));
  },

  updateTutorialProgress: (progress) => {
    set((state) => ({
      ui: {
        ...state.ui,
        tutorial: {
          ...state.ui.tutorial,
          progress: Math.max(0, Math.min(100, progress)),
        },
      },
    }));
  },

  // Responsive actions
  setResponsiveState: (state) => {
    set((stateStore) => ({
      ui: {
        ...stateStore.ui,
        responsive: {
          ...stateStore.ui.responsive,
          ...state,
        },
      },
    }));
  },

  updateScreenSize: () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let screenSize: UIState["responsive"]["screenSize"] = "lg";
    let isMobile = false;
    let isTablet = false;

    if (width < 640) {
      screenSize = "xs";
      isMobile = true;
    } else if (width < 768) {
      screenSize = "sm";
      isMobile = true;
    } else if (width < 1024) {
      screenSize = "md";
      isTablet = true;
    } else if (width < 1280) {
      screenSize = "lg";
    } else {
      screenSize = "xl";
    }

    const orientation: UIState["responsive"]["orientation"] =
      width > height ? "landscape" : "portrait";

    const touchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    set((state) => ({
      ui: {
        ...state.ui,
        responsive: {
          ...state.ui.responsive,
          screenSize,
          isMobile,
          isTablet,
          orientation,
          touchDevice,
        },
      },
    }));
  },

  // Debug actions
  setDebugSettings: (settings) => {
    set((state) => ({
      ui: {
        ...state.ui,
        debug: {
          ...state.ui.debug,
          ...settings,
        },
      },
    }));
  },

  toggleDebugMode: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        debug: {
          ...state.ui.debug,
          showFPS: !state.ui.debug.showFPS,
          showLatency: !state.ui.debug.showLatency,
          showGestureData: !state.ui.debug.showGestureData,
        },
      },
    }));
  },

  setLogLevel: (level) => {
    set((state) => ({
      ui: {
        ...state.ui,
        debug: {
          ...state.ui.debug,
          logLevel: level,
        },
      },
    }));
  },

  // Utility actions
  resetUI: () => {
    set((state) => ({
      ui: {
        panels: { ...initialPanelsState },
        modals: { ...initialModalsState },
        drawers: { ...initialDrawersState },
        theme: { ...initialThemeState },
        preferences: { ...initialPreferencesState },
        tutorial: { ...initialTutorialState },
        responsive: { ...initialResponsiveState },
        debug: { ...initialDebugState },
      },
    }));
  },

  exportUISettings: () => {
    const { ui } = get();
    return {
      theme: ui.theme,
      preferences: ui.preferences,
      panels: ui.panels,
      debug: ui.debug,
    };
  },

  importUISettings: (settings) => {
    set((state) => ({
      ui: {
        ...state.ui,
        ...settings,
      },
    }));
  },
});
