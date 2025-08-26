export interface BusinessData {
  name: string;
  rating: number;
  reviewCount: number;
  city: string;
  niche: string;
  website?: string;
  phone?: string;
  email?: string;
}

export interface PainPoint {
  issue: string;
  severity: 'high' | 'medium' | 'low' | 'critical';
  impact: string;
  solution?: string;
  example?: string;
}

export interface Competitor {
  name: string;
  rank: number;
  reviews: number;
  rating: number;
  advantages: string[];
  city?: string;
  state?: string;
  website?: string;
  phone?: string;
}

export interface AnalysisData {
  currentRank: number;
  potentialTraffic: string;
  lostRevenue: number;
  painPoints: PainPoint[];
  competitors: Competitor[];
  solutions: string[];
  timeline: string;
  urgency: string;
  actionPlan?: ActionPlan[];
}

export interface ActionPlan {
  phase: string;
  actions: string[];
}

export interface ReputationData {
  score: number;
  issues: string[];
  opportunities: string[];
  responseRate: number;
}