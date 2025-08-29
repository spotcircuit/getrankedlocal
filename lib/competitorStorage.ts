// Utility functions for storing and retrieving competitor data

export interface CompetitorData {
  target_business: string;
  niche: string;
  location: string;
  place_id?: string;
  all_competitors: string[];
  top_competitors: any[];
  market_analysis: any;
  raw_response: any;
  timestamp: string;
}

export function storeCompetitorData(data: CompetitorData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('competitor_data', JSON.stringify(data, null, 2));
    localStorage.setItem('competitor_data_history', JSON.stringify([
      ...(getCompetitorDataHistory() || []),
      data
    ], null, 2));
    
    console.log('💾 Full competitor data saved');
    console.log('📊 Total competitors found:', data.all_competitors.length);
    console.log('🔍 Access with: JSON.parse(localStorage.getItem("competitor_data"))');
    console.log('📚 History: JSON.parse(localStorage.getItem("competitor_data_history"))');
  }
}

export function getCompetitorData(): CompetitorData | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('competitor_data');
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function getCompetitorDataHistory(): CompetitorData[] | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('competitor_data_history');
    return data ? JSON.parse(data) : [];
  }
  return null;
}

export function clearCompetitorData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('competitor_data');
    localStorage.removeItem('competitor_data_history');
  }
}

// Export competitor data as JSON file
export function exportCompetitorData(filename?: string): void {
  const data = getCompetitorData();
  if (!data) {
    console.warn('No competitor data to export');
    return;
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `competitor-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}