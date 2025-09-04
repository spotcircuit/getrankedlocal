export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug');

  try {
    // Get all available services (based on distinct source_directory patterns)
    const result = await sql`
      SELECT 
        source_directory,
        COUNT(*) as business_count
      FROM leads
      WHERE source_directory IS NOT NULL
      GROUP BY source_directory
      ORDER BY business_count DESC
    `;

    // Parse service types from source_directory
    // Format: med_spas_Collection_Name_STATE
    const serviceTypes = new Map<string, {
      slug: string;
      name: string;
      totalBusinesses: number;
      states: Set<string>;
      collections: Set<string>;
    }>();

    result.forEach(row => {
      const parts = row.source_directory.split('_');
      if (parts.length >= 3) {
        const serviceType = parts[0] + '_' + parts[1]; // e.g., "med_spas"
        const state = parts[parts.length - 1]; // Last part is state
        
        // Convert to service slug
        const serviceSlug = serviceType === 'med_spas' ? 'medical-spas' :
                           serviceType === 'wellness' ? 'wellness-centers' :
                           serviceType === 'aesthetic' ? 'aesthetic-clinics' :
                           serviceType === 'health' ? 'health-clinics' :
                           'healthcare-services';

        const serviceName = serviceType === 'med_spas' ? 'Medical Spas' :
                           serviceType === 'wellness' ? 'Wellness Centers' :
                           serviceType === 'aesthetic' ? 'Aesthetic Clinics' :
                           serviceType === 'health' ? 'Health Clinics' :
                           'Healthcare Services';

        if (!serviceTypes.has(serviceSlug)) {
          serviceTypes.set(serviceSlug, {
            slug: serviceSlug,
            name: serviceName,
            totalBusinesses: 0,
            states: new Set(),
            collections: new Set()
          });
        }

        const service = serviceTypes.get(serviceSlug)!;
        service.totalBusinesses += Number(row.business_count);
        service.states.add(state);
        
        // Extract collection name
        const collectionParts = parts.slice(2, -1);
        const collectionName = collectionParts.join(' ');
        service.collections.add(collectionName);
      }
    });

    // Convert to array format
    const services = Array.from(serviceTypes.values()).map(service => ({
      slug: service.slug,
      name: service.name,
      totalBusinesses: service.totalBusinesses,
      totalStates: service.states.size,
      totalCollections: service.collections.size,
      averageRating: 4.7, // Could be calculated from actual data
      topStates: Array.from(service.states).slice(0, 3)
    }));

    const response: any = {
      success: true,
      data: {
        services,
        totalServices: services.length
      }
    };

    if (debug === '1') {
      response.debug = {
        sampleSourceDirectories: result.slice(0, 10).map(r => r.source_directory),
        serviceTypesFound: Array.from(serviceTypes.keys())
      };
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch services data' 
    }, { status: 500 });
  }
}