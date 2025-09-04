#!/usr/bin/env node

/**
 * Directory Structure Testing Script
 * Tests SEO, canonical URLs, structured data, and visual elements
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const Table = require('cli-table3');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TESTS_TO_RUN = process.argv[2] || 'all'; // all, seo, visual, structure

// Test cases for different URL patterns
const TEST_URLS = [
  // Service-first URLs (canonical)
  {
    url: '/directory/medical-spas',
    type: 'service-hub',
    expectedCanonical: '/directory/medical-spas',
    expectedTitle: /Medical Spas Directory/i,
    expectedH1: /Medical Spas/i,
    expectedStructuredData: ['CollectionPage', 'BreadcrumbList']
  },
  {
    url: '/directory/medical-spas/tx',
    type: 'service-state',
    expectedCanonical: '/directory/medical-spas/tx',
    expectedTitle: /Medical Spas in Texas/i,
    expectedH1: /Texas Medical Spas/i,
    expectedStructuredData: ['CollectionPage', 'BreadcrumbList']
  },
  {
    url: '/directory/medical-spas/tx/austin',
    type: 'service-city',
    expectedCanonical: '/directory/medical-spas/tx/austin',
    expectedTitle: /Medical Spas in Austin, TX/i,
    expectedH1: /Austin Medical Spas/i,
    expectedStructuredData: ['CollectionPage', 'BreadcrumbList', 'LocalBusiness']
  },
  // Location-first URLs (should point to canonical)
  {
    url: '/tx/austin/medspas',
    type: 'legacy-location',
    expectedCanonical: '/directory/medical-spas/tx/austin',
    expectedTitle: /Medical Spas in Austin/i,
    expectedH1: /Medical Spas/i,
    expectedStructuredData: ['CollectionPage', 'BreadcrumbList']
  }
];

// Visual regression checks
const VISUAL_CHECKS = {
  mobileViewport: { width: 375, height: 667 },
  tabletViewport: { width: 768, height: 1024 },
  desktopViewport: { width: 1920, height: 1080 },
  darkThemeColors: {
    background: ['#000000', '#111111', '#1a1a1a'],
    primaryGradient: ['#9333ea', '#3b82f6'],
    text: ['#ffffff', '#f3f4f6', '#e5e7eb']
  },
  requiredElements: {
    '.breadcrumb': 'Breadcrumb navigation',
    '.stats-bar': 'Statistics bar',
    '.business-card': 'Business cards',
    '.search-bar': 'Search functionality',
    'footer': 'Footer section'
  }
};

// SEO validation rules
const SEO_RULES = {
  metaTags: {
    'title': { maxLength: 60, required: true },
    'meta[name="description"]': { maxLength: 160, required: true },
    'link[rel="canonical"]': { required: true },
    'meta[property="og:title"]': { required: true },
    'meta[property="og:description"]': { required: true },
    'meta[property="og:image"]': { required: false },
    'meta[name="twitter:card"]': { required: true }
  },
  performance: {
    firstContentfulPaint: 1800, // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,
    totalBlockingTime: 300 // ms
  }
};

class DirectoryTester {
  constructor() {
    this.browser = null;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async init() {
    console.log(chalk.blue('🚀 Launching browser...'));
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async testURL(testCase) {
    const page = await this.browser.newPage();
    const fullUrl = `${BASE_URL}${testCase.url}`;
    const testResults = {
      url: testCase.url,
      type: testCase.type,
      tests: []
    };

    console.log(chalk.yellow(`\n📍 Testing: ${fullUrl}`));

    try {
      // Navigate to page
      await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Test 1: Canonical URL
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'seo') {
        const canonicalTest = await this.testCanonicalURL(page, testCase);
        testResults.tests.push(canonicalTest);
      }

      // Test 2: Page Title
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'seo') {
        const titleTest = await this.testPageTitle(page, testCase);
        testResults.tests.push(titleTest);
      }

      // Test 3: H1 Content
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'structure') {
        const h1Test = await this.testH1Content(page, testCase);
        testResults.tests.push(h1Test);
      }

      // Test 4: Structured Data
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'seo') {
        const structuredDataTest = await this.testStructuredData(page, testCase);
        testResults.tests.push(structuredDataTest);
      }

      // Test 5: Visual Elements
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'visual') {
        const visualTest = await this.testVisualElements(page);
        testResults.tests.push(visualTest);
      }

      // Test 6: Mobile Responsiveness
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'visual') {
        const mobileTest = await this.testMobileResponsiveness(page);
        testResults.tests.push(mobileTest);
      }

      // Test 7: Dark Theme
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'visual') {
        const themeTest = await this.testDarkTheme(page);
        testResults.tests.push(themeTest);
      }

      // Test 8: Performance Metrics
      if (TESTS_TO_RUN === 'all' || TESTS_TO_RUN === 'seo') {
        const perfTest = await this.testPerformance(page);
        testResults.tests.push(perfTest);
      }

    } catch (error) {
      testResults.tests.push({
        name: 'Page Load',
        status: 'failed',
        message: `Failed to load page: ${error.message}`
      });
    } finally {
      await page.close();
    }

    this.results.details.push(testResults);
    return testResults;
  }

  async testCanonicalURL(page, testCase) {
    try {
      const canonical = await page.$eval('link[rel="canonical"]', el => el.href);
      const expectedCanonical = `${BASE_URL}${testCase.expectedCanonical}`;
      
      if (canonical === expectedCanonical) {
        this.results.passed++;
        return {
          name: 'Canonical URL',
          status: 'passed',
          expected: expectedCanonical,
          actual: canonical
        };
      } else {
        this.results.failed++;
        return {
          name: 'Canonical URL',
          status: 'failed',
          expected: expectedCanonical,
          actual: canonical,
          message: 'Canonical URL does not match expected pattern'
        };
      }
    } catch (error) {
      this.results.failed++;
      return {
        name: 'Canonical URL',
        status: 'failed',
        message: 'No canonical URL found'
      };
    }
  }

  async testPageTitle(page, testCase) {
    try {
      const title = await page.title();
      
      if (testCase.expectedTitle.test(title)) {
        this.results.passed++;
        return {
          name: 'Page Title',
          status: 'passed',
          actual: title,
          length: title.length
        };
      } else {
        this.results.failed++;
        return {
          name: 'Page Title',
          status: 'failed',
          expected: testCase.expectedTitle.toString(),
          actual: title,
          message: 'Title does not match expected pattern'
        };
      }
    } catch (error) {
      this.results.failed++;
      return {
        name: 'Page Title',
        status: 'failed',
        message: error.message
      };
    }
  }

  async testH1Content(page, testCase) {
    try {
      const h1 = await page.$eval('h1', el => el.textContent.trim());
      
      if (testCase.expectedH1.test(h1)) {
        this.results.passed++;
        return {
          name: 'H1 Content',
          status: 'passed',
          actual: h1
        };
      } else {
        this.results.failed++;
        return {
          name: 'H1 Content',
          status: 'failed',
          expected: testCase.expectedH1.toString(),
          actual: h1
        };
      }
    } catch (error) {
      this.results.failed++;
      return {
        name: 'H1 Content',
        status: 'failed',
        message: 'No H1 found on page'
      };
    }
  }

  async testStructuredData(page, testCase) {
    try {
      const structuredData = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        return scripts.map(script => {
          try {
            const data = JSON.parse(script.textContent);
            return data['@type'] || 'Unknown';
          } catch {
            return 'Invalid JSON-LD';
          }
        });
      });

      const missingTypes = testCase.expectedStructuredData.filter(
        type => !structuredData.includes(type)
      );

      if (missingTypes.length === 0) {
        this.results.passed++;
        return {
          name: 'Structured Data',
          status: 'passed',
          found: structuredData
        };
      } else {
        this.results.failed++;
        return {
          name: 'Structured Data',
          status: 'failed',
          expected: testCase.expectedStructuredData,
          found: structuredData,
          missing: missingTypes
        };
      }
    } catch (error) {
      this.results.failed++;
      return {
        name: 'Structured Data',
        status: 'failed',
        message: error.message
      };
    }
  }

  async testVisualElements(page) {
    const missingElements = [];
    
    for (const [selector, description] of Object.entries(VISUAL_CHECKS.requiredElements)) {
      try {
        const element = await page.$(selector);
        if (!element) {
          missingElements.push(`${description} (${selector})`);
        }
      } catch (error) {
        missingElements.push(`${description} (${selector}): ${error.message}`);
      }
    }

    if (missingElements.length === 0) {
      this.results.passed++;
      return {
        name: 'Visual Elements',
        status: 'passed',
        message: 'All required elements present'
      };
    } else {
      this.results.warnings++;
      return {
        name: 'Visual Elements',
        status: 'warning',
        missing: missingElements
      };
    }
  }

  async testMobileResponsiveness(page) {
    try {
      // Test mobile viewport
      await page.setViewport(VISUAL_CHECKS.mobileViewport);
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Check touch target sizes
      const touchTargets = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button'));
        const smallTargets = links.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        });
        return {
          total: links.length,
          small: smallTargets.length
        };
      });

      if (!hasHorizontalScroll && touchTargets.small === 0) {
        this.results.passed++;
        return {
          name: 'Mobile Responsiveness',
          status: 'passed',
          message: 'Mobile optimized'
        };
      } else {
        this.results.warnings++;
        return {
          name: 'Mobile Responsiveness',
          status: 'warning',
          horizontalScroll: hasHorizontalScroll,
          smallTouchTargets: touchTargets.small
        };
      }
    } catch (error) {
      this.results.failed++;
      return {
        name: 'Mobile Responsiveness',
        status: 'failed',
        message: error.message
      };
    }
  }

  async testDarkTheme(page) {
    try {
      const colors = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        return {
          background: styles.backgroundColor,
          color: styles.color
        };
      });

      // Check if background is dark
      const isDark = colors.background.includes('0, 0, 0') || 
                     colors.background.includes('17, 17, 17') ||
                     colors.background.includes('26, 26, 26');

      if (isDark) {
        this.results.passed++;
        return {
          name: 'Dark Theme',
          status: 'passed',
          colors
        };
      } else {
        this.results.failed++;
        return {
          name: 'Dark Theme',
          status: 'failed',
          message: 'Dark theme not applied',
          colors
        };
      }
    } catch (error) {
      this.results.failed++;
      return {
        name: 'Dark Theme',
        status: 'failed',
        message: error.message
      };
    }
  }

  async testPerformance(page) {
    try {
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          loadComplete: perf.loadEventEnd - perf.loadEventStart
        };
      });

      if (metrics.loadComplete < 3000) {
        this.results.passed++;
        return {
          name: 'Performance',
          status: 'passed',
          metrics
        };
      } else {
        this.results.warnings++;
        return {
          name: 'Performance',
          status: 'warning',
          message: 'Page load time exceeds 3 seconds',
          metrics
        };
      }
    } catch (error) {
      this.results.warnings++;
      return {
        name: 'Performance',
        status: 'warning',
        message: error.message
      };
    }
  }

  generateReport() {
    console.log(chalk.blue('\n📊 Test Results Summary\n'));

    // Summary table
    const summaryTable = new Table({
      head: ['Metric', 'Count'],
      style: { head: ['cyan'] }
    });

    summaryTable.push(
      [chalk.green('Passed'), this.results.passed],
      [chalk.red('Failed'), this.results.failed],
      [chalk.yellow('Warnings'), this.results.warnings],
      ['Total Tests', this.results.passed + this.results.failed + this.results.warnings]
    );

    console.log(summaryTable.toString());

    // Detailed results
    console.log(chalk.blue('\n📋 Detailed Results\n'));

    this.results.details.forEach(urlResult => {
      console.log(chalk.cyan(`\n${urlResult.url} (${urlResult.type})`));
      
      const detailTable = new Table({
        head: ['Test', 'Status', 'Details'],
        style: { head: ['cyan'] }
      });

      urlResult.tests.forEach(test => {
        const status = test.status === 'passed' ? chalk.green('✓ Passed') :
                       test.status === 'failed' ? chalk.red('✗ Failed') :
                       chalk.yellow('⚠ Warning');
        
        let details = '';
        if (test.message) details = test.message;
        else if (test.actual) details = `Actual: ${test.actual}`;
        else if (test.missing) details = `Missing: ${test.missing.join(', ')}`;

        detailTable.push([test.name, status, details]);
      });

      console.log(detailTable.toString());
    });

    // Overall status
    const overallStatus = this.results.failed === 0 ? 
      chalk.green('\n✅ All critical tests passed!') :
      chalk.red(`\n❌ ${this.results.failed} tests failed`);
    
    console.log(overallStatus);

    if (this.results.warnings > 0) {
      console.log(chalk.yellow(`⚠️  ${this.results.warnings} warnings to review`));
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();

      console.log(chalk.blue(`\n🧪 Running ${TESTS_TO_RUN} tests...\n`));

      for (const testCase of TEST_URLS) {
        await this.testURL(testCase);
      }

      this.generateReport();

      // Exit with error code if tests failed
      process.exit(this.results.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error(chalk.red('Test execution failed:'), error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests
const tester = new DirectoryTester();
tester.run();