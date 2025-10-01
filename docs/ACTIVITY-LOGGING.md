# Activity Logging System

> **Created**: 2025-10-01
> **Version**: 1.0.0

## Overview

The Activity Logging system tracks development activities both locally and via GitHub Actions, providing insights into project development patterns and team collaboration.

## Components

### 1. GitHub Actions Workflow

**File**: `.github/workflows/activity-logger.yml`

Automatically logs activities on:

- Pushes to `main` or `develop` branches
- Pull request events (opened, closed, reopened)
- Release publications
- Deployments

**Features**:

- Captures git metadata (branch, SHA, author, message)
- Generates JSON activity summaries
- Uploads logs as artifacts (90-day retention)
- Timestamps all activities in UTC

### 2. Local Activity Logger

**File**: `scripts/activity-logger.js`

Node.js script for logging local development activities.

**Features**:

- JSONL format (one JSON object per line)
- Git integration (auto-captures branch, SHA, author)
- CLI interface for easy use
- Daily log files

## Usage

### GitHub Actions (Automatic)

Activity logging happens automatically on relevant GitHub events. View logs in:

- Actions tab → Workflow run → Artifacts → `activity-logs-{run_number}`

### Local Development (Manual)

#### Log an Activity

```bash
npm run activity:log "feature" '{"name":"terminal-ui","status":"complete"}'
```

Or directly:

```bash
node scripts/activity-logger.js log "bug-fix" '{"issue":"#123","fixed":true}'
```

#### View Recent Activities

```bash
npm run activity:recent
# Shows last 10 activities

npm run activity:recent 20
# Shows last 20 activities
```

#### Generate Activity Report

```bash
npm run activity:report
```

Output example:

```json
{
  "total": 45,
  "byType": {
    "feature": 20,
    "bug-fix": 15,
    "refactor": 10
  },
  "byBranch": {
    "main": 30,
    "develop": 15
  },
  "timeline": [...]
}
```

## Activity Types

Recommended activity types:

- `feature` - New feature implementation
- `bug-fix` - Bug resolution
- `refactor` - Code refactoring
- `docs` - Documentation updates
- `test` - Test additions/updates
- `performance` - Performance optimizations
- `security` - Security improvements
- `deployment` - Production deployments
- `release` - Version releases

## Log Format

### GitHub Actions

```json
{
  "event": "push",
  "repository": "org/ox-board",
  "actor": "username",
  "ref": "refs/heads/main",
  "sha": "abc123...",
  "timestamp": "2025-10-01T19:30:00Z",
  "workflow": "Activity Logger",
  "run_id": "123456",
  "run_number": "42"
}
```

### Local Development (JSONL)

```json
{
  "timestamp": "2025-10-01T19:30:00Z",
  "type": "feature",
  "git": {
    "branch": "main",
    "sha": "abc123...",
    "author": "Developer",
    "email": "dev@example.com"
  },
  "details": { "name": "terminal-ui" },
  "session": "local-dev"
}
```

## Storage

### GitHub

- **Location**: GitHub Actions Artifacts
- **Retention**: 90 days
- **Format**: JSON files
- **Access**: Workflow run page → Artifacts

### Local

- **Location**: `.github/activity-logs/`
- **Format**: JSONL files (one per day)
- **Naming**: `dev-activity-YYYY-MM-DD.jsonl`
- **Git**: Ignored (not committed)

## Integration with Git Hooks

You can integrate activity logging with Git hooks for automatic tracking:

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
node scripts/activity-logger.js log "commit" '{"files":"$(git diff --cached --name-only | wc -l)"}'
```

### Post-commit Hook

```bash
#!/bin/sh
# .git/hooks/post-commit
MESSAGE=$(git log -1 --pretty=%B)
node scripts/activity-logger.js log "commit" "{\"message\":\"$MESSAGE\"}"
```

## Analysis & Reporting

### View Activity Patterns

```bash
# Get recent activities
npm run activity:recent 50 | jq '.[] | .type' | sort | uniq -c

# Generate report
npm run activity:report | jq '.byType'
```

### Export to CSV

```bash
# Export JSONL to CSV
cat .github/activity-logs/dev-activity-*.jsonl | \
  jq -r '[.timestamp, .type, .git.branch, .git.author] | @csv' > activity-report.csv
```

## Best Practices

1. **Log Consistently**: Use consistent activity types
2. **Add Context**: Include meaningful details in the details object
3. **Regular Reviews**: Check activity reports weekly
4. **Clean Old Logs**: Archive or delete local logs older than 90 days

## Security Considerations

- **No Secrets**: Never log sensitive data (API keys, passwords, tokens)
- **Privacy**: Be mindful of PII in log details
- **Access Control**: GitHub artifacts are private to repository contributors

## Troubleshooting

### Logs not appearing locally

Check that the log directory exists:

```bash
mkdir -p .github/activity-logs
```

### GitHub Actions not running

Verify workflow file syntax:

```bash
yamllint .github/workflows/activity-logger.yml
```

### Permission errors

Ensure script is executable:

```bash
chmod +x scripts/activity-logger.js
```

## Future Enhancements

- [ ] Dashboard visualization (web UI)
- [ ] Slack/Discord notifications
- [ ] Automatic issue/PR linking
- [ ] AI-powered activity analysis
- [ ] Integration with time tracking tools

---

**Documentation**: Updated 2025-10-01
**Status**: ✅ Production Ready
