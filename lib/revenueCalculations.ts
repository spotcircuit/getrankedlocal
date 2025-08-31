// Centralized revenue calculations to ensure consistency across all components
export const REVENUE_CONFIG = {
  // CTR model for Map Pack positions
  mapPackCTR: {
    position1: 0.33,  // 33% CTR
    position2: 0.19,  // 19% CTR 
    position3: 0.13,  // 13% CTR
    topThreeTotal: 0.65, // 65% of clicks go to top 3
    position4to10: 0.35, // Remaining 35% split among positions 4-10
  },
  
  // Med spa industry averages
  industryMetrics: {
    avgMonthlySearchVolume: 1800, // Average monthly searches for "med spa near me" variants
    conversionRate: 0.15, // 15% of clicks convert to leads
    leadToCustomerRate: 0.30, // 30% of leads become customers
    avgCustomerValue: 2500, // Average customer lifetime value for med spa
    avgTransactionValue: 450, // Average per-visit transaction
  },
  
  // Calculate monthly lost revenue based on current rank
  calculateMonthlyLoss: (currentRank: number): number => {
    const { mapPackCTR, industryMetrics } = REVENUE_CONFIG;
    
    // If already in top 3, calculate what they're missing from higher positions
    if (currentRank <= 3) {
      let potentialCTR = 0;
      if (currentRank === 2) potentialCTR = mapPackCTR.position1 - mapPackCTR.position2;
      if (currentRank === 3) potentialCTR = mapPackCTR.position1 - mapPackCTR.position3;
      
      const missedClicks = industryMetrics.avgMonthlySearchVolume * potentialCTR;
      const missedLeads = missedClicks * industryMetrics.conversionRate;
      const missedCustomers = missedLeads * industryMetrics.leadToCustomerRate;
      return Math.round(missedCustomers * industryMetrics.avgTransactionValue);
    }
    
    // If outside top 3, calculate what they're missing from top 3
    const currentCTR = currentRank <= 10 ? mapPackCTR.position4to10 / 7 : 0.02;
    const topThreeAvgCTR = mapPackCTR.topThreeTotal / 3;
    const missedCTR = topThreeAvgCTR - currentCTR;
    
    const missedClicks = industryMetrics.avgMonthlySearchVolume * missedCTR;
    const missedLeads = missedClicks * industryMetrics.conversionRate;
    const missedCustomers = missedLeads * industryMetrics.leadToCustomerRate;
    
    return Math.round(missedCustomers * industryMetrics.avgTransactionValue);
  },
  
  // Calculate yearly lost revenue
  calculateYearlyLoss: (currentRank: number): number => {
    return REVENUE_CONFIG.calculateMonthlyLoss(currentRank) * 12;
  },
  
  // Format for display with explanation
  getRevenueDisplay: (currentRank: number) => {
    const monthlyLoss = REVENUE_CONFIG.calculateMonthlyLoss(currentRank);
    const yearlyLoss = monthlyLoss * 12;
    const dailyLoss = Math.round(monthlyLoss / 30);
    
    return {
      daily: dailyLoss,
      monthly: monthlyLoss,
      yearly: yearlyLoss,
      formatted: {
        daily: `$${dailyLoss.toLocaleString()}`,
        monthly: `$${monthlyLoss.toLocaleString()}`,
        yearly: `$${yearlyLoss.toLocaleString()}`,
      },
      explanation: `Based on ${REVENUE_CONFIG.industryMetrics.avgMonthlySearchVolume} monthly searches, ${(REVENUE_CONFIG.mapPackCTR.topThreeTotal * 100).toFixed(0)}% CTR for top 3, and $${REVENUE_CONFIG.industryMetrics.avgTransactionValue} avg transaction`,
    };
  },
};

// Export helper functions
export const formatRevenue = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

export const getConsistentRevenueData = (currentRank: number = 9) => {
  return REVENUE_CONFIG.getRevenueDisplay(currentRank);
};