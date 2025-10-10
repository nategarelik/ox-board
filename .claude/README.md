# Claude Code Configuration

This directory contains Claude Code configuration for the OX Board project.

## Structure

```
.claude/
├── agents/                          # Agent definitions
│   ├── opus-planner.md             # High-complexity planning agent
│   ├── claude-config-maintainer.md # Configuration management agent
│   ├── unity-builder.md            # Unity development agent
│   ├── researcher.md               # Research and documentation agent
│   └── life-ops.md                 # Email/calendar management agent
├── policies/                        # Security and permission policies
│   ├── permissions.json            # Auto-approve and deny lists
│   └── security.json               # MCP server allowlist and security
├── state/                           # Runtime state (gitignored)
│   ├── artifacts/                  # Offloaded bulky content
│   ├── thinking/                   # Extended thinking outputs
│   └── summaries/                  # Artifact summaries
├── checkpoints/                     # Recovery points (gitignored)
└── settings.local.json             # Local Claude Code settings
```

## Quick Start

### Agent Usage

Agents are invoked by name for specific activities:

```
# High-complexity planning
"Opus Planner: Design architecture for [feature]"

# Configuration management
"Config Maintainer: Optimize context usage"

# Unity development
"Unity Builder: Create [component]"

# Research
"Researcher: Analyze [technology/pattern]"

# Email/Calendar
"Life-Ops: Triage my inbox"
```

### The Agentic Startup Commands

```
/s:specify [idea]    # Generate PRD, SDD, implementation plan
/s:implement         # Execute phase-by-phase with approval gates
/s:refactor [target] # Improve code quality without breaking
/s:analyze [system]  # Discover and document system knowledge
```

### Checkpoint System

```
/s:checkpoint [name] # Save recovery point
/s:resume [id]       # Restore from checkpoint
```

## Configuration Files

### permissions.json

Defines what Claude Code can do automatically:

- **auto_approve**: Operations that don't need permission
- **deny**: Hard blocked destructive operations
- **ask**: Operations requiring user approval

### security.json

MCP server configuration and security policies:

- Gmail and Google Calendar integration
- OAuth2 authentication
- Rate limiting
- Audit logging

### settings.local.json

Local Claude Code settings (not checked into git):

- Permission overrides
- User-specific preferences

## Agent System

### 11 Role Archetypes (39 Activities)

1. **The Chief** - Orchestration & Leadership
2. **The Analyst** - Requirements & Research
3. **The Architect** - System Design
4. **The Software Engineer** - Core Development
5. **The Platform Engineer** - Infrastructure
6. **The Designer** - User Experience
7. **The QA Engineer** - Testing
8. **The Security Engineer** - Protection
9. **The Mobile Engineer** - Mobile Development
10. **The ML Engineer** - AI/ML Operations
11. **The Meta Agent** - Agent Evolution

### 5 Concrete Subagents

1. **Opus Planner** - High-complexity planning (Opus 4.1)
2. **Config Maintainer** - Configuration and context management
3. **Unity Builder** - Unity development specialist
4. **Researcher** - File-first research with artifact offload
5. **Life-Ops** - Email/calendar management via MCP

## Model Policy

- **Default**: Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Planning**: Opus 4.1 for complexity > 8 (`claude-opus-4-1-20250805`)
- **Extended Thinking**: OFF by default, enable per-task with 5000ms budget

## Safety & Permissions

### Auto-Approved

- ✅ Read files, grep, glob
- ✅ Git branch, commit, PR creation
- ✅ Write to project directories
- ✅ Whitelisted commands (npm, python, docker, gh copilot)

### Requires Approval

- ⚠️ Non-whitelisted shell commands
- ⚠️ Network operations
- ⚠️ CI/CD changes
- ⚠️ File deletions

### Hard Deny

- ❌ `git push --force`
- ❌ `rm -rf /*`
- ❌ `terraform destroy`
- ❌ Plus 15+ more destructive operations

## Token Management

### Artifact Offload Strategy

1. Identify bulky content (>5000 tokens)
2. Write to `.claude/state/artifacts/`
3. Summarize back into context
4. Reference artifact for details
5. Clean up when no longer needed

### Recovery from Context Overflow

1. Detect `model_context_window_exceeded`
2. Trim and summarize large content
3. Resume from last checkpoint
4. Continue execution

## MCP Integration

### Enabled Services

- ✅ Gmail (`@modelcontextprotocol/server-gmail` ^0.6.2)
- ✅ Google Calendar (`@modelcontextprotocol/server-google-calendar` ^0.1.0)

### Security

- OAuth2 authentication required
- All operations logged to `.claude/security-audit.log`
- Rate limited (60/min Gmail, 30/min Calendar)
- Minimal scopes
- Never permanently deletes emails

## Development Workflow

### Specification-Driven

1. Create constitution (project principles)
2. Generate specification (PRD, SDD)
3. Clarify requirements
4. Create technical plan
5. Generate task breakdown
6. Implement with parallel execution

### Parallel Execution Tracks

- Track A: Backend Infrastructure
- Track B: Frontend Development
- Track C: Integration
- Track D: Testing
- Track E: DevOps & Documentation
- Track F: Version Control

## Quality Standards

- 80%+ test coverage
- <200ms API response times
- Zero critical security issues
- 90%+ documentation completeness
- Clean, readable code
- Comprehensive error handling

## More Information

- See `CLAUDE.md` in project root for full instructions
- See `CONFIGURATION-OVERVIEW.md` for detailed conceptual overview
- See `UNIFIED-CONFIG-ANALYSIS.md` for design decisions
