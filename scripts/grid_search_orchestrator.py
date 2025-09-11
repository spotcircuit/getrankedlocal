#!/usr/bin/env python3
"""
Grid Search Orchestrator - Performs searches from multiple geographic points
to generate heat map data showing ranking variations across a city/area
"""
import asyncio
import json
import math
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple
import aiohttp

# Add parent directories to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'production'))
sys.path.insert(0, str(Path(__file__).parent.parent))

from production.google_maps_max_extract import scrape_google_maps_max

class GridSearchOrchestrator:
    def __init__(self, api_key: str = None):
        """Initialize grid search with optional Google Maps API key"""
        self.api_key = api_key or os.getenv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
        
    def generate_grid_points(
        self, 
        center_lat: float, 
        center_lng: float, 
        radius_miles: float = 5, 
        grid_size: int = 13
    ) -> List[Dict[str, float]]:
        """
        Generate a grid of lat/lng points around a center location
        
        Args:
            center_lat: Center latitude
            center_lng: Center longitude  
            radius_miles: Radius to cover in miles
            grid_size: Grid dimensions (e.g., 13 for 13x13 = 169 points)
        
        Returns:
            List of dictionaries with lat/lng coordinates
        """
        points = []
        
        # Approximate degrees per mile
        miles_per_degree_lat = 69.0
        miles_per_degree_lng = math.cos(math.radians(center_lat)) * 69.0
        
        # Calculate step sizes
        step_lat = (radius_miles * 2) / grid_size / miles_per_degree_lat
        step_lng = (radius_miles * 2) / grid_size / miles_per_degree_lng
        
        # Generate grid points
        for row in range(grid_size):
            for col in range(grid_size):
                lat = center_lat - (radius_miles / miles_per_degree_lat) + (row * step_lat)
                lng = center_lng - (radius_miles / miles_per_degree_lng) + (col * step_lng)
                
                points.append({
                    'lat': round(lat, 6),
                    'lng': round(lng, 6),
                    'grid_row': row,
                    'grid_col': col,
                    'grid_index': row * grid_size + col
                })
        
        return points
    
    async def get_city_bounds(self, city: str, state: str) -> Dict:
        """
        Get city viewport bounds using Google Geocoding API
        
        Args:
            city: City name
            state: State code (e.g., 'VA')
        
        Returns:
            Dictionary with northeast, southwest, and center coordinates
        """
        if not self.api_key:
            raise ValueError("Google Maps API key required for geocoding")
        
        async with aiohttp.ClientSession() as session:
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': f"{city}, {state}",
                'key': self.api_key
            }
            
            async with session.get(url, params=params) as response:
                data = await response.json()
                
                if data['status'] != 'OK' or not data['results']:
                    raise ValueError(f"Could not geocode {city}, {state}")
                
                result = data['results'][0]
                viewport = result['geometry']['viewport']
                location = result['geometry']['location']
                
                return {
                    'northeast': viewport['northeast'],
                    'southwest': viewport['southwest'],
                    'center': location,
                    'formatted_address': result['formatted_address']
                }
    
    def generate_city_grid(self, city_bounds: Dict, target_points: int = 169) -> List[Dict]:
        """
        Generate grid points based on city viewport bounds
        
        Args:
            city_bounds: City bounds from geocoding
            target_points: Approximate number of points desired
        
        Returns:
            List of grid points covering the city
        """
        ne = city_bounds['northeast']
        sw = city_bounds['southwest']
        
        # Calculate city dimensions in miles
        height_miles = (ne['lat'] - sw['lat']) * 69.0
        width_miles = (ne['lng'] - sw['lng']) * math.cos(math.radians(city_bounds['center']['lat'])) * 69.0
        
        # Determine grid size based on city size
        if height_miles > 20 or width_miles > 20:
            grid_size = 15  # Large city: 225 points
        elif height_miles > 10 or width_miles > 10:
            grid_size = 13  # Medium city: 169 points
        else:
            grid_size = 11  # Small city: 121 points
        
        print(f"City dimensions: {height_miles:.1f} x {width_miles:.1f} miles")
        print(f"Using {grid_size}x{grid_size} grid ({grid_size**2} points)")
        
        points = []
        for row in range(grid_size):
            for col in range(grid_size):
                lat = sw['lat'] + (row * (ne['lat'] - sw['lat']) / (grid_size - 1))
                lng = sw['lng'] + (col * (ne['lng'] - sw['lng']) / (grid_size - 1))
                
                points.append({
                    'lat': round(lat, 6),
                    'lng': round(lng, 6),
                    'grid_row': row,
                    'grid_col': col,
                    'grid_index': row * grid_size + col,
                    'grid_size': grid_size
                })
        
        return points
    
    async def search_from_point(
        self, 
        point: Dict, 
        niche: str, 
        max_results: int = 20
    ) -> Dict:
        """
        Perform a search from a specific lat/lng point
        
        Args:
            point: Dictionary with lat/lng coordinates
            niche: Search term (e.g., "medical spa")
            max_results: Maximum number of results to return
        
        Returns:
            Search results with rankings from this point
        """
        try:
            # Modify the search to use coordinates
            location = f"@{point['lat']},{point['lng']},15z"
            
            # Use existing scraper with coordinate-based location
            results = await scrape_google_maps_max(niche, location)
            
            # Add grid point info to results
            results['search_point'] = point
            results['timestamp'] = datetime.now().isoformat()
            
            # Limit results if needed
            if 'results' in results:
                results['results'] = results['results'][:max_results]
            
            return results
            
        except Exception as e:
            print(f"Error searching from point {point['grid_index']}: {str(e)}")
            return {
                'search_point': point,
                'error': str(e),
                'results': []
            }
    
    async def perform_grid_search(
        self,
        niche: str,
        city: str = None,
        state: str = None,
        center_lat: float = None,
        center_lng: float = None,
        radius_miles: float = 5,
        grid_size: int = 13,
        batch_size: int = 10,
        use_city_bounds: bool = True
    ) -> Dict:
        """
        Perform grid search across multiple points
        
        Args:
            niche: Search term (e.g., "medical spa")
            city: City name (required if use_city_bounds=True)
            state: State code (required if use_city_bounds=True)
            center_lat: Center latitude (required if use_city_bounds=False)
            center_lng: Center longitude (required if use_city_bounds=False)
            radius_miles: Radius in miles (if not using city bounds)
            grid_size: Grid dimensions (if not using city bounds)
            batch_size: Number of concurrent searches
            use_city_bounds: Whether to use city viewport or radius
        
        Returns:
            Dictionary with all grid search results
        """
        print(f"🗺️ Starting grid search for '{niche}'")
        
        # Generate grid points
        if use_city_bounds and city and state:
            print(f"📍 Getting bounds for {city}, {state}...")
            city_bounds = await self.get_city_bounds(city, state)
            grid_points = self.generate_city_grid(city_bounds)
            search_center = city_bounds['center']
            location_name = city_bounds['formatted_address']
        else:
            if not (center_lat and center_lng):
                raise ValueError("Either city/state or center_lat/center_lng required")
            
            grid_points = self.generate_grid_points(center_lat, center_lng, radius_miles, grid_size)
            search_center = {'lat': center_lat, 'lng': center_lng}
            location_name = f"{center_lat}, {center_lng}"
        
        print(f"📊 Generated {len(grid_points)} grid points")
        
        # Perform searches in batches
        all_results = []
        total_points = len(grid_points)
        
        for i in range(0, total_points, batch_size):
            batch = grid_points[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total_points + batch_size - 1) // batch_size
            
            print(f"🔍 Processing batch {batch_num}/{total_batches} ({len(batch)} points)...")
            
            # Run batch searches concurrently
            tasks = [self.search_from_point(point, niche) for point in batch]
            batch_results = await asyncio.gather(*tasks)
            
            all_results.extend(batch_results)
            
            # Small delay between batches to avoid rate limiting
            if i + batch_size < total_points:
                await asyncio.sleep(2)
        
        # Aggregate results
        aggregated = self.aggregate_grid_results(all_results)
        
        return {
            'search_term': niche,
            'location': location_name,
            'center': search_center,
            'grid_points': len(grid_points),
            'grid_dimension': int(math.sqrt(len(grid_points))),
            'timestamp': datetime.now().isoformat(),
            'grid_results': all_results,
            'aggregated': aggregated
        }
    
    def aggregate_grid_results(self, grid_results: List[Dict]) -> Dict:
        """
        Aggregate results from all grid points to show business rankings across the grid
        
        Args:
            grid_results: List of search results from each grid point
        
        Returns:
            Dictionary with aggregated business data and heat map
        """
        business_rankings = {}  # business_id -> list of rankings at each point
        all_businesses = {}  # business_id -> business info
        
        for result in grid_results:
            if 'error' in result or 'results' not in result:
                continue
            
            point = result['search_point']
            
            for rank, business in enumerate(result['results'], 1):
                # Use place_id as unique identifier
                business_id = business.get('place_id') or business.get('cid') or business.get('name')
                
                if not business_id:
                    continue
                
                # Store business info (only once)
                if business_id not in all_businesses:
                    all_businesses[business_id] = {
                        'name': business.get('name'),
                        'place_id': business.get('place_id'),
                        'cid': business.get('cid'),
                        'rating': business.get('rating'),
                        'reviews': business.get('reviews'),
                        'address': business.get('address'),
                        'phone': business.get('phone'),
                        'website': business.get('website')
                    }
                
                # Store ranking at this grid point
                if business_id not in business_rankings:
                    business_rankings[business_id] = []
                
                business_rankings[business_id].append({
                    'grid_index': point['grid_index'],
                    'grid_row': point['grid_row'],
                    'grid_col': point['grid_col'],
                    'lat': point['lat'],
                    'lng': point['lng'],
                    'rank': rank
                })
        
        # Calculate statistics for each business
        business_stats = []
        for business_id, rankings in business_rankings.items():
            ranks = [r['rank'] for r in rankings]
            
            stats = {
                'business': all_businesses[business_id],
                'total_appearances': len(rankings),
                'coverage_percentage': (len(rankings) / len(grid_results)) * 100,
                'average_rank': sum(ranks) / len(ranks),
                'best_rank': min(ranks),
                'worst_rank': max(ranks),
                'top3_count': sum(1 for r in ranks if r <= 3),
                'top10_count': sum(1 for r in ranks if r <= 10),
                'grid_rankings': rankings
            }
            
            business_stats.append(stats)
        
        # Sort by coverage and average rank
        business_stats.sort(key=lambda x: (-x['coverage_percentage'], x['average_rank']))
        
        return {
            'total_unique_businesses': len(all_businesses),
            'top_businesses': business_stats[:20],  # Top 20 by coverage/rank
            'business_count_by_coverage': {
                '90-100%': sum(1 for b in business_stats if b['coverage_percentage'] >= 90),
                '75-90%': sum(1 for b in business_stats if 75 <= b['coverage_percentage'] < 90),
                '50-75%': sum(1 for b in business_stats if 50 <= b['coverage_percentage'] < 75),
                '25-50%': sum(1 for b in business_stats if 25 <= b['coverage_percentage'] < 50),
                'Below 25%': sum(1 for b in business_stats if b['coverage_percentage'] < 25)
            }
        }
    
    def generate_heat_map_data(self, grid_results: Dict, business_name: str = None) -> Dict:
        """
        Generate heat map data for a specific business or top competitors
        
        Args:
            grid_results: Full grid search results
            business_name: Optional specific business to generate heat map for
        
        Returns:
            Heat map data ready for visualization
        """
        if business_name:
            # Find specific business
            for business_stat in grid_results['aggregated']['top_businesses']:
                if business_name.lower() in business_stat['business']['name'].lower():
                    return self._format_heat_map(business_stat, grid_results['grid_dimension'])
            return None
        else:
            # Return heat maps for top 3 businesses
            heat_maps = []
            for business_stat in grid_results['aggregated']['top_businesses'][:3]:
                heat_maps.append(self._format_heat_map(business_stat, grid_results['grid_dimension']))
            return heat_maps
    
    def _format_heat_map(self, business_stat: Dict, grid_size: int) -> Dict:
        """Format business rankings as heat map data"""
        # Initialize grid with nulls (not searched)
        grid = [[None for _ in range(grid_size)] for _ in range(grid_size)]
        
        # Fill in rankings
        for ranking in business_stat['grid_rankings']:
            row = ranking['grid_row']
            col = ranking['grid_col']
            rank = ranking['rank']
            
            # Color coding
            if rank <= 3:
                color = 'green'
            elif rank <= 10:
                color = 'yellow'
            elif rank <= 20:
                color = 'orange'
            else:
                color = 'red'
            
            grid[row][col] = {
                'rank': rank,
                'color': color,
                'lat': ranking['lat'],
                'lng': ranking['lng']
            }
        
        return {
            'business': business_stat['business'],
            'stats': {
                'coverage': f"{business_stat['coverage_percentage']:.1f}%",
                'average_rank': f"{business_stat['average_rank']:.1f}",
                'best_rank': business_stat['best_rank'],
                'worst_rank': business_stat['worst_rank'],
                'top3_percentage': f"{(business_stat['top3_count'] / len(business_stat['grid_rankings']) * 100):.1f}%"
            },
            'grid': grid
        }


async def main():
    """Example usage"""
    orchestrator = GridSearchOrchestrator()
    
    # Example 1: Search using city bounds (recommended)
    results = await orchestrator.perform_grid_search(
        niche="medical spa",
        city="Ashburn",
        state="VA",
        batch_size=10  # Run 10 searches concurrently
    )
    
    # Save results
    output_file = f"grid_search_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Grid search complete! Results saved to {output_file}")
    
    # Generate heat map for top business
    if results['aggregated']['top_businesses']:
        top_business = results['aggregated']['top_businesses'][0]
        print(f"\n🏆 Top business: {top_business['business']['name']}")
        print(f"   Coverage: {top_business['coverage_percentage']:.1f}%")
        print(f"   Average rank: {top_business['average_rank']:.1f}")
    
    # Example 2: Search using center point and radius
    # results = await orchestrator.perform_grid_search(
    #     niche="plumber",
    #     center_lat=39.0438,
    #     center_lng=-77.4874,
    #     radius_miles=5,
    #     grid_size=13,
    #     use_city_bounds=False
    # )


if __name__ == "__main__":
    asyncio.run(main())