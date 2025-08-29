'use client';

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Users, MousePointer, DollarSign, Target, AlertCircle } from "lucide-react";

// --- Utility helpers ---
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const num = (v: any, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);
const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (v: number) => `${clamp(v, -1000, 1000).toFixed(1)}%`;

// CTR by position (industry averages)
const CTR_BY_POSITION: { [key: number]: number } = {
  1: 35,
  2: 17,
  3: 11,
  4: 8,
  5: 5,
  6: 4,
  7: 3,
  8: 2.5,
  9: 2,
  10: 1.5,
};

export default function LostRevenueCalculator({ currentRank = 7 }: { currentRank?: number }) {
  // --- Inputs ---
  const [monthlySearches, setMonthlySearches] = useState(1000); // monthly searches for your service
  const [conv, setConv] = useState(2.5); // % booking/lead rate
  const [aov, setAov] = useState(350); // avg revenue per customer
  const [targetRank, setTargetRank] = useState(1); // target position

  const metrics = useMemo(() => {
    const searches = clamp(num(monthlySearches), 0, 1e9);
    const convRate = clamp(num(conv), 0, 100);
    const revenue = clamp(num(aov), 0, 1e7);
    
    const curRank = clamp(num(currentRank), 1, 20);
    const tarRank = clamp(num(targetRank), 1, 10);
    
    // Current performance
    const currentCTR = CTR_BY_POSITION[curRank] || 0.5;
    const currentClicks = (searches * currentCTR) / 100;
    const currentCustomers = (currentClicks * convRate) / 100;
    const currentRevenue = currentCustomers * revenue;
    
    // Potential performance at target rank
    const targetCTR = CTR_BY_POSITION[tarRank] || 35;
    const targetClicks = (searches * targetCTR) / 100;
    const targetCustomers = (targetClicks * convRate) / 100;
    const targetRevenue = targetCustomers * revenue;
    
    // The opportunity
    const clicksGap = Math.max(0, targetClicks - currentClicks);
    const customersGap = Math.max(0, targetCustomers - currentCustomers);
    const revenueGap = Math.max(0, targetRevenue - currentRevenue);
    const multiplier = targetCTR / Math.max(currentCTR, 0.1);

    return {
      searches,
      convRate,
      revenue,
      curRank,
      tarRank,
      currentCTR,
      currentClicks,
      currentCustomers,
      currentRevenue,
      targetCTR,
      targetClicks,
      targetCustomers,
      targetRevenue,
      clicksGap,
      customersGap,
      revenueGap,
      multiplier,
    };
  }, [monthlySearches, conv, aov, currentRank, targetRank]);

  const chartData = [
    { name: `Position #${metrics.curRank}`, Clicks: Math.round(metrics.currentClicks), Revenue: Math.round(metrics.currentRevenue) },
    { name: `Position #${metrics.tarRank}`, Clicks: Math.round(metrics.targetClicks), Revenue: Math.round(metrics.targetRevenue) },
  ];

  // Position-specific messaging
  const getMessage = (rank: number) => {
    if (rank === 1) return "You're #1! Focus on defending your position.";
    if (rank === 2) return "You're just ONE position away from 2X more customers";
    if (rank === 3) return "The top 2 businesses get 52% of all clicks. You're close!";
    if (rank >= 4 && rank <= 7) return "You're invisible to 75% of searchers who never scroll past top 3";
    if (rank >= 8 && rank <= 10) return "87% of people never scroll this far. Break into the top 3!";
    if (rank > 10) return "You're on page 2+. That's 99% invisible to searchers.";
    return "Improve your ranking to capture more customers";
  };

  const Preset = ({ label, s, c, v }: any) => (
    <button
      onClick={() => {
        setMonthlySearches(s); setConv(c); setAov(v);
      }}
      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium transition-all"
    >
      {label}
    </button>
  );

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100 p-6 md:p-10 font-sans rounded-2xl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-400" />
              Visibility Gap Calculator
            </h2>
            <p className="text-slate-300 mt-2">
              See exactly what moving from <span className="font-bold text-yellow-400">#{metrics.curRank}</span> to{" "}
              <span className="font-bold text-green-400">#{metrics.tarRank}</span> means for your business
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Preset label="Local Service" s={1000} c={2.5} v={350} />
            <Preset label="High Volume" s={5000} c={1.5} v={200} />
            <Preset label="Premium" s={500} c={3.5} v={1200} />
          </div>
        </div>

        {/* Alert Message */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-200 font-semibold">{getMessage(metrics.curRank)}</p>
            {metrics.curRank > 1 && (
              <p className="text-amber-100/70 text-sm mt-1">
                The business at position #1 gets {metrics.multiplier.toFixed(1)}X more clicks than you do.
              </p>
            )}
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Inputs Card */}
          <section className="md:col-span-1 bg-slate-900/70 backdrop-blur rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-blue-400" />
              Your Market Data
            </h3>
            <div className="space-y-4">
              <Field 
                label="Monthly Search Volume" 
                value={monthlySearches} 
                onChange={setMonthlySearches} 
                suffix="searches"
                tooltip="How many people search for your service each month" 
              />
              <Field 
                label="Visitor → Customer Rate" 
                value={conv} 
                onChange={setConv} 
                suffix="%" 
                step={0.1}
                tooltip="What % of website visitors become customers" 
              />
              <Field 
                label="Average Customer Value" 
                value={aov} 
                onChange={setAov} 
                prefix="$"
                tooltip="How much revenue per customer on average" 
              />
              <Divider />
              <div className="space-y-2">
                <label className="block">
                  <div className="text-sm mb-1 text-slate-300 flex items-center gap-2">
                    Target Position
                    <span className="text-xs text-slate-500">(your goal)</span>
                  </div>
                  <select
                    value={targetRank}
                    onChange={(e) => setTargetRank(+e.target.value)}
                    className="w-full bg-slate-800/70 border border-white/10 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-sky-400/40"
                  >
                    {[1, 2, 3, 4, 5].map(r => (
                      <option key={r} value={r}>Position #{r} ({CTR_BY_POSITION[r]}% CTR)</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          {/* Current vs Potential Card */}
          <section className="md:col-span-1 bg-slate-900/70 backdrop-blur rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Your Opportunity
            </h3>
            
            <div className="space-y-4">
              {/* Current Performance */}
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Current (Position #{metrics.curRank})</div>
                <div className="space-y-2">
                  <Row label="Click Rate" value={`${metrics.currentCTR}%`} />
                  <Row label="Monthly Visitors" value={Math.round(metrics.currentClicks).toLocaleString()} />
                  <Row label="New Customers" value={Math.round(metrics.currentCustomers).toLocaleString()} />
                  <Row label="Monthly Revenue" value={fmt.format(metrics.currentRevenue)} bold />
                </div>
              </div>

              {/* Potential Performance */}
              <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                <div className="text-xs uppercase tracking-wide text-green-300 mb-2">Potential (Position #{metrics.tarRank})</div>
                <div className="space-y-2">
                  <Row label="Click Rate" value={`${metrics.targetCTR}%`} />
                  <Row label="Monthly Visitors" value={Math.round(metrics.targetClicks).toLocaleString()} />
                  <Row label="New Customers" value={Math.round(metrics.targetCustomers).toLocaleString()} />
                  <Row label="Monthly Revenue" value={fmt.format(metrics.targetRevenue)} bold />
                </div>
              </div>

              {/* The Gap */}
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.4 }}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-300/20"
              >
                <div className="text-xs uppercase tracking-wide text-purple-200/90 mb-1">Your Opportunity</div>
                <div className="text-2xl font-extrabold text-purple-200">
                  +{Math.round(metrics.customersGap)} customers
                </div>
                <div className="text-lg font-bold text-purple-100/90 mt-1">
                  {fmt.format(metrics.revenueGap)}<span className="text-sm font-normal"> / month</span>
                </div>
                <div className="text-sm text-purple-100/70 mt-2">
                  That's {fmt.format(metrics.revenueGap * 12)} per year
                </div>
              </motion.div>
            </div>
          </section>

          {/* Visual Chart Card */}
          <section className="md:col-span-1 bg-slate-900/70 backdrop-blur rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Visual Comparison
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#cbd5e1" tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#cbd5e1" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <Tooltip 
                    formatter={(v: any, name: string) => [
                      name === 'Clicks' ? `${v} visitors` : fmt.format(v),
                      name
                    ]} 
                    contentStyle={{ 
                      background: "#0f172a", 
                      border: "1px solid #1f2937", 
                      borderRadius: "12px", 
                      color: "#e2e8f0" 
                    }} 
                  />
                  <Bar dataKey="Clicks" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Quick Facts:</h4>
              <ul className="text-sm text-slate-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Top 3 positions get <span className="font-semibold text-green-400">63%</span> of all clicks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Position #4-10 share just <span className="font-semibold text-yellow-400">29%</span> of clicks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Page 2+ gets less than <span className="font-semibold text-red-400">8%</span> of traffic</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Bottom CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl border border-purple-500/20 text-center"
        >
          <h3 className="text-xl font-bold mb-2">
            Ready to Capture Those {Math.round(metrics.customersGap)} Missing Customers?
          </h3>
          <p className="text-slate-300 mb-4">
            Moving from position #{metrics.curRank} to #{metrics.tarRank} would generate an additional{" "}
            <span className="font-bold text-green-400">{fmt.format(metrics.revenueGap * 12)}</span> per year
          </p>
        </motion.div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  tooltip?: string;
}

function Field({ label, value, onChange, prefix, suffix, step = 1, tooltip }: FieldProps) {
  return (
    <label className="block group">
      <div className="text-sm mb-1 text-slate-300 flex items-center gap-2">
        {label}
        {tooltip && (
          <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            ({tooltip})
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 bg-slate-800/70 border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-400/40 transition-colors">
        {prefix && <span className="text-slate-400">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
          className="w-full bg-transparent outline-none text-slate-100"
        />
        {suffix && <span className="text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
}

function Row({ label, value, bold }: RowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className={bold ? "font-semibold text-white" : "text-slate-100"}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}