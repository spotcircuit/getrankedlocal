import { test, expect, Page, BrowserContext } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

test.describe('Directory Structure Comprehensive Tests', () => {
  let context: BrowserContext;
  let page: Page;
  let consoleErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    // Create a new context with permissions
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });
  });

  test.beforeEach(async () => {
    // Create a new page for each test
    page = await context.newPage();
    consoleErrors = [];
    networkErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('Console Error:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.error('Page Error:', error.message);
    });

    // Listen for failed requests
    page.on('requestfailed', request => {
      networkErrors.push(`${request.failure()?.errorText} - ${request.url()}`);
      console.error('Request Failed:', request.url());
    });
  });

  test.afterEach(async () => {
    // Check for errors after each test
    if (consoleErrors.length > 0) {
      console.error('Test had console errors:', consoleErrors);
    }
    if (networkErrors.length > 0) {
      console.error('Test had network errors:', networkErrors);
    }
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Homepage loads without errors', async () => {
    await page.goto(BASE_URL);
    
    // Check for no console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Check page title exists
    await expect(page).toHaveTitle(/GetRankedLocal|GetLocalRanked/i);
    
    // Check for main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Check for dark theme
    const bodyBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBgColor).toMatch(/rgb\(0|#000000/);
  });

  test('Directory hub page loads and has correct structure', async () => {
    await page.goto(`${BASE_URL}/directory`);
    
    // No console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Check for canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/directory');
    expect(canonical).toContain('localhost:3001');
    
    // Check for H1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/directory/i);
    
    // Check for service cards
    const serviceCards = page.locator('a[href*="/directory/medical-spas"], a[href*="/directory/dental-practices"]');
    const count = await serviceCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Can navigate from directory to service page', async () => {
    await page.goto(`${BASE_URL}/directory`);
    
    // Find and click on medical-spas link
    const medicalSpasLink = page.locator('a[href*="/directory/medical-spas"]').first();
    await expect(medicalSpasLink).toBeVisible();
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      medicalSpasLink.click()
    ]);
    
    // Verify we're on the right page
    expect(page.url()).toContain('/directory/medical-spas');
    
    // Check for no errors
    expect(consoleErrors).toHaveLength(0);
    
    // Check page loaded correctly
    const h1 = page.locator('h1');
    await expect(h1).toContainText(/Medical Spas/i);
    
    // Check for state cards
    const stateCards = page.locator('a[href*="/directory/medical-spas/"]');
    const count = await stateCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Service page has proper SEO elements', async () => {
    await page.goto(`${BASE_URL}/directory/medical-spas`);
    
    // Check canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${BASE_URL}/directory/medical-spas`);
    
    // Check meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc?.length || 0).toBeGreaterThan(100);
    expect(metaDesc?.length || 0).toBeLessThan(160);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    // Check structured data
    const structuredData = await page.locator('script[type="application/ld+json"]').count();
    expect(structuredData).toBeGreaterThan(0);
  });

  test('Can navigate from service to state page', async () => {
    await page.goto(`${BASE_URL}/directory/medical-spas`);
    
    // Find a state link (e.g., Texas)
    const texasLink = page.locator('a[href*="/directory/medical-spas/tx"]').first();
    await expect(texasLink).toBeVisible();
    
    // Click and navigate
    await Promise.all([
      page.waitForNavigation(),
      texasLink.click()
    ]);
    
    // Verify URL
    expect(page.url()).toContain('/directory/medical-spas/tx');
    
    // Check for errors
    expect(consoleErrors).toHaveLength(0);
    
    // Check content loaded
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for city links
    const cityLinks = page.locator('a[href*="/directory/medical-spas/tx/"]');
    const count = await cityLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Can navigate to city page and see businesses', async () => {
    await page.goto(`${BASE_URL}/directory/medical-spas/tx/austin`);
    
    // Check for errors
    expect(consoleErrors).toHaveLength(0);
    
    // Check page loaded
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for business listings or loading state
    const businessCards = page.locator('[class*="business"], [class*="card"], [class*="listing"]');
    const loadingState = page.locator('[class*="loading"], [class*="skeleton"]');
    
    // Either we have businesses or loading state
    const hasContent = await businessCards.count() > 0 || await loadingState.count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Breadcrumb navigation works correctly', async () => {
    await page.goto(`${BASE_URL}/directory/medical-spas/tx/austin`);
    
    // Check for breadcrumbs
    const breadcrumbs = page.locator('nav, [aria-label*="breadcrumb"], .breadcrumb');
    await expect(breadcrumbs).toBeVisible();
    
    // Check breadcrumb links
    const breadcrumbLinks = breadcrumbs.locator('a');
    const count = await breadcrumbLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // Click on a breadcrumb to navigate back
    const directoryBreadcrumb = breadcrumbLinks.filter({ hasText: /directory/i }).first();
    if (await directoryBreadcrumb.count() > 0) {
      await Promise.all([
        page.waitForNavigation(),
        directoryBreadcrumb.click()
      ]);
      
      expect(page.url()).toContain('/directory');
    }
  });

  test('Search functionality works', async () => {
    await page.goto(`${BASE_URL}/directory/medical-spas`);
    
    // Find search input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    
    if (await searchInput.count() > 0) {
      // Type in search
      await searchInput.fill('Texas');
      
      // Wait for results to filter
      await page.waitForTimeout(500);
      
      // Check that we still have content
      const stateCards = page.locator('a[href*="/directory/medical-spas/"]');
      const count = await stateCards.count();
      expect(count).toBeGreaterThan(0);
      
      // Clear search
      const clearButton = page.locator('button:has-text("Clear")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
      } else {
        await searchInput.clear();
      }
    }
  });

  test('Mobile responsiveness', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/directory/medical-spas`);
    
    // Check for no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
    
    // Check touch targets are large enough
    const links = page.locator('a');
    const firstLink = links.first();
    if (await firstLink.count() > 0) {
      const box = await firstLink.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('API endpoints return data', async () => {
    // Test service API
    const serviceResponse = await page.request.get(`${BASE_URL}/api/directory/services/medical-spas`);
    expect(serviceResponse.ok()).toBeTruthy();
    const serviceData = await serviceResponse.json();
    expect(serviceData.success).toBeTruthy();
    
    // Test state API
    const stateResponse = await page.request.get(`${BASE_URL}/api/directory/services/medical-spas/tx`);
    expect(stateResponse.ok()).toBeTruthy();
    const stateData = await stateResponse.json();
    expect(stateData.success).toBeTruthy();
    
    // Test city API (this was missing before)
    const cityResponse = await page.request.get(`${BASE_URL}/api/directory/services/medical-spas/tx/austin`);
    expect(cityResponse.ok()).toBeTruthy();
    const cityData = await cityResponse.json();
    expect(cityData.success).toBeTruthy();
  });

  test('Different service types work', async () => {
    const services = [
      'medical-spas',
      'dental-practices',
      'law-firms',
      'marketing-agencies'
    ];
    
    for (const service of services) {
      await page.goto(`${BASE_URL}/directory/${service}`);
      
      // Check page loads without errors
      expect(consoleErrors).toHaveLength(0);
      
      // Check correct service name appears
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Should not show generic "Healthcare Services"
      const h1Text = await h1.textContent();
      expect(h1Text).not.toContain('Healthcare Services');
      
      // Clear errors for next iteration
      consoleErrors = [];
    }
  });

  test('Test page dashboard works', async () => {
    await page.goto(`${BASE_URL}/test-page`);
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Test/i);
    
    // Find test URL input
    const testInput = page.locator('input[type="text"]').first();
    await expect(testInput).toBeVisible();
    
    // Run a test
    await testInput.fill('/directory/medical-spas');
    const runButton = page.locator('button:has-text("Run Test")');
    await runButton.click();
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Check results appeared
    const results = page.locator('[class*="result"], [class*="test"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Complete user journey', async () => {
    // Start at homepage
    await page.goto(BASE_URL);
    expect(consoleErrors).toHaveLength(0);
    
    // Navigate to directory
    const directoryLink = page.locator('a[href="/directory"]').first();
    await directoryLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/directory');
    
    // Click on Medical Spas
    const medSpasLink = page.locator('a[href*="/directory/medical-spas"]').first();
    await medSpasLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/directory/medical-spas');
    
    // Click on Texas
    const texasLink = page.locator('a[href*="/tx"]').first();
    await texasLink.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/tx');
    
    // Click on Austin
    const austinLink = page.locator('a[href*="/austin"]').first();
    if (await austinLink.count() > 0) {
      await austinLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/austin');
    }
    
    // Check we made it through without errors
    expect(consoleErrors).toHaveLength(0);
    expect(networkErrors).toHaveLength(0);
  });
});

test.describe('Performance Tests', () => {
  test('Pages load within acceptable time', async ({ page }) => {
    const pages = [
      '/directory',
      '/directory/medical-spas',
      '/directory/medical-spas/tx',
      '/directory/medical-spas/tx/austin'
    ];
    
    for (const path of pages) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${path}`);
      const loadTime = Date.now() - startTime;
      
      console.log(`${path}: ${loadTime}ms`);
      
      // Pages should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('No memory leaks on navigation', async ({ page }) => {
    // Navigate multiple times and check memory doesn't grow excessively
    for (let i = 0; i < 5; i++) {
      await page.goto(`${BASE_URL}/directory`);
      await page.goto(`${BASE_URL}/directory/medical-spas`);
      await page.goto(`${BASE_URL}/directory/medical-spas/tx`);
    }
    
    // Check JavaScript heap size
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Heap should be under 100MB
    expect(metrics).toBeLessThan(100 * 1024 * 1024);
  });
});