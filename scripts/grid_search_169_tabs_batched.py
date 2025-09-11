#!/usr/bin/env python3
"""
BATCHED TABS VERSION - 169 searches in batches of 50 tabs
Runs 4 batches: 50, 50, 50, 19 tabs
"""
import asyncio
import json
import math
import time
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright

class GridSearch169TabsBatched:
    def __init__(self):
        self.grid_size = 13  # ALWAYS 13x13 = 169
        self.total_searches = 169
        self.batch_size = 50  # Chrome's reliable limit
        self.results_dir = Path(__file__).parent / 'grid_results'
        self.results_dir.mkdir(exist_ok=True)
        
    def generate_grid_points(self):
        """Generate exactly 169 grid points for Ashburn, VA"""
        center_lat = 39.0438  # Ashburn, VA
        center_lng = -77.4874
        radius_miles = 5  # 5-mile radius
        
        points = []
        miles_per_degree_lat = 69.0
        miles_per_degree_lng = math.cos(math.radians(center_lat)) * 69.0
        
        step_lat = (radius_miles * 2) / self.grid_size / miles_per_degree_lat
        step_lng = (radius_miles * 2) / self.grid_size / miles_per_degree_lng
        
        for row in range(self.grid_size):
            for col in range(self.grid_size):
                lat = center_lat - (radius_miles / miles_per_degree_lat) + (row * step_lat)
                lng = center_lng - (radius_miles / miles_per_degree_lng) + (col * step_lng)
                
                points.append({
                    'lat': round(lat, 6),
                    'lng': round(lng, 6),
                    'grid_row': row,
                    'grid_col': col,
                    'grid_index': row * self.grid_size + col
                })
        
        return points
    
    async def search_in_tab(self, page, point):
        """Search from one grid point in a tab with scrolling"""
        try:
            # Search medical spa from this specific point
            url = f"https://www.google.com/maps/search/medical+spa+near+me/@{point['lat']},{point['lng']},15z"
            
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(2)  # Initial wait
            
            # SCROLL TO LOAD MORE RESULTS
            feed = await page.query_selector('[role="feed"]')
            if not feed:
                feed = await page.query_selector('.m6QErb')
            
            if feed:
                # Do 5 quick scrolls to load more results
                for _ in range(5):
                    await feed.evaluate('element => element.scrollTop = element.scrollHeight')
                await asyncio.sleep(1)  # Wait for new results to load
            
            # Extract results
            results = await page.evaluate('''() => {
                const businesses = [];
                const cards = document.querySelectorAll('[role="article"], .Nv2PK');
                
                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    const name = card.querySelector('.fontHeadlineSmall, .qBF1Pd')?.textContent || 
                               card.getAttribute('aria-label')?.split(',')[0] || '';
                    
                    if (name) {
                        // Get rating
                        const ratingEl = card.querySelector('[role="img"][aria-label*="star"]');
                        let rating = 0;
                        let reviews = 0;
                        
                        if (ratingEl) {
                            const ariaLabel = ratingEl.getAttribute('aria-label') || '';
                            const ratingMatch = ariaLabel.match(/([0-9.]+)/);
                            const reviewMatch = ariaLabel.match(/\\(([0-9,]+)\\)/);
                            
                            if (ratingMatch) rating = parseFloat(ratingMatch[1]);
                            if (reviewMatch) reviews = parseInt(reviewMatch[1].replace(/,/g, ''));
                        }
                        
                        businesses.push({
                            rank: i + 1,
                            name: name,
                            rating: rating,
                            reviews: reviews
                        });
                    }
                }
                return businesses;
            }''')
            
            return {
                'point': point,
                'results': results,
                'success': True
            }
            
        except Exception as e:
            return {
                'point': point,
                'error': str(e)[:50],
                'results': [],
                'success': False
            }
    
    async def process_batch(self, browser, grid_points_batch, batch_num, total_batches):
        """Process one batch of up to 50 tabs"""
        print(f"\n📦 Batch {batch_num}/{total_batches}: Processing {len(grid_points_batch)} points...")
        
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        
        # Open tabs for this batch
        pages = []
        print(f"  📑 Opening {len(grid_points_batch)} tabs...")
        for i in range(len(grid_points_batch)):
            page = await context.new_page()
            pages.append(page)
        
        print(f"  ⚡ Executing searches...")
        
        # Create tasks for this batch
        tasks = []
        for page, point in zip(pages, grid_points_batch):
            task = self.search_in_tab(page, point)
            tasks.append(task)
        
        # Execute this batch simultaneously
        batch_results = await asyncio.gather(*tasks)
        
        # Clean up this batch
        print(f"  🧹 Cleaning up batch {batch_num}...")
        for page in pages:
            try:
                await page.close()
            except:
                pass
        await context.close()
        
        successful = sum(1 for r in batch_results if r.get('success', False))
        print(f"  ✅ Batch {batch_num} complete: {successful}/{len(batch_results)} successful")
        
        return batch_results
    
    async def run_169_tabs_batched(self):
        """Run 169 searches in batches of 50 tabs"""
        start_time = time.time()
        
        print("=" * 60)
        print("BATCHED GRID SEARCH: 169 SEARCHES IN BATCHES OF 50")
        print("=" * 60)
        print("📍 Location: Ashburn, VA")
        print("🔍 Search: Medical Spa")
        print("📊 Grid: 13x13 = 169 searches")
        print("📦 Batch size: 50 tabs max")
        print("📡 Radius: 5 miles")
        
        # Calculate batches
        num_batches = math.ceil(self.total_searches / self.batch_size)
        print(f"🔢 Total batches: {num_batches}")
        print("-" * 60)
        
        # Generate all 169 points
        grid_points = self.generate_grid_points()
        print(f"✅ Generated {len(grid_points)} grid points")
        
        all_results = []
        
        async with async_playwright() as p:
            print(f"🌐 Launching browser...")
            
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--max-old-space-size=4096',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            )
            
            # Process in batches
            for batch_num in range(num_batches):
                start_idx = batch_num * self.batch_size
                end_idx = min(start_idx + self.batch_size, self.total_searches)
                batch_points = grid_points[start_idx:end_idx]
                
                batch_results = await self.process_batch(
                    browser, 
                    batch_points, 
                    batch_num + 1, 
                    num_batches
                )
                
                all_results.extend(batch_results)
                
                # Small delay between batches
                if batch_num < num_batches - 1:
                    print(f"  💤 Pausing before next batch...")
                    await asyncio.sleep(2)
            
            # Close browser
            await browser.close()
            print(f"\n✅ Browser closed")
        
        # Calculate statistics
        elapsed = time.time() - start_time
        successful = sum(1 for r in all_results if r.get('success', False))
        
        print("-" * 60)
        print(f"✅ ALL BATCHES COMPLETE!")
        print(f"📊 Success: {successful}/169 ({successful/169*100:.1f}%)")
        print(f"⏱️ Time: {elapsed:.1f} seconds")
        print("-" * 60)
        
        # Analyze results
        business_appearances = {}
        
        for result in all_results:
            if not result.get('success'):
                continue
                
            for biz in result.get('results', []):
                name = biz['name']
                if name not in business_appearances:
                    business_appearances[name] = {
                        'name': name,
                        'rating': biz.get('rating', 0),
                        'reviews': biz.get('reviews', 0),
                        'appearances': [],
                        'ranks': []
                    }
                
                business_appearances[name]['appearances'].append(result['point']['grid_index'])
                business_appearances[name]['ranks'].append(biz['rank'])
        
        # Calculate coverage for each business
        business_stats = []
        for name, data in business_appearances.items():
            coverage = (len(data['appearances']) / successful * 100) if successful > 0 else 0
            avg_rank = sum(data['ranks']) / len(data['ranks']) if data['ranks'] else 0
            
            business_stats.append({
                'name': name,
                'rating': data['rating'],
                'reviews': data['reviews'],
                'coverage': coverage,
                'appearances': len(data['appearances']),
                'avg_rank': avg_rank,
                'best_rank': min(data['ranks']) if data['ranks'] else 999,
                'worst_rank': max(data['ranks']) if data['ranks'] else 999
            })
        
        # Sort by coverage
        business_stats.sort(key=lambda x: -x['coverage'])
        
        # Look for The Fix Clinic
        the_fix = None
        for biz in business_stats:
            if 'fix' in biz['name'].lower():
                the_fix = biz
                break
        
        # Display results
        print("\n🎯 TARGET BUSINESS: THE FIX CLINIC")
        print("-" * 60)
        if the_fix:
            print(f"✅ FOUND!")
            print(f"📊 Coverage: {the_fix['coverage']:.1f}% ({the_fix['appearances']}/{successful} searches)")
            print(f"📈 Avg Rank: #{the_fix['avg_rank']:.1f}")
            print(f"🏆 Best: #{the_fix['best_rank']}, Worst: #{the_fix['worst_rank']}")
            print(f"⭐ Rating: {the_fix['rating']:.1f} ({the_fix['reviews']} reviews)")
        else:
            print("❌ Not found in top 20 results")
        
        print("\n🏆 TOP 10 COMPETITORS")
        print("-" * 60)
        for i, biz in enumerate(business_stats[:10], 1):
            print(f"{i}. {biz['name'][:50]}")
            print(f"   Coverage: {biz['coverage']:.1f}% | Avg: #{biz['avg_rank']:.1f} | ⭐ {biz['rating']}")
        
        # Save results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = self.results_dir / f"grid_169_tabs_batched_{timestamp}.json"
        
        final_results = {
            'search_params': {
                'location': 'Ashburn, VA',
                'niche': 'medical spa',
                'grid_size': '13x13',
                'total_searches': 169,
                'radius_miles': 5,
                'method': 'tabs_batched_50'
            },
            'execution': {
                'duration_seconds': elapsed,
                'successful': successful,
                'failed': 169 - successful,
                'batch_size': self.batch_size,
                'num_batches': num_batches
            },
            'the_fix_clinic': the_fix,
            'top_20_businesses': business_stats[:20],
            'raw_results': all_results
        }
        
        with open(output_file, 'w') as f:
            json.dump(final_results, f, indent=2)
        
        print(f"\n💾 Results saved: {output_file.name}")
        print(f"📊 Unique businesses found: {len(business_stats)}")
        
        return final_results


async def main():
    searcher = GridSearch169TabsBatched()
    await searcher.run_169_tabs_batched()


if __name__ == "__main__":
    print("BATCHED TABS VERSION - RELIABLE 50 TAB BATCHES")
    print("This will run 169 searches in 4 batches (50, 50, 50, 19)")
    print("More reliable than 169 tabs at once")
    print("Estimated time: 60-90 seconds")
    print("")
    
    response = input("Start batched search? (y/n): ")
    if response.lower() == 'y':
        asyncio.run(main())
    else:
        print("Cancelled.")