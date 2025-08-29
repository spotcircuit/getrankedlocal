// API service for LeadFinder - connects to Render API
const API_URL = process.env.NEXT_PUBLIC_LEADFINDER_API_URL || 'https://leadfinder-mhh1.onrender.com';

export interface Lead {
  name: string;
  email: string | null;
  phone: string | null;
  score: number | null;
  city?: string;
}

export interface ApiResponse<T> {
  leads?: T[];
  count?: number;
  status?: string;
  message?: string;
}

export interface OrchestratorRequest {
  business_name: string;
  niche: string;
  city: string;
  state?: string;
}

export interface OrchestratorResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  analysis_available: boolean;
}

export interface FreshAnalysis {
  business: {
    name: string;
    city: string;
    niche: string;
  };
  competitors: Array<{
    name: string;
    rank: number;
    reviews: number;
    rating: number;
    city: string;
    website?: string;
    phone?: string;
  }>;
  analysis: {
    total_competitors: number;
    top_competitor?: any;
    market_insights: string;
  };
  job_status: string;
}

class LeadFinderAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Get leads from database
  async getLeads(city?: string, limit: number = 10): Promise<ApiResponse<Lead>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (city) params.append('city', city);

    return this.request<ApiResponse<Lead>>(`/api/get_leads?${params}`);
  }

  // Search leads by query
  async searchLeads(query: string, city?: string, limit: number = 10): Promise<ApiResponse<Lead>> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString()
    });
    if (city) params.append('city', city);

    return this.request<ApiResponse<Lead>>(`/api/search_leads?${params}`);
  }

  // Health check
  async health(): Promise<{ status: string; message: string }> {
    return this.request('/api/health');
  }

  // Trigger orchestrator to scrape and analyze
  async triggerOrchestrator(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    return this.request<OrchestratorResponse>('/api/trigger-orchestrator', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Check orchestrator job status
  async getJobStatus(jobId: string): Promise<JobStatus> {
    // Use local API instead of external
    const url = `/api/analysis-status/${jobId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Job status request failed: ${response.status}`);
    }
    return response.json();
  }

  // Get fresh analysis results
  async getFreshAnalysis(jobId: string): Promise<FreshAnalysis> {
    // Use local API instead of external
    const url = `/api/get-analysis/${jobId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Analysis request failed: ${response.status}`);
    }
    return response.json();
  }

  // Analyze business using real database data (fallback method)
  async analyzeBusiness(businessName: string, niche: string, city?: string): Promise<any> {
    try {
      // First, search for the business in our database
      const searchResults = await this.searchLeads(businessName, city, 5);
      const foundBusiness = searchResults.leads?.find(lead =>
        lead.name.toLowerCase().includes(businessName.toLowerCase()) ||
        businessName.toLowerCase().includes(lead.name.toLowerCase())
      );

      if (foundBusiness) {
        // Use real business data from database
        return {
          business: {
            name: foundBusiness.name,
            rating: 4.2, // You can add rating to your DB schema
            reviewCount: 85, // You can add review_count to your DB schema
            city: foundBusiness.city || city || 'Unknown',
            state: 'TX', // You can add state to your DB schema
            niche: niche,
            phone: foundBusiness.phone || undefined,
          },
          analysis: {
            currentRank: 7,
            potentialTraffic: 10000,
            lostRevenue: 50000,
            reviewDeficit: 25,
            competitorsAvgReviews: 150,
            competitors: [
              { name: 'Competitor 1', rank: 1, reviews: 200, rating: 4.8 },
              { name: 'Competitor 2', rank: 2, reviews: 180, rating: 4.7 },
              { name: 'Competitor 3', rank: 3, reviews: 160, rating: 4.6 },
            ],
            solutions: [
              'Optimize Google Business Profile',
              'Implement review collection system',
              'Build location-specific content'
            ],
            timeline: '90 days to #1'
          }
        };
      }
    } catch (error) {
      console.log('Business not found in database, using enhanced mock data');
    }

    // Enhanced mock data with your real business structure
    return {
      business: {
        name: businessName,
        rating: 4.2,
        reviewCount: 85,
        city: city || 'Unknown City',
        state: 'TX',
        niche: niche,
        phone: '+1-555-0123',
      },
      analysis: {
        currentRank: 7,
        potentialTraffic: 10000,
        lostRevenue: 50000,
        reviewDeficit: 25,
        competitorsAvgReviews: 150,
        competitors: [
          { name: 'Elite Spa', rank: 1, reviews: 200, rating: 4.8 },
          { name: 'Glow Med Spa', rank: 2, reviews: 180, rating: 4.7 },
          { name: 'Radiant Beauty', rank: 3, reviews: 160, rating: 4.6 },
        ],
        solutions: [
          'Optimize Google Business Profile',
          'Implement review collection system',
          'Build location-specific content'
        ],
        timeline: '90 days to #1'
      }
    };
  }
}

// Export singleton instance
export const leadFinderAPI = new LeadFinderAPI(API_URL);

// Convenience functions for common operations
export const api = {
  // Get leads
  getLeads: (city?: string, limit?: number) => leadFinderAPI.getLeads(city, limit),

  // Search leads
  searchLeads: (query: string, city?: string, limit?: number) =>
    leadFinderAPI.searchLeads(query, city, limit),

  // Analyze business
  analyzeBusiness: (businessName: string, niche: string, city?: string) =>
    leadFinderAPI.analyzeBusiness(businessName, niche, city),

  // Orchestrator functions
  triggerOrchestrator: (request: OrchestratorRequest) =>
    leadFinderAPI.triggerOrchestrator(request),

  getJobStatus: (jobId: string) => leadFinderAPI.getJobStatus(jobId),

  getFreshAnalysis: (jobId: string) => leadFinderAPI.getFreshAnalysis(jobId),

  // Health check
  health: () => leadFinderAPI.health(),
};