'use client';

import { Info } from 'lucide-react';

export default function ComplianceDisclaimer() {
  return (
    <div className="bg-gray-900/50 border-t border-gray-800 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-500 space-y-2">
            <p>
              <strong>*Performance Disclaimer:</strong> Individual results vary based on market conditions, competition, and implementation. 
              Rankings are influenced by numerous factors including Google algorithm changes. Our guarantee terms: If agreed KPIs 
              (review velocity, visibility metrics) are not met within 60 days, receive an additional month of service at no charge. 
              <a href="/terms" className="text-purple-400 hover:text-purple-300 ml-1">View full terms</a>
            </p>
            <p>
              <strong>Medical Compliance:</strong> This service provides marketing support only. We do not make medical claims or 
              guarantee customer outcomes. All review collection follows HIPAA guidelines - no PHI is collected or stored. 
              Customer testimonials reflect individual experiences.
            </p>
            <p>
              <strong>Data Methodology:</strong> Revenue calculations based on industry averages: 1,800 monthly searches, 
              65% CTR for top 3 positions, 15% lead conversion, $450 average transaction value. 
              <button className="text-purple-400 hover:text-purple-300 ml-1">Customize assumptions</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}