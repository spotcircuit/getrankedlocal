#!/usr/bin/env python3
"""
Migrate column data to JSONB additional_data field
"""
import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor, Json
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

def migrate_to_jsonb(test_mode=False):
    """Migrate column data to JSONB structure"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("=" * 80)
    print("COLUMN TO JSONB MIGRATION")
    print("=" * 80)
    print(f"Mode: {'TEST (5 records)' if test_mode else 'FULL MIGRATION'}")
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # Build query to find records with column data
    query = """
        SELECT 
            id,
            business_name,
            owner_name,
            owner_first_name,
            owner_last_name,
            medical_director_name,
            medical_director_first_name,
            medical_director_last_name,
            email,
            email_type,
            additional_emails,
            additional_phones,
            pricing_botox,
            pricing_filler,
            pricing_membership,
            instagram_handle,
            instagram_followers,
            facebook_handle,
            facebook_followers,
            twitter_handle,
            tiktok_handle,
            youtube_handle,
            is_expanding,
            is_hiring,
            founded_year,
            additional_data
        FROM leads
        WHERE owner_name IS NOT NULL 
           OR owner_first_name IS NOT NULL
           OR medical_director_name IS NOT NULL
           OR pricing_botox IS NOT NULL
           OR pricing_filler IS NOT NULL
           OR instagram_handle IS NOT NULL
           OR facebook_handle IS NOT NULL
    """
    
    if test_mode:
        query += " LIMIT 5"
    
    cur.execute(query)
    leads = cur.fetchall()
    
    print(f"📊 Found {len(leads)} leads with column data to migrate\n")
    
    migrated = 0
    errors = 0
    
    for lead in leads:
        try:
            # Build structured data from columns
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
            
            # Merge with existing additional_data
            existing_data = lead['additional_data'] or {}
            if isinstance(existing_data, str):
                try:
                    existing_data = json.loads(existing_data)
                except:
                    existing_data = {}
            
            # Create new additional_data structure
            new_data = {
                'structured': structured,
                'migration_timestamp': datetime.now().isoformat(),
                'migrated_from_columns': True
            }
            
            # Preserve raw_ai_response if it exists
            if 'raw_ai_response' in existing_data:
                new_data['raw_ai_response'] = existing_data['raw_ai_response']
            
            # Preserve any other existing data
            for key, value in existing_data.items():
                if key not in ['structured', 'raw_ai_response', 'migration_timestamp', 'migrated_from_columns']:
                    new_data[key] = value
            
            # Update the record
            if not test_mode:
                cur.execute("""
                    UPDATE leads 
                    SET additional_data = %s
                    WHERE id = %s
                """, (Json(new_data), lead['id']))
            
            migrated += 1
            
            if migrated <= 3 or test_mode:
                print(f"✅ Migrated: {lead['business_name']} (ID: {lead['id']})")
                if structured.get('owner'):
                    print(f"   Owner: {structured['owner'].get('name', 'N/A')}")
                if structured.get('pricing'):
                    print(f"   Pricing: {list(structured['pricing'].keys())}")
                if structured.get('social_media'):
                    print(f"   Social: {list(structured['social_media'].keys())}")
                print()
        
        except Exception as e:
            errors += 1
            print(f"❌ Error migrating {lead['business_name']} (ID: {lead['id']}): {e}")
    
    if not test_mode:
        conn.commit()
        print(f"\n✅ MIGRATION COMPLETE")
    else:
        print(f"\n✅ TEST COMPLETE (no changes saved)")
    
    print(f"   Migrated: {migrated}")
    print(f"   Errors: {errors}")
    
    cur.close()
    conn.close()

def main():
    # Check for test mode
    test_mode = '--test' in sys.argv
    
    if test_mode:
        print("Running in TEST mode (5 records, no commit)\n")
        migrate_to_jsonb(test_mode=True)
    else:
        print("Running FULL migration\n")
        response = input("Are you sure you want to migrate all column data to JSONB? (yes/no): ")
        if response.lower() == 'yes':
            migrate_to_jsonb(test_mode=False)
        else:
            print("Migration cancelled")

if __name__ == "__main__":
    main()