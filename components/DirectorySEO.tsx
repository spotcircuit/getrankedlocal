'use client';

import Head from 'next/head';

interface DirectorySEOProps {
  collection: string;
  collectionDisplayName: string;
  city: string;
  state: string;
  stateAbbr: string;
  businessCount: number;
  businesses?: Array<{
    id: number;
    business_name: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    review_count?: number;
    latitude?: number;
    longitude?: number;
  }>;
  averageRating?: number;
  totalReviews?: number;
}

export default function DirectorySEO({
  collection,
  collectionDisplayName,
  city,
  state,
  stateAbbr,
  businessCount,
  businesses = [],
  averageRating,
  totalReviews
}: DirectorySEOProps) {
  
  // Generate SEO-optimized title
  const generateTitle = () => {
    const cityState = `${city}, ${stateAbbr}`;
    const count = businessCount > 0 ? ` (${businessCount} Results)` : '';
    return `${collectionDisplayName} in ${cityState}${count} | GetLocalRanked Directory`;
  };

  // Generate comprehensive meta description
  const generateDescription = () => {
    const cityState = `${city}, ${state}`;
    const ratingText = averageRating ? ` with an average rating of ${averageRating.toFixed(1)} stars` : '';
    const reviewText = totalReviews ? ` and ${totalReviews.toLocaleString()} total reviews` : '';
    
    return `Find the best ${collectionDisplayName.toLowerCase()} in ${cityState}. Browse ${businessCount} verified businesses${ratingText}${reviewText}. Compare ratings, reviews, and contact information.`;
  };

  // Generate keywords
  const generateKeywords = () => {
    const baseKeywords = [
      collectionDisplayName.toLowerCase(),
      `${collectionDisplayName.toLowerCase()} ${city.toLowerCase()}`,
      `${collectionDisplayName.toLowerCase()} ${state.toLowerCase()}`,
      `best ${collectionDisplayName.toLowerCase()} ${city.toLowerCase()}`,
      `top ${collectionDisplayName.toLowerCase()} ${city.toLowerCase()}`,
      `${city.toLowerCase()} ${collectionDisplayName.toLowerCase()} directory`,
      `${city.toLowerCase()} business directory`,
      `${collectionDisplayName.toLowerCase()} near me`,
      `local ${collectionDisplayName.toLowerCase()}`,
      `${collectionDisplayName.toLowerCase()} reviews ${city.toLowerCase()}`
    ];

    return baseKeywords.join(', ');
  };

  // Generate canonical URL
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory/${collection}/${state.toLowerCase().replace(/\s+/g, '-')}/${city.toLowerCase().replace(/\s+/g, '-')}`;

  // Generate breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Directory',
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': collectionDisplayName,
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory/${collection}`
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': state,
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory/${collection}/${state.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        '@type': 'ListItem',
        'position': 5,
        'name': `${collectionDisplayName} in ${city}, ${stateAbbr}`,
        'item': canonicalUrl
      }
    ]
  };

  // Generate local business structured data
  const localBusinessStructuredData = businesses.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${collectionDisplayName} in ${city}, ${stateAbbr}`,
    'description': generateDescription(),
    'numberOfItems': businessCount,
    'itemListElement': businesses.slice(0, 20).map((business, index) => ({ // Limit to first 20 for performance
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'LocalBusiness',
        'name': business.business_name,
        'address': business.address ? {
          '@type': 'PostalAddress',
          'streetAddress': business.address.split(',')[0]?.trim(),
          'addressLocality': city,
          'addressRegion': stateAbbr,
          'addressCountry': 'US'
        } : undefined,
        'telephone': business.phone,
        'url': business.website,
        'aggregateRating': business.rating && business.review_count ? {
          '@type': 'AggregateRating',
          'ratingValue': business.rating,
          'reviewCount': business.review_count
        } : undefined,
        'geo': business.latitude && business.longitude ? {
          '@type': 'GeoCoordinates',
          'latitude': business.latitude,
          'longitude': business.longitude
        } : undefined
      }
    }))
  } : null;

  // Generate FAQ structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `How many ${collectionDisplayName.toLowerCase()} are in ${city}, ${stateAbbr}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `There are ${businessCount} ${collectionDisplayName.toLowerCase()} listed in ${city}, ${stateAbbr} on GetLocalRanked.`
        }
      },
      {
        '@type': 'Question',
        'name': `What is the average rating of ${collectionDisplayName.toLowerCase()} in ${city}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': averageRating 
            ? `The average rating of ${collectionDisplayName.toLowerCase()} in ${city}, ${stateAbbr} is ${averageRating.toFixed(1)} stars based on ${totalReviews?.toLocaleString()} reviews.`
            : `Browse our directory to see individual ratings and reviews for ${collectionDisplayName.toLowerCase()} in ${city}, ${stateAbbr}.`
        }
      },
      {
        '@type': 'Question',
        'name': `How do I find the best ${collectionDisplayName.toLowerCase()} in ${city}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `You can find the best ${collectionDisplayName.toLowerCase()} in ${city}, ${stateAbbr} by browsing our directory, comparing ratings and reviews, and reading detailed business information including contact details and addresses.`
        }
      }
    ]
  };

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{generateTitle()}</title>
        <meta name="description" content={generateDescription()} />
        <meta name="keywords" content={generateKeywords()} />
        <meta name="author" content="GetLocalRanked" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={generateTitle()} />
        <meta property="og:description" content={generateDescription()} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="GetLocalRanked" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/og-directory.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${collectionDisplayName} in ${city}, ${stateAbbr} - GetLocalRanked Directory`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={generateTitle()} />
        <meta name="twitter:description" content={generateDescription()} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/og-directory.png`} />
        <meta name="twitter:site" content="@getlocalranked" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        
        {/* Geo Tags */}
        <meta name="geo.region" content={`US-${stateAbbr}`} />
        <meta name="geo.placename" content={`${city}, ${stateAbbr}`} />
        
        {/* Local Business Schema */}
        <meta name="DC.title" content={generateTitle()} />
        <meta name="DC.description" content={generateDescription()} />
        <meta name="DC.subject" content={`${collectionDisplayName} ${city} ${state} business directory`} />
        <meta name="DC.type" content="Text.HTML" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.language" content="en" />
        
        {/* Mobile & Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={`${collectionDisplayName} ${city}`} />
        
        {/* Theme Colors */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* Alternative language versions (if applicable) */}
        <link rel="alternate" hrefLang="en-US" href={canonicalUrl} />
        
        {/* RSS Feed (if applicable) */}
        <link rel="alternate" type="application/rss+xml" title={`${collectionDisplayName} in ${city}, ${stateAbbr} - GetLocalRanked`} href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/rss/${collection}/${state.toLowerCase()}/${city.toLowerCase()}.xml`} />
      </Head>

      {/* Structured Data */}
      <JsonLd data={breadcrumbStructuredData} />
      {localBusinessStructuredData && <JsonLd data={localBusinessStructuredData} />}
      <JsonLd data={faqStructuredData} />
    </>
  );
}

// Helper component to render JSON-LD structured data
interface JsonLdProps {
  data: any;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}