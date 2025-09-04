-- Backup queries generated at 2025-09-02T00:27:16.514387

-- Backup leads with column data

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
   OR instagram_handle IS NOT NULL;

-- Backup additional_data

CREATE TABLE leads_backup_jsonb AS
SELECT id, business_name, additional_data
FROM leads
WHERE additional_data IS NOT NULL;

