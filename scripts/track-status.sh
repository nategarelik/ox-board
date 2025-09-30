#!/bin/bash
# scripts/track-status.sh
# Monitor status of all parallel tracks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BOLD}=== OX Board: Self-Hosted Demucs Implementation Status ===${NC}\n"

# Function to check track status
check_track_status() {
    local track=$1
    local track_name=$2
    local checkpoint_dir="$PROJECT_ROOT/.roo/checkpoints/$track"

    if [[ -d "$checkpoint_dir" ]]; then
        local latest_checkpoint=$(ls -t "$checkpoint_dir" 2>/dev/null | head -1)
        if [[ -n "$latest_checkpoint" ]]; then
            echo -e "${GREEN}✓${NC} $track_name"
            echo -e "  Last checkpoint: $latest_checkpoint"
        else
            echo -e "${YELLOW}⧗${NC} $track_name (In Progress)"
        fi
    else
        echo -e "${BLUE}○${NC} $track_name (Not Started)"
    fi
}

# Function to show test coverage
show_coverage() {
    local component=$1
    local coverage_file=$2

    if [[ -f "$coverage_file" ]]; then
        local coverage=$(grep -oP 'TOTAL.*\K\d+(?=%)' "$coverage_file" | tail -1)
        if [[ -n "$coverage" ]]; then
            if [[ $coverage -ge 80 ]]; then
                echo -e "  Coverage: ${GREEN}${coverage}%${NC}"
            else
                echo -e "  Coverage: ${RED}${coverage}%${NC} (Below 80%)"
            fi
        fi
    fi
}

# Track statuses
echo -e "${BOLD}Track A: Backend Infrastructure${NC}"
check_track_status "track-a" "Backend Services"
show_coverage "Backend" "$PROJECT_ROOT/backend/htmlcov/index.html"

if [[ -d "$PROJECT_ROOT/backend/venv" ]]; then
    echo -e "  ${GREEN}✓${NC} Python environment ready"
fi

if [[ -f "$PROJECT_ROOT/backend/requirements.txt" ]]; then
    echo -e "  ${GREEN}✓${NC} Dependencies defined"
fi

echo ""

# Track B
echo -e "${BOLD}Track B: Frontend Integration${NC}"
check_track_status "track-b" "Frontend Components"

if [[ -d "$PROJECT_ROOT/app/node_modules" ]]; then
    echo -e "  ${GREEN}✓${NC} Node modules installed"
fi

# Check for mocks in production code
mock_count=$(grep -r "mock" "$PROJECT_ROOT/app/src" --exclude-dir=__tests__ 2>/dev/null | grep -v test | wc -l || echo 0)
if [[ $mock_count -eq 0 ]]; then
    echo -e "  ${GREEN}✓${NC} No mocks in production code"
else
    echo -e "  ${RED}✗${NC} $mock_count mock references found"
fi

echo ""

# Track C
echo -e "${BOLD}Track C: API Migration${NC}"
check_track_status "track-c" "API Endpoints"

if [[ -f "$PROJECT_ROOT/specs/003-self-hosted-demucs/contracts/openapi.yaml" ]]; then
    echo -e "  ${GREEN}✓${NC} OpenAPI contract defined"
fi

echo ""

# Track D
echo -e "${BOLD}Track D: Testing Infrastructure${NC}"
check_track_status "track-d" "Test Suite"

# Backend test count
if [[ -d "$PROJECT_ROOT/backend/tests" ]]; then
    backend_tests=$(find "$PROJECT_ROOT/backend/tests" -name "test_*.py" | wc -l)
    echo -e "  Backend tests: $backend_tests files"
fi

# Frontend test count
if [[ -d "$PROJECT_ROOT/tests" ]]; then
    frontend_tests=$(find "$PROJECT_ROOT/tests" -name "*.test.tsx" -o -name "*.test.ts" | wc -l)
    echo -e "  Frontend tests: $frontend_tests files"
fi

echo ""

# Track E
echo -e "${BOLD}Track E: DevOps & Deployment${NC}"
check_track_status "track-e" "Infrastructure"

if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
    echo -e "  ${GREEN}✓${NC} Docker Compose configured"
fi

# Check if services are running
if command -v docker &> /dev/null; then
    running_services=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l || echo 0)
    if [[ $running_services -gt 0 ]]; then
        echo -e "  ${GREEN}✓${NC} $running_services services running"
    else
        echo -e "  ${YELLOW}⧗${NC} No services running"
    fi
fi

echo ""

# Overall progress
echo -e "${BOLD}=== Overall Progress ===${NC}"

# Count completed checkpoints
total_checkpoints=0
for track in track-a track-b track-c track-d track-e; do
    checkpoint_dir="$PROJECT_ROOT/.roo/checkpoints/$track"
    if [[ -d "$checkpoint_dir" ]] && [[ -n "$(ls -A "$checkpoint_dir" 2>/dev/null)" ]]; then
        ((total_checkpoints++))
    fi
done

progress=$((total_checkpoints * 20))
echo -e "Tracks completed: $total_checkpoints/5 (${progress}%)"

# Progress bar
bar_length=50
filled_length=$((bar_length * total_checkpoints / 5))
empty_length=$((bar_length - filled_length))

bar=$(printf "%${filled_length}s" | tr ' ' '█')
bar+=$(printf "%${empty_length}s" | tr ' ' '░')

echo -e "[${GREEN}${bar}${NC}]"

echo ""
echo -e "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "Refresh: ${BLUE}watch -n 5 ./scripts/track-status.sh${NC}"