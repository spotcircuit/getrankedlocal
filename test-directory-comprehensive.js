const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testDirectoryComprehensive() {
  console.log('Starting comprehensive directory test...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const baseUrl = 'http://172.20.240.1:3001';
  const issues = [];
  const brokenLinks = [];
  const testedUrls = new Set();
  
  // Setup console and error monitoring
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico') && !text.includes('_next')) {
        issues.push({
          type: 'console-error',
          url: page.url(),
          message: text
        });
      }
    }
  });
  
  page.on('pageerror', error => {
    issues.push({
      type: 'page-error',
      url: page.url(),
      message: error.message
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 404) {
      const url = response.url();
      if (!url.includes('favicon.ico') && !url.includes('_next/static')) {
        issues.push({
          type: 'network-error',
          url: page.url(),
          resource: url,
          status: response.status()
        });
      }
    }
  });
  
  try {
    // Test main directory page
    console.log('\n=== Testing Main Directory Page ===');
    await page.goto(`${baseUrl}/directory`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    testedUrls.add('/directory');
    
    // Take screenshot
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    await page.screenshot({ 
      path: 'screenshots/directory-main.png',
      fullPage: true 
    });
    
    // Analyze page structure
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        hasHeader: !!document.querySelector('header'),
        hasNav: !!document.querySelector('nav'),
        hasBreadcrumbs: !!document.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav'),
        collections: [],
        links: [],
        visualIssues: []
      };
      
      // Find all collection cards/links
      const collectionElements = document.querySelectorAll('[href*="/directory/"]');
      collectionElements.forEach(el => {
        if (!el.href.includes('/api/')) {
          analysis.collections.push({
            href: el.href,
            text: el.textContent.trim(),
            visible: el.offsetParent !== null
          });
        }
      });
      
      // Get all links
      const allLinks = document.querySelectorAll('a');
      allLinks.forEach(link => {
        if (link.href && !link.href.includes('#')) {
          analysis.links.push({
            href: link.href,
            text: link.textContent.trim(),
            visible: link.offsetParent !== null
          });
        }
      });
      
      // Check for visual issues
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        // Check text overflow
        if (el.scrollWidth > el.clientWidth && el.textContent.trim()) {
          analysis.visualIssues.push({
            type: 'text-overflow',
            element: el.tagName,
            text: el.textContent.substring(0, 50)
          });
        }
        
        // Check for elements outside viewport
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.right > window.innerWidth || rect.left < 0) {
            analysis.visualIssues.push({
              type: 'element-outside-viewport',
              element: el.tagName,
              class: el.className
            });
          }
        }
      });
      
      // Check images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
          analysis.visualIssues.push({
            type: 'broken-image',
            src: img.src
          });
        }
      });
      
      return analysis;
    });
    
    console.log(`Found ${pageAnalysis.collections.length} collection links`);
    console.log(`Found ${pageAnalysis.links.length} total links`);
    console.log(`Has breadcrumbs: ${pageAnalysis.hasBreadcrumbs}`);
    
    if (pageAnalysis.visualIssues.length > 0) {
      pageAnalysis.visualIssues.forEach(issue => {
        issues.push({
          type: 'visual',
          url: '/directory',
          ...issue
        });
      });
    }
    
    // Test each collection page
    console.log('\n=== Testing Collection Pages ===');
    const collectionsToTest = pageAnalysis.collections
      .filter(c => c.visible)
      .slice(0, 10); // Test first 10 collections
    
    for (const collection of collectionsToTest) {
      const pathname = new URL(collection.href).pathname;
      if (testedUrls.has(pathname)) continue;
      
      console.log(`\nTesting: ${pathname}`);
      testedUrls.add(pathname);
      
      try {
        const response = await page.goto(collection.href, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        if (!response || !response.ok()) {
          brokenLinks.push({
            url: collection.href,
            text: collection.text,
            status: response ? response.status() : 'no response'
          });
          continue;
        }
        
        // Analyze this collection page
        const collectionAnalysis = await page.evaluate(() => {
          const analysis = {
            title: document.title,
            hasBreadcrumbs: !!document.querySelector('[aria-label="breadcrumb"], .breadcrumb, nav a'),
            breadcrumbLinks: [],
            subCollections: [],
            businesses: [],
            visualIssues: []
          };
          
          // Get breadcrumb links
          const breadcrumbs = document.querySelectorAll('nav a, [aria-label="breadcrumb"] a');
          breadcrumbs.forEach(bc => {
            analysis.breadcrumbLinks.push({
              href: bc.href,
              text: bc.textContent.trim()
            });
          });
          
          // Find sub-collections or items
          const links = document.querySelectorAll('a[href*="/directory/"]');
          links.forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            
            if (href.includes('/services/')) {
              analysis.businesses.push({ href, text });
            } else {
              analysis.subCollections.push({ href, text });
            }
          });
          
          // Check for layout issues
          const cards = document.querySelectorAll('[class*="card"], [class*="Card"], .grid > *, .flex > *');
          let prevBottom = 0;
          cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            if (index > 0 && rect.top < prevBottom - 10) {
              analysis.visualIssues.push({
                type: 'overlapping-elements',
                description: 'Cards may be overlapping'
              });
            }
            prevBottom = rect.bottom;
          });
          
          return analysis;
        });
        
        console.log(`  - Breadcrumbs: ${collectionAnalysis.breadcrumbLinks.length}`);
        console.log(`  - Sub-collections: ${collectionAnalysis.subCollections.length}`);
        console.log(`  - Businesses: ${collectionAnalysis.businesses.length}`);
        
        // Test breadcrumb navigation
        if (collectionAnalysis.breadcrumbLinks.length > 0) {
          for (const breadcrumb of collectionAnalysis.breadcrumbLinks) {
            try {
              const bcResponse = await page.goto(breadcrumb.href, {
                waitUntil: 'networkidle2',
                timeout: 10000
              });
              
              if (!bcResponse || !bcResponse.ok()) {
                brokenLinks.push({
                  url: breadcrumb.href,
                  text: `Breadcrumb: ${breadcrumb.text}`,
                  from: collection.href,
                  status: bcResponse ? bcResponse.status() : 'no response'
                });
              }
            } catch (error) {
              brokenLinks.push({
                url: breadcrumb.href,
                text: `Breadcrumb: ${breadcrumb.text}`,
                from: collection.href,
                error: error.message
              });
            }
          }
        }
        
        // Take screenshot
        const screenshotName = pathname.replace(/\//g, '-').substring(1);
        await page.screenshot({ 
          path: `screenshots/${screenshotName}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        brokenLinks.push({
          url: collection.href,
          text: collection.text,
          error: error.message
        });
      }
    }
    
    // Test mobile view
    console.log('\n=== Testing Mobile View ===');
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${baseUrl}/directory`, { 
      waitUntil: 'networkidle2' 
    });
    
    const mobileAnalysis = await page.evaluate(() => {
      const analysis = {
        hasHamburgerMenu: !!document.querySelector('[aria-label*="menu"], button[class*="menu"], [data-testid*="menu"]'),
        elementsOutsideViewport: [],
        textOverflow: []
      };
      
      // Check for elements outside mobile viewport
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.right > 375) {
            analysis.elementsOutsideViewport.push({
              element: el.tagName,
              class: el.className,
              width: rect.width
            });
          }
        }
        
        // Check text overflow in mobile
        if (el.scrollWidth > el.clientWidth && el.textContent.trim()) {
          analysis.textOverflow.push({
            element: el.tagName,
            text: el.textContent.substring(0, 30)
          });
        }
      });
      
      return analysis;
    });
    
    if (mobileAnalysis.elementsOutsideViewport.length > 0) {
      mobileAnalysis.elementsOutsideViewport.forEach(item => {
        issues.push({
          type: 'mobile-overflow',
          ...item
        });
      });
    }
    
    await page.screenshot({ 
      path: 'screenshots/directory-mobile.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Generate detailed report
    console.log('\n' + '='.repeat(60));
    console.log('TEST REPORT');
    console.log('='.repeat(60));
    
    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      testedUrls: Array.from(testedUrls),
      issues: issues,
      brokenLinks: brokenLinks,
      summary: {
        totalIssues: issues.length,
        totalBrokenLinks: brokenLinks.length,
        issueTypes: {}
      }
    };
    
    // Count issue types
    issues.forEach(issue => {
      report.summary.issueTypes[issue.type] = (report.summary.issueTypes[issue.type] || 0) + 1;
    });
    
    fs.writeFileSync('directory-test-report.json', JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\nSUMMARY:');
    console.log(`- Pages tested: ${testedUrls.size}`);
    console.log(`- Total issues found: ${issues.length}`);
    console.log(`- Broken links: ${brokenLinks.length}`);
    
    if (Object.keys(report.summary.issueTypes).length > 0) {
      console.log('\nIssue Types:');
      Object.entries(report.summary.issueTypes).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    }
    
    if (brokenLinks.length > 0) {
      console.log('\nBroken Links:');
      brokenLinks.slice(0, 10).forEach(link => {
        console.log(`  - ${link.url}`);
        if (link.from) console.log(`    From: ${link.from}`);
        if (link.error) console.log(`    Error: ${link.error}`);
        if (link.status) console.log(`    Status: ${link.status}`);
      });
      if (brokenLinks.length > 10) {
        console.log(`  ... and ${brokenLinks.length - 10} more`);
      }
    }
    
    if (issues.length > 0) {
      console.log('\nTop Issues:');
      issues.slice(0, 10).forEach(issue => {
        console.log(`  - [${issue.type}] ${issue.url || 'N/A'}`);
        if (issue.message) console.log(`    ${issue.message}`);
      });
      if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more`);
      }
    }
    
    console.log('\nFull report saved to: directory-test-report.json');
    console.log('Screenshots saved to: screenshots/');
    
    await browser.close();
  }
}

testDirectoryComprehensive().catch(console.error);