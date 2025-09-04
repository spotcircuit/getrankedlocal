#!/usr/bin/env python3
"""
Drop orphaned columns from leads table after successful migration
"""
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
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

def drop_columns(dry_run=True):
    """Drop orphaned columns"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("=" * 80)
    print("DROPPING ORPHANED COLUMNS")
    print("=" * 80)
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'EXECUTING'}")
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    columns_to_drop = [
        # Search/collection columns (now in lead_collections)
        'search_city',
        'search_niche', 
        'source_directory',
        
        # Owner/contact columns (now in contact_to_lead)
        'owner_first_name',
        'owner_last_name',
        'medical_director_first_name',
        'medical_director_last_name',
        'contact_type',
        
        # Pricing columns (now in JSONB)
        'pricing_botox',
        'pricing_filler',
        'pricing_membership',
        
        # Social media columns (now in JSONB)
        'instagram_handle',
        'facebook_handle',
        'twitter_handle',
        'tiktok_handle',
        'youtube_handle',
        'instagram_followers',
        'facebook_followers',
        
        # Business intel columns (now in JSONB)
        'is_expanding',
        'is_hiring',
        'founded_year',
        
        # Additional contact columns (now in JSONB/contact_to_lead)
        'additional_emails',
        'additional_phones',
        'email_type'
    ]
    
    print(f"Columns to drop: {len(columns_to_drop)}\n")
    
    dropped = 0
    skipped = 0
    
    for column in columns_to_drop:
        # Check if column exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'leads' 
                AND column_name = %s
            )
        """, (column,))
        
        exists = cur.fetchone()['exists']
        
        if exists:
            if not dry_run:
                try:
                    cur.execute(f"ALTER TABLE leads DROP COLUMN {column}")
                    print(f"✅ Dropped: {column}")
                    dropped += 1
                except Exception as e:
                    print(f"❌ Error dropping {column}: {e}")
                    skipped += 1
            else:
                print(f"Would drop: {column}")
                dropped += 1
        else:
            print(f"⚠️  Already dropped: {column}")
            skipped += 1
    
    if not dry_run:
        conn.commit()
    
    # Show remaining columns
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'leads'
        ORDER BY ordinal_position
    """)
    
    remaining = cur.fetchall()
    
    print("\n" + "=" * 40)
    print("REMAINING COLUMNS IN LEADS TABLE")
    print("=" * 40)
    
    core_columns = [
        'id', 'place_id', 'business_name', 'rating', 'review_count',
        'street_address', 'city', 'state', 'latitude', 'longitude',
        'website', 'phone', 'email', 'domain', 'additional_data',
        'created_at', 'updated_at', 'lead_score'
    ]
    
    for col in remaining[:20]:  # Show first 20
        marker = "✅" if col['column_name'] in core_columns else "  "
        print(f"{marker} {col['column_name']}: {col['data_type']}")
    
    if len(remaining) > 20:
        print(f"   ... and {len(remaining) - 20} more")
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if dry_run:
        print(f"DRY RUN COMPLETE - Would drop {dropped} columns")
        print("\nTo execute, run: python3 drop_orphaned_columns.py --execute")
    else:
        print(f"✅ Dropped {dropped} columns")
        print(f"⚠️  Skipped {skipped} columns")
        print("\n🎉 MIGRATION COMPLETE!")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    execute = '--execute' in sys.argv
    
    if execute:
        response = input("Are you sure you want to DROP columns? This cannot be undone! (yes/no): ")
        if response.lower() == 'yes':
            drop_columns(dry_run=False)
        else:
            print("Cancelled")
    else:
        drop_columns(dry_run=True)