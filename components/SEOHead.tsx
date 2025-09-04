'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { MetaTags, needsCanonicalRedirect } from '@/lib/seo-utils';

interface SEOHeadProps {
  meta: MetaTags;
  structuredData?: object[];
}

/**
 * Centralized SEO Head component that handles all meta tags and structured data
 * Automatically handles canonical URL redirects for dual URL patterns
 */
export default function SEOHead({ meta, structuredData = [] }: SEOHeadProps) {
  const pathname = usePathname();
  
  // Check if current path needs canonical redirect
  const canonicalCheck = needsCanonicalRedirect(pathname);
  const finalCanonical = canonicalCheck.needs && canonicalCheck.canonicalUrl 
    ? canonicalCheck.canonicalUrl 
    : meta.canonical;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={finalCanonical} />
      
      {/* Robots Meta */}
      <meta name="robots" content={meta.robots || 'index,follow'} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta property="og:description" content={meta.ogDescription || meta.description} />
      <meta property="og:url" content={meta.ogUrl || finalCanonical} />
      {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
      <meta property="og:site_name" content="GetLocalRanked" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.twitterTitle || meta.title} />
      <meta name="twitter:description" content={meta.twitterDescription || meta.description} />
      {meta.twitterImage && <meta name="twitter:image" content={meta.twitterImage} />}
      <meta name="twitter:site" content="@getlocalranked" />
      
      {/* Alternate Language Tags */}
      {meta.alternates?.map((alt) => (
        <link
          key={alt.lang}
          rel="alternate"
          hrefLang={alt.lang}
          href={alt.href}
        />
      ))}
      
      {/* Structured Data / JSON-LD */}
      {structuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data)
          }}
        />
      ))}
    </Head>
  );
}