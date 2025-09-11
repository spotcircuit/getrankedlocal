#!/usr/bin/env python3
"""
Competitor Ads Scraper
Fetches advertising data from Google Ads Transparency Center and Meta Ad Library
"""

import asyncio
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import quote_plus, urlencode

import typer
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
import pandas as pd
from tqdm import tqdm

app = typer.Typer(help='Fetch competitor ads from Google and Meta ad libraries')


class AdTransparencyScraper:
    """Scrapes ads from Google Ads Transparency Center and Meta Ad Library"""
    
    def __init__(self, headless: bool = False, save_screenshots: bool = False):
        self.headless = headless
        self.save_screenshots = save_screenshots
        self.results_dir = Path('ad_results')
        self.results_dir.mkdir(exist_ok=True)
        self.screenshots_dir = self.results_dir / 'screenshots'
        if save_screenshots:
            self.screenshots_dir.mkdir(exist_ok=True)
    
    async def setup_browser(self, p):
        """Setup browser with anti-detection measures"""
        browser = await p.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080',
            ]
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
        )
        
        # Add stealth settings
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            window.chrome = {runtime: {}};
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({state: 'granted'})
                })
            });
        """)
        
        page = await context.new_page()
        return browser, context, page
    
    async def scrape_google_ads_transparency(self, company_name: str, page: Page) -> Dict:
        """
        Scrape Google Ads Transparency Center for a company
        URL: https://adstransparency.google.com/
        """
        results = {
            'platform': 'Google Ads Transparency',
            'company': company_name,
            'timestamp': datetime.now().isoformat(),
            'ads': [],
            'error': None
        }
        
        try:
            # Check if it's a domain/URL
            search_term = company_name
            if '.com' in company_name or '.net' in company_name or '.org' in company_name:
                # Clean up domain - remove http/https and www
                search_term = company_name.replace('http://', '').replace('https://', '').replace('www.', '')
                print(f"🌐 Detected domain: {search_term}")
            
            # Navigate to Google Ads Transparency
            url = f"https://adstransparency.google.com/?region=US&q={quote_plus(search_term)}"
            print(f"🔍 Searching Google Ads for: {search_term}")
            print(f"   URL: {url}")
            
            await page.goto(url, wait_until='networkidle', timeout=60000)
            await asyncio.sleep(3)  # Let page fully load
            
            # Take screenshot if enabled
            if self.save_screenshots:
                screenshot_path = self.screenshots_dir / f"google_{company_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                await page.screenshot(path=str(screenshot_path), full_page=True)
                print(f"📸 Screenshot saved: {screenshot_path.name}")
            
            # Wait for results to load
            try:
                await page.wait_for_selector('[role="list"]', timeout=10000)
            except:
                # No results found
                results['message'] = 'No ads found for this advertiser'
                return results
            
            # Scroll to load more results
            for _ in range(3):
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await asyncio.sleep(2)
            
            # Extract ad data
            ads_data = await page.evaluate('''() => {
                const ads = [];
                const adElements = document.querySelectorAll('[role="listitem"]');
                
                adElements.forEach(el => {
                    const ad = {};
                    
                    // Get ad format (text, image, video)
                    const formatEl = el.querySelector('[aria-label*="format"]');
                    ad.format = formatEl ? formatEl.textContent : 'Unknown';
                    
                    // Get ad text content
                    const textElements = el.querySelectorAll('div[dir="ltr"]');
                    const texts = [];
                    textElements.forEach(t => {
                        const text = t.textContent.trim();
                        if (text && !texts.includes(text)) {
                            texts.push(text);
                        }
                    });
                    ad.texts = texts;
                    
                    // Get date range if available
                    const dateEl = el.querySelector('span[aria-label*="date"]');
                    ad.dateRange = dateEl ? dateEl.textContent : null;
                    
                    // Get regions/platforms
                    const platformEls = el.querySelectorAll('[aria-label*="Platform"], [aria-label*="Region"]');
                    const platforms = [];
                    platformEls.forEach(p => {
                        platforms.push(p.textContent);
                    });
                    ad.platforms = platforms;
                    
                    // Get any URLs in the ad
                    const urlElements = el.querySelectorAll('a[href*="http"]');
                    const urls = [];
                    urlElements.forEach(u => {
                        const href = u.getAttribute('href');
                        if (href && !href.includes('adstransparency.google.com')) {
                            urls.push(href);
                        }
                    });
                    ad.urls = urls;
                    
                    if (ad.texts.length > 0 || ad.urls.length > 0) {
                        ads.push(ad);
                    }
                });
                
                return ads;
            }''')
            
            results['ads'] = ads_data
            results['total_ads'] = len(ads_data)
            
            print(f"✅ Found {len(ads_data)} Google ads for {company_name}")
            
        except Exception as e:
            results['error'] = str(e)
            print(f"❌ Error scraping Google Ads: {e}")
        
        return results
    
    async def scrape_meta_ad_library(self, company_name: str, page: Page) -> Dict:
        """
        Scrape Meta Ad Library for a company
        URL: https://www.facebook.com/ads/library/
        """
        results = {
            'platform': 'Meta Ad Library',
            'company': company_name,
            'timestamp': datetime.now().isoformat(),
            'ads': [],
            'error': None
        }
        
        try:
            # Navigate to Meta Ad Library
            params = {
                'active_status': 'active',  # Show only active ads
                'ad_type': 'all',
                'country': 'US',
                'q': company_name,
                'search_type': 'keyword_unordered',
                'media_type': 'all'
            }
            
            url = f"https://www.facebook.com/ads/library/?{urlencode(params)}"
            print(f"🔍 Searching Meta Ads for: {company_name}")
            print(f"   URL: {url}")
            
            await page.goto(url, wait_until='networkidle', timeout=60000)
            await asyncio.sleep(5)  # Meta's site needs time to load
            
            # Handle cookie consent if it appears
            try:
                cookie_button = await page.wait_for_selector('button[data-cookiebanner="accept_button"]', timeout=3000)
                if cookie_button:
                    await cookie_button.click()
                    await asyncio.sleep(2)
            except:
                pass  # No cookie banner
            
            # Take screenshot if enabled
            if self.save_screenshots:
                screenshot_path = self.screenshots_dir / f"meta_{company_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                await page.screenshot(path=str(screenshot_path), full_page=True)
                print(f"📸 Screenshot saved: {screenshot_path.name}")
            
            # Wait for results
            try:
                await page.wait_for_selector('[role="article"]', timeout=10000)
            except:
                results['message'] = 'No ads found for this advertiser'
                return results
            
            # Scroll to load more ads
            for _ in range(5):
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await asyncio.sleep(2)
            
            # Extract ad data
            ads_data = await page.evaluate('''() => {
                const ads = [];
                const adCards = document.querySelectorAll('[role="article"]');
                
                adCards.forEach(card => {
                    const ad = {};
                    
                    // Get advertiser name
                    const advertiserEl = card.querySelector('h3, h4');
                    ad.advertiser = advertiserEl ? advertiserEl.textContent : '';
                    
                    // Get ad text
                    const textEls = card.querySelectorAll('span[dir="auto"]');
                    const texts = [];
                    textEls.forEach(el => {
                        const text = el.textContent.trim();
                        if (text && text.length > 20 && !texts.includes(text)) {
                            texts.push(text);
                        }
                    });
                    ad.texts = texts;
                    
                    // Get CTA button text
                    const ctaButtons = card.querySelectorAll('a[role="button"], button');
                    const ctas = [];
                    ctaButtons.forEach(btn => {
                        const text = btn.textContent.trim();
                        if (text && !['See ad details', 'Library ID'].some(skip => text.includes(skip))) {
                            ctas.push(text);
                        }
                    });
                    ad.cta_buttons = ctas;
                    
                    // Get platforms (Facebook, Instagram, etc.)
                    const platformIcons = card.querySelectorAll('i[data-visualcompletion="css-img"]');
                    const platforms = [];
                    platformIcons.forEach(icon => {
                        const style = icon.getAttribute('style') || '';
                        if (style.includes('facebook')) platforms.push('Facebook');
                        if (style.includes('instagram')) platforms.push('Instagram');
                        if (style.includes('messenger')) platforms.push('Messenger');
                        if (style.includes('audience')) platforms.push('Audience Network');
                    });
                    ad.platforms = [...new Set(platforms)];
                    
                    // Get start date
                    const dateText = card.textContent;
                    const dateMatch = dateText.match(/Started running on ([A-Za-z]+ \\d+, \\d+)/);
                    ad.start_date = dateMatch ? dateMatch[1] : null;
                    
                    // Get Library ID
                    const idMatch = card.textContent.match(/Library ID: (\\d+)/);
                    ad.library_id = idMatch ? idMatch[1] : null;
                    
                    // Check if it has disclaimer (political/social)
                    ad.has_disclaimer = card.textContent.includes('Paid for by');
                    
                    if (ad.advertiser && (ad.texts.length > 0 || ad.cta_buttons.length > 0)) {
                        ads.push(ad);
                    }
                });
                
                return ads;
            }''')
            
            results['ads'] = ads_data
            results['total_ads'] = len(ads_data)
            
            print(f"✅ Found {len(ads_data)} Meta ads for {company_name}")
            
        except Exception as e:
            results['error'] = str(e)
            print(f"❌ Error scraping Meta Ads: {e}")
        
        return results
    
    async def scrape_all_platforms(self, company_name: str) -> Dict:
        """Scrape ads from all platforms for a company"""
        all_results = {
            'company': company_name,
            'timestamp': datetime.now().isoformat(),
            'platforms': {}
        }
        
        async with async_playwright() as p:
            browser, context, page = await self.setup_browser(p)
            
            try:
                # Scrape Google Ads
                google_results = await self.scrape_google_ads_transparency(company_name, page)
                all_results['platforms']['google'] = google_results
                
                # Scrape Meta Ads
                meta_results = await self.scrape_meta_ad_library(company_name, page)
                all_results['platforms']['meta'] = meta_results
                
                # Summary statistics
                all_results['summary'] = {
                    'total_google_ads': len(google_results.get('ads', [])),
                    'total_meta_ads': len(meta_results.get('ads', [])),
                    'total_ads': len(google_results.get('ads', [])) + len(meta_results.get('ads', [])),
                    'google_error': google_results.get('error'),
                    'meta_error': meta_results.get('error')
                }
                
            finally:
                await browser.close()
        
        return all_results
    
    def save_results(self, results: Dict, company_name: str) -> Path:
        """Save results to JSON and CSV files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_name = company_name.replace(' ', '_').replace('/', '_')
        
        # Save full JSON
        json_path = self.results_dir / f"{safe_name}_ads_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Create CSV summaries
        rows = []
        
        # Process Google ads
        for ad in results['platforms'].get('google', {}).get('ads', []):
            rows.append({
                'platform': 'Google',
                'company': company_name,
                'format': ad.get('format', ''),
                'text': ' | '.join(ad.get('texts', [])),
                'platforms': ', '.join(ad.get('platforms', [])),
                'date_range': ad.get('dateRange', ''),
                'urls': ' | '.join(ad.get('urls', []))
            })
        
        # Process Meta ads
        for ad in results['platforms'].get('meta', {}).get('ads', []):
            rows.append({
                'platform': 'Meta',
                'company': ad.get('advertiser', company_name),
                'text': ' | '.join(ad.get('texts', [])),
                'cta_buttons': ', '.join(ad.get('cta_buttons', [])),
                'platforms': ', '.join(ad.get('platforms', [])),
                'start_date': ad.get('start_date', ''),
                'library_id': ad.get('library_id', ''),
                'has_disclaimer': ad.get('has_disclaimer', False)
            })
        
        if rows:
            csv_path = self.results_dir / f"{safe_name}_ads_{timestamp}.csv"
            pd.DataFrame(rows).to_csv(csv_path, index=False)
            print(f"💾 CSV saved: {csv_path}")
        
        return json_path


@app.command()
def scrape(
    company: str = typer.Option(..., '--company', '-c', help='Company name to search for'),
    headless: bool = typer.Option(False, '--headless', help='Run browser in headless mode'),
    screenshots: bool = typer.Option(False, '--screenshots', '-s', help='Save screenshots of results'),
):
    """Scrape ads for a company from Google and Meta ad libraries"""
    print(f"\n🎯 Starting ad scraper for: {company}")
    print("=" * 60)
    
    scraper = AdTransparencyScraper(headless=headless, save_screenshots=screenshots)
    
    # Run the async scraper
    results = asyncio.run(scraper.scrape_all_platforms(company))
    
    # Save results
    output_path = scraper.save_results(results, company)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"Company: {company}")
    print(f"Google Ads found: {results['summary']['total_google_ads']}")
    print(f"Meta Ads found: {results['summary']['total_meta_ads']}")
    print(f"Total Ads: {results['summary']['total_ads']}")
    print(f"\n💾 Results saved to: {output_path}")
    
    # Print sample ads
    if results['platforms']['google']['ads']:
        print("\n📱 Sample Google Ad:")
        ad = results['platforms']['google']['ads'][0]
        print(f"  Format: {ad.get('format', 'Unknown')}")
        if ad.get('texts'):
            print(f"  Text: {ad['texts'][0][:100]}...")
    
    if results['platforms']['meta']['ads']:
        print("\n📘 Sample Meta Ad:")
        ad = results['platforms']['meta']['ads'][0]
        print(f"  Advertiser: {ad.get('advertiser', 'Unknown')}")
        if ad.get('texts'):
            print(f"  Text: {ad['texts'][0][:100]}...")
        print(f"  Platforms: {', '.join(ad.get('platforms', []))}")


@app.command()
def batch(
    companies_file: Path = typer.Option(..., '--file', '-f', help='Text file with company names (one per line)'),
    headless: bool = typer.Option(True, '--headless', help='Run browser in headless mode'),
    screenshots: bool = typer.Option(False, '--screenshots', '-s', help='Save screenshots of results'),
    delay: int = typer.Option(5, '--delay', '-d', help='Delay in seconds between companies'),
):
    """Scrape ads for multiple companies from a file"""
    if not companies_file.exists():
        typer.echo(f"❌ File not found: {companies_file}")
        raise typer.Exit(1)
    
    companies = companies_file.read_text().strip().split('\n')
    companies = [c.strip() for c in companies if c.strip()]
    
    print(f"\n📋 Loaded {len(companies)} companies from {companies_file}")
    print("=" * 60)
    
    scraper = AdTransparencyScraper(headless=headless, save_screenshots=screenshots)
    all_results = []
    
    for i, company in enumerate(companies, 1):
        print(f"\n[{i}/{len(companies)}] Processing: {company}")
        print("-" * 40)
        
        try:
            results = asyncio.run(scraper.scrape_all_platforms(company))
            output_path = scraper.save_results(results, company)
            all_results.append({
                'company': company,
                'success': True,
                'google_ads': results['summary']['total_google_ads'],
                'meta_ads': results['summary']['total_meta_ads'],
                'output': str(output_path)
            })
            print(f"✅ Completed: {company}")
        except Exception as e:
            print(f"❌ Failed: {company} - {e}")
            all_results.append({
                'company': company,
                'success': False,
                'error': str(e)
            })
        
        if i < len(companies):
            print(f"⏳ Waiting {delay} seconds before next company...")
            time.sleep(delay)
    
    # Save batch summary
    summary_path = scraper.results_dir / f"batch_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(summary_path, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print("\n" + "=" * 60)
    print("📊 BATCH COMPLETE")
    print("=" * 60)
    successful = sum(1 for r in all_results if r.get('success'))
    print(f"Success: {successful}/{len(companies)}")
    print(f"Summary saved: {summary_path}")


@app.command()
def test():
    """Test the scraper with sample companies"""
    test_companies = [
        "Nike",
        "McDonald's", 
        "Amazon"
    ]
    
    print("🧪 Running test with sample companies...")
    
    for company in test_companies:
        print(f"\nTesting: {company}")
        scraper = AdTransparencyScraper(headless=True, save_screenshots=False)
        
        try:
            results = asyncio.run(scraper.scrape_all_platforms(company))
            print(f"✅ {company}: Found {results['summary']['total_ads']} total ads")
        except Exception as e:
            print(f"❌ {company}: Error - {e}")


if __name__ == "__main__":
    app()