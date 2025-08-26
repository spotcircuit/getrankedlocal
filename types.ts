// Shared TypeScript types for the Next.js app
// Keep these aligned with data returned by /app/api/analyze/route.ts

export interface BusinessData {
  name: string;
  rating?: number | null;
  reviewCount?: number | null;
  city?: string | null;
  state?: string | null;
  niche?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  ownerName?: string | null;
  medicalDirector?: string | null;
  leadScore?: number | null;
}

export interface PainPoint {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  impact?: string;
}

export interface CompetitorItem {
  name?: string;
  rank?: number;
  reviews?: number;
  rating?: number;
  advantages?: string[];
  [key: string]: any;
}

export interface AnalysisData {
  currentRank?: number | null;
  potentialTraffic?: string | number | null;
  lostRevenue?: number | null;
  reviewDeficit?: number | null; // Added to satisfy component usage
  competitorsAvgReviews?: number | null;
  painPoints?: PainPoint[];
  competitors?: CompetitorItem[];
  competitorLocations?: any[];
  solutions?: string[];
  timeline?: string;
  urgency?: string;
  actionPlan?: any[];
  marketIntel?: any;
  businessPercentile?: number | null;
}
