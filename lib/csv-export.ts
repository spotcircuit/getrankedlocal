export function exportGridDataToCSV(gridData: any, businessName: string = '') {
  const rows: string[][] = [];
  
  // Header row
  rows.push([
    'Grid Row',
    'Grid Col',
    'Latitude',
    'Longitude',
    'Target Rank',
    'Total Results',
    'Business Name',
    'Rank',
    'Rating',
    'Reviews',
    'Address',
    'Phone',
    'Coverage %',
    'Avg Rank',
    'Appearances'
  ]);

  // Process each grid point
  gridData.gridPoints?.forEach((point: any) => {
    // Add target business ranking at this point if exists
    if (businessName && point.targetRank !== undefined) {
      rows.push([
        point.gridRow.toString(),
        point.gridCol.toString(),
        point.lat.toString(),
        point.lng.toString(),
        point.targetRank === 999 ? 'Not Found' : point.targetRank.toString(),
        point.totalResults?.toString() || '0',
        businessName,
        point.targetRank === 999 ? 'Not Found' : point.targetRank.toString(),
        gridData.targetBusiness?.rating?.toString() || '',
        gridData.targetBusiness?.reviews?.toString() || '',
        '',
        '',
        gridData.targetBusiness?.coverage?.toFixed(2) || '',
        gridData.targetBusiness?.avgRank?.toFixed(2) || '',
        gridData.targetBusiness?.pointsFound?.toString() || ''
      ]);
    }

    // Add all competitors at this point
    point.topCompetitors?.forEach((comp: any) => {
      // Find full competitor data if available
      const fullCompetitor = gridData.competitors?.find((c: any) => c.name === comp.name);
      
      rows.push([
        point.gridRow.toString(),
        point.gridCol.toString(),
        point.lat.toString(),
        point.lng.toString(),
        '',
        point.totalResults?.toString() || '0',
        comp.name,
        comp.rank?.toString() || '',
        comp.rating?.toString() || '',
        comp.reviews?.toString() || '',
        fullCompetitor?.address || '',
        fullCompetitor?.phone || '',
        fullCompetitor?.coverage || '',
        fullCompetitor?.avgRank || '',
        fullCompetitor?.appearances?.toString() || ''
      ]);
    });
  });

  // Add summary section
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Search Term', gridData.searchTerm || '']);
  rows.push(['Total Grid Points', gridData.gridPoints?.length?.toString() || '0']);
  rows.push(['Total Unique Businesses', gridData.summary?.totalUniqueBusinesses?.toString() || '0']);
  rows.push(['Execution Time (seconds)', gridData.summary?.executionTime?.toString() || '0']);
  rows.push(['Success Rate', gridData.summary?.successRate || '']);
  
  if (gridData.location) {
    rows.push(['City', gridData.location.city || '']);
    rows.push(['State', gridData.location.state || '']);
    rows.push(['Center Latitude', gridData.location.centerLat?.toString() || '']);
    rows.push(['Center Longitude', gridData.location.centerLng?.toString() || '']);
  }

  // Add competitor rankings summary
  rows.push([]);
  rows.push(['TOP COMPETITORS BY COVERAGE']);
  rows.push(['Rank', 'Business Name', 'Coverage %', 'Avg Rank', 'Rating', 'Reviews', 'Appearances']);
  
  gridData.competitors?.slice(0, 20).forEach((comp: any, idx: number) => {
    rows.push([
      `#${idx + 1}`,
      comp.name,
      comp.coverage,
      comp.avgRank,
      comp.rating?.toString() || '',
      comp.reviews?.toString() || '',
      comp.appearances?.toString() || ''
    ]);
  });

  // Convert to CSV string
  const csvContent = rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const escaped = (cell || '').toString().replace(/"/g, '""');
      return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(',')
  ).join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `grid-search-${gridData.searchTerm || 'data'}-${timestamp}.csv`;
  
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  // Cleanup
  URL.revokeObjectURL(link.href);
}

export function exportCompetitorAnalysisCSV(gridData: any) {
  const rows: string[][] = [];
  
  // Header for competitor analysis
  rows.push([
    'Rank',
    'Business Name',
    'Coverage %',
    'Appearances',
    'Avg Rank',
    'Best Rank',
    'Worst Rank',
    'Rating',
    'Reviews',
    'Address',
    'Phone',
    'Latitude',
    'Longitude'
  ]);

  // Process competitors with their full ranking data
  gridData.competitors?.forEach((comp: any, idx: number) => {
    // Calculate best/worst from matrix if available
    let bestRank = 999, worstRank = 999;
    if (gridData.competitorRankMatrix && gridData.competitorRankMatrix[comp.name]) {
      const ranks = gridData.competitorRankMatrix[comp.name].filter((r: number) => r < 999);
      if (ranks.length > 0) {
        bestRank = Math.min(...ranks);
        worstRank = Math.max(...ranks);
      }
    }

    rows.push([
      `${idx + 1}`,
      comp.name,
      comp.coverage,
      comp.appearances?.toString() || '',
      comp.avgRank,
      bestRank === 999 ? 'N/A' : bestRank.toString(),
      worstRank === 999 ? 'N/A' : worstRank.toString(),
      comp.rating?.toString() || '',
      comp.reviews?.toString() || '',
      comp.address || '',
      comp.phone || '',
      comp.lat?.toString() || '',
      comp.lng?.toString() || ''
    ]);
  });

  // Convert to CSV
  const csvContent = rows.map(row => 
    row.map(cell => {
      const escaped = (cell || '').toString().replace(/"/g, '""');
      return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(',')
  ).join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `competitor-analysis-${gridData.searchTerm || 'data'}-${timestamp}.csv`;
  
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}