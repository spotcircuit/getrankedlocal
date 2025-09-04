#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.blue.bold('\n🧪 GetLocalRanked Directory Test Suite\n'));
console.log(chalk.gray('=' .repeat(60)));

// Check if Playwright is installed
try {
  execSync('npx playwright --version', { stdio: 'ignore' });
} catch (error) {
  console.log(chalk.yellow('⚠️  Playwright not installed. Installing now...'));
  try {
    execSync('npm install -D @playwright/test', { stdio: 'inherit' });
    execSync('npx playwright install', { stdio: 'inherit' });
    console.log(chalk.green('✅ Playwright installed successfully\n'));
  } catch (installError) {
    console.error(chalk.red('❌ Failed to install Playwright'));
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const options = {
  headless: !args.includes('--headed'),
  browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'chromium',
  workers: args.find(arg => arg.startsWith('--workers='))?.split('=')[1] || '1',
};

console.log(chalk.cyan('Test Configuration:'));
console.log(`  Test Type: ${chalk.white(testType)}`);
console.log(`  Browser: ${chalk.white(options.browser)}`);
console.log(`  Mode: ${chalk.white(options.headless ? 'Headless' : 'Headed')}`);
console.log(`  Workers: ${chalk.white(options.workers)}`);
console.log(chalk.gray('=' .repeat(60)));

// Build the Playwright command
let command = 'npx playwright test';

// Add specific test file based on type
switch (testType) {
  case 'quick':
    command += ' --grep "Homepage|Directory hub"';
    break;
  case 'navigation':
    command += ' --grep "navigate|journey"';
    break;
  case 'seo':
    command += ' --grep "SEO|canonical|meta"';
    break;
  case 'performance':
    command += ' tests/directory-test.spec.ts --grep "Performance"';
    break;
  case 'mobile':
    command += ' --project="Mobile Chrome" --project="Mobile Safari"';
    break;
  case 'all':
  default:
    // Run all tests
    break;
}

// Add options
if (!options.headless) {
  command += ' --headed';
}

if (options.browser !== 'all') {
  command += ` --project=${options.browser}`;
}

command += ` --workers=${options.workers}`;

// Add reporter
command += ' --reporter=list';

console.log(chalk.blue('\n🚀 Running tests...\n'));
console.log(chalk.gray(`Command: ${command}\n`));

try {
  // Run the tests
  execSync(command, { stdio: 'inherit' });
  
  console.log(chalk.green.bold('\n✅ All tests passed!\n'));
  
  // Parse and display results if JSON file exists
  const resultsPath = path.join(process.cwd(), 'test-results.json');
  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    displayResults(results);
  }
  
  // Offer to open HTML report
  console.log(chalk.cyan('\n📊 View detailed HTML report:'));
  console.log(chalk.white('   npx playwright show-report\n'));
  
} catch (error) {
  console.error(chalk.red.bold('\n❌ Tests failed!\n'));
  
  // Parse and display results
  const resultsPath = path.join(process.cwd(), 'test-results.json');
  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    displayResults(results);
    displayFailures(results);
  }
  
  console.log(chalk.yellow('\n💡 Tips:'));
  console.log('   • Run with --headed to see the browser');
  console.log('   • Run "npx playwright show-report" for detailed report');
  console.log('   • Check test-results.json for raw data\n');
  
  process.exit(1);
}

function displayResults(results) {
  console.log(chalk.blue('\n📈 Test Summary:'));
  console.log(chalk.gray('-'.repeat(40)));
  
  const stats = results.stats || {};
  const total = stats.expected || 0;
  const passed = total - (stats.unexpected || 0) - (stats.flaky || 0);
  const failed = stats.unexpected || 0;
  const flaky = stats.flaky || 0;
  const duration = stats.duration || 0;
  
  console.log(`  Total Tests: ${chalk.white(total)}`);
  console.log(`  Passed: ${chalk.green(passed)}`);
  console.log(`  Failed: ${chalk.red(failed)}`);
  console.log(`  Flaky: ${chalk.yellow(flaky)}`);
  console.log(`  Duration: ${chalk.white((duration / 1000).toFixed(2))}s`);
  console.log(chalk.gray('-'.repeat(40)));
}

function displayFailures(results) {
  const failures = results.errors || [];
  
  if (failures.length > 0) {
    console.log(chalk.red('\n❌ Failed Tests:'));
    console.log(chalk.gray('-'.repeat(40)));
    
    failures.forEach((failure, index) => {
      console.log(chalk.red(`\n${index + 1}. ${failure.message || 'Test failed'}`));
      if (failure.stack) {
        console.log(chalk.gray(failure.stack.substring(0, 200) + '...'));
      }
    });
  }
}

// Show help
if (args.includes('--help')) {
  console.log(chalk.cyan('\nUsage:'));
  console.log('  node scripts/run-tests.js [test-type] [options]\n');
  console.log(chalk.cyan('Test Types:'));
  console.log('  all         - Run all tests (default)');
  console.log('  quick       - Run quick smoke tests');
  console.log('  navigation  - Test navigation and user journeys');
  console.log('  seo         - Test SEO elements');
  console.log('  performance - Test page performance');
  console.log('  mobile      - Test mobile responsiveness\n');
  console.log(chalk.cyan('Options:'));
  console.log('  --headed           - Run tests in headed mode (see browser)');
  console.log('  --browser=<name>   - Browser to use (chromium, firefox, webkit)');
  console.log('  --workers=<n>      - Number of parallel workers\n');
  console.log(chalk.cyan('Examples:'));
  console.log('  node scripts/run-tests.js quick --headed');
  console.log('  node scripts/run-tests.js seo --browser=firefox');
  console.log('  node scripts/run-tests.js all --workers=4\n');
  process.exit(0);
}