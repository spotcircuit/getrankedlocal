import { test, expect } from '@playwright/test';

const BASE_URL = 'http://10.0.0.234:3001';

test.describe('Directory Navigation Tests', () => {
  
  test('Directory main page loads with categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/directory`);
    
    // Check for main title
    const title = await page.locator('h1').first().textContent();
    expect(title).toContain('Business Directory');
    
    // Check for service categories
    const categories = await page.locator('.grid a[href^="/directory/"]').count();
    expect(categories).toBeGreaterThan(0);
  });

  test('Navigate through Med Spas hierarchy', async ({ page }) => {
    // Start at directory
    await page.goto(`${BASE_URL}/directory`);
    
    // Click on Medical Spas
    await page.click('text=Medical Spas');
    await page.waitForURL('**/directory/medical-spas');
    
    // Should see states
    const states = await page.locator('a[href*="/directory/medical-spas/"]').count();
    expect(states).toBeGreaterThan(0);
    
    // Click on Florida if available
    const floridaLink = page.locator('a[href="/directory/medical-spas/fl"]');
    if (await floridaLink.count() > 0) {
      await floridaLink.click();
      await page.waitForURL('**/directory/medical-spas/fl');
      
      // Should see cities
      const cities = await page.locator('a[href*="/directory/medical-spas/fl/"]').count();
      expect(cities).toBeGreaterThan(0);
    }
  });

  test('Hair Salons in Ashburn shows correct data', async ({ page }) => {
    await page.goto(`${BASE_URL}/directory/hair-salons/va/ashburn`);
    
    // Wait for businesses to load
    await page.waitForSelector('.business-card', { timeout: 10000 });
    
    // Check for K&M HAIR LOUNGE
    const kmHairLounge = await page.locator('text=K&M HAIR LOUNGE').count();
    expect(kmHairLounge).toBeGreaterThan(0);
    
    // Should show many businesses (100+ prospects)
    const totalBusinesses = await page.locator('.business-card').count();
    expect(totalBusinesses).toBeGreaterThan(50);
  });

  test('Business detail page loads correctly', async ({ page }) => {
    // Go directly to a known business
    await page.goto(`${BASE_URL}/va/ashburn/hairsalons/km-hair-lounge`);
    
    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Should show business name
    const businessName = await page.locator('h1').first().textContent();
    expect(businessName).toContain('HAIR');
    
    // Should show rank
    const rankElement = await page.locator('text=/Rank.*#\\d+/').count();
    expect(rankElement).toBeGreaterThan(0);
  });

  test('SimpliStack shows correct low ranking', async ({ page }) => {
    // Go to SimpliStack page
    await page.goto(`${BASE_URL}/fl/aventura/marketing/simplistack`);
    
    // Wait for content
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Check rank - should be very low (near 105)
    const rankText = await page.locator('text=/Rank.*#\\d+/').first().textContent();
    const rankMatch = rankText?.match(/#(\d+)/);
    if (rankMatch) {
      const rank = parseInt(rankMatch[1]);
      expect(rank).toBeGreaterThan(100); // SimpliStack has no reviews, should be last
    }
  });

  test('API returns correct competitor data', async ({ page }) => {
    // Test the analyze API directly
    const response = await page.goto(`${BASE_URL}/api/analyze?name=test&city=Aventura&state=FL&niche=marketing`);
    const data = await response?.json();
    
    // Should have 105 total businesses
    expect(data.analysis.marketIntel.market_summary.total_businesses).toBe(105);
    
    // Top competitor should be Grant Cardone
    expect(data.analysis.competitors[0].name).toContain('Grant Cardone');
    expect(data.analysis.competitors[0].reviews).toBeGreaterThan(1000);
    expect(data.analysis.competitors[0].rank).toBe(1);
  });

  test('Collections API returns normalized data', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/api/directory/collections`);
    const data = await response?.json();
    
    expect(data.success).toBe(true);
    
    // Check that collections are normalized (no hyphens)
    const collections = data.data.collections;
    const collectionNames = collections.map((c: any) => c.collection);
    
    // Should have "hair salons" not "hair-salons"
    expect(collectionNames).toContain('hair salons');
    expect(collectionNames).not.toContain('hair-salons');
    
    // Should have "med spas" not "medspas"
    expect(collectionNames).toContain('med spas');
    expect(collectionNames).not.toContain('medspas');
  });
});