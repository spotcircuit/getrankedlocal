'use client';

import { useState } from 'react';
import { FileText, TrendingUp, Target, Users, AlertTriangle, CheckCircle, XCircle, Download } from 'lucide-react';

interface MarketingAnalystReportProps {
  gridData: any;
  businessName: string;
}

export default function MarketingAnalystReport({ gridData, businessName }: MarketingAnalystReportProps) {
  const [showFullReport, setShowFullReport] = useState(false);

  // Calculate key metrics
  const targetBusiness = gridData.targetBusiness;
  const competitors = gridData.competitors || [];
  const topCompetitor = competitors[0];
  const avgCompetitorCoverage = competitors.slice(0, 5).reduce((sum: number, c: any) => 
    sum + parseFloat(c.coverage), 0) / Math.min(5, competitors.length);
  
  const coverageGap = topCompetitor ? parseFloat(topCompetitor.coverage) - (targetBusiness?.coverage || 0) : 0;
  const isMarketLeader = targetBusiness && competitors[0] && 
    targetBusiness.coverage >= parseFloat(competitors[0].coverage);
  
  // Market saturation analysis
  const totalBusinesses = gridData.summary?.totalUniqueBusinesses || 0;
  const marketSaturation = totalBusinesses > 50 ? 'High' : totalBusinesses > 25 ? 'Moderate' : 'Low';
  
  // Opportunity score (0-100)
  const opportunityScore = targetBusiness ? 
    Math.round(100 - (targetBusiness.coverage * 0.7 + targetBusiness.avgRank * 0.3)) : 75;

  // Generate recommendations
  const getRecommendations = () => {
    const recs = [];
    
    if (targetBusiness) {
      if (targetBusiness.coverage < 25) {
        recs.push({
          priority: 'Critical',
          title: 'Expand Local Presence',
          description: `Your visibility is critically low at ${targetBusiness.coverage.toFixed(1)}%. Implement aggressive local SEO and Google My Business optimization immediately.`,
          impact: 'High',
          timeframe: '1-2 weeks'
        });
      }
      
      if (targetBusiness.avgRank > 10) {
        recs.push({
          priority: 'High',
          title: 'Improve Ranking Position',
          description: `Average rank of #${targetBusiness.avgRank.toFixed(0)} means you're invisible to most searchers. Focus on review generation and local citations.`,
          impact: 'High',
          timeframe: '2-4 weeks'
        });
      }
      
      if (targetBusiness.reviews < (topCompetitor?.reviews || 100)) {
        recs.push({
          priority: 'Medium',
          title: 'Accelerate Review Collection',
          description: `You have ${targetBusiness.reviews || 0} reviews vs market leader's ${topCompetitor?.reviews || 'many'}. Launch a review campaign to build trust signals.`,
          impact: 'Medium',
          timeframe: '4-6 weeks'
        });
      }
    } else {
      // All businesses mode
      recs.push({
        priority: 'High',
        title: 'Market Entry Strategy',
        description: `${totalBusinesses} competitors identified. Focus on differentiation and aggressive local presence building.`,
        impact: 'High',
        timeframe: '2-4 weeks'
      });
    }
    
    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 space-y-6 border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Marketing Analyst Report</h2>
            <p className="text-sm text-gray-400">
              AI-Powered Market Intelligence for {businessName || gridData.searchTerm || 'Your Business'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFullReport(!showFullReport)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
        >
          {showFullReport ? 'Hide Details' : 'View Full Report'}
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-black/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Executive Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Market Position */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Market Position</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {targetBusiness ? (
                isMarketLeader ? 'Leader' : 
                targetBusiness.coverage > 50 ? 'Strong' :
                targetBusiness.coverage > 25 ? 'Moderate' : 'Weak'
              ) : 'Analysis'}
            </p>
            {targetBusiness && (
              <p className="text-xs text-gray-400 mt-1">
                {coverageGap > 0 ? `${coverageGap.toFixed(1)}% behind leader` : 'Market leader'}
              </p>
            )}
          </div>

          {/* Opportunity Score */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Opportunity Score</span>
            </div>
            <p className="text-2xl font-bold text-white">{opportunityScore}/100</p>
            <p className="text-xs text-gray-400 mt-1">
              {opportunityScore > 70 ? 'High growth potential' : 
               opportunityScore > 40 ? 'Moderate potential' : 'Established market'}
            </p>
          </div>

          {/* Competition Level */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Competition</span>
            </div>
            <p className="text-2xl font-bold text-white">{marketSaturation}</p>
            <p className="text-xs text-gray-400 mt-1">
              {totalBusinesses} competitors found
            </p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Key Insights</h3>
        
        <div className="space-y-2">
          {targetBusiness && targetBusiness.coverage < 50 && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Critical Visibility Gap</p>
                <p className="text-xs text-gray-300 mt-1">
                  You're missing {(100 - targetBusiness.coverage).toFixed(0)}% of potential customer searches. 
                  Competitors are capturing these leads instead.
                </p>
              </div>
            </div>
          )}
          
          {topCompetitor && parseFloat(topCompetitor.coverage) > 80 && (
            <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Dominant Competitor</p>
                <p className="text-xs text-gray-300 mt-1">
                  {topCompetitor.name} controls {parseFloat(topCompetitor.coverage).toFixed(0)}% of the market. 
                  They have {topCompetitor.reviews} reviews and {topCompetitor.rating}⭐ rating.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Market Opportunity</p>
              <p className="text-xs text-gray-300 mt-1">
                Average competitor coverage is {avgCompetitorCoverage.toFixed(0)}%. 
                {opportunityScore > 50 ? 'Significant room for growth exists.' : 'Market is competitive but penetrable.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {showFullReport && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Strategic Recommendations</h3>
            
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-xs text-gray-400">Impact: {rec.impact}</span>
                    </div>
                    <span className="text-xs text-gray-400">{rec.timeframe}</span>
                  </div>
                  <h4 className="text-white font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-300">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Competitive Analysis */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Competitive Landscape</h3>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Top Competitor</p>
                    <p className="text-white font-semibold">{topCompetitor?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Their Coverage</p>
                    <p className="text-white font-semibold">{topCompetitor?.coverage || 0}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Their Avg Rank</p>
                    <p className="text-white font-semibold">#{topCompetitor?.avgRank || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Their Reviews</p>
                    <p className="text-white font-semibold">{topCompetitor?.reviews || 0}</p>
                  </div>
                </div>
                
                {/* Market Share Visualization */}
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Market Share Distribution (Top 5)</p>
                  <div className="space-y-2">
                    {competitors.slice(0, 5).map((comp: any, idx: number) => {
                      const coverage = parseFloat(comp.coverage);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-24 truncate">{comp.name}</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-4 relative overflow-hidden">
                            <div 
                              className={`absolute left-0 top-0 h-full ${
                                idx === 0 ? 'bg-yellow-500' : 
                                idx === 1 ? 'bg-gray-400' : 
                                idx === 2 ? 'bg-orange-500' : 
                                'bg-purple-500'
                              }`}
                              style={{ width: `${coverage}%` }}
                            />
                          </div>
                          <span className="text-xs text-white font-semibold w-12 text-right">
                            {coverage.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">30-Day Action Plan</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">1</span>
                <p className="text-white">Optimize Google My Business profile with keywords from top competitors</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                <p className="text-white">Launch review collection campaign (target: {Math.max(50, (topCompetitor?.reviews || 100) * 0.5).toFixed(0)} reviews)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">3</span>
                <p className="text-white">Create location-specific content targeting underserved grid areas</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">4</span>
                <p className="text-white">Build citations on top {marketSaturation === 'High' ? '50' : '30'} local directories</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}