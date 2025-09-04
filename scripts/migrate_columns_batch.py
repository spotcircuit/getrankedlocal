#!/usr/bin/env python3
"""
Batch migration of column data to JSONB - optimized for performance
"""
import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor, execute_batch
from datetime import datetime

# Get database URL
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    try:
        with open('../.env.local', 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    DATABASE_URL = line.split('=', 1)[1].strip()
                    break
    except:
        pass

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found")
    sys.exit(1)

def build_structured_data(lead):
    """Build structured data from lead columns"""
    structured = {}
    
    # Owner information
    if any([lead['owner_name'], lead['owner_first_name'], lead['owner_last_name']]):
        structured['owner'] = {}
        if lead['owner_name']:
            structured['owner']['name'] = lead['owner_name']
        if lead['owner_first_name']:
            structured['owner']['first_name'] = lead['owner_first_name']
        if lead['owner_last_name']:
            structured['owner']['last_name'] = lead['owner_last_name']
    
    # Medical director information
    if any([lead['medical_director_name'], lead['medical_director_first_name'], lead['medical_director_last_name']]):
        structured['medical_director'] = {}
        if lead['medical_director_name']:
            structured['medical_director']['name'] = lead['medical_director_name']
        if lead['medical_director_first_name']:
            structured['medical_director']['first_name'] = lead['medical_director_first_name']
        if lead['medical_director_last_name']:
            structured['medical_director']['last_name'] = lead['medical_director_last_name']
    
    # Contact information
    contacts = {}
    if lead['email_type']:
        contacts['email_type'] = lead['email_type']
    if lead['additional_emails']:
        contacts['additional_emails'] = lead['additional_emails']
    if lead['additional_phones']:
        contacts['additional_phones'] = lead['additional_phones']
    if contacts:
        structured['contacts'] = contacts
    
    # Pricing information
    if any([lead['pricing_botox'], lead['pricing_filler'], lead['pricing_membership']]):
        structured['pricing'] = {}
        if lead['pricing_botox']:
            structured['pricing']['botox'] = lead['pricing_botox']
        if lead['pricing_filler']:
            structured['pricing']['filler'] = lead['pricing_filler']
        if lead['pricing_membership']:
            structured['pricing']['membership'] = lead['pricing_membership']
    
    # Social media
    social = {}
    if lead['instagram_handle'] or lead['instagram_followers']:
        social['instagram'] = {}
        if lead['instagram_handle']:
            social['instagram']['handle'] = lead['instagram_handle']
        if lead['instagram_followers']:
            social['instagram']['followers'] = lead['instagram_followers']
    
    if lead['facebook_handle'] or lead['facebook_followers']:
        social['facebook'] = {}
        if lead['facebook_handle']:
            social['facebook']['handle'] = lead['facebook_handle']
        if lead['facebook_followers']:
            social['facebook']['followers'] = lead['facebook_followers']
    
    if lead['twitter_handle']:
        social['twitter'] = {'handle': lead['twitter_handle']}
    if lead['tiktok_handle']:
        social['tiktok'] = {'handle': lead['tiktok_handle']}
    if lead['youtube_handle']:
        social['youtube'] = {'handle': lead['youtube_handle']}
    
    if social:
        structured['social_media'] = social
    
    # Business intelligence
    if any([lead['is_expanding'], lead['is_hiring'], lead['founded_year']]):
        structured['business_intel'] = {}
        if lead['is_expanding'] is not None:
            structured['business_intel']['is_expanding'] = lead['is_expanding']
        if lead['is_hiring'] is not None:
            structured['business_intel']['is_hiring'] = lead['is_hiring']
        if lead['founded_year']:
            structured['business_intel']['founded_year'] = lead['founded_year']
    
    return structured

def migrate_batch():
    """Migrate in batches for better performance"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("=" * 80)
    print("BATCH COLUMN TO JSONB MIGRATION")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # Count total records to migrate
    cur.execute("""
        SELECT COUNT(*) as count FROM leads
        WHERE (owner_name IS NOT NULL 
           OR owner_first_name IS NOT NULL
           OR medical_director_name IS NOT NULL
           OR pricing_botox IS NOT NULL
           OR pricing_filler IS NOT NULL
           OR instagram_handle IS NOT NULL
           OR facebook_handle IS NOT NULL)
           AND (additional_data IS NULL 
                OR additional_data::text = 'null'
                OR additional_data::text = '{}'
                OR COALESCE(additional_data->>'migrated_from_columns', '') != 'true')
    """)
    total = cur.fetchone()['count']
    print(f"📊 Total records to migrate: {total:,}\n")
    
    if total == 0:
        print("✅ No records need migration")
        cur.close()
        conn.close()
        return
    
    batch_size = 100
    offset = 0
    migrated = 0
    errors = 0
    
    while offset < total:
        # Fetch batch
        cur.execute("""
            SELECT 
                id, business_name, owner_name, owner_first_name, owner_last_name,
                medical_director_name, medical_director_first_name, medical_director_last_name,
                email, email_type, additional_emails, additional_phones,
                pricing_botox, pricing_filler, pricing_membership,
                instagram_handle, instagram_followers, facebook_handle, facebook_followers,
                twitter_handle, tiktok_handle, youtube_handle,
                is_expanding, is_hiring, founded_year, additional_data
            FROM leads
            WHERE (owner_name IS NOT NULL 
               OR owner_first_name IS NOT NULL
               OR medical_director_name IS NOT NULL
               OR pricing_botox IS NOT NULL
               OR pricing_filler IS NOT NULL
               OR instagram_handle IS NOT NULL
               OR facebook_handle IS NOT NULL)
               AND (additional_data IS NULL 
                    OR additional_data::text = 'null'
                    OR additional_data::text = '{}'
                    OR additional_data->>'migrated_from_columns' IS NULL)
            ORDER BY id
            LIMIT %s OFFSET %s
        """, (batch_size, offset))
        
        batch = cur.fetchall()
        if not batch:
            break
        
        updates = []
        for lead in batch:
            try:
                structured = build_structured_data(lead)
                
                # Merge with existing data
                existing_data = lead['additional_data'] or {}
                if isinstance(existing_data, str):
                    try:
                        existing_data = json.loads(existing_data)
                    except:
                        existing_data = {}
                
                # Create new additional_data
                new_data = {
                    'structured': structured,
                    'migration_timestamp': datetime.now().isoformat(),
                    'migrated_from_columns': True
                }
                
                # Preserve raw_ai_response if exists
                if 'raw_ai_response' in existing_data:
                    new_data['raw_ai_response'] = existing_data['raw_ai_response']
                
                # Preserve other existing data
                for key, value in existing_data.items():
                    if key not in ['structured', 'raw_ai_response', 'migration_timestamp', 'migrated_from_columns']:
                        new_data[key] = value
                
                updates.append((json.dumps(new_data), lead['id']))
                migrated += 1
                
            except Exception as e:
                errors += 1
                print(f"❌ Error processing {lead['business_name']} (ID: {lead['id']}): {e}")
        
        # Batch update
        if updates:
            execute_batch(cur, 
                "UPDATE leads SET additional_data = %s WHERE id = %s",
                updates,
                page_size=100)
            conn.commit()
        
        offset += batch_size
        
        # Progress report
        if migrated % 500 == 0:
            print(f"Progress: {migrated:,}/{total:,} ({migrated*100/total:.1f}%)")
    
    print(f"\n✅ MIGRATION COMPLETE")
    print(f"   Migrated: {migrated:,}")
    print(f"   Errors: {errors}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate_batch()