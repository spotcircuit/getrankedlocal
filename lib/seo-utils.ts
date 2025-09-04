/**
 * SEO Utilities for Dual URL Pattern Management
 * 
 * CRITICAL CONTEXT:
 * We have two URL patterns that both serve content:
 * 1. Location-first: /state/city/service (e.g., /tx/frisco/medspas)
 * 2. Service-first: /directory/service/state/city (e.g., /directory/medical-spas/tx/frisco)
 * 
 * Service-first URLs are CANONICAL to match user search intent.
 */

export interface SEOConfig {
  siteUrl: string;
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage?: string;
  twitterHandle?: string;
}

export const seoConfig: SEOConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://getlocalranked.com',
  siteName: 'GetLocalRanked',
  defaultTitle: 'GetLocalRanked - Find Top-Rated Local Businesses',
  defaultDescription: 'Discover and compare the best local medical spas, wellness centers, and healthcare providers in your area with verified reviews and rankings.',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@getlocalranked'
};

/**
 * Service slug mapping for canonical URL generation
 */
export const serviceSlugMap: Record<string, string> = {
  'medspas': 'medical-spas',
  'dentists': 'dental-practices',
  'lawfirms': 'law-firms',
  'homeservices': 'home-services',
  'wellness': 'wellness-centers',
  'aesthetic': 'aesthetic-clinics',
  'health': 'health-clinics',
  'medical-spas': 'medical-spas',
  'dental-practices': 'dental-practices',
  'law-firms': 'law-firms',
  'home-services': 'home-services',
  'wellness-centers': 'wellness-centers',
  'aesthetic-clinics': 'aesthetic-clinics',
  'health-clinics': 'health-clinics'
};

/**
 * Generate canonical URL for any page
 * Always returns service-first pattern when applicable
 */
export function generateCanonicalUrl(params: {
  type: 'home' | 'state' | 'city' | 'service' | 'service-state' | 'service-city' | 'business';
  state?: string;
  city?: string;
  service?: string;
  businessSlug?: string;
}): string {
  const baseUrl = seoConfig.siteUrl;
  const { type, state, city, service, businessSlug } = params;

  switch (type) {
    case 'home':
      return baseUrl;
    
    case 'state':
      // State pages remain location-first (no service context)
      return `${baseUrl}/${state?.toLowerCase()}`;
    
    case 'city':
      // City collection pages remain location-first (no service context)
      return `${baseUrl}/${state?.toLowerCase()}/${city}`;
    
    case 'service':
      // Service hub page
      const mappedService = serviceSlugMap[service || ''] || service;
      return `${baseUrl}/directory/${mappedService}`;
    
    case 'service-state':
      // Service + State page (canonical)
      const mappedServiceState = serviceSlugMap[service || ''] || service;
      return `${baseUrl}/directory/${mappedServiceState}/${state?.toLowerCase()}`;
    
    case 'service-city':
      // Service + City page (canonical)
      const mappedServiceCity = serviceSlugMap[service || ''] || service;
      return `${baseUrl}/directory/${mappedServiceCity}/${state?.toLowerCase()}/${city}`;
    
    case 'business':
      // Individual business page (use service-first for consistency)
      const mappedServiceBusiness = serviceSlugMap[service || ''] || service;
      return `${baseUrl}/directory/${mappedServiceBusiness}/${state?.toLowerCase()}/${city}/${businessSlug}`;
    
    default:
      return baseUrl;
  }
}

/**
 * Determine if current URL should have a canonical tag pointing elsewhere
 */
export function needsCanonicalRedirect(pathname: string): {
  needs: boolean;
  canonicalUrl?: string;
} {
  // Parse location-first pattern: /state/city/service
  const locationFirstMatch = pathname.match(/^\/([a-z]{2})\/([^\/]+)\/([^\/]+)$/);
  
  if (locationFirstMatch) {
    const [, state, city, service] = locationFirstMatch;
    
    // Check if this is a service page (not a business detail page)
    if (serviceSlugMap[service]) {
      return {
        needs: true,
        canonicalUrl: generateCanonicalUrl({
          type: 'service-city',
          state,
          city,
          service
        })
      };
    }
  }

  // Parse location-first business pattern: /state/city/service/business
  const locationBusinessMatch = pathname.match(/^\/([a-z]{2})\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  
  if (locationBusinessMatch) {
    const [, state, city, service, businessSlug] = locationBusinessMatch;
    
    if (serviceSlugMap[service]) {
      return {
        needs: true,
        canonicalUrl: generateCanonicalUrl({
          type: 'business',
          state,
          city,
          service,
          businessSlug
        })
      };
    }
  }

  return { needs: false };
}

/**
 * Generate meta tags for a page
 */
export interface MetaTags {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  alternates?: Array<{ lang: string; href: string }>;
}

export function generateMetaTags(params: {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  noindex?: boolean;
  alternates?: Array<{ lang: string; href: string }>;
}): MetaTags {
  const { title, description, canonical, image, noindex, alternates } = params;
  
  return {
    title: `${title} | ${seoConfig.siteName}`,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogImage: image || seoConfig.defaultImage,
    ogUrl: canonical,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image || seoConfig.defaultImage,
    robots: noindex ? 'noindex,follow' : 'index,follow',
    alternates
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{
  name: string;
  url: string;
}>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generate CollectionPage structured data
 */
export function generateCollectionSchema(params: {
  name: string;
  description: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
    address?: string;
    phone?: string;
  }>;
}): object {
  const { name, description, url, items } = params;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: item.name,
          url: item.url,
          description: item.description,
          telephone: item.phone,
          address: item.address ? {
            '@type': 'PostalAddress',
            streetAddress: item.address
          } : undefined,
          aggregateRating: item.rating && item.reviewCount ? {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            reviewCount: item.reviewCount
          } : undefined
        }
      }))
    }
  };
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip?: string;
  };
  phone?: string;
  email?: string;
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string[];
  serviceType?: string;
}): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': params.serviceType === 'medical-spas' ? 'MedicalSpa' : 
            params.serviceType === 'health-clinics' ? 'MedicalClinic' :
            params.serviceType === 'dental-practices' ? 'Dentist' :
            params.serviceType === 'law-firms' ? 'LegalService' :
            'LocalBusiness',
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: params.address.street,
      addressLocality: params.address.city,
      addressRegion: params.address.state,
      postalCode: params.address.zip,
      addressCountry: 'US'
    }
  };

  if (params.phone) schema.telephone = params.phone;
  if (params.email) schema.email = params.email;
  if (params.priceRange) schema.priceRange = params.priceRange;
  
  if (params.rating && params.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: params.rating,
      reviewCount: params.reviewCount
    };
  }
  
  if (params.openingHours && params.openingHours.length > 0) {
    schema.openingHoursSpecification = params.openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(' ')[0],
      opens: hours.split(' ')[1].split('-')[0],
      closes: hours.split(' ')[1].split('-')[1]
    }));
  }

  return schema;
}

/**
 * Generate Organization structured data (for homepage)
 */
export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo.png`,
    description: seoConfig.defaultDescription,
    sameAs: [
      'https://twitter.com/getlocalranked',
      'https://www.facebook.com/getlocalranked',
      'https://www.linkedin.com/company/getlocalranked'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['en']
    }
  };
}

/**
 * State name mapping
 */
export const stateNames: Record<string, string> = {
  'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas',
  'ca': 'California', 'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware',
  'fl': 'Florida', 'ga': 'Georgia', 'hi': 'Hawaii', 'id': 'Idaho',
  'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa', 'ks': 'Kansas',
  'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
  'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi',
  'mo': 'Missouri', 'mt': 'Montana', 'ne': 'Nebraska', 'nv': 'Nevada',
  'nh': 'New Hampshire', 'nj': 'New Jersey', 'nm': 'New Mexico', 'ny': 'New York',
  'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio', 'ok': 'Oklahoma',
  'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island', 'sc': 'South Carolina',
  'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah',
  'vt': 'Vermont', 'va': 'Virginia', 'wa': 'Washington', 'wv': 'West Virginia',
  'wi': 'Wisconsin', 'wy': 'Wyoming'
};

/**
 * Service metadata for better SEO
 */
export const serviceMetadata = {
  'medical-spas': {
    name: 'Medical Spas',
    shortName: 'Med Spas',
    description: 'Advanced aesthetic treatments including Botox, fillers, laser therapy, and cosmetic procedures',
    keywords: ['medical spa', 'med spa', 'botox', 'fillers', 'aesthetic treatments', 'cosmetic procedures', 'laser therapy'],
    schemaType: 'MedicalSpa'
  },
  'wellness-centers': {
    name: 'Wellness Centers',
    shortName: 'Wellness',
    description: 'Holistic health services, IV therapy, wellness treatments, and preventive care',
    keywords: ['wellness center', 'holistic health', 'IV therapy', 'preventive care', 'wellness treatments'],
    schemaType: 'HealthAndBeautyBusiness'
  },
  'aesthetic-clinics': {
    name: 'Aesthetic Clinics',
    shortName: 'Aesthetics',
    description: 'Laser treatments, body contouring, skin rejuvenation, and beauty procedures',
    keywords: ['aesthetic clinic', 'laser treatment', 'body contouring', 'skin rejuvenation', 'beauty clinic'],
    schemaType: 'HealthAndBeautyBusiness'
  },
  'health-clinics': {
    name: 'Health Clinics',
    shortName: 'Clinics',
    description: 'Primary care, preventive medicine, health screenings, and general medical services',
    keywords: ['health clinic', 'primary care', 'medical care', 'health screenings', 'preventive medicine'],
    schemaType: 'MedicalClinic'
  },
  'dental-practices': {
    name: 'Dental Practices',
    shortName: 'Dentists',
    description: 'Comprehensive dental care, cosmetic dentistry, orthodontics, and oral surgery',
    keywords: ['dentist', 'dental practice', 'dental care', 'cosmetic dentistry', 'orthodontics'],
    schemaType: 'Dentist'
  },
  'law-firms': {
    name: 'Law Firms',
    shortName: 'Lawyers',
    description: 'Legal services, attorneys, personal injury, family law, and business law',
    keywords: ['law firm', 'attorney', 'lawyer', 'legal services', 'personal injury', 'family law'],
    schemaType: 'LegalService'
  },
  'home-services': {
    name: 'Home Services',
    shortName: 'Home',
    description: 'Home improvement, repairs, maintenance, and professional home services',
    keywords: ['home services', 'home improvement', 'home repairs', 'contractors', 'maintenance'],
    schemaType: 'HomeAndConstructionBusiness'
  }
};