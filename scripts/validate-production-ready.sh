#!/bin/bash
# scripts/validate-production-ready.sh
# Comprehensive production readiness validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

FAILED_CHECKS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

check_result() {
    if [[ $? -eq 0 ]]; then
        log_success "$1"
    else
        log_error "$1"
    fi
}

echo -e "${BOLD}=== Production Readiness Validation ===${NC}\n"

# 1. NO MOCKS IN PRODUCTION CODE
echo -e "${BOLD}1. Validating No Mocks in Production Code${NC}"

log_info "Checking app/src for mock implementations..."
mock_count=$(grep -r "mock" "$PROJECT_ROOT/app/src" --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null | grep -v test | wc -l || echo 0)

if [[ $mock_count -eq 0 ]]; then
    log_success "No mocks found in production code"
else
    log_error "Found $mock_count mock references in production code"
    grep -r "mock" "$PROJECT_ROOT/app/src" --exclude-dir=__tests__ --exclude-dir=node_modules 2>/dev/null | grep -v test | head -10
fi

log_info "Checking for silent audio generation..."
if grep -r "silent-audio" "$PROJECT_ROOT/app/src" 2>/dev/null | grep -v test | grep -v comment; then
    log_error "Found silent audio references in production code"
else
    log_success "No silent audio generation in production"
fi

log_info "Checking for mock progress simulation..."
if grep -r "fake.*progress\|simulate.*progress" "$PROJECT_ROOT/app/src" 2>/dev/null | grep -v test; then
    log_error "Found mock progress simulation"
else
    log_success "No mock progress simulation"
fi

echo ""

# 2. TEST COVERAGE
echo -e "${BOLD}2. Validating Test Coverage (80%+ Required)${NC}"

log_info "Running backend tests with coverage..."
cd "$PROJECT_ROOT/backend"

if [[ -d "venv" ]]; then
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
fi

if [[ -f "requirements.txt" ]]; then
    pytest --cov=backend --cov-report=term --cov-report=html --cov-fail-under=80 > /tmp/backend-cov.txt 2>&1
    check_result "Backend coverage ≥80%"

    backend_coverage=$(grep -oP 'TOTAL.*\K\d+(?=%)' /tmp/backend-cov.txt | tail -1)
    log_info "Backend coverage: ${backend_coverage}%"
else
    log_warn "Backend requirements.txt not found, skipping backend tests"
fi

cd "$PROJECT_ROOT"

log_info "Running frontend tests with coverage..."
if [[ -d "$PROJECT_ROOT/app/node_modules" ]]; then
    cd "$PROJECT_ROOT/app"
    npm test -- --coverage --watchAll=false --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}' > /tmp/frontend-cov.txt 2>&1
    check_result "Frontend coverage ≥80%"
else
    log_warn "Node modules not installed, skipping frontend tests"
fi

echo ""

# 3. CODE QUALITY
echo -e "${BOLD}3. Validating Code Quality${NC}"

log_info "Checking Python code with flake8..."
cd "$PROJECT_ROOT/backend"
if command -v flake8 &> /dev/null; then
    flake8 backend/ --max-line-length=100 --exclude=venv,__pycache__ || {
        log_error "Flake8 found code quality issues"
    }
else
    log_warn "flake8 not installed"
fi

log_info "Checking Python type hints with mypy..."
if command -v mypy &> /dev/null; then
    mypy backend/ --ignore-missing-imports || {
        log_error "mypy found type issues"
    }
else
    log_warn "mypy not installed"
fi

cd "$PROJECT_ROOT"

log_info "Checking TypeScript compilation..."
cd "$PROJECT_ROOT/app"
if [[ -f "package.json" ]]; then
    npm run type-check > /dev/null 2>&1
    check_result "TypeScript compiles without errors"
else
    log_warn "Frontend package.json not found"
fi

echo ""

# 4. SECURITY VALIDATION
echo -e "${BOLD}4. Validating Security${NC}"

log_info "Checking for hardcoded secrets..."
cd "$PROJECT_ROOT"

if grep -r "password.*=.*['\"]" --include="*.py" --include="*.ts" --include="*.tsx" . | grep -v test | grep -v example; then
    log_error "Found potential hardcoded passwords"
else
    log_success "No hardcoded passwords found"
fi

if grep -r "api_key.*=.*['\"]" --include="*.py" --include="*.ts" --include="*.tsx" . | grep -v test | grep -v placeholder; then
    log_error "Found potential hardcoded API keys"
else
    log_success "No hardcoded API keys found"
fi

log_info "Checking Python dependencies for vulnerabilities..."
cd "$PROJECT_ROOT/backend"
if command -v safety &> /dev/null && [[ -f "requirements.txt" ]]; then
    safety check -r requirements.txt || {
        log_error "Security vulnerabilities found in Python dependencies"
    }
else
    log_warn "safety not installed or requirements.txt missing"
fi

cd "$PROJECT_ROOT"

log_info "Checking Node dependencies for vulnerabilities..."
cd "$PROJECT_ROOT/app"
if [[ -f "package.json" ]]; then
    npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities" && {
        log_success "No high-severity npm vulnerabilities"
    } || {
        log_error "npm vulnerabilities found"
    }
fi

echo ""

# 5. INTEGRATION TESTS
echo -e "${BOLD}5. Validating Integration Tests${NC}"

cd "$PROJECT_ROOT/backend"
log_info "Running backend integration tests..."
if [[ -d "tests/integration" ]]; then
    pytest tests/integration/ -v || {
        log_error "Backend integration tests failed"
    }
    log_success "Backend integration tests passed"
else
    log_warn "No backend integration tests found"
fi

cd "$PROJECT_ROOT"
log_info "Running E2E tests..."
if [[ -d "tests/e2e" ]]; then
    npm run test:e2e || {
        log_error "E2E tests failed"
    }
    log_success "E2E tests passed"
else
    log_warn "No E2E tests found"
fi

echo ""

# 6. DOCKER VALIDATION
echo -e "${BOLD}6. Validating Docker Environment${NC}"

if ! command -v docker &> /dev/null; then
    log_error "Docker not installed"
else
    log_success "Docker installed"

    log_info "Checking docker-compose.yml..."
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log_success "docker-compose.yml exists"

        log_info "Validating docker-compose configuration..."
        docker-compose config > /dev/null 2>&1
        check_result "docker-compose.yml is valid"

        log_info "Building Docker images..."
        docker-compose build --quiet || {
            log_error "Docker build failed"
        }
        log_success "Docker images built successfully"

        log_info "Starting services..."
        docker-compose up -d

        sleep 15

        log_info "Checking service health..."
        if curl -f http://localhost:8000/health 2>/dev/null; then
            log_success "Backend health check passed"
        else
            log_error "Backend health check failed"
            docker-compose logs backend | tail -20
        fi

        log_info "Stopping services..."
        docker-compose down
    else
        log_error "docker-compose.yml not found"
    fi
fi

echo ""

# 7. DOCUMENTATION
echo -e "${BOLD}7. Validating Documentation${NC}"

log_info "Checking for API documentation..."
if [[ -f "$PROJECT_ROOT/specs/003-self-hosted-demucs/contracts/openapi.yaml" ]]; then
    log_success "OpenAPI specification exists"
else
    log_warn "OpenAPI specification not found"
fi

log_info "Checking for README..."
if [[ -f "$PROJECT_ROOT/README.md" ]]; then
    log_success "README.md exists"
else
    log_warn "README.md not found"
fi

log_info "Checking for quickstart guide..."
if [[ -f "$PROJECT_ROOT/specs/003-self-hosted-demucs/quickstart.md" ]]; then
    log_success "Quickstart guide exists"
else
    log_warn "Quickstart guide not found"
fi

echo ""

# 8. PERFORMANCE VALIDATION
echo -e "${BOLD}8. Validating Performance Benchmarks${NC}"

if [[ -f "$PROJECT_ROOT/backend/tests/performance/test_benchmarks.py" ]]; then
    log_info "Running performance benchmarks..."
    cd "$PROJECT_ROOT/backend"
    pytest tests/performance/test_benchmarks.py -v || {
        log_error "Performance benchmarks failed"
    }
    log_success "Performance benchmarks passed"
else
    log_warn "Performance benchmarks not found"
fi

echo ""

# FINAL SUMMARY
echo -e "${BOLD}=== Validation Summary ===${NC}\n"

if [[ $FAILED_CHECKS -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✓ ALL VALIDATION CHECKS PASSED${NC}"
    echo -e "${GREEN}System is PRODUCTION READY${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}✗ $FAILED_CHECKS VALIDATION CHECK(S) FAILED${NC}"
    echo -e "${RED}System is NOT production ready${NC}"
    echo ""
    echo -e "Please fix the issues above before deploying to production."
    exit 1
fi