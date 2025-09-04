const puppeteer = require('puppeteer');

describe('Directory E2E Navigation Tests', () => {
  let browser;
  let page;
  const BASE_URL = 'http://10.0.0.234:3001';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Directory main page loads', async () => {
    await page.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2' });
    
    // Check for main directory elements
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('Business Directory');
    
    // Check for service categories
    const categories = await page.$$eval('.service-card', cards => cards.length);
    expect(categories).toBeGreaterThan(0);
  }, 30000);

  test('Navigate to Med Spas category', async () => {
    await page.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2' });
    
    // Click on Med Spas
    await page.click('a[href="/directory/medical-spas"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Verify we're on the med spas page
    const url = page.url();
    expect(url).toContain('/directory/medical-spas');
    
    // Check for state listings
    const states = await page.$$eval('.state-link', links => links.length);
    expect(states).toBeGreaterThan(0);
  }, 30000);

  test('Navigate to specific state (Florida)', async () => {
    await page.goto(`${BASE_URL}/directory/medical-spas`, { waitUntil: 'networkidle2' });
    
    // Click on Florida
    const floridaLink = await page.$('a[href*="/fl"]');
    if (floridaLink) {
      await floridaLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      expect(url).toContain('/fl');
      
      // Check for city listings
      const cities = await page.$$eval('.city-link', links => links.length);
      expect(cities).toBeGreaterThan(0);
    }
  }, 30000);

  test('Navigate to specific city (Aventura)', async () => {
    await page.goto(`${BASE_URL}/directory/marketing-agencies/fl`, { waitUntil: 'networkidle2' });
    
    // Look for Aventura link
    const aventuraLink = await page.$('a[href*="aventura"]');
    if (aventuraLink) {
      await aventuraLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      expect(url).toContain('/aventura');
      
      // Check for business listings
      const businesses = await page.$$eval('.business-card', cards => cards.length);
      expect(businesses).toBeGreaterThan(0);
    }
  }, 30000);

  test('Navigate to business detail page', async () => {
    await page.goto(`${BASE_URL}/directory/marketing-agencies/fl/aventura`, { waitUntil: 'networkidle2' });
    
    // Get first business link
    const businessLinks = await page.$$('.business-link');
    if (businessLinks.length > 0) {
      const firstBusinessName = await businessLinks[0].evaluate(el => el.textContent);
      await businessLinks[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Should be on detail page
      const url = page.url();
      expect(url).toMatch(/\/[a-z]{2}\/[^\/]+\/[^\/]+\/[^\/]+$/);
      
      // Check for business name on detail page
      await page.waitForSelector('h1', { timeout: 10000 });
      const detailName = await page.$eval('h1', el => el.textContent);
      expect(detailName).toBeTruthy();
    }
  }, 30000);

  test('Hair Salons in Virginia shows correct businesses', async () => {
    await page.goto(`${BASE_URL}/directory/hair-salons/va/ashburn`, { waitUntil: 'networkidle2' });
    
    // Check for K&M HAIR LOUNGE
    const businessNames = await page.$$eval('.business-name', names => 
      names.map(n => n.textContent)
    );
    
    expect(businessNames).toContain('K&M HAIR LOUNGE');
    
    // Should show many businesses (leads + prospects)
    expect(businessNames.length).toBeGreaterThan(50);
  }, 30000);

  test('SimpliStack ranking is correct', async () => {
    await page.goto(`${BASE_URL}/fl/aventura/marketing/simplistack`, { waitUntil: 'networkidle2' });
    
    // Wait for rank to load
    await page.waitForSelector('.rank-display', { timeout: 10000 });
    
    const rank = await page.$eval('.rank-display', el => el.textContent);
    
    // SimpliStack should be ranked low (near 105) due to no reviews
    expect(parseInt(rank)).toBeGreaterThan(100);
  }, 30000);

  test('Check prospects are included in rankings', async () => {
    await page.goto(`${BASE_URL}/api/analyze?name=test&city=Aventura&state=FL&niche=marketing`, { 
      waitUntil: 'networkidle2' 
    });
    
    const jsonText = await page.evaluate(() => document.body.textContent);
    const data = JSON.parse(jsonText);
    
    // Should have 105 total businesses (1 lead + 104 prospects)
    expect(data.analysis.marketIntel.market_summary.total_businesses).toBe(105);
    
    // Top competitor should be Grant Cardone with 1157 reviews
    expect(data.analysis.competitors[0].name).toContain('Grant Cardone');
    expect(data.analysis.competitors[0].reviews).toBeGreaterThan(1000);
  }, 30000);
});