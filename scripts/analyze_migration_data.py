#!/usr/bin/env python3
"""
Analyze current data structure before migration
"""
import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    # Try to read from .env.local
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

def analyze_data():
    """Analyze current data structure"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("=" * 80)
    print("DATABASE MIGRATION ANALYSIS")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # 1. Count total leads
    cur.execute("SELECT COUNT(*) as total FROM leads")
    total_leads = cur.fetchone()['total']
    print(f"📊 Total leads: {total_leads:,}")
    
    # 2. Count leads with column data (med spas)
    cur.execute("""
        SELECT COUNT(*) as count FROM leads 
        WHERE owner_name IS NOT NULL 
           OR owner_first_name IS NOT NULL
           OR medical_director_name IS NOT NULL
           OR pricing_botox IS NOT NULL
           OR pricing_filler IS NOT NULL
           OR instagram_handle IS NOT NULL
           OR facebook_handle IS NOT NULL
    """)
    column_data_count = cur.fetchone()['count']
    print(f"📝 Leads with column data: {column_data_count:,}")
    
    # 3. Count leads with additional_data
    cur.execute("""
        SELECT COUNT(*) as count FROM leads 
        WHERE additional_data IS NOT NULL 
          AND additional_data::text != 'null'
          AND additional_data::text != '{}'
    """)
    jsonb_count = cur.fetchone()['count']
    print(f"📦 Leads with JSONB data: {jsonb_count:,}")
    
    # 4. Count leads with AI data
    cur.execute("""
        SELECT COUNT(*) as count FROM leads 
        WHERE additional_data->>'raw_ai_response' IS NOT NULL
    """)
    ai_count = cur.fetchone()['count']
    print(f"🤖 Leads with AI data: {ai_count:,}")
    
    # 5. Sample column data
    print("\n" + "=" * 40)
    print("SAMPLE COLUMN DATA (First 3)")
    print("=" * 40)
    
    cur.execute("""
        SELECT 
            id,
            business_name,
            owner_name,
            owner_first_name,
            owner_last_name,
            medical_director_name,
            pricing_botox,
            pricing_filler,
            instagram_handle,
            facebook_handle
        FROM leads 
        WHERE owner_name IS NOT NULL 
           OR pricing_botox IS NOT NULL
        LIMIT 3
    """)
    
    for lead in cur.fetchall():
        print(f"\n🏢 {lead['business_name']} (ID: {lead['id']})")
        if lead['owner_name']:
            print(f"   Owner: {lead['owner_name']}")
        if lead['medical_director_name']:
            print(f"   Medical Director: {lead['medical_director_name']}")
        if lead['pricing_botox']:
            print(f"   Botox: {lead['pricing_botox']}")
        if lead['instagram_handle']:
            print(f"   Instagram: @{lead['instagram_handle']}")
    
    # 6. Check contact_to_lead table
    print("\n" + "=" * 40)
    print("CONTACT_TO_LEAD TABLE STATUS")
    print("=" * 40)
    
    # Check if table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'contact_to_lead'
        )
    """)
    table_exists = cur.fetchone()['exists']
    
    if table_exists:
        cur.execute("SELECT COUNT(*) as count FROM contact_to_lead")
        contact_count = cur.fetchone()['count']
        print(f"✅ Table exists with {contact_count:,} contacts")
        
        cur.execute("""
            SELECT contact_type, COUNT(*) as count 
            FROM contact_to_lead 
            GROUP BY contact_type
        """)
        for row in cur.fetchall():
            print(f"   - {row['contact_type']}: {row['count']:,}")
    else:
        print("❌ Table does not exist - will need to create")
    
    # 7. Check prospects table
    print("\n" + "=" * 40)
    print("PROSPECTS TABLE STATUS")
    print("=" * 40)
    
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'prospects'
        )
    """)
    prospects_exists = cur.fetchone()['exists']
    
    if prospects_exists:
        cur.execute("SELECT COUNT(*) as count FROM prospects")
        prospects_count = cur.fetchone()['count']
        print(f"✅ Table exists with {prospects_count:,} prospects")
        
        # Check for status column
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'prospects' 
                AND column_name = 'status'
            )
        """)
        has_status = cur.fetchone()['exists']
        
        if has_status:
            print("✅ Status column exists")
        else:
            print("⚠️  Status column missing - will add")
    else:
        print("❌ Table does not exist - will need to create")
    
    # 8. Check for duplicates between leads and prospects
    if prospects_exists:
        cur.execute("""
            SELECT COUNT(*) as count
            FROM prospects p
            INNER JOIN leads l ON p.place_id = l.place_id
        """)
        duplicates = cur.fetchone()['count']
        print(f"\n🔍 Duplicates between leads and prospects: {duplicates:,}")
    
    # 9. Backup critical data
    print("\n" + "=" * 40)
    print("CREATING BACKUP QUERIES")
    print("=" * 40)
    
    # Create backup file
    backup_file = f"backup_queries_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    with open(backup_file, 'w') as f:
        f.write(f"-- Backup queries generated at {datetime.now().isoformat()}\n\n")
        f.write("-- Backup leads with column data\n")
        f.write("""
CREATE TABLE leads_backup_columns AS
SELECT 
    id, business_name, owner_name, owner_first_name, owner_last_name,
    medical_director_name, medical_director_first_name, medical_director_last_name,
    pricing_botox, pricing_filler, pricing_membership,
    instagram_handle, facebook_handle, twitter_handle, tiktok_handle, youtube_handle,
    instagram_followers, facebook_followers,
    is_expanding, is_hiring, founded_year,
    additional_emails, additional_phones, email_type
FROM leads
WHERE owner_name IS NOT NULL 
   OR pricing_botox IS NOT NULL
   OR instagram_handle IS NOT NULL;\n\n""")
        
        f.write("-- Backup additional_data\n")
        f.write("""
CREATE TABLE leads_backup_jsonb AS
SELECT id, business_name, additional_data
FROM leads
WHERE additional_data IS NOT NULL;\n\n""")
        
    print(f"✅ Backup queries saved to: {backup_file}")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    analyze_data()