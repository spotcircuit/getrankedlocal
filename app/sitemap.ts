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
      const result = await sql`\
        SELECT \
          SUBSTRING(source_directory FROM '([A-Z]{2})$') as state \
        FROM leads \
        WHERE source_directory IS NOT NULL \
        GROUP BY SUBSTRING(source_directory FROM '([A-Z]{2})$') \
        HAVING SUBSTRING(source_directory FROM '([A-Z]{2})$') IS NOT NULL \
        ORDER BY state ASC` as unknown as Array<{ state: string }>; 

      for (const row of result) {
        const code = (row.state || '').toLowerCase();
        if (!code) continue;
        entries.push({
          url: `${baseUrl}/${code}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
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
