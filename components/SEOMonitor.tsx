'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Search, Link, FileText, Zap } from 'lucide-react';

interface SEOCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface PageSEOData {
  url: string;
  canonical: string;
  title: string;
  description: string;
  hasStructuredData: boolean;
  schemaTypes: string[];
  checks: SEOCheck[];
}

/**
 * SEO Monitor Component
 * Provides real-time SEO validation and monitoring for the dual URL pattern implementation
 */
export default function SEOMonitor({ currentPath }: { currentPath: string }) {
  const [seoData, setSeoData] = useState<PageSEOData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or with ?seo=debug query param
    const params = new URLSearchParams(window.location.search);
    const debugMode = params.get('seo') === 'debug';
    setIsVisible(process.env.NODE_ENV === 'development' || debugMode);

    if (!isVisible) return;

    // Analyze current page SEO
    const analyzePageSEO = () => {
      const data: PageSEOData = {
        url: window.location.href,
        canonical: '',
        title: document.title,
        description: '',
        hasStructuredData: false,
        schemaTypes: [],
        checks: []
      };

      // Get canonical URL
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        data.canonical = canonicalLink.getAttribute('href') || '';
      }

      // Get meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        data.description = metaDesc.getAttribute('content') || '';
      }

      // Check for structured data
      const schemas = document.querySelectorAll('script[type="application/ld+json"]');
      data.hasStructuredData = schemas.length > 0;
      schemas.forEach(schema => {
        try {
          const parsed = JSON.parse(schema.textContent || '{}');
          if (parsed['@type']) {
            data.schemaTypes.push(parsed['@type']);
          }
        } catch (e) {
          console.error('Failed to parse schema:', e);
        }
      });

      // Run SEO checks
      data.checks = runSEOChecks(data, currentPath);

      setSeoData(data);
    };

    analyzePageSEO();
  }, [currentPath, isVisible]);

  const runSEOChecks = (data: PageSEOData, path: string): SEOCheck[] => {
    const checks: SEOCheck[] = [];

    // Check 1: Canonical URL implementation
    const isLocationFirst = /^\/[a-z]{2}\/[^\/]+\/[^\/]+/.test(path);
    const isServiceFirst = /^\/directory\//.test(path);

    if (isLocationFirst) {
      const shouldPointToService = data.canonical.includes('/directory/');
      checks.push({
        name: 'Canonical URL Strategy',
        status: shouldPointToService ? 'pass' : 'fail',
        message: shouldPointToService 
          ? 'Correctly points to service-first URL'
          : 'CRITICAL: Location-first URL should have canonical pointing to service-first pattern',
        priority: 'critical'
      });
    } else if (isServiceFirst) {
      const isSelfCanonical = data.canonical === data.url || data.canonical.includes(path);
      checks.push({
        name: 'Canonical URL Strategy',
        status: isSelfCanonical ? 'pass' : 'warning',
        message: isSelfCanonical
          ? 'Service-first URL is correctly self-canonical'
          : 'Service-first URL canonical may not match current URL',
        priority: 'high'
      });
    }

    // Check 2: Title length
    const titleLength = data.title.length;
    checks.push({
      name: 'Title Tag Length',
      status: titleLength <= 60 ? 'pass' : titleLength <= 70 ? 'warning' : 'fail',
      message: `${titleLength} characters (recommended: ≤60)`,
      priority: 'medium'
    });

    // Check 3: Meta description length
    const descLength = data.description.length;
    checks.push({
      name: 'Meta Description Length',
      status: descLength >= 120 && descLength <= 160 ? 'pass' : 
              descLength > 0 && descLength < 120 ? 'warning' : 
              descLength > 160 ? 'warning' : 'fail',
      message: descLength > 0 
        ? `${descLength} characters (recommended: 120-160)`
        : 'Missing meta description',
      priority: 'high'
    });

    // Check 4: Structured data presence
    checks.push({
      name: 'Structured Data',
      status: data.hasStructuredData ? 'pass' : 'fail',
      message: data.hasStructuredData 
        ? `Found: ${data.schemaTypes.join(', ')}`
        : 'No structured data found',
      priority: 'high'
    });

    // Check 5: Breadcrumb schema
    const hasBreadcrumb = data.schemaTypes.includes('BreadcrumbList');
    checks.push({
      name: 'Breadcrumb Schema',
      status: hasBreadcrumb ? 'pass' : 'warning',
      message: hasBreadcrumb 
        ? 'BreadcrumbList schema present'
        : 'Missing BreadcrumbList schema',
      priority: 'medium'
    });

    // Check 6: Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const hasOG = ogTitle && ogDesc;
    checks.push({
      name: 'Open Graph Tags',
      status: hasOG ? 'pass' : 'warning',
      message: hasOG 
        ? 'OG tags properly configured'
        : 'Missing Open Graph tags',
      priority: 'low'
    });

    return checks;
  };

  if (!isVisible || !seoData) return null;

  const criticalIssues = seoData.checks.filter(c => c.status === 'fail' && c.priority === 'critical').length;
  const warnings = seoData.checks.filter(c => c.status === 'warning').length;
  const passed = seoData.checks.filter(c => c.status === 'pass').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEO Monitor
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-500/20 rounded p-2 text-center">
            <div className="text-green-400 font-bold">{passed}</div>
            <div className="text-xs text-gray-400">Passed</div>
          </div>
          <div className="bg-yellow-500/20 rounded p-2 text-center">
            <div className="text-yellow-400 font-bold">{warnings}</div>
            <div className="text-xs text-gray-400">Warnings</div>
          </div>
          <div className="bg-red-500/20 rounded p-2 text-center">
            <div className="text-red-400 font-bold">{criticalIssues}</div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
        </div>

        {/* Current URL Info */}
        <div className="bg-gray-800 rounded p-3 mb-4">
          <div className="text-xs text-gray-400 mb-1">Current Path</div>
          <div className="text-sm font-mono break-all">{currentPath}</div>
          
          {seoData.canonical && (
            <>
              <div className="text-xs text-gray-400 mt-2 mb-1">Canonical URL</div>
              <div className="text-sm font-mono break-all text-purple-400">
                {seoData.canonical}
              </div>
            </>
          )}
        </div>

        {/* SEO Checks */}
        <div className="space-y-2">
          {seoData.checks.map((check, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-2 rounded ${
                check.status === 'pass' ? 'bg-green-500/10' :
                check.status === 'warning' ? 'bg-yellow-500/10' :
                'bg-red-500/10'
              }`}
            >
              <div className="mt-0.5">
                {check.status === 'pass' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : check.status === 'warning' ? (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{check.name}</div>
                <div className="text-xs text-gray-400">{check.message}</div>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded ${
                check.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                check.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                check.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {check.priority}
              </div>
            </div>
          ))}
        </div>

        {/* Schema Types */}
        {seoData.schemaTypes.length > 0 && (
          <div className="mt-4 bg-gray-800 rounded p-3">
            <div className="text-xs text-gray-400 mb-2">Detected Schema Types</div>
            <div className="flex flex-wrap gap-1">
              {seoData.schemaTypes.map((type, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-800 px-4 py-3 flex gap-2">
        <button
          onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
          className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center justify-center gap-1"
        >
          <FileText className="w-3 h-3" />
          Test Rich Results
        </button>
        <button
          onClick={() => window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(window.location.href)}`, '_blank')}
          className="flex-1 text-xs bg-green-600 hover:bg-green-700 px-3 py-2 rounded flex items-center justify-center gap-1"
        >
          <Zap className="w-3 h-3" />
          PageSpeed Test
        </button>
      </div>
    </div>
  );
}