#!/usr/bin/env node

/**
 * Improved Directory Testing Agent
 * This agent actually navigates through pages, clicks links, and validates the entire user journey
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

class ImprovedTestAgent {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.visitedUrls = new Set();
    this.testResults = [];
  }

  async init() {
    console.log(chalk.blue('🚀 Launching Improved Testing Agent...'));
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: false
    });
    this.page = await this.browser.newPage();
    
    // Set up console message listener to catch errors
    this.page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        this.errors.push({
          type: 'Console Error',
          url: this.page.url(),
          message: text,
          timestamp: new Date().toISOString()
        });
        console.log(chalk.red(`❌ Console Error: ${text.substring(0, 100)}...`));
      }
    });

    // Set up page error listener
    this.page.on('pageerror', error => {
      this.errors.push({
        type: 'Page Error',
        url: this.page.url(),
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(chalk.red(`❌ Page Error: ${error.message}`));
    });

    // Set up response listener to catch failed requests
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.errors.push({
          type: 'HTTP Error',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log(chalk.red(`❌ HTTP ${response.status()}: ${response.url()}`));
      }
    });

    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async navigateAndTest(url, testName = 'Page Load') {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    if (this.visitedUrls.has(fullUrl)) {
      console.log(chalk.gray(`⏭️  Skipping already visited: ${fullUrl}`));
      return null;
    }
    
    this.visitedUrls.add(fullUrl);
    console.log(chalk.cyan(`\n📍 Testing: ${fullUrl}`));
    console.log(chalk.gray(`   Test: ${testName}`));

    const testResult = {
      url: fullUrl,
      testName,
      timestamp: new Date().toISOString(),
      loadTime: 0,
      errors: [],
      warnings: [],
      validations: []
    };

    try {
      const startTime = Date.now();
      
      // Navigate with proper error handling
      const response = await this.page.goto(fullUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      testResult.loadTime = Date.now() - startTime;
      testResult.httpStatus = response.status();

      // Check HTTP status
      if (response.status() !== 200) {
        testResult.errors.push({
          type: 'HTTP Status',
          message: `Expected 200, got ${response.status()}`,
          severity: 'high'
        });
        this.errors.push({
          url: fullUrl,
          error: `HTTP ${response.status()}`
        });
      } else {
        console.log(chalk.green(`✓ Page loaded successfully (${testResult.loadTime}ms)`));
      }

      // Wait for content to be visible
      await this.page.waitForSelector('body', { timeout: 5000 });

      // Run comprehensive validations
      await this.validatePage(testResult);

      // Find and test clickable elements
      await this.testClickableElements(testResult);

    } catch (error) {
      testResult.errors.push({
        type: 'Navigation Error',
        message: error.message,
        severity: 'critical'
      });
      this.errors.push({
        url: fullUrl,
        error: error.message
      });
      console.log(chalk.red(`❌ Failed to load: ${error.message}`));
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async validatePage(testResult) {
    console.log(chalk.yellow('   🔍 Running validations...'));

    // 1. Check for JavaScript errors
    const jsErrors = await this.page.evaluate(() => {
      return window.__errors || [];
    });
    if (jsErrors.length > 0) {
      testResult.errors.push({
        type: 'JavaScript Errors',
        message: `${jsErrors.length} JS errors found`,
        details: jsErrors,
        severity: 'high'
      });
    }

    // 2. Validate SEO elements
    const seoData = await this.page.evaluate(() => {
      const canonical = document.querySelector('link[rel="canonical"]');
      const title = document.querySelector('title');
      const metaDesc = document.querySelector('meta[name="description"]');
      const h1 = document.querySelector('h1');
      const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      
      return {
        canonical: canonical?.href,
        title: title?.textContent,
        metaDescription: metaDesc?.content,
        h1: h1?.textContent?.trim(),
        structuredDataCount: structuredData.length,
        hasOpenGraph: !!document.querySelector('meta[property="og:title"]')
      };
    });

    // Validate canonical URL
    if (!seoData.canonical) {
      testResult.warnings.push({
        type: 'SEO',
        message: 'Missing canonical URL',
        severity: 'medium'
      });
    } else if (!seoData.canonical.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3001')) {
      testResult.errors.push({
        type: 'SEO',
        message: `Incorrect canonical URL: ${seoData.canonical}`,
        severity: 'high'
      });
    } else {
      testResult.validations.push({
        type: 'Canonical URL',
        status: 'passed',
        value: seoData.canonical
      });
    }

    // Validate title
    if (!seoData.title) {
      testResult.errors.push({
        type: 'SEO',
        message: 'Missing page title',
        severity: 'high'
      });
    } else if (seoData.title.length > 60) {
      testResult.warnings.push({
        type: 'SEO',
        message: `Title too long: ${seoData.title.length} chars`,
        severity: 'low'
      });
    } else {
      testResult.validations.push({
        type: 'Page Title',
        status: 'passed',
        value: seoData.title
      });
    }

    // 3. Check for visual elements
    const visualChecks = await this.page.evaluate(() => {
      const isDarkTheme = window.getComputedStyle(document.body).backgroundColor.includes('0, 0, 0') ||
                         window.getComputedStyle(document.body).backgroundColor.includes('rgb(0');
      const hasBreadcrumbs = !!document.querySelector('.breadcrumb, [aria-label*="breadcrumb"], nav');
      const hasBusinessCards = !!document.querySelector('[class*="business"], [class*="card"], [class*="listing"]');
      const hasHeader = !!document.querySelector('header, [class*="header"]');
      const hasFooter = !!document.querySelector('footer, [class*="footer"]');
      
      return {
        isDarkTheme,
        hasBreadcrumbs,
        hasBusinessCards,
        hasHeader,
        hasFooter
      };
    });

    if (!visualChecks.isDarkTheme) {
      testResult.errors.push({
        type: 'Visual',
        message: 'Dark theme not applied',
        severity: 'medium'
      });
    }

    if (!visualChecks.hasBreadcrumbs && !testResult.url.includes('/directory')) {
      testResult.warnings.push({
        type: 'Navigation',
        message: 'Missing breadcrumb navigation',
        severity: 'low'
      });
    }

    // 4. Check for required data
    const dataChecks = await this.page.evaluate(() => {
      const hasContent = document.body.textContent.length > 500;
      const hasLinks = document.querySelectorAll('a[href]').length > 0;
      const hasImages = document.querySelectorAll('img, svg').length > 0;
      
      return { hasContent, hasLinks, hasImages };
    });

    if (!dataChecks.hasContent) {
      testResult.errors.push({
        type: 'Content',
        message: 'Page appears to have no content',
        severity: 'critical'
      });
    }

    console.log(chalk.green(`   ✓ Validations complete`));
  }

  async testClickableElements(testResult) {
    console.log(chalk.yellow('   🖱️  Testing clickable elements...'));

    try {
      // Get all links on the page
      const links = await this.page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        return allLinks
          .filter(link => {
            const href = link.getAttribute('href');
            return href && 
                   !href.startsWith('#') && 
                   !href.startsWith('mailto:') && 
                   !href.startsWith('tel:') &&
                   !href.includes('javascript:');
          })
          .map(link => ({
            href: link.href,
            text: link.textContent.trim().substring(0, 50),
            isInternal: link.href.includes(window.location.hostname)
          }))
          .slice(0, 5); // Test only first 5 links to avoid too many requests
      });

      console.log(chalk.gray(`   Found ${links.length} testable links`));

      // Test internal links
      for (const link of links.filter(l => l.isInternal)) {
        console.log(chalk.gray(`   → Testing link: ${link.text || link.href}`));
        
        // Open link in new tab to avoid navigation issues
        const newPage = await this.browser.newPage();
        try {
          const response = await newPage.goto(link.href, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
          
          if (response.status() === 200) {
            testResult.validations.push({
              type: 'Link Test',
              status: 'passed',
              link: link.href
            });
            console.log(chalk.green(`     ✓ Link works: ${link.text}`));
          } else {
            testResult.errors.push({
              type: 'Broken Link',
              message: `Link returned ${response.status()}: ${link.href}`,
              severity: 'medium'
            });
            console.log(chalk.red(`     ✗ Broken link: ${response.status()}`));
          }
        } catch (error) {
          testResult.errors.push({
            type: 'Link Error',
            message: `Failed to test link: ${link.href}`,
            severity: 'low'
          });
        } finally {
          await newPage.close();
        }
      }

    } catch (error) {
      testResult.warnings.push({
        type: 'Link Testing',
        message: `Could not test links: ${error.message}`,
        severity: 'low'
      });
    }
  }

  async testUserJourney() {
    console.log(chalk.blue('\n🎯 Testing Complete User Journey\n'));

    // 1. Start at homepage
    await this.navigateAndTest('/', 'Homepage');

    // 2. Navigate to directory
    const hasDirectory = await this.page.evaluate(() => {
      const directoryLink = Array.from(document.querySelectorAll('a')).find(a => 
        a.href.includes('/directory') || a.textContent.includes('Directory')
      );
      if (directoryLink) {
        directoryLink.click();
        return true;
      }
      return false;
    });

    if (hasDirectory) {
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      await this.validatePage({ url: this.page.url(), validations: [], errors: [], warnings: [] });
      console.log(chalk.green('✓ Successfully navigated to directory'));
    } else {
      // Navigate directly if link not found
      await this.navigateAndTest('/directory', 'Directory Hub');
    }

    // 3. Click on first service (e.g., medical-spas)
    const serviceClicked = await this.page.evaluate(() => {
      const serviceLink = document.querySelector('a[href*="/directory/medical-spas"], a[href*="/directory/dental"]');
      if (serviceLink) {
        serviceLink.click();
        return serviceLink.href;
      }
      return null;
    });

    if (serviceClicked) {
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      await this.validatePage({ url: this.page.url(), validations: [], errors: [], warnings: [] });
      console.log(chalk.green('✓ Successfully navigated to service page'));
      
      // 4. Click on a state
      const stateClicked = await this.page.evaluate(() => {
        const stateLink = document.querySelector('a[href*="/tx"], a[href*="/ca"], a[href*="/fl"]');
        if (stateLink) {
          stateLink.click();
          return stateLink.href;
        }
        return null;
      });

      if (stateClicked) {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        await this.validatePage({ url: this.page.url(), validations: [], errors: [], warnings: [] });
        console.log(chalk.green('✓ Successfully navigated to state page'));
        
        // 5. Click on a city
        const cityClicked = await this.page.evaluate(() => {
          const cityLink = document.querySelector('a[href*="/austin"], a[href*="/dallas"], a[href*="/houston"]');
          if (cityLink) {
            cityLink.click();
            return cityLink.href;
          }
          return null;
        });

        if (cityClicked) {
          await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
          await this.validatePage({ url: this.page.url(), validations: [], errors: [], warnings: [] });
          console.log(chalk.green('✓ Successfully navigated to city page'));
        }
      }
    }
  }

  async testCriticalPaths() {
    console.log(chalk.blue('\n🔄 Testing Critical User Paths\n'));

    const criticalPaths = [
      { url: '/directory', name: 'Directory Hub' },
      { url: '/directory/medical-spas', name: 'Medical Spas Service' },
      { url: '/directory/dental-practices', name: 'Dental Practices Service' },
      { url: '/directory/medical-spas/tx', name: 'State Level (TX)' },
      { url: '/directory/medical-spas/tx/austin', name: 'City Level (Austin)' },
      { url: '/test-page', name: 'Test Dashboard' }
    ];

    for (const path of criticalPaths) {
      await this.navigateAndTest(path.url, path.name);
      
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  generateReport() {
    console.log(chalk.blue('\n📊 COMPREHENSIVE TEST REPORT\n'));
    console.log('='.repeat(60));

    // Summary statistics
    const totalErrors = this.testResults.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.testResults.reduce((sum, r) => sum + r.warnings.length, 0);
    const totalValidations = this.testResults.reduce((sum, r) => sum + r.validations.length, 0);
    const avgLoadTime = this.testResults.reduce((sum, r) => sum + r.loadTime, 0) / this.testResults.length;

    console.log(chalk.cyan('SUMMARY'));
    console.log(`Pages Tested: ${this.testResults.length}`);
    console.log(`Total Errors: ${chalk.red(totalErrors)}`);
    console.log(`Total Warnings: ${chalk.yellow(totalWarnings)}`);
    console.log(`Successful Validations: ${chalk.green(totalValidations)}`);
    console.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
    console.log('='.repeat(60));

    // Critical errors
    if (totalErrors > 0) {
      console.log(chalk.red('\n❌ CRITICAL ERRORS (Must Fix)\n'));
      this.testResults.forEach(result => {
        if (result.errors.length > 0) {
          console.log(chalk.red(`\n${result.url}`));
          result.errors.forEach(error => {
            console.log(`  • ${error.type}: ${error.message}`);
            if (error.details) {
              console.log(`    Details: ${JSON.stringify(error.details).substring(0, 100)}...`);
            }
          });
        }
      });
    }

    // Warnings
    if (totalWarnings > 0) {
      console.log(chalk.yellow('\n⚠️  WARNINGS (Should Fix)\n'));
      this.testResults.forEach(result => {
        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`\n${result.url}`));
          result.warnings.forEach(warning => {
            console.log(`  • ${warning.type}: ${warning.message}`);
          });
        }
      });
    }

    // Successful validations
    console.log(chalk.green('\n✅ SUCCESSFUL VALIDATIONS\n'));
    this.testResults.forEach(result => {
      if (result.validations.length > 0) {
        console.log(chalk.green(`\n${result.url}`));
        result.validations.forEach(validation => {
          console.log(`  ✓ ${validation.type}: ${validation.status}`);
        });
      }
    });

    // Performance metrics
    console.log(chalk.blue('\n⚡ PERFORMANCE METRICS\n'));
    this.testResults
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 5)
      .forEach(result => {
        const status = result.loadTime < 1000 ? chalk.green('Fast') :
                      result.loadTime < 3000 ? chalk.yellow('Medium') :
                      chalk.red('Slow');
        console.log(`${result.url.substring(this.baseUrl.length)}: ${result.loadTime}ms (${status})`);
      });

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (totalErrors === 0) {
      console.log(chalk.green('\n✅ ALL CRITICAL TESTS PASSED!\n'));
    } else {
      console.log(chalk.red(`\n❌ ${totalErrors} CRITICAL ISSUES NEED IMMEDIATE ATTENTION\n`));
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
      
      // Run different test suites
      await this.testCriticalPaths();
      await this.testUserJourney();
      
      // Generate comprehensive report
      this.generateReport();
      
      // Save detailed report to file
      const fs = require('fs');
      fs.writeFileSync(
        'test-report.json',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          baseUrl: this.baseUrl,
          results: this.testResults,
          summary: {
            totalTests: this.testResults.length,
            totalErrors: this.errors.length,
            totalWarnings: this.warnings.length
          }
        }, null, 2)
      );
      
      console.log(chalk.gray('\nDetailed report saved to test-report.json'));
      
      // Exit with appropriate code
      process.exit(this.errors.length > 0 ? 1 : 0);
      
    } catch (error) {
      console.error(chalk.red('Fatal error:'), error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the improved test agent
const agent = new ImprovedTestAgent(process.env.BASE_URL || 'http://localhost:3001');
agent.run();