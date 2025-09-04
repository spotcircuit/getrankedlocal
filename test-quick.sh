#!/bin/bash

# Quick Directory Structure Testing Script
# No dependencies required - uses curl and basic shell commands

BASE_URL="${1:-http://localhost:3001}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Directory Structure at $BASE_URL"
echo "================================================"

# Test URLs
declare -a TEST_URLS=(
  "/directory/medical-spas"
  "/directory/medical-spas/tx"
  "/directory/medical-spas/tx/austin"
  "/tx/austin/medspas"
)

# Initialize counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to test a URL
test_url() {
  local url="$1"
  local full_url="${BASE_URL}${url}"
  
  echo ""
  echo "📍 Testing: $url"
  echo "-------------------------------------------"
  
  # Fetch the page
  response=$(curl -s -o /tmp/test_page.html -w "%{http_code}" "$full_url")
  
  # Check HTTP status
  if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} HTTP Status: 200 OK"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} HTTP Status: $response"
    ((FAILED++))
    return
  fi
  
  # Check for canonical URL
  canonical=$(grep -o '<link rel="canonical"[^>]*>' /tmp/test_page.html | grep -o 'href="[^"]*"' | sed 's/href="//;s/"//')
  if [ ! -z "$canonical" ]; then
    if [[ "$canonical" == *"/directory/"* ]]; then
      echo -e "${GREEN}✓${NC} Canonical URL: $canonical (service-first)"
      ((PASSED++))
    else
      echo -e "${YELLOW}⚠${NC} Canonical URL: $canonical (not service-first)"
      ((WARNINGS++))
    fi
  else
    echo -e "${RED}✗${NC} No canonical URL found"
    ((FAILED++))
  fi
  
  # Check for title tag
  title=$(grep -o '<title>[^<]*</title>' /tmp/test_page.html | sed 's/<[^>]*>//g')
  if [ ! -z "$title" ]; then
    title_length=${#title}
    if [ $title_length -le 60 ]; then
      echo -e "${GREEN}✓${NC} Title: \"$title\" (${title_length} chars)"
      ((PASSED++))
    elif [ $title_length -le 70 ]; then
      echo -e "${YELLOW}⚠${NC} Title: \"$title\" (${title_length} chars - slightly long)"
      ((WARNINGS++))
    else
      echo -e "${RED}✗${NC} Title too long: ${title_length} chars"
      ((FAILED++))
    fi
  else
    echo -e "${RED}✗${NC} No title tag found"
    ((FAILED++))
  fi
  
  # Check for meta description
  meta_desc=$(grep -o '<meta name="description"[^>]*>' /tmp/test_page.html | grep -o 'content="[^"]*"' | sed 's/content="//;s/"//')
  if [ ! -z "$meta_desc" ]; then
    desc_length=${#meta_desc}
    if [ $desc_length -ge 120 ] && [ $desc_length -le 160 ]; then
      echo -e "${GREEN}✓${NC} Meta description: ${desc_length} chars (optimal)"
      ((PASSED++))
    else
      echo -e "${YELLOW}⚠${NC} Meta description: ${desc_length} chars (should be 120-160)"
      ((WARNINGS++))
    fi
  else
    echo -e "${RED}✗${NC} No meta description found"
    ((FAILED++))
  fi
  
  # Check for H1
  h1=$(grep -o '<h1[^>]*>[^<]*</h1>' /tmp/test_page.html | sed 's/<[^>]*>//g' | head -1)
  if [ ! -z "$h1" ]; then
    echo -e "${GREEN}✓${NC} H1: \"$h1\""
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} No H1 tag found"
    ((FAILED++))
  fi
  
  # Check for structured data
  structured_data_count=$(grep -c '<script type="application/ld+json">' /tmp/test_page.html)
  if [ $structured_data_count -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Structured data: $structured_data_count JSON-LD blocks found"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} No structured data found"
    ((FAILED++))
  fi
  
  # Check for dark theme
  if grep -q "bg-black\|bg-gray-900\|from-black\|background.*#000" /tmp/test_page.html; then
    echo -e "${GREEN}✓${NC} Dark theme detected"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} No dark theme styles found"
    ((FAILED++))
  fi
  
  # Check for breadcrumbs
  if grep -q "breadcrumb\|Breadcrumb" /tmp/test_page.html; then
    echo -e "${GREEN}✓${NC} Breadcrumb navigation found"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} No breadcrumb navigation found"
    ((WARNINGS++))
  fi
  
  # Check for Open Graph tags
  og_title=$(grep -c '<meta property="og:title"' /tmp/test_page.html)
  og_desc=$(grep -c '<meta property="og:description"' /tmp/test_page.html)
  if [ $og_title -gt 0 ] && [ $og_desc -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Open Graph tags present"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} Missing Open Graph tags"
    ((WARNINGS++))
  fi
}

# Run tests for each URL
for url in "${TEST_URLS[@]}"; do
  test_url "$url"
done

# Clean up
rm -f /tmp/test_page.html

# Summary
echo ""
echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo "Total: $((PASSED + FAILED + WARNINGS))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All critical tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED tests failed${NC}"
  exit 1
fi