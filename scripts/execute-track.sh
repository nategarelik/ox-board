#!/bin/bash
# scripts/execute-track.sh
# Execute specific track with agent delegation

set -e

TRACK=$1
TASKS=$2
MODE=${3:-"sequential"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Track configuration
declare -A TRACK_CONFIG=(
    ["track-a"]="Backend Infrastructure|backend|Software Engineer + ML Engineer"
    ["track-b"]="Frontend Integration|app|Software Engineer (Frontend) + Designer"
    ["track-c"]="API Migration|backend/api,app/api|Software Engineer (Full-Stack) + Architect"
    ["track-d"]="Testing Infrastructure|tests,backend/tests|QA Engineer + Software Engineer"
    ["track-e"]="DevOps Deployment|infrastructure,docker,.github|Platform Engineer + Security Engineer"
)

# Validate track
if [[ -z "${TRACK_CONFIG[$TRACK]}" ]]; then
    log_error "Invalid track: $TRACK"
    echo "Valid tracks: ${!TRACK_CONFIG[@]}"
    exit 1
fi

IFS='|' read -r TRACK_NAME WORK_DIR AGENTS <<< "${TRACK_CONFIG[$TRACK]}"

log_info "=== Executing Track: $TRACK_NAME ==="
log_info "Working Directory: $WORK_DIR"
log_info "Agents: $AGENTS"
log_info "Tasks: $TASKS"
log_info "Mode: $MODE"

# Create track log directory
LOG_DIR="$PROJECT_ROOT/logs/$TRACK"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/execution_${TIMESTAMP}.log"

log_info "Logging to: $LOG_FILE"

# Create checkpoint
checkpoint() {
    local checkpoint_name=$1
    local checkpoint_dir="$PROJECT_ROOT/.roo/checkpoints/$TRACK"
    mkdir -p "$checkpoint_dir"

    local checkpoint_file="$checkpoint_dir/${checkpoint_name}_${TIMESTAMP}.json"

    cat > "$checkpoint_file" << EOF
{
  "track": "$TRACK",
  "track_name": "$TRACK_NAME",
  "checkpoint_name": "$checkpoint_name",
  "timestamp": "$(date -Iseconds)",
  "tasks": "$TASKS",
  "mode": "$MODE",
  "agents": "$AGENTS",
  "working_directory": "$WORK_DIR",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'N/A')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'N/A')"
}
EOF

    log_success "Checkpoint saved: $checkpoint_name"
}

# Execute based on track
execute_track_a() {
    log_info "Executing Track A: Backend Infrastructure"

    cd "$PROJECT_ROOT/backend" 2>/dev/null || mkdir -p "$PROJECT_ROOT/backend"

    # Setup Python environment
    if [[ ! -d "venv" ]]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi

    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || {
        log_error "Failed to activate virtual environment"
        exit 1
    }

    # Install dependencies if requirements.txt exists
    if [[ -f "requirements.txt" ]]; then
        log_info "Installing Python dependencies..."
        pip install -r requirements.txt --quiet
    fi

    # Run tests if mode is TDD
    if [[ "$MODE" == "--tdd" ]]; then
        log_info "Running tests (TDD mode)..."
        pytest --cov=backend --cov-report=term-missing --cov-fail-under=80 || {
            log_warn "Tests failed (expected in TDD mode)"
        }
    fi

    checkpoint "track-a-complete"
}

execute_track_b() {
    log_info "Executing Track B: Frontend Integration"

    cd "$PROJECT_ROOT/app"

    # Install dependencies
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing Node dependencies..."
        npm install --silent
    fi

    # Type check
    log_info "Running TypeScript type check..."
    npm run type-check || {
        log_error "Type check failed"
        exit 1
    }

    # Run tests
    if [[ "$MODE" != "--no-test" ]]; then
        log_info "Running frontend tests..."
        npm test -- --coverage --watchAll=false
    fi

    checkpoint "track-b-complete"
}

execute_track_c() {
    log_info "Executing Track C: API Migration"

    # Validate API contracts
    log_info "Validating API contracts..."

    if [[ -f "$PROJECT_ROOT/specs/003-self-hosted-demucs/contracts/openapi.yaml" ]]; then
        log_success "OpenAPI contract found"
    else
        log_warn "OpenAPI contract not found"
    fi

    # Run contract tests
    cd "$PROJECT_ROOT/backend"
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

    log_info "Running contract tests..."
    pytest tests/test_contracts.py -v || {
        log_warn "Contract tests failed (expected if endpoints not implemented)"
    }

    checkpoint "track-c-complete"
}

execute_track_d() {
    log_info "Executing Track D: Testing Infrastructure"

    # Backend tests
    log_info "Running backend test suite..."
    cd "$PROJECT_ROOT/backend"
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

    pytest --cov=backend --cov-report=html --cov-report=term-missing --cov-fail-under=80

    # Frontend tests
    log_info "Running frontend test suite..."
    cd "$PROJECT_ROOT/app"
    npm test -- --coverage --watchAll=false --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'

    checkpoint "track-d-complete"
}

execute_track_e() {
    log_info "Executing Track E: DevOps & Deployment"

    cd "$PROJECT_ROOT"

    # Docker environment check
    if ! command -v docker &> /dev/null; then
        log_error "Docker not installed"
        exit 1
    fi

    log_info "Building Docker images..."
    docker-compose build || {
        log_error "Docker build failed"
        exit 1
    }

    log_info "Starting services..."
    docker-compose up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10

    # Health check
    log_info "Running health checks..."
    curl -f http://localhost:8000/health || {
        log_error "Backend health check failed"
        docker-compose logs backend
        exit 1
    }

    log_success "All services healthy"

    checkpoint "track-e-complete"
}

# Execute based on track
case $TRACK in
    track-a)
        execute_track_a 2>&1 | tee "$LOG_FILE"
        ;;
    track-b)
        execute_track_b 2>&1 | tee "$LOG_FILE"
        ;;
    track-c)
        execute_track_c 2>&1 | tee "$LOG_FILE"
        ;;
    track-d)
        execute_track_d 2>&1 | tee "$LOG_FILE"
        ;;
    track-e)
        execute_track_e 2>&1 | tee "$LOG_FILE"
        ;;
    *)
        log_error "Unknown track: $TRACK"
        exit 1
        ;;
esac

log_success "=== Track $TRACK_NAME Complete ==="
log_info "Log file: $LOG_FILE"