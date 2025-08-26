"""
Market Intelligence Query Module
Provides aggregated market data for specific city/state areas
"""

import psycopg2
from typing import Dict, Any, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def get_market_intelligence(city: str, state: str, niche: str = 'med spa') -> Dict[str, Any]:
    """
    Get comprehensive market intelligence for a specific city/state area
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    market_data = {}
    
    try:
        # 1. Overall market summary for the city
        cur.execute("""
            SELECT 
                COUNT(*) as total_businesses,
                AVG(rating) as avg_rating,
                AVG(review_count) as avg_reviews,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY review_count) as median_reviews,
                MAX(review_count) as max_reviews,
                MIN(review_count) as min_reviews,
                COUNT(CASE WHEN local_pack_rank <= 3 THEN 1 END) as top_3_count,
                COUNT(CASE WHEN local_pack_rank BETWEEN 4 AND 10 THEN 1 END) as rank_4_to_10,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
                COUNT(CASE WHEN owner_name IS NOT NULL THEN 1 END) as with_owner
            FROM leads 
            WHERE city = %s AND state = %s 
            AND (search_niche ILIKE %s OR search_niche IS NULL)
        """, (city, state, f'%{niche}%'))
        
        result = cur.fetchone()
        if result:
            market_data['market_summary'] = {
                'total_businesses': result[0],
                'avg_rating': float(result[1]) if result[1] else 0,
                'avg_reviews': int(result[2]) if result[2] else 0,
                'median_reviews': int(result[3]) if result[3] else 0,
                'max_reviews': result[4] or 0,
                'min_reviews': result[5] or 0,
                'top_3_count': result[6],
                'rank_4_to_10': result[7],
                'with_email': result[8],
                'with_owner': result[9]
            }
        
        # 2. Top 10 competitors by review count
        cur.execute("""
            SELECT 
                business_name,
                rating,
                review_count,
                local_pack_rank,
                website,
                CASE 
                    WHEN pricing_botox IS NOT NULL THEN pricing_botox
                    ELSE NULL
                END as botox_price,
                instagram_handle,
                owner_name
            FROM leads 
            WHERE city = %s AND state = %s 
            AND (search_niche ILIKE %s OR search_niche IS NULL)
            ORDER BY review_count DESC NULLS LAST
            LIMIT 10
        """, (city, state, f'%{niche}%'))
        
        top_competitors = []
        for row in cur.fetchall():
            top_competitors.append({
                'name': row[0],
                'rating': float(row[1]) if row[1] is not None else None,
                'reviews': row[2] or 0,
                'rank': row[3],
                'website': row[4],
                'botox_price': row[5],
                'instagram': row[6],
                'has_owner': bool(row[7])
            })
        market_data['top_competitors'] = top_competitors
        
        # 3. Review distribution analysis
        cur.execute("""
            SELECT 
                CASE 
                    WHEN review_count = 0 THEN '0'
                    WHEN review_count BETWEEN 1 AND 10 THEN '1-10'
                    WHEN review_count BETWEEN 11 AND 50 THEN '11-50'
                    WHEN review_count BETWEEN 51 AND 100 THEN '51-100'
                    WHEN review_count BETWEEN 101 AND 200 THEN '101-200'
                    WHEN review_count BETWEEN 201 AND 500 THEN '201-500'
                    ELSE '500+'
                END as review_range,
                COUNT(*) as business_count
            FROM leads 
            WHERE city = %s AND state = %s 
            AND (search_niche ILIKE %s OR search_niche IS NULL)
            GROUP BY review_range
            ORDER BY 
                CASE review_range
                    WHEN '0' THEN 1
                    WHEN '1-10' THEN 2
                    WHEN '11-50' THEN 3
                    WHEN '51-100' THEN 4
                    WHEN '101-200' THEN 5
                    WHEN '201-500' THEN 6
                    ELSE 7
                END
        """, (city, state, f'%{niche}%'))
        
        review_distribution = []
        for row in cur.fetchall():
            review_distribution.append({
                'range': row[0],
                'count': row[1]
            })
        market_data['review_distribution'] = review_distribution
        
        # 4. Pricing intelligence
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN pricing_botox IS NOT NULL THEN 1 END) as with_botox_pricing,
                AVG(CASE 
                    WHEN pricing_botox ~ '^[0-9]+$' THEN CAST(pricing_botox AS NUMERIC)
                    WHEN pricing_botox ~ '^\\$([0-9]+)' THEN CAST(SUBSTRING(pricing_botox FROM '\\$([0-9]+)') AS NUMERIC)
                    ELSE NULL
                END) as avg_botox_price,
                MIN(CASE 
                    WHEN pricing_botox ~ '^[0-9]+$' THEN CAST(pricing_botox AS NUMERIC)
                    WHEN pricing_botox ~ '^\\$([0-9]+)' THEN CAST(SUBSTRING(pricing_botox FROM '\\$([0-9]+)') AS NUMERIC)
                    ELSE NULL
                END) as min_botox_price,
                MAX(CASE 
                    WHEN pricing_botox ~ '^[0-9]+$' THEN CAST(pricing_botox AS NUMERIC)
                    WHEN pricing_botox ~ '^\\$([0-9]+)' THEN CAST(SUBSTRING(pricing_botox FROM '\\$([0-9]+)') AS NUMERIC)
                    ELSE NULL
                END) as max_botox_price
            FROM leads 
            WHERE city = %s AND state = %s 
            AND (search_niche ILIKE %s OR search_niche IS NULL)
        """, (city, state, f'%{niche}%'))
        
        pricing_result = cur.fetchone()
        if pricing_result:
            market_data['pricing_intelligence'] = {
                'businesses_with_pricing': pricing_result[0] or 0,
                'avg_botox_price': float(pricing_result[1]) if pricing_result[1] else None,
                'min_botox_price': float(pricing_result[2]) if pricing_result[2] else None,
                'max_botox_price': float(pricing_result[3]) if pricing_result[3] else None
            }
        
        # 5. Growth indicators
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN instagram_handle IS NOT NULL THEN 1 END) as with_instagram,
                COUNT(CASE WHEN facebook_handle IS NOT NULL THEN 1 END) as with_facebook,
                COUNT(CASE WHEN website IS NOT NULL THEN 1 END) as with_website,
                COUNT(CASE WHEN medical_director_name IS NOT NULL THEN 1 END) as with_medical_director
            FROM leads 
            WHERE city = %s AND state = %s 
            AND (search_niche ILIKE %s OR search_niche IS NULL)
        """, (city, state, f'%{niche}%'))
        
        growth_result = cur.fetchone()
        if growth_result:
            market_data['digital_presence'] = {
                'with_instagram': growth_result[0] or 0,
                'with_facebook': growth_result[1] or 0,
                'with_website': growth_result[2] or 0,
                'with_medical_director': growth_result[3] or 0
            }
            
        # 6. Get business's own ranking position
        cur.execute("""
            SELECT 
                business_name,
                review_count,
                (SELECT COUNT(*) + 1 FROM leads l2 
                 WHERE l2.city = l1.city AND l2.state = l1.state 
                 AND l2.review_count > l1.review_count) as review_rank
            FROM leads l1
            WHERE city = %s AND state = %s 
            AND (search_niche ILIKE %s OR search_niche IS NULL)
            ORDER BY review_count DESC
        """, (city, state, f'%{niche}%'))
        
        rankings = []
        for row in cur.fetchall():
            rankings.append({
                'business': row[0],
                'reviews': row[1] or 0,
                'position': row[2]
            })
        market_data['market_rankings'] = rankings[:20]  # Top 20 for context
        
    except Exception as e:
        print(f"Error fetching market intelligence: {e}")
        market_data['error'] = str(e)
    finally:
        cur.close()
        conn.close()
    
    return market_data

def get_business_percentile(business_name: str, city: str, state: str) -> Dict[str, Any]:
    """
    Get a specific business's percentile rankings in their market
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    percentile_data = {}
    
    try:
        cur.execute("""
            WITH business_data AS (
                SELECT 
                    business_name,
                    review_count,
                    rating,
                    local_pack_rank
                FROM leads 
                WHERE business_name = %s AND city = %s AND state = %s
                LIMIT 1
            ),
            market_stats AS (
                SELECT 
                    review_count,
                    rating,
                    PERCENT_RANK() OVER (ORDER BY review_count) as review_percentile,
                    PERCENT_RANK() OVER (ORDER BY rating) as rating_percentile,
                    business_name
                FROM leads 
                WHERE city = %s AND state = %s
            )
            SELECT 
                bd.business_name,
                bd.review_count,
                bd.rating,
                bd.local_pack_rank,
                ms.review_percentile,
                ms.rating_percentile,
                (SELECT COUNT(*) FROM leads WHERE city = %s AND state = %s) as total_businesses
            FROM business_data bd
            LEFT JOIN market_stats ms ON bd.business_name = ms.business_name
        """, (business_name, city, state, city, state, city, state))
        
        result = cur.fetchone()
        if result:
            percentile_data = {
                'business_name': result[0],
                'review_count': result[1] or 0,
                'rating': float(result[2]) if result[2] else 0,
                'local_pack_rank': result[3],
                'review_percentile': round((result[4] or 0) * 100, 1),
                'rating_percentile': round((result[5] or 0) * 100, 1),
                'total_businesses': result[6]
            }
            
    except Exception as e:
        print(f"Error fetching percentile data: {e}")
        percentile_data['error'] = str(e)
    finally:
        cur.close()
        conn.close()
    
    return percentile_data

def get_rollup_market_stats(city: str, state: str, niche: str = 'med spa') -> Dict[str, Any]:
    """
    Get aggregated market statistics from roll-up tables
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    rollup_data = {}
    
    try:
        # 1. Service Distribution - What services are most common
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN pricing_botox IS NOT NULL THEN 1 END) as offers_botox,
                COUNT(CASE WHEN pricing_filler IS NOT NULL THEN 1 END) as offers_filler,
                COUNT(CASE WHEN pricing_membership IS NOT NULL THEN 1 END) as has_membership,
                COUNT(CASE WHEN instagram_handle IS NOT NULL THEN 1 END) as active_instagram,
                COUNT(CASE WHEN medical_director_name IS NOT NULL THEN 1 END) as has_med_director,
                COUNT(DISTINCT owner_name) as unique_owners
            FROM leads 
            WHERE city = %s AND state = %s
        """, (city, state))
        
        services = cur.fetchone()
        if services:
            rollup_data['service_distribution'] = {
                'offers_botox': services[0],
                'offers_filler': services[1],
                'has_membership': services[2],
                'active_instagram': services[3],
                'has_med_director': services[4],
                'unique_owners': services[5]
            }
        
        # 2. Rating Distribution
        cur.execute("""
            SELECT 
                CASE 
                    WHEN rating >= 4.8 THEN 'Excellent (4.8+)'
                    WHEN rating >= 4.5 THEN 'Very Good (4.5-4.7)'
                    WHEN rating >= 4.0 THEN 'Good (4.0-4.4)'
                    WHEN rating >= 3.5 THEN 'Average (3.5-3.9)'
                    ELSE 'Below Average (<3.5)'
                END as rating_tier,
                COUNT(*) as count,
                AVG(review_count) as avg_reviews
            FROM leads 
            WHERE city = %s AND state = %s AND rating IS NOT NULL
            GROUP BY rating_tier
            ORDER BY MIN(rating) DESC
        """, (city, state))
        
        rating_distribution = []
        for row in cur.fetchall():
            rating_distribution.append({
                'tier': row[0],
                'count': row[1],
                'avg_reviews': int(row[2]) if row[2] else 0
            })
        rollup_data['rating_distribution'] = rating_distribution
        
        # 3. Competition Intensity by Area
        cur.execute("""
            SELECT 
                COUNT(*) as competitor_count,
                AVG(review_count) as avg_reviews,
                MAX(review_count) as leader_reviews,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY review_count) as top_quartile_reviews
            FROM leads 
            WHERE city = %s AND state = %s
        """, (city, state))
        
        intensity = cur.fetchone()
        if intensity:
            rollup_data['competition_intensity'] = {
                'total_competitors': intensity[0],
                'avg_reviews': int(intensity[1]) if intensity[1] else 0,
                'market_leader_reviews': intensity[2] or 0,
                'top_quartile_threshold': int(intensity[3]) if intensity[3] else 0
            }
        
        # 4. Digital Maturity Score
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN website IS NOT NULL THEN 1 END) as has_website,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as has_email,
                COUNT(CASE WHEN instagram_handle IS NOT NULL OR facebook_handle IS NOT NULL THEN 1 END) as has_social,
                COUNT(CASE WHEN pricing_botox IS NOT NULL OR pricing_filler IS NOT NULL THEN 1 END) as transparent_pricing
            FROM leads 
            WHERE city = %s AND state = %s
        """, (city, state))
        
        digital = cur.fetchone()
        if digital and digital[0] > 0:
            rollup_data['digital_maturity'] = {
                'website_adoption': round(100 * digital[1] / digital[0], 1),
                'email_capture': round(100 * digital[2] / digital[0], 1),
                'social_presence': round(100 * digital[3] / digital[0], 1),
                'price_transparency': round(100 * digital[4] / digital[0], 1)
            }
            
    except Exception as e:
        print(f"Error fetching rollup stats: {e}")
        rollup_data['error'] = str(e)
    finally:
        cur.close()
        conn.close()
    
    return rollup_data

def get_detailed_competitors(business_name: str, city: str, state: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get detailed competitor information for display
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    competitors = []
    
    try:
        cur.execute("""
            SELECT 
                business_name,
                rating,
                review_count,
                local_pack_rank,
                website,
                phone,
                street_address,
                pricing_botox,
                pricing_filler,
                instagram_handle,
                facebook_handle,
                owner_name,
                medical_director_name,
                email IS NOT NULL as has_email,
                CASE 
                    WHEN review_count > 500 THEN 'Market Leader'
                    WHEN review_count > 200 THEN 'Established'
                    WHEN review_count > 50 THEN 'Growing'
                    ELSE 'New/Small'
                END as business_tier
            FROM leads 
            WHERE city = %s AND state = %s
            ORDER BY review_count DESC NULLS LAST
            LIMIT %s
        """, (city, state, limit))
        
        for row in cur.fetchall():
            competitors.append({
                'name': row[0],
                'rating': float(row[1]) if row[1] else None,
                'reviews': row[2] or 0,
                'rank': row[3],
                'website': row[4],
                'phone': row[5],
                'address': row[6],
                'botox_price': row[7],
                'filler_price': row[8],
                'instagram': row[9],
                'facebook': row[10],
                'owner': row[11],
                'medical_director': row[12],
                'has_email': row[13],
                'tier': row[14]
            })
            
    except Exception as e:
        print(f"Error fetching detailed competitors: {e}")
    finally:
        cur.close()
        conn.close()
    
    return competitors