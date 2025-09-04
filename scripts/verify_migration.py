#!/usr/bin/env python3
"""
Verify data migration integrity
"""
import os
import sys
import json
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

def verify_migration():
    """Verify all data was migrated correctly"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    print("=" * 80)
    print("DATA MIGRATION VERIFICATION")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    issues = []
    
    # 1. Check JSONB migration
    print("1. JSONB Migration Check")
    print("-" * 40)
    
    cur.execute("""
        SELECT COUNT(*) as total FROM leads
    """)
    total_leads = cur.fetchone()['total']
    
    cur.execute("""
        SELECT COUNT(*) as count FROM leads
        WHERE additional_data IS NOT NULL
          AND additional_data::text != 'null'
          AND additional_data::text != '{}'
    """)
    with_jsonb = cur.fetchone()['count']
    
    cur.execute("""
        SELECT COUNT(*) as count FROM leads
        WHERE additional_data->>'migrated_from_columns' = 'true'
    """)
    migrated = cur.fetchone()['count']
    
    print(f"   Total leads: {total_leads:,}")
    print(f"   With JSONB data: {with_jsonb:,}")
    print(f"   Migrated from columns: {migrated:,}")
    
    # Sample verification - compare column vs JSONB
    cur.execute("""
        SELECT 
            id,
            business_name,
            owner_name,
            additional_data->'structured'->'owner'->>'name' as jsonb_owner
        FROM leads
        WHERE owner_name IS NOT NULL
        LIMIT 5
    """)
    
    print("\n   Sample comparison (column vs JSONB):")
    mismatches = 0
    for lead in cur.fetchall():
        if lead['owner_name'] != lead['jsonb_owner']:
            mismatches += 1
            print(f"   ❌ ID {lead['id']}: Column='{lead['owner_name']}' vs JSONB='{lead['jsonb_owner']}'")
            issues.append(f"Owner mismatch in lead {lead['id']}")
    
    if mismatches == 0:
        print("   ✅ All samples match")
    
    # 2. Check contact_to_lead population
    print("\n2. Contact Population Check")
    print("-" * 40)
    
    cur.execute("""
        SELECT 
            COUNT(DISTINCT lead_id) as leads_with_contacts,
            COUNT(*) as total_contacts
        FROM contact_to_lead
    """)
    contact_stats = cur.fetchone()
    
    cur.execute("""
        SELECT contact_type, COUNT(*) as count
        FROM contact_to_lead
        GROUP BY contact_type
    """)
    
    print(f"   Leads with contacts: {contact_stats['leads_with_contacts']:,}")
    print(f"   Total contacts: {contact_stats['total_contacts']:,}")
    print("   By type:")
    for row in cur.fetchall():
        print(f"      {row['contact_type']}: {row['count']:,}")
    
    # Check for orphaned owners
    cur.execute("""
        SELECT COUNT(*) as count
        FROM leads l
        WHERE l.owner_name IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM contact_to_lead c
              WHERE c.lead_id = l.id
              AND c.contact_type = 'owner'
          )
    """)
    orphaned_owners = cur.fetchone()['count']
    
    if orphaned_owners > 0:
        print(f"   ⚠️  {orphaned_owners} owners not in contact_to_lead")
        issues.append(f"{orphaned_owners} owners not migrated to contact_to_lead")
    else:
        print("   ✅ All owners migrated")
    
    # 3. Check prospects table
    print("\n3. Prospects Table Check")
    print("-" * 40)
    
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'promoted' THEN 1 END) as promoted,
            COUNT(CASE WHEN status = 'discovered' THEN 1 END) as discovered
        FROM prospects
    """)
    prospect_stats = cur.fetchone()
    
    print(f"   Total prospects: {prospect_stats['total']:,}")
    print(f"   Promoted: {prospect_stats['promoted']:,}")
    print(f"   Discovered: {prospect_stats['discovered']:,}")
    
    # 4. Check lead_collections
    print("\n4. Lead Collections Check")
    print("-" * 40)
    
    cur.execute("""
        SELECT 
            COUNT(DISTINCT lead_id) as unique_leads,
            COUNT(*) as total_relationships
        FROM lead_collections
    """)
    collection_stats = cur.fetchone()
    
    print(f"   Unique leads in collections: {collection_stats['unique_leads']:,}")
    print(f"   Total relationships: {collection_stats['total_relationships']:,}")
    
    # 5. Data integrity checks
    print("\n5. Data Integrity Checks")
    print("-" * 40)
    
    # Check for NULL additional_data where we expect data
    cur.execute("""
        SELECT COUNT(*) as count
        FROM leads
        WHERE (owner_name IS NOT NULL OR pricing_botox IS NOT NULL)
          AND additional_data IS NULL
    """)
    null_jsonb = cur.fetchone()['count']
    
    if null_jsonb > 0:
        print(f"   ❌ {null_jsonb} leads with column data but NULL JSONB")
        issues.append(f"{null_jsonb} leads with column data but NULL JSONB")
    else:
        print("   ✅ No NULL JSONB for leads with column data")
    
    # Check AI data preservation
    cur.execute("""
        SELECT COUNT(*) as count
        FROM leads
        WHERE additional_data->>'raw_ai_response' IS NOT NULL
    """)
    ai_preserved = cur.fetchone()['count']
    print(f"   ✅ AI responses preserved: {ai_preserved:,}")
    
    # Final summary
    print("\n" + "=" * 80)
    print("VERIFICATION SUMMARY")
    print("=" * 80)
    
    if len(issues) == 0:
        print("✅ ALL CHECKS PASSED - Migration successful!")
        print("\nReady to drop orphaned columns.")
    else:
        print(f"⚠️  {len(issues)} ISSUES FOUND:")
        for issue in issues:
            print(f"   - {issue}")
        print("\nResolve issues before dropping columns.")
    
    cur.close()
    conn.close()
    
    return len(issues) == 0

if __name__ == "__main__":
    success = verify_migration()
    sys.exit(0 if success else 1)