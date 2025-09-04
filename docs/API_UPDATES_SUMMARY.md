# API Updates After Database Migration

## Database Changes Made
1. Migrated column data to `additional_data` JSONB field
2. Populated `contact_to_lead` table with 6,999 contacts
3. Added `status` field to `prospects` table
4. Dropped 24 orphaned columns from `leads` table

## API Files Updated

### 1. `/api/directory/services/[service]/route.ts`
**Changed**: Now uses `lead_collections` table instead of `source_directory`
```sql
-- Before: WHERE source_directory LIKE 'pattern'
-- After: INNER JOIN lead_collections lc WHERE lc.search_collection LIKE 'pattern'
```

### 2. `/api/directory/services/[service]/[state]/route.ts`
**Changed**: Updated to use `lead_collections` join
```sql
FROM leads l
INNER JOIN lead_collections lc ON l.id = lc.lead_id
WHERE lc.search_collection LIKE ${sourcePattern}
  AND l.state = ${state}
```

### 3. `/api/directory/services/[service]/[state]/[city]/route.ts`
**Changed**: Updated to use `lead_collections` join
- Removed reference to `source_directory`
- Fixed `zip_code` reference (now optional)

### 4. `/api/analyze/route.ts`
**Changed**: Major updates for new structure
- Uses `lead_collections` for finding businesses
- References to social media now use `additional_data->structured->social_media`
- Removed all references to dropped columns

## Remaining Issues to Check

### Frontend Components
May need updates if they reference:
- `owner_first_name`, `owner_last_name` → Use `additional_data->structured->owner`
- `pricing_botox`, `pricing_filler` → Use `additional_data->structured->pricing`
- `instagram_handle`, `facebook_handle` → Use `additional_data->structured->social_media`

### Data Access Pattern
To get owner info:
```javascript
// Old way
lead.owner_name
lead.owner_first_name

// New way
lead.owner_name // Still available as summary field
lead.additional_data?.structured?.owner?.first_name
```

To get social media:
```javascript
// Old way
lead.instagram_handle

// New way
lead.additional_data?.structured?.social_media?.instagram?.handle
```

## Testing Checklist
- [ ] `/directory` page loads
- [ ] `/directory/medical-spas` shows states with medical spas
- [ ] `/directory/medical-spas/tx` shows Texas cities
- [ ] `/directory/medical-spas/tx/austin` shows Austin businesses
- [ ] Analyze API works with business lookup
- [ ] Business data displays correctly (owner, pricing, social)

## Common Errors and Fixes

### Error: "column source_directory does not exist"
**Fix**: Update query to use `lead_collections` table

### Error: "column instagram_handle does not exist"
**Fix**: Use `additional_data->structured->social_media->instagram->handle`

### Error: "column pricing_botox does not exist"
**Fix**: Use `additional_data->structured->pricing->botox`

## SQL Query Template
```sql
-- Get businesses for a service/location
SELECT 
  l.*,
  l.additional_data->'structured' as structured_data
FROM leads l
INNER JOIN lead_collections lc ON l.id = lc.lead_id
WHERE lc.search_collection LIKE 'pattern'
  AND l.state = 'TX'
  AND l.city = 'Austin'
```