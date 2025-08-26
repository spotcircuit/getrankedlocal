import type { MetadataRoute } from 'next';
import { neon } from '@neondatabase/serverless';

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return envUrl || 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/getrankedlocal`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Try to append dynamic state-level routes from the database
  try {
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      // 1) States
      const states = await sql`\
        SELECT \
          SUBSTRING(source_directory FROM '([A-Z]{2})$') as state \
        FROM leads \
        WHERE source_directory IS NOT NULL \
        GROUP BY SUBSTRING(source_directory FROM '([A-Z]{2})$') \
        HAVING SUBSTRING(source_directory FROM '([A-Z]{2})$') IS NOT NULL \
        ORDER BY state ASC` as unknown as Array<{ state: string }>;

      const stateCodes = states
        .map(r => (r.state || '').toLowerCase())
        .filter(Boolean)
        .slice(0, 50); // safety cap

      for (const code of stateCodes) {
        entries.push({
          url: `${baseUrl}/${code}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }

      // Helper to derive collection slug from source_directory
      const collectionSlugFromSourceDir = (sd: string) => {
        // med_spas_Collection_Name_STATE -> collection words between prefix and state
        const parts = (sd || '').split('_');
        if (parts.length < 4) return '';
        const words = parts.slice(2, -1); // drop 'med', 'spas', and state
        return words.join('-').toLowerCase();
      };

      // 2) Collections per state (only med_spas for now)
      for (const code of stateCodes) {
        try {
          const colRows = await sql`\
            SELECT source_directory, COUNT(*) as count \
            FROM leads \
            WHERE source_directory LIKE ${'%_' + code.toUpperCase()} \
            GROUP BY source_directory \
            ORDER BY count DESC \
            LIMIT 50` as unknown as Array<{ source_directory: string; count: number }>;

          const collectionSlugs = colRows
            .map(r => collectionSlugFromSourceDir(r.source_directory))
            .filter(Boolean);

          // Add collection pages and their niche pages
          for (const cslug of collectionSlugs) {
            entries.push({
              url: `${baseUrl}/${code}/${cslug}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.5,
            });

            // Currently supported niches
            const niches = ['medspas'];
            for (const niche of niches) {
              entries.push({
                url: `${baseUrl}/${code}/${cslug}/${niche}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.5,
              });

              // 3) Company pages within collection + niche (limit per collection)
              try {
                const sourceDir = `med_spas_${cslug.replace(/-/g, '_')}_${code.toUpperCase()}`;
                const bizRows = await sql`\
                  SELECT \
                    regexp_replace(LOWER(REPLACE(business_name, ' ', '-')), '[^a-z0-9-]+', '', 'g') as slug \
                  FROM leads \
                  WHERE source_directory = ${sourceDir} \
                    AND business_name !~* 'sponsored' \
                  ORDER BY review_count DESC NULLS LAST, rating DESC NULLS LAST \
                  LIMIT 200` as unknown as Array<{ slug: string }>;

                for (const b of bizRows) {
                  const s = (b.slug || '').toString();
                  if (!s) continue;
                  entries.push({
                    url: `${baseUrl}/${code}/${cslug}/${niches[0]}/${s}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.4,
                  });
                }
              } catch (e) {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('[sitemap] company listing failed for', code, cslug, e);
                }
              }
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[sitemap] collection listing failed for state', code, e);
          }
        }
      }
    }
  } catch (err) {
    // Fail gracefully; base routes will still be present
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sitemap] dynamic generation failed:', err);
    }
  }

  return entries;
}
