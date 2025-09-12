'use client';

import { motion } from 'framer-motion';
import MarketingAnalystReport from '@/components/MarketingAnalystReport';

interface DataExportSectionProps {
  showReport: boolean;
  setShowReport: (show: boolean) => void;
  handleExportGridData: () => void;
  handleExportCompetitorAnalysis: () => void;
  businessData: any;
  analysisData: any;
  competitorsSafe: any[];
  ai_intelligence: any;
}

export default function DataExportSection({
  showReport,
  setShowReport,
  handleExportGridData,
  handleExportCompetitorAnalysis,
  businessData,
  analysisData,
  competitorsSafe,
  ai_intelligence
}: DataExportSectionProps) {
  return (
    <section className="py-12 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Export Your Analysis & Data
          </h2>
          <p className="text-gray-300 mb-8">
            Download comprehensive reports and raw data for further analysis
          </p>
          
          {/* Export Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button
              onClick={handleExportGridData}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Raw Grid Data (CSV)
            </button>
            
            <button
              onClick={handleExportCompetitorAnalysis}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-5h4" />
              </svg>
              Export Competitor Analysis (CSV)
            </button>
            
            <button
              onClick={() => setShowReport(!showReport)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showReport ? 'Hide' : 'View'} Marketing Analyst Report
            </button>
          </div>
        </motion.div>
        
        {/* Marketing Analyst Report */}
        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MarketingAnalystReport
              businessData={businessData}
              analysisData={analysisData}
              competitorsData={competitorsSafe}
              marketData={analysisData.marketIntel}
              aiIntelligence={ai_intelligence}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}