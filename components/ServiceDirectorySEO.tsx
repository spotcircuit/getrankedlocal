'use client';

import { useEffect } from 'react';

interface ServiceDirectorySEOProps {
  service: string;
  serviceName: string;
  state?: string;
  stateName?: string;
  city?: string;
  cityName?: string;
  businessCount: number;
  averageRating: number;
  totalReviews: number;
  canonicalPattern: 'service' | 'location';
}

export default function ServiceDirectorySEO({
  service,
  serviceName,
  state,
  stateName,
  city,
  cityName,
  businessCount,
  averageRating,
  totalReviews,
  canonicalPattern = 'location'
}: ServiceDirectorySEOProps) {
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com';
    
    // Build canonical URL based on pattern priority
    let canonicalUrl = '';
    let alternateUrl = '';
    
    if (canonicalPattern === 'location' && state && city && service) {
      // Location-first is canonical (existing SEO established)
      const serviceNiche = service.replace('-', ''); // medical-spas -> medspas
      canonicalUrl = `${baseUrl}/${state.toLowerCase()}/${city.toLowerCase()}/${serviceNiche}`;
      alternateUrl = `${baseUrl}/directory/${service}${state ? `/${state.toLowerCase()}` : ''}${city ? `/${city.toLowerCase()}` : ''}`;
    } else {
      // Service-first is canonical (new structure)
      canonicalUrl = `${baseUrl}/directory/${service}${state ? `/${state.toLowerCase()}` : ''}${city ? `/${city.toLowerCase()}` : ''}`;
      if (state && city) {
        const serviceNiche = service.replace('-', '');
        alternateUrl = `${baseUrl}/${state.toLowerCase()}/${city.toLowerCase()}/${serviceNiche}`;
      }
    }

    // Build title based on hierarchy
    let title = '';
    let description = '';
    
    if (cityName && stateName) {
      title = `Best ${serviceName} in ${cityName}, ${state?.toUpperCase()} - Top-Rated Providers`;
      description = `Find the best ${serviceName.toLowerCase()} in ${cityName}, ${stateName}. Compare top-rated providers with verified reviews and ratings.`;
    } else if (stateName) {
      title = `${serviceName} in ${stateName} - Top-Rated Providers by City`;
      description = `Find top-rated ${serviceName.toLowerCase()} in ${stateName}. Browse by city to discover verified providers with authentic reviews.`;
    } else {
      title = `${serviceName} Directory - Find Top-Rated Providers Nationwide`;
      description = `Discover top-rated ${serviceName.toLowerCase()} across all 50 states. Verified reviews and rankings nationwide.`;
    }

    // Update document head
    document.title = title;
    
    // Remove existing meta tags we're managing
    const existingTags = document.querySelectorAll('meta[data-service-directory-seo]');
    existingTags.forEach(tag => tag.remove());
    
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) existingCanonical.remove();
    
    const existingAlternate = document.querySelector('link[rel="alternate"]');
    if (existingAlternate) existingAlternate.remove();

    // Create meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description }
    ];

    // Add location-specific keywords
    let keywords = [serviceName.toLowerCase()];
    if (cityName) keywords.push(cityName.toLowerCase());
    if (stateName) keywords.push(stateName.toLowerCase());
    keywords.push('near me', 'top rated', 'reviews', 'verified');
    
    metaTags.push({ name: 'keywords', content: keywords.join(', ') });

    // Create and append meta tags
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute('data-service-directory-seo', 'true');
      
      if (name) meta.setAttribute('name', name);
      if (property) meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      
      document.head.appendChild(meta);
    });

    // Add canonical link
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', canonicalUrl);
    document.head.appendChild(canonical);

    // Add alternate link if different from canonical
    if (alternateUrl && alternateUrl !== canonicalUrl) {
      const alternate = document.createElement('link');
      alternate.setAttribute('rel', 'alternate');
      alternate.setAttribute('href', alternateUrl);
      document.head.appendChild(alternate);
    }

    // Add hreflang for US English
    const hreflang = document.createElement('link');
    hreflang.setAttribute('rel', 'alternate');
    hreflang.setAttribute('hreflang', 'en-US');
    hreflang.setAttribute('href', canonicalUrl);
    document.head.appendChild(hreflang);

    // Cleanup function
    return () => {
      const seoTags = document.querySelectorAll('[data-service-directory-seo]');
      seoTags.forEach(tag => tag.remove());
    };
  }, [service, serviceName, state, stateName, city, cityName, businessCount, averageRating, totalReviews, canonicalPattern]);

  // Add JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': cityName ? 'LocalBusiness' : 'CollectionPage',
    'name': cityName 
      ? `${serviceName} in ${cityName}, ${stateName}`
      : stateName 
        ? `${serviceName} in ${stateName}`
        : `${serviceName} Directory`,
    'description': cityName
      ? `Find top-rated ${serviceName.toLowerCase()} in ${cityName}, ${stateName}`
      : stateName
        ? `Browse ${serviceName.toLowerCase()} by city across ${stateName}`
        : `Nationwide directory of ${serviceName.toLowerCase()}`,
    'url': process.env.NEXT_PUBLIC_SITE_URL + (cityName && state && city 
      ? `/directory/${service}/${state.toLowerCase()}/${city.toLowerCase()}`
      : stateName && state
        ? `/directory/${service}/${state.toLowerCase()}`
        : `/directory/${service}`),
    ...(cityName && stateName && {
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': cityName,
        'addressRegion': state?.toUpperCase(),
        'addressCountry': 'US'
      }
    }),
    'aggregateRating': businessCount > 0 ? {
      '@type': 'AggregateRating',
      'ratingValue': averageRating,
      'reviewCount': totalReviews,
      'bestRating': 5,
      'worstRating': 1
    } : undefined
  };

  // Breadcrumb structured data
  const breadcrumbData = {
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
        'name': serviceName,
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory/${service}`
      },
      ...(stateName ? [{
        '@type': 'ListItem',
        'position': 4,
        'name': stateName,
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory/${service}/${state?.toLowerCase()}`
      }] : []),
      ...(cityName ? [{
        '@type': 'ListItem',
        'position': stateName ? 5 : 4,
        'name': cityName,
        'item': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com'}/directory/${service}/${state?.toLowerCase()}/${city?.toLowerCase()}`
      }] : [])
    ]
  };

  return (
    <>
      {/* Main Entity Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData)
        }}
      />
    </>
  );
}