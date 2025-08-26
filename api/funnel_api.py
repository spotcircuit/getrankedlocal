#!/usr/bin/env python3
"""
FastAPI backend for sales funnel
Serves personalized data to Next.js frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

# Add project root and sales_funnel to sys.path for imports when running directly
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
SALES_FUNNEL_PATH = PROJECT_ROOT / 'sales_funnel'
if str(SALES_FUNNEL_PATH) not in sys.path:
    sys.path.insert(0, str(SALES_FUNNEL_PATH))

from competitive_analysis import CompetitiveAnalyzer, analyze_campaign_data
from review_analyzer import ReviewAnalyzer
from config.config import Config
from market_intelligence import (
    get_market_intelligence, 
    get_business_percentile,
    get_rollup_market_stats,
    get_detailed_competitors
)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    business_id: Optional[str] = None
    business_name: Optional[str] = None
    niche: Optional[str] = "med spas"
    city: Optional[str] = "Austin"

@app.get("/api/analyze")
async def analyze_business(
    id: Optional[str] = None,
    name: Optional[str] = None,
    niche: Optional[str] = "med spas",
    city: Optional[str] = "Austin"
):
    """
    Analyze a business and return personalized funnel data
    """
    
    try:
        # Load business data (from your scraped data)
        business_data = load_business_data(id, name, niche, city)
        
        if not business_data:
            # Use demo data if not found
            business_data = get_demo_business()
        
        # Prefer the lead's actual city/niche if not provided
        effective_city = city or business_data.get('city') or "Austin"
        effective_state = business_data.get('state')
        effective_niche = niche or business_data.get('search_niche') or "med spas"

        # Load competitor data using effective location, excluding the business itself
        competitors = load_competitor_data(
            effective_niche,
            effective_city,
            state=effective_state,
            exclude_id=business_data.get('id'),
            exclude_name=business_data.get('business_name'),
        )
        # Debug log: show selected competitors from DB
        try:
            print('[analyze] selected_competitors:', [
                {
                    'name': c.get('business_name'),
                    'rating': c.get('rating'),
                    'review_count': c.get('review_count'),
                    'local_pack_rank': c.get('local_pack_rank'),
                    'city': c.get('city'),
                    'state': c.get('state'),
                } for c in (competitors or [])
            ])
        except Exception:
            pass
        
        # Run competitive analysis
        analyzer = CompetitiveAnalyzer()
        analysis = analyzer.analyze_business_ranking(
            business_data, 
            competitors,
            keyword=f"{effective_niche} {effective_city}"
        )
        
        # Generate pitch data
        pitch = analyzer.generate_pitch_data(analysis)
        
        # If we have reviews, analyze them too
        reviews = load_reviews(business_data.get('business_name'))
        reputation_analysis = None
        if reviews:
            review_analyzer = ReviewAnalyzer()
            reputation_analysis = review_analyzer.analyze_reviews(reviews)
            reputation_pitch = review_analyzer.generate_reputation_pitch(
                reputation_analysis, 
                business_data.get('business_name')
            )
            pitch['reputation'] = reputation_pitch
        
        # Calculate additional insights
        competitors_avg_reviews = sum(c.get('review_count', 0) for c in competitors) / len(competitors) if competitors else 0
        review_deficit = int(competitors_avg_reviews - business_data.get('review_count', 0))
        
        # Get comprehensive market intelligence
        market_intel = get_market_intelligence(
            effective_city, 
            business_data.get('state', ''), 
            effective_niche
        )
        
        # Get business percentile rankings
        business_percentile = get_business_percentile(
            business_data.get('business_name'),
            effective_city,
            business_data.get('state', '')
        )
        
        # Format response for frontend
        response = {
            'business': {
                'name': business_data.get('business_name'),
                'rating': business_data.get('rating'),
                'reviewCount': business_data.get('review_count'),
                'city': business_data.get('city') or effective_city,
                'state': business_data.get('state'),
                'niche': effective_niche,
                'website': business_data.get('website'),
                'phone': business_data.get('phone'),
                'address': business_data.get('street_address'),
                'ownerName': business_data.get('owner_name'),
                'medicalDirector': business_data.get('medical_director_name'),
                'leadScore': business_data.get('lead_score'),
                'socialMedia': {
                    'instagram': business_data.get('instagram_handle'),
                    'facebook': business_data.get('facebook_handle'),
                },
                'pricing': {
                    'botox': business_data.get('pricing_botox'),
                    'filler': business_data.get('pricing_filler'),
                },
                'businessIntel': {
                    'isExpanding': business_data.get('is_expanding'),
                    'isHiring': business_data.get('is_hiring'),
                    'foundedYear': business_data.get('founded_year'),
                }
            },
            'analysis': {
                'currentRank': analysis['current_ranking'],
                'potentialTraffic': analysis['estimated_impact']['potential_traffic'],
                'lostRevenue': calculate_lost_revenue(analysis),
                'reviewDeficit': max(0, review_deficit),
                'competitorsAvgReviews': int(competitors_avg_reviews),
                'painPoints': format_pain_points(analysis['pain_points']),
                # Use DB top 3 as source of truth; merge in analysis advantages by name
                'competitors': merge_competitor_advantages(competitors, analysis['competitor_advantages']),
                # Don't show competitor locations if they're from fallback metro areas
                'competitorLocations': [],
                'solutions': [o['action'] for o in analysis['opportunities']],
                'timeline': analysis['estimated_impact']['timeline'],
                'urgency': pitch['urgency'],
                'actionPlan': analysis['action_plan'],
                # Add market intelligence
                'marketIntel': market_intel,
                'businessPercentile': business_percentile
            },
            'pitch': pitch,
            'reputation': reputation_analysis
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/real-time-rank")
async def get_real_time_rank(
    business_name: str,
    keyword: str,
    location: str
):
    """
    Get real-time Google ranking for a business
    """
    # This would integrate with your scraping system
    # For now, return mock data
    return {
        'business': business_name,
        'keyword': keyword,
        'location': location,
        'rank': 7,
        'page': 1,
        'competitors_above': [
            {'name': 'Competitor 1', 'rank': 1},
            {'name': 'Competitor 2', 'rank': 2},
            {'name': 'Competitor 3', 'rank': 3}
        ]
    }

@app.get("/api/debug-competitors")
async def debug_competitors(
    niche: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    id: Optional[str] = None,
    name: Optional[str] = None,
):
    """
    Temporary debug endpoint: returns raw Top 3 competitors selected from DB using the same logic
    as /api/analyze (filtered by niche/city/state and excluding the business if provided).
    """
    try:
        business = load_business_data(id, name, niche, city)
        effective_city = city or (business and business.get('city')) or ''
        effective_state = (business and business.get('state')) if state is None else state
        effective_niche = niche or (business and business.get('search_niche')) or 'med spas'
        competitors = load_competitor_data(
            effective_niche,
            effective_city,
            state=effective_state,
            exclude_id=(business and business.get('id')),
            exclude_name=(business and business.get('business_name')),
        )
        return {
            'params': {
                'niche': effective_niche,
                'city': effective_city,
                'state': effective_state,
            },
            'competitors': competitors,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-report")
async def generate_report(request: AnalysisRequest):
    """
    Generate a detailed PDF report for a business
    """
    # This would generate a comprehensive report
    return {
        'report_url': f'/reports/{request.business_name}_seo_analysis.pdf',
        'generated': True
    }

@app.get("/api/track-conversion")
async def track_conversion(
    business_id: str,
    action: str,
    value: Optional[float] = None
):
    """
    Track funnel conversions and interactions
    """
    # Log conversion event
    return {
        'tracked': True,
        'action': action,
        'business_id': business_id
    }

def load_business_data(business_id: str = None, name: str = None, 
                       niche: str = None, city: str = None) -> Dict:
    """
    Load business data from your database or scraped files
    """
    db_url = Config.DATABASE_URL or os.getenv('DATABASE_URL')
    if not db_url:
        return None
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        query = None
        params = []
        if business_id:
            query = """
                SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count, 
                       city, state, website, phone, street_address, email, email_type,
                       owner_name, medical_director_name, search_niche, lead_score,
                       pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                       is_expanding, is_hiring, founded_year,
                       additional_data
                FROM leads
                WHERE id = %s
            """
            params = [business_id]
        elif name:
            # Match by business_name (ILIKE) and optionally city
            if city:
                query = """
                    SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count, 
                           city, state, website, phone, street_address, email, email_type,
                           owner_name, medical_director_name, search_niche, lead_score,
                           pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                           is_expanding, is_hiring, founded_year,
                           additional_data
                    FROM leads
                    WHERE business_name ILIKE %s AND city ILIKE %s
                    ORDER BY review_count DESC NULLS LAST
                    LIMIT 1
                """
                params = [f"%{name}%", f"%{city}%"]
            else:
                query = """
                    SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count, 
                           city, state, website, phone, street_address, email, email_type,
                           owner_name, medical_director_name, search_niche, lead_score,
                           pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                           is_expanding, is_hiring, founded_year,
                           additional_data
                    FROM leads
                    WHERE business_name ILIKE %s
                    ORDER BY review_count DESC NULLS LAST
                    LIMIT 1
                """
                params = [f"%{name}%"]
        else:
            # Fallback: first lead in niche/city if present
            query = """
                SELECT id, business_name, local_pack_rank, rating, review_count::int AS review_count, 
                       city, state, website, phone, street_address, email, email_type,
                       owner_name, medical_director_name, search_niche, lead_score,
                       pricing_botox, pricing_filler, instagram_handle, facebook_handle,
                       is_expanding, is_hiring, founded_year,
                       additional_data
                FROM leads
                WHERE (search_niche IS NULL OR search_niche = %s) AND (city ILIKE %s)
                ORDER BY review_count DESC NULLS LAST
                LIMIT 1
            """
            params = [niche or 'med spas', f"%{city or ''}%"]
        cur.execute(query, params)
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return None
        return {
            'id': row.get('id'),
            'business_name': row.get('business_name'),
            'rating': float(row['rating']) if row.get('rating') is not None else None,
            'review_count': row.get('review_count'),
            'city': row.get('city'),
            'state': row.get('state'),
            'website': row.get('website'),
            'phone': row.get('phone'),
            'street_address': row.get('street_address'),
            'local_pack_rank': row.get('local_pack_rank'),
            'email': row.get('email'),
            'email_type': row.get('email_type'),
            'owner_name': row.get('owner_name'),
            'medical_director_name': row.get('medical_director_name'),
            'search_niche': row.get('search_niche'),
            'lead_score': row.get('lead_score'),
            'pricing_botox': row.get('pricing_botox'),
            'pricing_filler': row.get('pricing_filler'),
            'instagram_handle': row.get('instagram_handle'),
            'facebook_handle': row.get('facebook_handle'),
            'is_expanding': row.get('is_expanding'),
            'is_hiring': row.get('is_hiring'),
            'founded_year': row.get('founded_year'),
        }
    except Exception:
        # Fail silently; caller will use demo
        return None

def load_competitor_data(niche: str, city: str, state: str | None = None, exclude_id: str | None = None, exclude_name: str | None = None) -> List[Dict]:
    """
    Load top competitors for the niche and city
    If no top 3 in specific city, fallback to broader search
    """
    db_url = Config.DATABASE_URL or os.getenv('DATABASE_URL')
    if not db_url:
        return []
    try:
        conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        
        # First try: exact city match
        where_clauses = [
            "search_niche = %s",
            "city ILIKE %s",
            "local_pack_rank BETWEEN 1 AND 3"
        ]
        params = [niche, f"%{city}%"]
        if state:
            where_clauses.append("state = %s")
            params.append(state)
        if exclude_id:
            where_clauses.append("id <> %s")
            params.append(exclude_id)
        elif exclude_name:
            where_clauses.append("business_name <> %s")
            params.append(exclude_name)

        query = f"""
            SELECT 
                id, business_name, local_pack_rank, rating, review_count::int AS review_count, 
                city, state, website, phone, street_address
            FROM leads
            WHERE {' AND '.join(where_clauses)}
            ORDER BY local_pack_rank ASC
            LIMIT 3
        """
        cur.execute(query, params)
        rows = cur.fetchall()
        
        # If no results in specific city, try broader search
        if len(rows) == 0 and state:
            # For Texas cities like West Lake Hills, try major metro areas
            metro_cities = {
                'TX': ['Austin', 'Dallas', 'Houston', 'San Antonio'],
                'CA': ['Los Angeles', 'San Francisco', 'San Diego'],
                'FL': ['Miami', 'Orlando', 'Tampa'],
            }
            
            if state in metro_cities:
                # Try major cities in the state
                where_clauses = [
                    "search_niche = %s",
                    "state = %s",
                    "local_pack_rank BETWEEN 1 AND 3",
                    f"city IN ({','.join(['%s'] * len(metro_cities[state]))})"
                ]
                params = [niche, state] + metro_cities[state]
                if exclude_id:
                    where_clauses.append("id <> %s")
                    params.append(exclude_id)
                
                query = f"""
                    SELECT 
                        id, business_name, local_pack_rank, rating, review_count::int AS review_count, 
                        city, state, website, phone, street_address
                    FROM leads
                    WHERE {' AND '.join(where_clauses)}
                    ORDER BY local_pack_rank ASC, review_count DESC
                    LIMIT 3
                """
                cur.execute(query, params)
                rows = cur.fetchall()
        
        cur.close()
        conn.close()
        return [
            {
                'id': row.get('id'),
                'business_name': row.get('business_name'),
                'rating': float(row['rating']) if row.get('rating') is not None else None,
                'review_count': row.get('review_count'),
                'city': row.get('city'),
                'state': row.get('state'),
                'website': row.get('website'),
                'phone': row.get('phone'),
                'street_address': row.get('street_address'),
                'local_pack_rank': row.get('local_pack_rank'),
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error loading competitors: {e}")
        return []
    # For now, return mock competitors
    
    return [
        {
            'business_name': 'Elite Aesthetics',
            'rating': 4.8,
            'review_count': 250,
            'ranking': 1
        },
        {
            'business_name': 'Glow Medical Spa',
            'rating': 4.7,
            'review_count': 180,
            'ranking': 2
        },
        {
            'business_name': 'Radiant Beauty Med Spa',
            'rating': 4.6,
            'review_count': 120,
            'ranking': 3
        }
    ]

def load_reviews(business_name: str) -> List[Dict]:
    """
    Load reviews for a business
    """
    # This would load from your reviews scraping
    # Path would be like: output/[niche]_[city]/reviews/[business_name].json
    return []

def get_demo_business() -> Dict:
    """
    Return demo business data for testing
    """
    return {
        'business_name': 'Average Med Spa',
        'rating': 4.2,
        'review_count': 85,
        'city': 'Austin',
        'website': 'averagemedspa.com',
        'phone': '512-555-0100',
        'email': 'info@averagemedspa.com'
    }

def calculate_lost_revenue(analysis: Dict) -> float:
    """
    Calculate estimated lost revenue based on ranking
    """
    # Simple calculation based on ranking position
    rank = analysis.get('current_ranking', 7)
    if rank <= 3:
        return 0
    elif rank <= 5:
        return 30000
    elif rank <= 10:
        return 75000
    else:
        return 150000

def format_pain_points(pain_points: List) -> List[Dict]:
    """
    Format pain points for frontend
    """
    return [
        {
            'issue': point.issue,
            'severity': point.severity,
            'impact': point.impact
        }
        for point in pain_points[:3]  # Top 3 pain points
    ]

def format_competitors(competitor_advantages: List, db_competitors: List[Dict] | None = None) -> List[Dict]:
    """
    Format competitor data for frontend
    """
    # Group by competitor
    competitors = {}
    for adv in competitor_advantages:
        name = adv.competitor
        if name not in competitors:
            competitors[name] = {
                'name': name,
                'rank': adv.ranking,
                'advantages': []
            }
        competitors[name]['advantages'].append(adv.advantage)

    # Merge real review counts and ratings from DB competitors if provided
    if db_competitors:
        # Map by normalized name for fuzzy equality
        def norm(s: str | None) -> str:
            return (s or '').strip().lower()

        db_map = {norm(row.get('business_name')): row for row in db_competitors}
        for name, comp in competitors.items():
            row = db_map.get(norm(name))
            if row:
                comp['reviews'] = row.get('review_count')
                rating = row.get('rating')
                comp['rating'] = float(rating) if rating is not None else None

    return list(competitors.values())[:3]  # Top 3 competitors

def merge_competitor_advantages(db_competitors: List[Dict], competitor_advantages: List) -> List[Dict]:
    """
    Use DB top competitors as source of truth for identity/metrics and merge in analysis advantages by name.
    Output fields expected by frontend: name, rank, reviews, rating, advantages (+ extras city/state/website/phone)
    """
    def norm(s: str | None) -> str:
        return (s or '').strip().lower()

    # Build advantages grouped by competitor name
    adv_map: Dict[str, List[str]] = {}
    for adv in competitor_advantages or []:
        key = norm(getattr(adv, 'competitor', None))
        if not key:
            continue
        adv_map.setdefault(key, []).append(getattr(adv, 'advantage', None))

    # Sort DB competitors by true Google rank, breaking ties by reviews then rating
    sortable: List[Dict] = sorted(db_competitors or [], key=lambda r: (
        r.get('local_pack_rank') if r.get('local_pack_rank') is not None else 9999,
        -(r.get('review_count') or 0),
        -(float(r.get('rating')) if r.get('rating') is not None else 0.0),
    ))

    merged: List[Dict] = []
    for idx, row in enumerate(sortable):
        name = row.get('business_name')
        rating = row.get('rating')
        item = {
            'name': name,
            # Preserve true Google rank from DB
            'rank': row.get('local_pack_rank') or (idx + 1),
            # Provide a unique sequential rank for display in the UI
            'display_rank': idx + 1,
            'reviews': row.get('review_count'),
            'rating': float(rating) if rating is not None else None,
            'advantages': adv_map.get(norm(name), []),
            'city': row.get('city'),
            'state': row.get('state'),
            'website': row.get('website'),
            'phone': row.get('phone'),
        }
        merged.append(item)
    return merged[:3]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)