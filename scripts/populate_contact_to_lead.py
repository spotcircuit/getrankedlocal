#!/usr/bin/env python3
"""
Populate contact_to_lead table from column data and JSONB
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

def populate_contacts():
    """Populate contact_to_lead table"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("=" * 80)
    print("POPULATING CONTACT_TO_LEAD TABLE")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # Current count
    cur.execute("SELECT COUNT(*) as count FROM contact_to_lead")
    before_count = cur.fetchone()['count']
    print(f"📊 Current contacts: {before_count:,}\n")
    
    # 1. From column data - Owners
    print("Adding owners from column data...")
    cur.execute("""
        INSERT INTO contact_to_lead (lead_id, contact_type, full_name, first_name, last_name, email)
        SELECT 
            id, 
            'owner',
            owner_name,
            owner_first_name,
            owner_last_name,
            email
        FROM leads
        WHERE owner_name IS NOT NULL 
           OR owner_first_name IS NOT NULL
        ON CONFLICT (lead_id, email) DO UPDATE
        SET 
            full_name = COALESCE(EXCLUDED.full_name, contact_to_lead.full_name),
            first_name = COALESCE(EXCLUDED.first_name, contact_to_lead.first_name),
            last_name = COALESCE(EXCLUDED.last_name, contact_to_lead.last_name),
            updated_at = NOW()
    """)
    owners_added = cur.rowcount
    print(f"   Added/Updated: {owners_added:,} owners")
    
    # 2. From column data - Medical Directors
    print("Adding medical directors from column data...")
    cur.execute("""
        INSERT INTO contact_to_lead (lead_id, contact_type, full_name, first_name, last_name)
        SELECT 
            id, 
            'medical_director',
            medical_director_name,
            medical_director_first_name,
            medical_director_last_name
        FROM leads
        WHERE medical_director_name IS NOT NULL 
           OR medical_director_first_name IS NOT NULL
        ON CONFLICT (lead_id, email) DO NOTHING
    """)
    medical_added = cur.rowcount
    print(f"   Added: {medical_added:,} medical directors")
    
    # 3. From JSONB data - Owners
    print("Adding owners from JSONB data...")
    cur.execute("""
        INSERT INTO contact_to_lead (lead_id, contact_type, full_name, first_name, last_name, email)
        SELECT 
            l.id,
            'owner',
            l.additional_data->'structured'->'owner'->>'name',
            l.additional_data->'structured'->'owner'->>'first_name',
            l.additional_data->'structured'->'owner'->>'last_name',
            l.email
        FROM leads l
        WHERE l.additional_data->'structured'->'owner'->>'name' IS NOT NULL
        ON CONFLICT (lead_id, email) DO UPDATE
        SET 
            full_name = COALESCE(EXCLUDED.full_name, contact_to_lead.full_name),
            first_name = COALESCE(EXCLUDED.first_name, contact_to_lead.first_name),
            last_name = COALESCE(EXCLUDED.last_name, contact_to_lead.last_name),
            updated_at = NOW()
    """)
    jsonb_owners = cur.rowcount
    print(f"   Added/Updated: {jsonb_owners:,} owners from JSONB")
    
    # 4. From JSONB data - Medical Directors
    print("Adding medical directors from JSONB data...")
    cur.execute("""
        INSERT INTO contact_to_lead (lead_id, contact_type, full_name)
        SELECT 
            l.id,
            'medical_director',
            l.additional_data->'structured'->'medical_director'->>'name'
        FROM leads l
        WHERE l.additional_data->'structured'->'medical_director'->>'name' IS NOT NULL
        ON CONFLICT (lead_id, email) DO NOTHING
    """)
    jsonb_medical = cur.rowcount
    print(f"   Added: {jsonb_medical:,} medical directors from JSONB")
    
    # 5. From AI extraction - contacts with emails
    print("Adding contacts from AI extraction...")
    cur.execute("""
        SELECT 
            id,
            additional_data->'structured'->'contacts'->>'additional_emails' as emails_json,
            additional_data->'raw_ai_response' as ai_response
        FROM leads
        WHERE additional_data->'structured'->'contacts'->>'additional_emails' IS NOT NULL
           OR additional_data->'raw_ai_response' IS NOT NULL
        LIMIT 100
    """)
    
    ai_contacts = 0
    for lead in cur.fetchall():
        # Parse additional emails
        if lead['emails_json']:
            try:
                emails = json.loads(lead['emails_json']) if isinstance(lead['emails_json'], str) else lead['emails_json']
                for email in emails[:3]:  # Limit to 3 additional emails per lead
                    cur.execute("""
                        INSERT INTO contact_to_lead (lead_id, contact_type, email)
                        VALUES (%s, 'additional', %s)
                        ON CONFLICT (lead_id, email) DO NOTHING
                    """, (lead['id'], email))
                    if cur.rowcount > 0:
                        ai_contacts += 1
            except:
                pass
    
    print(f"   Added: {ai_contacts:,} additional contacts")
    
    # Commit all changes
    conn.commit()
    
    # Final count
    cur.execute("SELECT COUNT(*) as count FROM contact_to_lead")
    after_count = cur.fetchone()['count']
    
    # Count by type
    cur.execute("""
        SELECT contact_type, COUNT(*) as count
        FROM contact_to_lead
        GROUP BY contact_type
        ORDER BY count DESC
    """)
    
    print("\n" + "=" * 40)
    print("FINAL STATISTICS")
    print("=" * 40)
    print(f"Total contacts before: {before_count:,}")
    print(f"Total contacts after: {after_count:,}")
    print(f"New contacts added: {after_count - before_count:,}\n")
    
    print("Contacts by type:")
    for row in cur.fetchall():
        print(f"   {row['contact_type']}: {row['count']:,}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    populate_contacts()