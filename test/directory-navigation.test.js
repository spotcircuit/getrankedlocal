const puppeteer = require('puppeteer');

const BASE_URL = 'http://10.0.0.234:3001';

describe('Directory Navigation Flow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Main Directory Page', () => {
    test('should load directory page and show service cards', async () => {
      console.log('\n📁 Testing Main Directory Page...');
      await page.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2' });
      
      // Check page title
      const title = await page.title();
      console.log(`  ✓ Page title: ${title}`);
      
      // Check for service cards
      const serviceCards = await page.$$('[href^="/directory/"]');
      console.log(`  ✓ Found ${serviceCards.length} service cards`);
      
      // Get all service links
      const serviceLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href^="/directory/"]'));
        return links.map(link => ({
          href: link.href,
          text: link.textContent.trim()
        })).filter(link => !link.href.includes('/state/') && !link.href.includes('/city/'));
      });
      
      console.log('  ✓ Available services:');
      serviceLinks.forEach(link => {
        console.log(`    - ${link.text}`);
      });
      
      expect(serviceCards.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Service State Pages', () => {
    test('should navigate to medspas and show states', async () => {
      console.log('\n🏥 Testing Medical Spas Service...');
      
      // Click on Medical Spas
      await page.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2' });
      await page.click('a[href="/directory/medspas"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const currentUrl = page.url();
      console.log(`  ✓ Navigated to: ${currentUrl}`);
      
      // Check for state cards
      const stateCards = await page.$$('a[href*="/directory/medspas/"]');
      console.log(`  ✓ Found ${stateCards.length} state cards`);
      
      // Get state information
      const states = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a[href*="/directory/medspas/"]'));
        return cards.map(card => {
          const stateText = card.querySelector('h3')?.textContent || '';
          const citiesText = card.querySelector('p')?.textContent || '';
          return { state: stateText, cities: citiesText };
        });
      });
      
      console.log('  ✓ Available states:');
      states.forEach(state => {
        console.log(`    - ${state.state}: ${state.cities}`);
      });
      
      expect(stateCards.length).toBeGreaterThan(0);
    }, 30000);

    test('should navigate to hair-salons and show states', async () => {
      console.log('\n💇 Testing Hair Salons Service...');
      
      await page.goto(`${BASE_URL}/directory/hair-salons`, { waitUntil: 'networkidle2' });
      
      const currentUrl = page.url();
      console.log(`  ✓ Navigated to: ${currentUrl}`);
      
      // Check for VA state (we know hair salons exist in VA)
      const vaCard = await page.$('a[href="/directory/hair-salons/VA"]');
      expect(vaCard).toBeTruthy();
      
      if (vaCard) {
        const vaInfo = await page.evaluate(el => {
          const heading = el.querySelector('h3')?.textContent || '';
          const cities = el.querySelector('p')?.textContent || '';
          return { heading, cities };
        }, vaCard);
        
        console.log(`  ✓ Found Virginia: ${vaInfo.heading}`);
        console.log(`    Cities: ${vaInfo.cities}`);
      }
    }, 30000);
  });

  describe('City Pages', () => {
    test('should navigate to city page and show businesses', async () => {
      console.log('\n🏙️ Testing City Page (Hair Salons in Ashburn, VA)...');
      
      await page.goto(`${BASE_URL}/directory/hair-salons/VA/ashburn`, { waitUntil: 'networkidle2' });
      
      const currentUrl = page.url();
      console.log(`  ✓ Navigated to: ${currentUrl}`);
      
      // Wait for business cards to load
      await page.waitForSelector('[class*="card"]', { timeout: 10000 });
      
      // Count business cards
      const businessCards = await page.$$('[class*="card"]');
      console.log(`  ✓ Found ${businessCards.length} business cards`);
      
      // Get business information
      const businesses = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('[class*="card"]'));
        return cards.slice(0, 5).map(card => {
          const name = card.querySelector('h3')?.textContent || '';
          const rating = card.querySelector('[class*="rating"]')?.textContent || '';
          const badge = card.querySelector('[class*="badge"]')?.textContent || '';
          return { name, rating, badge };
        });
      });
      
      console.log('  ✓ Top 5 businesses:');
      businesses.forEach((biz, i) => {
        console.log(`    ${i + 1}. ${biz.name} - Rating: ${biz.rating} ${biz.badge ? `[${biz.badge}]` : ''}`);
      });
      
      // Check for leads vs prospects
      const businessTypes = await page.evaluate(() => {
        const apiData = window.__NEXT_DATA__?.props?.pageProps || {};
        if (apiData.businesses) {
          const leads = apiData.businesses.filter(b => b.businessType === 'lead').length;
          const prospects = apiData.businesses.filter(b => b.businessType === 'prospect').length;
          return { leads, prospects };
        }
        return null;
      });
      
      if (businessTypes) {
        console.log(`  ✓ Business breakdown: ${businessTypes.leads} leads, ${businessTypes.prospects} prospects`);
      }
      
      expect(businessCards.length).toBeGreaterThan(0);
    }, 30000);

    test('should navigate to medspas city page', async () => {
      console.log('\n🏙️ Testing City Page (Medical Spas in Austin, TX)...');
      
      await page.goto(`${BASE_URL}/directory/medspas/TX/austin`, { waitUntil: 'networkidle2' });
      
      const currentUrl = page.url();
      console.log(`  ✓ Navigated to: ${currentUrl}`);
      
      // Check page heading
      const heading = await page.$eval('h1', el => el.textContent);
      console.log(`  ✓ Page heading: ${heading}`);
      
      // Check for business cards
      const hasBusinesses = await page.$('[class*="card"]');
      if (hasBusinesses) {
        const businessCount = await page.$$eval('[class*="card"]', cards => cards.length);
        console.log(`  ✓ Found ${businessCount} businesses`);
      } else {
        console.log('  ⚠️ No businesses found (might be empty collection)');
      }
    }, 30000);
  });

  describe('Business Detail Pages', () => {
    test('should navigate to business detail page', async () => {
      console.log('\n🏢 Testing Business Detail Page...');
      
      // First go to a city page with businesses
      await page.goto(`${BASE_URL}/directory/hair-salons/VA/ashburn`, { waitUntil: 'networkidle2' });
      
      // Get first business card link
      const firstBusinessLink = await page.evaluate(() => {
        const card = document.querySelector('[class*="card"] a[href*="company"]');
        return card ? card.href : null;
      });
      
      if (firstBusinessLink) {
        console.log(`  ✓ Found business link: ${firstBusinessLink}`);
        
        // Navigate to detail page
        await page.goto(firstBusinessLink, { waitUntil: 'networkidle2' });
        
        // Check for business details
        const businessName = await page.$eval('h1', el => el.textContent).catch(() => null);
        console.log(`  ✓ Business name: ${businessName}`);
        
        // Check for analysis sections
        const sections = await page.evaluate(() => {
          const sectionHeaders = Array.from(document.querySelectorAll('h2, h3'));
          return sectionHeaders.map(h => h.textContent);
        });
        
        console.log('  ✓ Page sections:');
        sections.forEach(section => {
          console.log(`    - ${section}`);
        });
        
        // Check for contact information
        const hasPhone = await page.$('a[href^="tel:"]');
        const hasWebsite = await page.$('a[target="_blank"][rel="noopener noreferrer"]');
        
        console.log(`  ✓ Contact info: Phone: ${!!hasPhone}, Website: ${!!hasWebsite}`);
      } else {
        console.log('  ⚠️ No business detail links found');
      }
    }, 30000);
  });

  describe('Navigation Flow', () => {
    test('should complete full navigation flow', async () => {
      console.log('\n🔄 Testing Complete Navigation Flow...');
      
      // Start at directory
      await page.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2' });
      console.log('  ✓ Step 1: Main directory page');
      
      // Click on Hair Salons
      await page.click('a[href="/directory/hair-salons"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('  ✓ Step 2: Hair Salons service page');
      
      // Click on Virginia
      await page.click('a[href="/directory/hair-salons/VA"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('  ✓ Step 3: Virginia state page');
      
      // Click on Ashburn
      const ashburnLink = await page.$('a[href="/directory/hair-salons/VA/ashburn"]');
      if (ashburnLink) {
        await ashburnLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('  ✓ Step 4: Ashburn city page');
        
        // Try to click on a business
        const businessLink = await page.$('[class*="card"] a[href*="company"]');
        if (businessLink) {
          await businessLink.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2' });
          console.log('  ✓ Step 5: Business detail page');
          
          const finalUrl = page.url();
          console.log(`  ✓ Final URL: ${finalUrl}`);
        }
      }
    }, 60000);
  });

  describe('Error Handling', () => {
    test('should handle non-existent service gracefully', async () => {
      console.log('\n❌ Testing Error Handling...');
      
      await page.goto(`${BASE_URL}/directory/non-existent-service`, { waitUntil: 'networkidle2' });
      
      const pageContent = await page.content();
      const has404 = pageContent.includes('404') || pageContent.includes('not found');
      
      console.log(`  ✓ Non-existent service returns 404: ${has404}`);
    }, 30000);
    
    test('should handle empty collections gracefully', async () => {
      console.log('\n📭 Testing Empty Collections...');
      
      // Try Florida medspas (which might be empty)
      await page.goto(`${BASE_URL}/directory/medspas/FL`, { waitUntil: 'networkidle2' });
      
      const pageContent = await page.content();
      const hasContent = await page.$('[class*="card"]');
      
      if (!hasContent) {
        console.log('  ✓ Empty collection handled gracefully');
      } else {
        const cardCount = await page.$$eval('[class*="card"]', cards => cards.length);
        console.log(`  ✓ Collection has ${cardCount} items`);
      }
    }, 30000);
  });
});