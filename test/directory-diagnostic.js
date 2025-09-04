const puppeteer = require('puppeteer');

const BASE_URL = 'http://10.0.0.234:3001';

async function diagnoseDirectory() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('🔍 Directory Diagnostic Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Main Directory Page
    console.log('\n📁 Main Directory Page (/directory)');
    console.log('-' .repeat(40));
    await page.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2' });
    
    const directoryLinks = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      return allLinks.map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent.trim()
      })).filter(link => link.href && link.href.includes('directory'));
    });
    
    console.log(`Found ${directoryLinks.length} directory links:`);
    directoryLinks.forEach(link => {
      console.log(`  ${link.href} - "${link.text}"`);
    });
    
    // Test 2: Hair Salons Service Page
    console.log('\n💇 Hair Salons Service Page (/directory/hair-salons)');
    console.log('-' .repeat(40));
    await page.goto(`${BASE_URL}/directory/hair-salons`, { waitUntil: 'networkidle2' });
    
    const hairSalonLinks = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      return allLinks.map(link => ({
        href: link.getAttribute('href'),
        text: link.textContent.trim()
      })).filter(link => link.href && link.href.includes('hair-salons'));
    });
    
    console.log(`Found ${hairSalonLinks.length} hair salon links:`);
    hairSalonLinks.forEach(link => {
      console.log(`  ${link.href} - "${link.text}"`);
    });
    
    // Check for any cards
    const cards = await page.evaluate(() => {
      const cardSelectors = [
        '[class*="card"]',
        '[class*="Card"]',
        'article',
        '.grid > div',
        '.grid > a'
      ];
      
      for (const selector of cardSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return {
            selector,
            count: elements.length,
            sample: Array.from(elements).slice(0, 3).map(el => el.textContent.trim().substring(0, 100))
          };
        }
      }
      return null;
    });
    
    if (cards) {
      console.log(`\nFound ${cards.count} cards using selector: ${cards.selector}`);
      console.log('Sample content:');
      cards.sample.forEach((text, i) => {
        console.log(`  ${i + 1}. ${text}...`);
      });
    } else {
      console.log('\n⚠️ No card elements found');
    }
    
    // Test 3: Ashburn Hair Salons Page
    console.log('\n🏙️ Ashburn Hair Salons (/directory/hair-salons/VA/ashburn)');
    console.log('-' .repeat(40));
    await page.goto(`${BASE_URL}/directory/hair-salons/VA/ashburn`, { waitUntil: 'networkidle2' });
    
    // Check for business listings
    const businessElements = await page.evaluate(() => {
      // Try different selectors to find business listings
      const selectors = [
        'h3',
        '[class*="business"]',
        '[class*="card"]',
        'article',
        '.grid > div'
      ];
      
      const results = {};
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results[selector] = Array.from(elements).slice(0, 5).map(el => 
            el.textContent.trim().substring(0, 100)
          );
        }
      }
      return results;
    });
    
    console.log('Elements found on page:');
    Object.entries(businessElements).forEach(([selector, texts]) => {
      console.log(`\n  ${selector}: ${texts.length} items`);
      texts.forEach((text, i) => {
        console.log(`    ${i + 1}. ${text}`);
      });
    });
    
    // Test 4: Check API response directly
    console.log('\n🔌 API Response Check');
    console.log('-' .repeat(40));
    
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/directory/services/hair-salons/VA/ashburn');
        const data = await response.json();
        return {
          success: data.success,
          businessCount: data.businesses?.length || 0,
          firstBusiness: data.businesses?.[0] || null,
          error: data.error
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('API Response:');
    console.log(`  Success: ${apiResponse.success}`);
    console.log(`  Business Count: ${apiResponse.businessCount}`);
    if (apiResponse.firstBusiness) {
      console.log(`  First Business: ${apiResponse.firstBusiness.name}`);
    }
    if (apiResponse.error) {
      console.log(`  Error: ${apiResponse.error}`);
    }
    
    // Test 5: Check page structure
    console.log('\n📄 Page Structure Analysis');
    console.log('-' .repeat(40));
    
    const pageStructure = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent,
        h2Count: document.querySelectorAll('h2').length,
        linkCount: document.querySelectorAll('a').length,
        hasGrid: !!document.querySelector('.grid'),
        hasContainer: !!document.querySelector('.container'),
        bodyClasses: document.body.className,
        mainContent: document.querySelector('main')?.className || 'No main element'
      };
    });
    
    console.log('Page structure:');
    Object.entries(pageStructure).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error during diagnostic:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Diagnostic complete');
}

// Run the diagnostic
diagnoseDirectory().catch(console.error);