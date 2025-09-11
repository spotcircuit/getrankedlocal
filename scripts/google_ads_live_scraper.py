#!/usr/bin/env python3
"""
Google Ads Live Scraper
Captures actual ads shown in Google Search results for specific keywords
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from urllib.parse import quote_plus

from playwright.async_api import async_playwright, Page


class GoogleAdsLiveScraper:
    """Scrapes live Google Ads from search results"""
    
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.results_dir = Path('google_ads_live')
        self.results_dir.mkdir(exist_ok=True)
    
    async def setup_browser(self, p):
        """Setup browser with anti-detection"""
        browser = await p.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1920,1080',
            ]
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
        )
        
        page = await context.new_page()
        return browser, context, page
    
    async def search_google_ads(self, keywords: List[str], location: str = None) -> Dict:
        """
        Search Google and capture ads for specific keywords
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'keywords': keywords,
            'location': location,
            'searches': []
        }
        
        async with async_playwright() as p:
            browser, context, page = await self.setup_browser(p)
            
            try:
                for keyword in keywords:
                    print(f"\n🔍 Searching for: {keyword}")
                    
                    # Build search query
                    query = keyword
                    if location:
                        query = f"{keyword} {location}"
                    
                    # Search Google
                    url = f"https://www.google.com/search?q={quote_plus(query)}"
                    print(f"   URL: {url}")
                    
                    await page.goto(url, wait_until='networkidle', timeout=30000)
                    await asyncio.sleep(2)
                    
                    # Extract ads
                    ads_data = await page.evaluate('''() => {
                        const ads = [];
                        
                        // Get text ads (top and bottom)
                        const adElements = document.querySelectorAll('[data-text-ad], [data-hveid][data-ved]');
                        
                        adElements.forEach(el => {
                            // Check if it's actually an ad
                            const adLabel = el.querySelector('[aria-label*="Ad"], [aria-label*="Sponsored"]') || 
                                           Array.from(el.querySelectorAll('span')).find(s => s.textContent === 'Ad' || s.textContent === 'Sponsored');
                            const parentHasAd = el.closest('[aria-label*="Ads"]') || el.closest('[role="region"][aria-label*="Advertisement"]');
                            
                            if (adLabel || parentHasAd || el.textContent.includes('Ad·') || el.textContent.includes('Sponsored·')) {
                                const ad = {};
                                
                                // Get advertiser/title
                                const titleEl = el.querySelector('h3, [role="heading"]');
                                ad.title = titleEl ? titleEl.textContent.trim() : '';
                                
                                // Get display URL
                                const urlEl = el.querySelector('cite, [data-dtld]');
                                ad.display_url = urlEl ? urlEl.textContent.trim() : '';
                                
                                // Get description
                                const descEls = el.querySelectorAll('[data-sncf], [style*="webkit-line-clamp"]');
                                const descriptions = [];
                                descEls.forEach(desc => {
                                    const text = desc.textContent.trim();
                                    if (text && !descriptions.includes(text)) {
                                        descriptions.push(text);
                                    }
                                });
                                ad.description = descriptions.join(' | ');
                                
                                // Get actual URL (from href)
                                const linkEl = el.querySelector('a[href*="http"]');
                                ad.url = linkEl ? linkEl.href : '';
                                
                                // Get extensions (sitelinks, callouts, etc.)
                                const extensions = [];
                                const extEls = el.querySelectorAll('[role="list"] a, [data-expansion-text]');
                                extEls.forEach(ext => {
                                    const text = ext.textContent.trim();
                                    if (text && text.length > 2) {
                                        extensions.push(text);
                                    }
                                });
                                ad.extensions = extensions;
                                
                                // Position (top or bottom)
                                const rect = el.getBoundingClientRect();
                                ad.position = rect.top < 600 ? 'top' : 'bottom';
                                
                                if (ad.title || ad.display_url) {
                                    ads.push(ad);
                                }
                            }
                        });
                        
                        // Also check for Shopping ads
                        const shoppingAds = document.querySelectorAll('[data-hveid][data-ved] [aria-label*="Sponsored"]');
                        shoppingAds.forEach(el => {
                            const container = el.closest('[data-hveid]');
                            if (container) {
                                const ad = {
                                    type: 'shopping',
                                    title: container.querySelector('h3')?.textContent.trim() || '',
                                    price: container.querySelector('[aria-label*="price"], span:has-text("$")')?.textContent.trim() || '',
                                    merchant: container.querySelector('[data-merchant-name], cite')?.textContent.trim() || '',
                                    image: container.querySelector('img')?.src || ''
                                };
                                if (ad.title) {
                                    ads.push(ad);
                                }
                            }
                        });
                        
                        return ads;
                    }''')
                    
                    # Take screenshot
                    screenshot_path = self.results_dir / f"search_{keyword.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=str(screenshot_path), full_page=True)
                    
                    search_result = {
                        'keyword': keyword,
                        'query': query,
                        'ads_found': len(ads_data),
                        'ads': ads_data,
                        'screenshot': str(screenshot_path)
                    }
                    
                    results['searches'].append(search_result)
                    
                    print(f"   ✅ Found {len(ads_data)} ads")
                    
                    # Print ad details
                    for i, ad in enumerate(ads_data, 1):
                        if ad.get('type') == 'shopping':
                            print(f"   📦 Shopping Ad {i}: {ad.get('title', 'Unknown')} - {ad.get('price', 'N/A')} from {ad.get('merchant', 'Unknown')}")
                        else:
                            print(f"   📢 Ad {i}: {ad.get('title', 'Unknown')}")
                            print(f"      URL: {ad.get('display_url', 'N/A')}")
                            if ad.get('description'):
                                print(f"      Desc: {ad['description'][:100]}...")
                    
                    # Wait between searches
                    if keyword != keywords[-1]:
                        await asyncio.sleep(3)
                
            finally:
                await browser.close()
        
        return results
    
    def save_results(self, results: Dict) -> Path:
        """Save results to JSON"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        json_path = self.results_dir / f"google_ads_{timestamp}.json"
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Create summary
        total_ads = sum(s['ads_found'] for s in results['searches'])
        print(f"\n📊 SUMMARY")
        print("=" * 60)
        print(f"Total searches: {len(results['searches'])}")
        print(f"Total ads found: {total_ads}")
        print(f"Results saved: {json_path}")
        
        return json_path


async def main():
    """Run the scraper"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python google_ads_live_scraper.py <keyword1> [keyword2] ...")
        print("Example: python google_ads_live_scraper.py 'medical spa ashburn' 'botox leesburg'")
        sys.exit(1)
    
    keywords = sys.argv[1:]
    
    print("🎯 Google Ads Live Scraper")
    print("=" * 60)
    print(f"Keywords: {', '.join(keywords)}")
    
    scraper = GoogleAdsLiveScraper(headless=False)  # Set to False to see what's happening
    results = await scraper.search_google_ads(keywords)
    scraper.save_results(results)


if __name__ == "__main__":
    asyncio.run(main())