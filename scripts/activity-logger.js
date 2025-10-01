#!/usr/bin/env node

/**
 * Activity Logger
 * Logs development activities to a local log file for tracking and analysis
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const LOG_DIR = path.join(__dirname, "../.github/activity-logs");
const LOG_FILE = path.join(
  LOG_DIR,
  `dev-activity-${new Date().toISOString().split("T")[0]}.jsonl`,
);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Get git information
 */
function getGitInfo() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();
    const sha = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    const author = execSync("git config user.name", {
      encoding: "utf-8",
    }).trim();
    const email = execSync("git config user.email", {
      encoding: "utf-8",
    }).trim();

    return { branch, sha, author, email };
  } catch (error) {
    return {
      branch: "unknown",
      sha: "unknown",
      author: "unknown",
      email: "unknown",
    };
  }
}

/**
 * Log an activity
 */
function logActivity(type, details = {}) {
  const gitInfo = getGitInfo();

  const entry = {
    timestamp: new Date().toISOString(),
    type,
    git: gitInfo,
    details,
    session: process.env.SESSION_ID || "local-dev",
  };

  // Append to log file (JSONL format - one JSON object per line)
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");

  console.log(`✓ Activity logged: ${type}`);
  return entry;
}

/**
 * Get recent activities
 */
function getRecentActivities(count = 10) {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  const content = fs.readFileSync(LOG_FILE, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);

  return lines
    .slice(-count)
    .map((line) => JSON.parse(line))
    .reverse();
}

/**
 * Generate activity report
 */
function generateReport() {
  const activities = getRecentActivities(100);

  const report = {
    total: activities.length,
    byType: {},
    byBranch: {},
    timeline: activities.map((a) => ({
      time: a.timestamp,
      type: a.type,
      branch: a.git.branch,
    })),
  };

  // Count by type
  activities.forEach((a) => {
    report.byType[a.type] = (report.byType[a.type] || 0) + 1;
    report.byBranch[a.git.branch] = (report.byBranch[a.git.branch] || 0) + 1;
  });

  return report;
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "log":
      const type = args[1] || "development";
      const details = args[2] ? JSON.parse(args[2]) : {};
      logActivity(type, details);
      break;

    case "recent":
      const count = parseInt(args[1]) || 10;
      const recent = getRecentActivities(count);
      console.log(JSON.stringify(recent, null, 2));
      break;

    case "report":
      const report = generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    default:
      console.log(`
Activity Logger Usage:

  node scripts/activity-logger.js log <type> [details]
    Log a development activity
    Example: node scripts/activity-logger.js log "feature" '{"name":"terminal-ui"}'

  node scripts/activity-logger.js recent [count]
    Show recent activities (default: 10)
    Example: node scripts/activity-logger.js recent 20

  node scripts/activity-logger.js report
    Generate activity report
    Example: node scripts/activity-logger.js report
      `);
  }
}

module.exports = {
  logActivity,
  getRecentActivities,
  generateReport,
};
