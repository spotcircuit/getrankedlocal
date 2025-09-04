const puppeteer = require('puppeteer');
const fs = require('fs');

async function analyzeDirectoryVisuals() {
  console.log('🎨 Starting Visual Analysis of Directory Pages...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  const baseUrl = 'http://172.20.240.1:3001';
  
  const visualIssues = [];
  const layoutRecommendations = [];
  const flowImprovements = [];
  
  try {
    // Test different viewport sizes
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 812 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      // Test main directory page
      console.log('  → Analyzing /directory');
      await page.goto(`${baseUrl}/directory`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Analyze visual hierarchy and spacing
      const directoryAnalysis = await page.evaluate(() => {
        const issues = [];
        const recommendations = [];
        
        // Check hero section
        const hero = document.querySelector('section');
        if (hero) {
          const heroHeight = hero.getBoundingClientRect().height;
          if (heroHeight > window.innerHeight * 0.8) {
            issues.push({
              type: 'hero-size',
              description: 'Hero section takes up too much vertical space',
              height: heroHeight,
              screenHeight: window.innerHeight
            });
            recommendations.push('Reduce hero section padding or content to improve above-the-fold visibility');
          }
        }
        
        // Check collection cards
        const cards = document.querySelectorAll('[href*="/directory/"]').length > 0 
          ? document.querySelectorAll('[href*="/directory/"]')
          : document.querySelectorAll('.grid > *');
          
        if (cards.length > 0) {
          // Check card visibility
          let visibleCards = 0;
          cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              visibleCards++;
            }
          });
          
          if (visibleCards < 3 && cards.length >= 3) {
            issues.push({
              type: 'card-visibility',
              description: 'Too few collection cards visible without scrolling',
              visibleCards,
              totalCards: cards.length
            });
            recommendations.push('Reduce vertical spacing to show more cards above the fold');
          }
          
          // Check card consistency
          const cardHeights = Array.from(cards).map(c => c.getBoundingClientRect().height);
          const avgHeight = cardHeights.reduce((a, b) => a + b, 0) / cardHeights.length;
          const inconsistent = cardHeights.some(h => Math.abs(h - avgHeight) > 20);
          
          if (inconsistent) {
            issues.push({
              type: 'card-inconsistency',
              description: 'Collection cards have inconsistent heights',
              heights: cardHeights
            });
            recommendations.push('Ensure all collection cards have consistent height for better visual alignment');
          }
        }
        
        // Check text readability
        const allText = document.querySelectorAll('p, span, h1, h2, h3, h4');
        allText.forEach(el => {
          const styles = window.getComputedStyle(el);
          const fontSize = parseInt(styles.fontSize);
          const color = styles.color;
          
          // Check font size on mobile
          if (window.innerWidth < 768) {
            if (fontSize < 14 && el.textContent.length > 20) {
              issues.push({
                type: 'text-too-small',
                description: `Text too small on mobile: "${el.textContent.substring(0, 30)}..."`,
                fontSize: fontSize
              });
            }
          }
          
          // Check contrast (simplified)
          if (color && color.includes('128') || color.includes('gray')) {
            const bgColor = styles.backgroundColor;
            if (bgColor && bgColor.includes('0, 0, 0')) {
              issues.push({
                type: 'low-contrast',
                description: 'Gray text on dark background may have contrast issues',
                element: el.tagName
              });
            }
          }
        });
        
        // Check spacing and padding
        const sections = document.querySelectorAll('section');
        sections.forEach((section, index) => {
          const styles = window.getComputedStyle(section);
          const paddingTop = parseInt(styles.paddingTop);
          const paddingBottom = parseInt(styles.paddingBottom);
          
          if (paddingTop > 120 || paddingBottom > 120) {
            issues.push({
              type: 'excessive-padding',
              description: `Section ${index + 1} has excessive padding`,
              padding: `${paddingTop}px top, ${paddingBottom}px bottom`
            });
            recommendations.push(`Reduce padding on section ${index + 1} to improve content density`);
          }
        });
        
        // Check for horizontal scrolling
        if (document.body.scrollWidth > window.innerWidth) {
          issues.push({
            type: 'horizontal-scroll',
            description: 'Page has horizontal scrolling',
            bodyWidth: document.body.scrollWidth,
            windowWidth: window.innerWidth
          });
          recommendations.push('Fix elements causing horizontal overflow');
        }
        
        // Check loading states
        const loadingElements = document.querySelectorAll('.animate-pulse, .skeleton');
        if (loadingElements.length > 0) {
          issues.push({
            type: 'loading-state',
            description: 'Loading skeletons still visible',
            count: loadingElements.length
          });
        }
        
        // Check empty states
        const emptyStates = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent.includes('No collections found') || 
          el.textContent.includes('No results')
        );
        if (emptyStates.length > 0) {
          issues.push({
            type: 'empty-state',
            description: 'Empty state message shown instead of content'
          });
          recommendations.push('Ensure data is loading properly or provide better fallback content');
        }
        
        return { issues, recommendations };
      });
      
      directoryAnalysis.issues.forEach(issue => {
        visualIssues.push({
          page: '/directory',
          viewport: viewport.name,
          ...issue
        });
      });
      
      layoutRecommendations.push(...directoryAnalysis.recommendations);
      
      // Take screenshot for reference
      await page.screenshot({ 
        path: `screenshots/visual-analysis-directory-${viewport.name.toLowerCase()}.png`,
        fullPage: false 
      });
      
      // Test a collection page
      const collectionLinks = await page.$$eval('a[href*="/directory/"]', links => 
        links.map(l => l.href).filter(h => !h.includes('/api/'))
      );
      
      if (collectionLinks.length > 0) {
        const testUrl = collectionLinks[0];
        console.log(`  → Analyzing ${new URL(testUrl).pathname}`);
        
        await page.goto(testUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        const collectionAnalysis = await page.evaluate(() => {
          const issues = [];
          const flowSuggestions = [];
          
          // Check breadcrumb navigation
          const breadcrumbs = document.querySelector('nav');
          if (breadcrumbs) {
            const links = breadcrumbs.querySelectorAll('a');
            if (links.length < 2) {
              issues.push({
                type: 'breadcrumb-incomplete',
                description: 'Breadcrumb navigation has too few links',
                linkCount: links.length
              });
              flowSuggestions.push('Add complete breadcrumb trail: Home > Directory > Collection > State');
            }
            
            // Check breadcrumb visibility
            const rect = breadcrumbs.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom < 0) {
              issues.push({
                type: 'breadcrumb-hidden',
                description: 'Breadcrumbs not visible at top of page'
              });
            }
          } else {
            issues.push({
              type: 'breadcrumb-missing',
              description: 'No breadcrumb navigation found'
            });
            flowSuggestions.push('Add breadcrumb navigation for better user orientation');
          }
          
          // Check state cards layout
          const stateCards = document.querySelectorAll('.grid > div');
          if (stateCards.length > 0) {
            // Check grid responsiveness
            const grid = stateCards[0].parentElement;
            const gridStyles = window.getComputedStyle(grid);
            const gridColumns = gridStyles.gridTemplateColumns;
            
            if (window.innerWidth < 768 && gridColumns.includes('repeat')) {
              const columnCount = gridColumns.match(/\d+/)?.[0];
              if (columnCount && parseInt(columnCount) > 1) {
                issues.push({
                  type: 'grid-not-responsive',
                  description: 'Grid not properly stacked on mobile',
                  columns: columnCount
                });
                flowSuggestions.push('Stack cards vertically on mobile for better readability');
              }
            }
            
            // Check CTA buttons
            const ctaButtons = document.querySelectorAll('a[href*="/directory/"] .group-hover\\:translate-x-1');
            if (ctaButtons.length === 0) {
              flowSuggestions.push('Add clear call-to-action buttons on state cards');
            }
          }
          
          // Check search functionality
          const searchInput = document.querySelector('input[type="text"], input[placeholder*="search" i]');
          if (!searchInput) {
            issues.push({
              type: 'search-missing',
              description: 'No search functionality on collection page'
            });
            flowSuggestions.push('Add search/filter functionality to help users find specific locations');
          }
          
          // Check footer visibility
          const footer = document.querySelector('footer');
          if (footer) {
            const footerRect = footer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (footerRect.top < viewportHeight && stateCards.length < 3) {
              issues.push({
                type: 'content-too-short',
                description: 'Page content too short, footer visible without scrolling'
              });
              flowSuggestions.push('Add more content or adjust spacing to properly fill the viewport');
            }
          }
          
          return { issues, flowSuggestions };
        });
        
        collectionAnalysis.issues.forEach(issue => {
          visualIssues.push({
            page: new URL(testUrl).pathname,
            viewport: viewport.name,
            ...issue
          });
        });
        
        flowImprovements.push(...collectionAnalysis.flowSuggestions);
        
        await page.screenshot({ 
          path: `screenshots/visual-analysis-collection-${viewport.name.toLowerCase()}.png`,
          fullPage: false 
        });
      }
    }
    
    // Analyze user flow
    console.log('\n🔄 Analyzing User Flow...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${baseUrl}/directory`, { waitUntil: 'networkidle2' });
    
    const userFlowAnalysis = await page.evaluate(() => {
      const suggestions = [];
      
      // Check navigation clarity
      const navLinks = document.querySelectorAll('header a');
      const directoryLink = Array.from(navLinks).find(a => a.textContent.includes('Directory'));
      if (directoryLink) {
        const isActive = directoryLink.className.includes('gradient') || 
                        directoryLink.className.includes('active');
        if (!isActive) {
          suggestions.push('Highlight active navigation item to show current page');
        }
      }
      
      // Check information architecture
      const collections = document.querySelectorAll('[href*="/directory/"]');
      if (collections.length > 6) {
        const hasCategories = document.querySelector('[class*="filter"], [class*="category"]');
        if (!hasCategories) {
          suggestions.push('Add category filters or grouping for easier navigation with many collections');
        }
      }
      
      // Check for user guidance
      const hasInstructions = Array.from(document.querySelectorAll('p')).some(p => 
        p.textContent.toLowerCase().includes('select') || 
        p.textContent.toLowerCase().includes('choose') ||
        p.textContent.toLowerCase().includes('browse')
      );
      if (!hasInstructions) {
        suggestions.push('Add clear instructions or helper text to guide users');
      }
      
      // Check for back navigation
      const hasBackButton = document.querySelector('button[onclick*="back"], a[href*="javascript:history"]');
      if (!hasBackButton) {
        suggestions.push('Consider adding a back button for easier navigation');
      }
      
      return suggestions;
    });
    
    flowImprovements.push(...userFlowAnalysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
  } finally {
    // Generate comprehensive report
    console.log('\n' + '='.repeat(60));
    console.log('📊 VISUAL ANALYSIS REPORT');
    console.log('='.repeat(60));
    
    // Group issues by type
    const issuesByType = {};
    visualIssues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    console.log('\n🔴 VISUAL ISSUES FOUND:');
    Object.entries(issuesByType).forEach(([type, issues]) => {
      console.log(`\n${type.toUpperCase().replace(/-/g, ' ')}:`);
      issues.forEach(issue => {
        console.log(`  • [${issue.viewport}] ${issue.page}: ${issue.description}`);
      });
    });
    
    console.log('\n🎨 LAYOUT RECOMMENDATIONS:');
    const uniqueRecommendations = [...new Set(layoutRecommendations)];
    uniqueRecommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    
    console.log('\n🔄 USER FLOW IMPROVEMENTS:');
    const uniqueFlowImprovements = [...new Set(flowImprovements)];
    uniqueFlowImprovements.forEach((imp, i) => {
      console.log(`  ${i + 1}. ${imp}`);
    });
    
    // Priority fixes
    console.log('\n⚡ PRIORITY FIXES:');
    const priorities = [
      '1. Fix "No collections found" empty state - ensure API returns fallback data',
      '2. Reduce hero section height to show more content above the fold',
      '3. Improve mobile responsiveness - stack cards vertically on small screens',
      '4. Add search/filter functionality to collection pages',
      '5. Enhance breadcrumb navigation with complete trail',
      '6. Fix contrast issues with gray text on dark backgrounds',
      '7. Add loading states that resolve properly',
      '8. Implement proper error handling with user-friendly messages'
    ];
    priorities.forEach(p => console.log(`  ${p}`));
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      visualIssues,
      layoutRecommendations: uniqueRecommendations,
      flowImprovements: uniqueFlowImprovements,
      priorityFixes: priorities,
      summary: {
        totalIssues: visualIssues.length,
        issueTypes: Object.keys(issuesByType),
        recommendationCount: uniqueRecommendations.length,
        flowImprovementCount: uniqueFlowImprovements.length
      }
    };
    
    fs.writeFileSync('directory-visual-analysis-report.json', JSON.stringify(report, null, 2));
    console.log('\n📁 Full report saved to: directory-visual-analysis-report.json');
    console.log('📸 Screenshots saved to: screenshots/visual-analysis-*.png');
    
    await browser.close();
  }
}

analyzeDirectoryVisuals().catch(console.error);