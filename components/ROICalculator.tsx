'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Users, ArrowUp, Info } from 'lucide-react';

interface ROICalculatorProps {
  currentRank?: number;
  niche?: string;
  embedded?: boolean;
}

export default function ROICalculator({ 
  currentRank = 7, 
  niche = 'med spa',
  embedded = false 
}: ROICalculatorProps) {
  // Industry-specific defaults
  const getIndustryDefaults = () => {
    switch(niche.toLowerCase()) {
      case 'med spa':
      case 'med spas':
        return { avgValue: 1500, conversionRate: 0.25, callsPerPosition: 12 };
      case 'dental':
      case 'dentist':
        return { avgValue: 2000, conversionRate: 0.30, callsPerPosition: 10 };
      case 'law firm':
      case 'lawyer':
        return { avgValue: 5000, conversionRate: 0.20, callsPerPosition: 8 };
      case 'home services':
        return { avgValue: 500, conversionRate: 0.35, callsPerPosition: 15 };
      default:
        return { avgValue: 1000, conversionRate: 0.25, callsPerPosition: 10 };
    }
  };

  const defaults = getIndustryDefaults();
  
  const [customerValue, setCustomerValue] = useState(defaults.avgValue);
  const [targetRank, setTargetRank] = useState(1);
  const [investmentAmount, setInvestmentAmount] = useState(1997);

  // Calculate metrics based on rank
  const calculateMetrics = () => {
    const positionImpact = {
      1: { callMultiplier: 3.0, clickShare: 0.35 },
      2: { callMultiplier: 2.2, clickShare: 0.25 },
      3: { callMultiplier: 1.8, clickShare: 0.18 },
      4: { callMultiplier: 1.3, clickShare: 0.08 },
      5: { callMultiplier: 1.0, clickShare: 0.05 },
      6: { callMultiplier: 0.7, clickShare: 0.03 },
      7: { callMultiplier: 0.5, clickShare: 0.02 },
      8: { callMultiplier: 0.3, clickShare: 0.015 },
      9: { callMultiplier: 0.2, clickShare: 0.01 },
      10: { callMultiplier: 0.1, clickShare: 0.005 }
    };

    const currentMetrics = positionImpact[Math.min(currentRank, 10)] || { callMultiplier: 0.05, clickShare: 0.002 };
    const targetMetrics = positionImpact[targetRank] || positionImpact[1];

    const baseMonthlySearches = 1000; // Conservative estimate
    const currentCalls = Math.round(baseMonthlySearches * currentMetrics.clickShare * 0.4); // 40% call rate
    const targetCalls = Math.round(baseMonthlySearches * targetMetrics.clickShare * 0.4);
    const additionalCalls = targetCalls - currentCalls;

    const currentCustomers = Math.round(currentCalls * defaults.conversionRate);
    const targetCustomers = Math.round(targetCalls * defaults.conversionRate);
    const additionalCustomers = targetCustomers - currentCustomers;

    const currentRevenue = currentCustomers * customerValue;
    const targetRevenue = targetCustomers * customerValue;
    const additionalRevenue = targetRevenue - currentRevenue;

    const annualRevenue = additionalRevenue * 12;
    const annualInvestment = investmentAmount * 12;
    const annualProfit = annualRevenue - annualInvestment;
    const roi = ((annualProfit / annualInvestment) * 100).toFixed(0);

    return {
      currentCalls,
      targetCalls,
      additionalCalls,
      currentCustomers,
      targetCustomers,
      additionalCustomers,
      currentRevenue,
      targetRevenue,
      additionalRevenue,
      annualRevenue,
      annualProfit,
      roi: parseInt(roi)
    };
  };

  const metrics = calculateMetrics();

  if (embedded) {
    // Simplified embedded version
    return (
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-400" />
          Your Potential ROI at #{targetRank}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-400">+{metrics.additionalCalls}</p>
            <p className="text-sm text-gray-400">More Calls/Mo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">+{metrics.additionalCustomers}</p>
            <p className="text-sm text-gray-400">New Customers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{metrics.roi}%</p>
            <p className="text-sm text-gray-400">Annual ROI</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-center">
            <span className="text-gray-400">Monthly Revenue Increase: </span>
            <span className="text-2xl font-bold text-green-400">
              +${metrics.additionalRevenue.toLocaleString()}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Full calculator version
  return (
    <section className="py-16 px-6 bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Calculate Your <span className="text-green-400">Revenue Potential</span>
          </h2>
          <p className="text-xl text-gray-300">
            See exactly how much revenue you're leaving on the table
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
        >
          {/* Input Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Average Customer Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={customerValue}
                  onChange={(e) => setCustomerValue(parseInt(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Lifetime value per customer</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Rank Position
              </label>
              <select
                value={targetRank}
                onChange={(e) => setTargetRank(parseInt(e.target.value))}
                className="w-full px-3 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value={1}>#1 - Top Position</option>
                <option value={2}>#2 - Second Place</option>
                <option value={3}>#3 - Third Place</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Where you want to rank</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monthly Investment
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseInt(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Your marketing budget</p>
            </div>
          </div>

          {/* Current vs Target Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Current Position (#{currentRank})</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Calls</span>
                  <span className="text-white font-bold">{metrics.currentCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Customers</span>
                  <span className="text-white font-bold">{metrics.currentCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Revenue</span>
                  <span className="text-white font-bold">${metrics.currentRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Target Position (#{targetRank})</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Calls</span>
                  <span className="text-white font-bold">{metrics.targetCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Customers</span>
                  <span className="text-white font-bold">{metrics.targetCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Revenue</span>
                  <span className="text-white font-bold">${metrics.targetRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Results */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 text-center border-2 border-purple-500/50">
            <h3 className="text-2xl font-bold text-white mb-6">Your Potential Return</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-blue-400">+{metrics.additionalCalls}</p>
                <p className="text-sm text-gray-400">Calls/Month</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-purple-400">+{metrics.additionalCustomers}</p>
                <p className="text-sm text-gray-400">Customers/Mo</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">
                  +${metrics.additionalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Revenue/Month</p>
              </div>
              
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <ArrowUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-yellow-400">{metrics.roi}%</p>
                <p className="text-sm text-gray-400">Annual ROI</p>
              </div>
            </div>

            <div className="pt-6 border-t border-purple-700">
              <p className="text-gray-400 mb-2">12-Month Net Profit:</p>
              <p className="text-5xl font-bold text-green-400">
                ${metrics.annualProfit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">How we calculate this:</p>
                <p>Based on Google's click distribution data, position #{targetRank} receives approximately {(positionImpact[targetRank].clickShare * 100).toFixed(1)}% of all clicks. 
                With an average conversion rate of {(defaults.conversionRate * 100).toFixed(0)}% for {niche}, 
                moving from position #{currentRank} to #{targetRank} will generate {metrics.additionalCalls} more calls per month.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const positionImpact = {
    1: { callMultiplier: 3.0, clickShare: 0.35 },
    2: { callMultiplier: 2.2, clickShare: 0.25 },
    3: { callMultiplier: 1.8, clickShare: 0.18 },
    4: { callMultiplier: 1.3, clickShare: 0.08 },
    5: { callMultiplier: 1.0, clickShare: 0.05 },
    6: { callMultiplier: 0.7, clickShare: 0.03 },
    7: { callMultiplier: 0.5, clickShare: 0.02 },
    8: { callMultiplier: 0.3, clickShare: 0.015 },
    9: { callMultiplier: 0.2, clickShare: 0.01 },
    10: { callMultiplier: 0.1, clickShare: 0.005 }
  };
}