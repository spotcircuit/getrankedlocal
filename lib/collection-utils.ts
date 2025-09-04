/**
 * Utilities for normalizing and managing business collections
 */

/**
 * Normalize a search term into a consistent collection name
 * @param searchTerm - The raw search term (e.g., "hair salons", "med spas")
 * @returns Normalized collection name (e.g., "hair-salons", "medspas")
 */
export function normalizeCollection(searchTerm: string): string {
  if (!searchTerm) return '';
  
  // Convert to lowercase and trim
  let normalized = searchTerm.toLowerCase().trim();
  
  // Only normalize truly identical terms
  const mappings: Record<string, string> = {
    // Medical/Spa variations all go to the same collection
    'med spa': 'medspas',
    'med spas': 'medspas',
    'medical spa': 'medspas',
    'medical spas': 'medspas',
    'medi spa': 'medspas',
    'medi spas': 'medspas',
    'medspa': 'medspas',
    'medspas': 'medspas',
    'medical aesthetics': 'aesthetics',
    'aesthetic center': 'aesthetics',
    'aesthetic centers': 'aesthetics',
    
    // Hair/Beauty
    'hair salon': 'hair-salons',
    'hair salons': 'hair-salons',
    'beauty salon': 'beauty-salons',
    'beauty salons': 'beauty-salons',
    'nail salon': 'nail-salons',
    'nail salons': 'nail-salons',
    'barber shop': 'barber-shops',
    'barber shops': 'barber-shops',
    'barbershop': 'barber-shops',
    'barbershops': 'barber-shops',
    
    // Food/Dining
    'restaurant': 'restaurants',
    'restaurants': 'restaurants',
    'dining': 'restaurants',
    'cafe': 'cafes',
    'cafes': 'cafes',
    'coffee shop': 'coffee-shops',
    'coffee shops': 'coffee-shops',
    'bar': 'bars',
    'bars': 'bars',
    'pub': 'pubs',
    'pubs': 'pubs',
    
    // Services
    'plumber': 'plumbers',
    'plumbers': 'plumbers',
    'plumbing': 'plumbers',
    'electrician': 'electricians',
    'electricians': 'electricians',
    'electrical': 'electricians',
    'roofer': 'roofers',
    'roofers': 'roofers',
    'roofing': 'roofers',
    'hvac': 'hvac',
    'heating and cooling': 'hvac',
    'air conditioning': 'hvac',
    
    // Professional Services
    'lawyer': 'lawyers',
    'lawyers': 'lawyers',
    'attorney': 'lawyers',
    'attorneys': 'lawyers',
    'law firm': 'law-firms',
    'law firms': 'law-firms',
    'accountant': 'accountants',
    'accountants': 'accountants',
    'cpa': 'accountants',
    'dentist': 'dentists',
    'dentists': 'dentists',
    'dental': 'dentists',
    
    // Fitness/Wellness
    'gym': 'gyms',
    'gyms': 'gyms',
    'fitness center': 'gyms',
    'fitness centers': 'gyms',
    'yoga studio': 'yoga-studios',
    'yoga studios': 'yoga-studios',
    'pilates studio': 'pilates-studios',
    'pilates studios': 'pilates-studios',
    'massage': 'massage-therapy',
    'massage therapy': 'massage-therapy',
    'chiropractor': 'chiropractors',
    'chiropractors': 'chiropractors',
    
    // Retail
    'boutique': 'boutiques',
    'boutiques': 'boutiques',
    'clothing store': 'clothing-stores',
    'clothing stores': 'clothing-stores',
    'jewelry store': 'jewelry-stores',
    'jewelry stores': 'jewelry-stores',
    
    // Automotive
    'auto repair': 'auto-repair',
    'car repair': 'auto-repair',
    'mechanic': 'auto-repair',
    'mechanics': 'auto-repair',
    'car wash': 'car-washes',
    'car washes': 'car-washes',
    'auto detailing': 'auto-detailing',
    'car detailing': 'auto-detailing',
    
    // Real Estate
    'real estate': 'real-estate',
    'realtor': 'real-estate',
    'realtors': 'real-estate',
    'property management': 'property-management',
    
    // Technology
    'it services': 'it-services',
    'computer repair': 'computer-repair',
    'web design': 'web-design',
    'web development': 'web-development',
    // Don't force "marketing" to become "marketing-agencies"
    // Let each search term create its own collection
    'seo agency': 'seo-agencies',
    'seo agencies': 'seo-agencies'
  };
  
  // Check if we have a direct mapping
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // If no direct mapping, create a slug version
  // Remove special characters and replace spaces with hyphens
  normalized = normalized
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
  
  return normalized;
}

/**
 * Parse a search destination into state and city
 * @param destination - The search destination (e.g., "Ashburn, VA", "Miami Beach, FL")
 * @returns Object with state and city
 */
export function parseDestination(destination: string): { city: string; state: string } {
  if (!destination) return { city: '', state: '' };
  
  // Split by comma
  const parts = destination.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    // Format: "City, State" or "City, State Zip"
    const city = parts[0];
    // Extract state code (first 2 letters after comma)
    const statePart = parts[1].trim();
    const state = statePart.split(' ')[0].toUpperCase().substring(0, 2);
    
    return { city, state };
  }
  
  // If no comma, return as-is
  return { city: destination, state: '' };
}

/**
 * Generate a slug for a business name
 * @param businessName - The business name
 * @returns URL-safe slug
 */
export function generateBusinessSlug(businessName: string): string {
  if (!businessName) return '';
  
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Build a directory path for a business
 * @param collection - Normalized collection name
 * @param state - State code (e.g., "VA")
 * @param city - City name
 * @param businessSlug - Business slug (optional)
 * @returns Directory path
 */
export function buildDirectoryPath(
  collection: string,
  state: string,
  city: string,
  businessSlug?: string
): string {
  const parts = [
    `/${collection}-directory`,
    state.toLowerCase(),
    city.toLowerCase().replace(/\s+/g, '-')
  ];
  
  if (businessSlug) {
    parts.push(businessSlug);
  }
  
  return parts.join('/');
}