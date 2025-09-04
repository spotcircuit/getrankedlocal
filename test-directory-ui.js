const puppeteer = require('puppeteer');

async function testDirectoryPages() {
  console.log('Starting directory UI test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const issues = [];
  const brokenLinks = [];
  
  try {
    // Test main directory page
    console.log('\n=== Testing /directory ===');
    const baseUrl = 'http://172.20.240.1:3001';
    await page.goto(`${baseUrl}/directory`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        issues.push(`Console error on ${page.url()}: ${msg.text()}`);
      }
    });
    
    // Check for page errors
    page.on('pageerror', error => {
      issues.push(`Page error on ${page.url()}: ${error.message}`);
    });
    
    // Take screenshot of main directory page
    await page.screenshot({ 
      path: 'screenshots/directory-main.png',
      fullPage: true 
    });
    
    // Check if breadcrumbs exist
    const breadcrumbs = await page.$$('[aria-label="breadcrumb"]');
    if (breadcrumbs.length === 0) {
      const navElements = await page.$$('nav');
      console.log(`Found ${navElements.length} nav elements`);
    }
    
    // Get all links on the page
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a');
      return Array.from(anchors).map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        visible: a.offsetParent !== null
      }));
    });
    
    console.log(`Found ${links.length} links on directory page`);
    
    // Test each collection link
    const collectionLinks = links.filter(link => 
      link.href.includes('/directory/') && 
      !link.href.includes('/api/') &&
      link.visible
    );
    
    console.log(`Testing ${collectionLinks.length} collection links...`);
    
    for (const link of collectionLinks.slice(0, 5)) { // Test first 5 for now
      try {
        console.log(`\nTesting: ${link.href}`);
        const response = await page.goto(link.href, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        if (!response || !response.ok()) {
          brokenLinks.push({
            url: link.href,
            text: link.text,
            status: response ? response.status() : 'no response'
          });
        }
        
        // Check for visual issues
        const visualChecks = await page.evaluate(() => {
          const issues = [];
          
          // Check for overlapping elements
          const elements = document.querySelectorAll('*');
          
          // Check for text overflow
          elements.forEach(el => {
            if (el.scrollWidth > el.clientWidth) {
              const text = el.textContent?.substring(0, 50);
              if (text) issues.push(`Text overflow: ${text}...`);
            }
          });
          
          // Check for missing images
          const images = document.querySelectorAll('img');
          images.forEach(img => {
            if (!img.complete || img.naturalHeight === 0) {
              issues.push(`Broken image: ${img.src}`);
            }
          });
          
          // Check for z-index issues
          const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
          if (fixedElements.length > 1) {
            issues.push('Multiple fixed elements detected - potential overlap');
          }
          
          return issues;
        });
        
        if (visualChecks.length > 0) {
          issues.push(...visualChecks.map(issue => `${link.href}: ${issue}`));
        }
        
        // Test breadcrumb navigation if exists
        const breadcrumbLinks = await page.$$('nav a, [aria-label="breadcrumb"] a');
        console.log(`Found ${breadcrumbLinks.length} breadcrumb links`);
        
        // Take screenshot
        const urlPath = new URL(link.href).pathname.replace(/\//g, '-');
        await page.screenshot({ 
          path: `screenshots/directory${urlPath}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        brokenLinks.push({
          url: link.href,
          text: link.text,
          error: error.message
        });
      }
    }
    
    // Test mobile viewport
    console.log('\n=== Testing mobile viewport ===');
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${baseUrl}/directory`, { 
      waitUntil: 'networkidle2' 
    });
    await page.screenshot({ 
      path: 'screenshots/directory-mobile.png',
      fullPage: true 
    });
    
    // Check mobile menu if exists
    const mobileMenu = await page.$('[aria-label="menu"], [data-testid="menu-button"], button[class*="menu"]');
    if (mobileMenu) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/directory-mobile-menu.png' });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Print report
    console.log('\n=== TEST REPORT ===');
    
    if (issues.length > 0) {
      console.log('\nVisual/Console Issues Found:');
      issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('\nNo visual issues detected');
    }
    
    if (brokenLinks.length > 0) {
      console.log('\nBroken Links:');
      brokenLinks.forEach(link => {
        console.log(`- ${link.url}`);
        console.log(`  Text: ${link.text}`);
        console.log(`  Issue: ${link.error || `Status ${link.status}`}`);
      });
    } else {
      console.log('\nNo broken links found');
    }
    
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testDirectoryPages().catch(console.error);