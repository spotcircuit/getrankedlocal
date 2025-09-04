'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  expected?: any;
  actual?: any;
  message?: string;
}

interface PageTest {
  url: string;
  results: TestResult[];
  timestamp: string;
}

export default function TestPage() {
  const [currentUrl, setCurrentUrl] = useState('/directory/medical-spas/tx/austin');
  const [testResults, setTestResults] = useState<PageTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testMode, setTestMode] = useState<'manual' | 'auto'>('manual');

  const testUrls = [
    '/directory/medical-spas',
    '/directory/medical-spas/tx',
    '/directory/medical-spas/tx/austin',
    '/tx/austin/medspas',
    '/directory/dental-practices',
    '/directory/dental-practices/ca',
    '/directory/dental-practices/ca/los-angeles',
  ];

  const runTests = async (url: string) => {
    setIsLoading(true);
    const results: TestResult[] = [];

    try {
      // Fetch the page
      const response = await fetch(url);
      const html = await response.text();
      
      // Create a temporary DOM to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Test 1: Check for canonical URL
      const canonical = doc.querySelector('link[rel="canonical"]');
      if (canonical) {
        const canonicalHref = canonical.getAttribute('href');
        const isServiceFirst = canonicalHref?.includes('/directory/');
        results.push({
          name: 'Canonical URL',
          status: isServiceFirst ? 'passed' : 'failed',
          actual: canonicalHref,
          expected: 'Should use service-first pattern (/directory/...)',
          message: isServiceFirst ? 'Canonical URL follows service-first pattern' : 'Canonical URL should point to service-first URL'
        });
      } else {
        results.push({
          name: 'Canonical URL',
          status: 'failed',
          message: 'No canonical URL found'
        });
      }

      // Test 2: Check page title
      const title = doc.querySelector('title')?.textContent || '';
      const titleLength = title.length;
      results.push({
        name: 'Page Title',
        status: titleLength > 0 && titleLength <= 60 ? 'passed' : 
                titleLength > 60 && titleLength <= 70 ? 'warning' : 'failed',
        actual: title,
        message: `Length: ${titleLength} characters (recommended: ≤60)`
      });

      // Test 3: Check meta description
      const metaDesc = doc.querySelector('meta[name="description"]');
      const descContent = metaDesc?.getAttribute('content') || '';
      const descLength = descContent.length;
      results.push({
        name: 'Meta Description',
        status: descLength >= 120 && descLength <= 160 ? 'passed' :
                descLength > 0 && descLength < 120 ? 'warning' : 
                descLength > 160 ? 'warning' : 'failed',
        actual: descContent,
        message: `Length: ${descLength} characters (recommended: 120-160)`
      });

      // Test 4: Check for structured data
      const structuredDataScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      const structuredData: any[] = [];
      structuredDataScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          structuredData.push(data['@type'] || 'Unknown');
        } catch (e) {
          structuredData.push('Invalid JSON-LD');
        }
      });
      
      results.push({
        name: 'Structured Data',
        status: structuredData.length > 0 ? 'passed' : 'failed',
        actual: structuredData.join(', '),
        message: `Found ${structuredData.length} schema types`
      });

      // Test 5: Check H1
      const h1 = doc.querySelector('h1');
      results.push({
        name: 'H1 Tag',
        status: h1 ? 'passed' : 'failed',
        actual: h1?.textContent?.trim(),
        message: h1 ? 'H1 found' : 'No H1 tag found'
      });

      // Test 6: Check for breadcrumbs
      const breadcrumbs = doc.querySelector('.breadcrumb') || 
                         doc.querySelector('[aria-label*="breadcrumb"]') ||
                         doc.querySelector('nav');
      results.push({
        name: 'Breadcrumb Navigation',
        status: breadcrumbs ? 'passed' : 'warning',
        message: breadcrumbs ? 'Breadcrumb navigation found' : 'No breadcrumb navigation found'
      });

      // Test 7: Check Open Graph tags
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      const ogDesc = doc.querySelector('meta[property="og:description"]');
      const ogImage = doc.querySelector('meta[property="og:image"]');
      
      results.push({
        name: 'Open Graph Tags',
        status: ogTitle && ogDesc ? 'passed' : 'warning',
        actual: {
          title: ogTitle?.getAttribute('content'),
          description: ogDesc?.getAttribute('content'),
          image: ogImage?.getAttribute('content')
        },
        message: `OG Title: ${ogTitle ? '✓' : '✗'}, OG Desc: ${ogDesc ? '✓' : '✗'}, OG Image: ${ogImage ? '✓' : '✗'}`
      });

      // Test 8: Check for dark theme
      const bodyClasses = doc.body.className;
      const hasDarkTheme = html.includes('bg-black') || 
                           html.includes('bg-gray-900') ||
                           html.includes('from-black') ||
                           html.includes('background-color: #000') ||
                           html.includes('background: #000');
      
      results.push({
        name: 'Dark Theme',
        status: hasDarkTheme ? 'passed' : 'failed',
        message: hasDarkTheme ? 'Dark theme styles detected' : 'No dark theme styles found'
      });

      // Test 9: Check for mobile viewport
      const viewport = doc.querySelector('meta[name="viewport"]');
      const viewportContent = viewport?.getAttribute('content') || '';
      
      results.push({
        name: 'Mobile Viewport',
        status: viewportContent.includes('width=device-width') ? 'passed' : 'failed',
        actual: viewportContent,
        message: viewportContent ? 'Viewport meta tag configured' : 'No viewport meta tag'
      });

      // Test 10: Check for business cards or content
      const hasBusinessCards = html.includes('business-card') || 
                              html.includes('BusinessCard') ||
                              html.includes('listing-card');
      
      results.push({
        name: 'Business Listings',
        status: hasBusinessCards ? 'passed' : 'warning',
        message: hasBusinessCards ? 'Business card components detected' : 'No business card components found'
      });

    } catch (error: any) {
      results.push({
        name: 'Page Load',
        status: 'failed',
        message: `Failed to load page: ${error.message}`
      });
    }

    setTestResults(prev => [{
      url,
      results,
      timestamp: new Date().toISOString()
    }, ...prev]);

    setIsLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);
    for (const url of testUrls) {
      await runTests(url);
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-400 bg-green-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✓';
      case 'failed': return '✗';
      case 'warning': return '⚠';
      default: return '?';
    }
  };

  const getSummary = (results: TestResult[]) => {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    
    return { passed, failed, warnings, total: results.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Directory Structure Test Suite
        </h1>

        {/* Test Controls */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setTestMode('manual')}
              className={`px-4 py-2 rounded ${testMode === 'manual' ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              Manual Test
            </button>
            <button
              onClick={() => setTestMode('auto')}
              className={`px-4 py-2 rounded ${testMode === 'auto' ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              Auto Test All
            </button>
          </div>

          {testMode === 'manual' ? (
            <div className="flex gap-4">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
                placeholder="Enter URL to test (e.g., /directory/medical-spas/tx)"
              />
              <button
                onClick={() => runTests(currentUrl)}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Run Test'}
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={runAllTests}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isLoading ? 'Running Tests...' : 'Run All Tests'}
              </button>
              <div className="mt-4 text-sm text-gray-400">
                Will test {testUrls.length} URLs automatically
              </div>
            </div>
          )}
        </div>

        {/* Quick Test URLs */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-8 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Test URLs:</h3>
          <div className="flex flex-wrap gap-2">
            {testUrls.map(url => (
              <button
                key={url}
                onClick={() => {
                  setCurrentUrl(url);
                  setTestMode('manual');
                  runTests(url);
                }}
                className="px-3 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600 transition-colors"
              >
                {url}
              </button>
            ))}
          </div>
        </div>

        {/* Test Results */}
        {testResults.map((pageTest, idx) => {
          const summary = getSummary(pageTest.results);
          
          return (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-purple-400">{pageTest.url}</h2>
                  <div className="text-sm text-gray-400">
                    Tested at {new Date(pageTest.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="px-3 py-1 rounded bg-green-400/10 text-green-400 text-sm">
                    {summary.passed} passed
                  </span>
                  {summary.failed > 0 && (
                    <span className="px-3 py-1 rounded bg-red-400/10 text-red-400 text-sm">
                      {summary.failed} failed
                    </span>
                  )}
                  {summary.warnings > 0 && (
                    <span className="px-3 py-1 rounded bg-yellow-400/10 text-yellow-400 text-sm">
                      {summary.warnings} warnings
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {pageTest.results.map((result, ridx) => (
                  <div key={ridx} className="bg-gray-900/50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(result.status)}`}>
                          {getStatusIcon(result.status)}
                        </span>
                        <span className="font-semibold">{result.name}</span>
                      </div>
                      <span className="text-sm text-gray-400">{result.message}</span>
                    </div>
                    {result.actual && (
                      <div className="mt-2 text-sm text-gray-500 font-mono truncate">
                        {typeof result.actual === 'object' 
                          ? JSON.stringify(result.actual, null, 2)
                          : result.actual
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {testResults.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-4">No test results yet</p>
            <p>Enter a URL above and click "Run Test" to start testing</p>
          </div>
        )}
      </div>
    </div>
  );
}