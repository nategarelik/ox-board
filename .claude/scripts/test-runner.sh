#!/bin/bash

# Test Runner Script for ox-board
# Optimized for Claude Code test-runner agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT=$(pwd)
TEST_RESULTS_DIR="${PROJECT_ROOT}/.claude/test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "OX-BOARD TEST RUNNER"
echo "=========================================="
echo "Timestamp: ${TIMESTAMP}"
echo "Project Root: ${PROJECT_ROOT}"
echo ""

# Create test results directory
mkdir -p "${TEST_RESULTS_DIR}"

# Parse arguments
TEST_PATTERN=""
COVERAGE=false
WATCH=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --pattern)
      TEST_PATTERN="$2"
      shift 2
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Build test command
TEST_CMD="npm test"

if [ ! -z "$TEST_PATTERN" ]; then
  TEST_CMD="${TEST_CMD} -- --testNamePattern=\"${TEST_PATTERN}\""
fi

if [ "$COVERAGE" = true ]; then
  TEST_CMD="${TEST_CMD} -- --coverage"
fi

if [ "$WATCH" = true ]; then
  TEST_CMD="${TEST_CMD} -- --watch"
fi

if [ "$VERBOSE" = true ]; then
  TEST_CMD="${TEST_CMD} -- --verbose"
fi

# Add JSON reporter for structured output
TEST_CMD="${TEST_CMD} -- --json --outputFile=${TEST_RESULTS_DIR}/results_${TIMESTAMP}.json"

# Check dependencies
echo -e "${YELLOW}Checking test dependencies...${NC}"
npm list jest @testing-library/react ts-jest --depth=0 > /dev/null 2>&1 || {
  echo -e "${RED}Missing test dependencies. Installing...${NC}"
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
}

# Clear Jest cache
echo -e "${YELLOW}Clearing Jest cache...${NC}"
npx jest --clearCache

# Run tests
echo -e "${GREEN}Running tests...${NC}"
echo "Command: ${TEST_CMD}"
echo ""

# Execute tests and capture output
OUTPUT_FILE="${TEST_RESULTS_DIR}/output_${TIMESTAMP}.log"
if eval "${TEST_CMD}" 2>&1 | tee "${OUTPUT_FILE}"; then
  TEST_EXIT_CODE=0
  echo -e "\n${GREEN}✓ All tests passed!${NC}"
else
  TEST_EXIT_CODE=$?
  echo -e "\n${RED}✗ Tests failed with exit code ${TEST_EXIT_CODE}${NC}"
fi

# Parse results if JSON output exists
JSON_FILE="${TEST_RESULTS_DIR}/results_${TIMESTAMP}.json"
if [ -f "${JSON_FILE}" ]; then
  echo ""
  echo "=========================================="
  echo "TEST SUMMARY"
  echo "=========================================="

  # Extract summary using Node.js
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('${JSON_FILE}', 'utf8'));
    const results = data.testResults || [];

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    results.forEach(suite => {
      suite.assertionResults.forEach(test => {
        totalTests++;
        if (test.status === 'passed') passedTests++;
        else if (test.status === 'failed') failedTests++;
        else if (test.status === 'skipped' || test.status === 'pending') skippedTests++;
      });
    });

    console.log('Total Tests:', totalTests);
    console.log('Passed:', passedTests);
    console.log('Failed:', failedTests);
    console.log('Skipped:', skippedTests);
    console.log('Success Rate:', totalTests > 0 ? ((passedTests/totalTests)*100).toFixed(1) + '%' : 'N/A');
  "
fi

# Coverage report
if [ "$COVERAGE" = true ] && [ -d "coverage" ]; then
  echo ""
  echo "=========================================="
  echo "COVERAGE REPORT"
  echo "=========================================="

  # Display coverage summary
  if [ -f "coverage/coverage-summary.json" ]; then
    node -e "
      const fs = require('fs');
      const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
      const total = coverage.total;

      console.log('Lines:', total.lines.pct + '%');
      console.log('Statements:', total.statements.pct + '%');
      console.log('Functions:', total.functions.pct + '%');
      console.log('Branches:', total.branches.pct + '%');
    "
  fi

  # Copy coverage to test results
  cp -r coverage "${TEST_RESULTS_DIR}/coverage_${TIMESTAMP}"
fi

# Failed test details
if [ $TEST_EXIT_CODE -ne 0 ] && [ -f "${JSON_FILE}" ]; then
  echo ""
  echo "=========================================="
  echo "FAILED TEST DETAILS"
  echo "=========================================="

  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('${JSON_FILE}', 'utf8'));
    const results = data.testResults || [];

    results.forEach(suite => {
      const failed = suite.assertionResults.filter(test => test.status === 'failed');
      if (failed.length > 0) {
        console.log('\nFile:', suite.name);
        failed.forEach(test => {
          console.log('  ✗', test.fullName || test.title);
          if (test.failureMessages && test.failureMessages.length > 0) {
            console.log('    Error:', test.failureMessages[0].substring(0, 200));
          }
        });
      }
    });
  "
fi

echo ""
echo "=========================================="
echo "Test results saved to: ${TEST_RESULTS_DIR}"
echo "=========================================="

exit $TEST_EXIT_CODE