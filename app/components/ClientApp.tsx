"use client";

import { TerminalApp } from "./terminal";

/**
 * OX Board Main Application
 * Terminal UI is the primary and only active interface
 *
 * Other UI implementations are preserved in ui-archive/ for reference:
 * - Professional DJ Interface (ui-archive/professional-dj/)
 * - Stem Player Dashboard (ui-archive/stem-player/)
 * - Visualizations (ui-archive/visualizations/)
 */
export default function ClientApp() {
  return <TerminalApp />;
}
