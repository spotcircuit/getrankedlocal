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

// --- Utility helpers ---
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const num = (v: any, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);
const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (v: number) => `${clamp(v, -1000, 1000).toFixed(1)}%`;

export default function LostRevenueCalculator() {
  // --- Inputs (with med-spa friendly defaults) ---
  const [sessions, setSessions] = useState(2500); // monthly visitors searching for your services
  const [conv, setConv] = useState(2.2); // % booking/lead rate
  const [aov, setAov] = useState(350); // avg revenue per visit (realistic for med spas)
  const [trafficUplift, setTrafficUplift] = useState(45); // % more traffic from ranking #1 vs #7
  const [convUplift, setConvUplift] = useState(25); // % better conversion from trust/reviews
  const [grossMargin, setGrossMargin] = useState(60); // % typical med spa margin

  const metrics = useMemo(() => {
    const s = clamp(num(sessions), 0, 1e9);
    const c = clamp(num(conv), 0, 100);
    const v = clamp(num(aov), 0, 1e7);
    const tUp = clamp(num(trafficUplift), -100, 1000); // allow negatives for reality checks
    const cUp = clamp(num(convUplift), -100, 1000);
    const margin = clamp(num(grossMargin), 0, 100) / 100;

    const currentConversions = (s * c) / 100;
    const currentRevenue = currentConversions * v;

    const potentialSessions = s * (1 + tUp / 100);
    const potentialConvRate = clamp(c * (1 + cUp / 100), 0, 100);
    const potentialConversions = (potentialSessions * potentialConvRate) / 100;
    const potentialRevenue = potentialConversions * v;

    const monthlyDelta = Math.max(0, potentialRevenue - currentRevenue);
    const annualDelta = monthlyDelta * 12;
    const maxMonthlySpend = monthlyDelta * margin; // what you can spend and still break even on gross profit

    return {
      s,
      c,
      v,
      tUp,
      cUp,
      currentConversions,
      currentRevenue,
      potentialSessions,
      potentialConvRate,
      potentialConversions,
      potentialRevenue,
      monthlyDelta,
      annualDelta,
      maxMonthlySpend,
      margin,
    };
  }, [sessions, conv, aov, trafficUplift, convUplift, grossMargin]);

  const chartData = [
    { name: "Current", Revenue: Math.round(metrics.currentRevenue) },
    { name: "Potential", Revenue: Math.round(metrics.potentialRevenue) },
  ];

  const Preset = ({ label, s, c, v, t, cu }: any) => (
    <button
      onClick={() => {
        setSessions(s); setConv(c); setAov(v); setTrafficUplift(t); setConvUplift(cu);
      }}
      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium"
    >
      {label}
    </button>
  );

  return (
    <div className="w-full bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Calculate Your Lost Revenue</h2>
            <p className="text-slate-300 mt-1">See the <span className="font-semibold">money left on the table</span> from poor rankings and low conversion.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Preset label="Med Spa Average" s={2500} c={2.2} v={350} t={45} cu={25} />
            <Preset label="Hair Salon" s={1800} c={3.5} v={85} t={40} cu={20} />
            <Preset label="Dental Practice" s={3000} c={2.8} v={450} t={50} cu={30} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Inputs Card */}
          <section className="md:col-span-1 bg-slate-900/70 rounded-2xl border border-white/10 p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Your Current Metrics</h3>
            <div className="space-y-4">
              <Field label="Monthly Visitors" value={sessions} onChange={setSessions} suffix="visits" />
              <Field label="Current Conversion Rate" value={conv} onChange={setConv} suffix="%" step={0.1} />
              <Field label="Avg Revenue per Conversion" value={aov} onChange={setAov} prefix="$" />
              <Divider />
              <Field label="Traffic Uplift (from SEO)" value={trafficUplift} onChange={setTrafficUplift} suffix="%" step={1} />
              <Field label="Conversion Uplift (from CRO/UX)" value={convUplift} onChange={setConvUplift} suffix="%" step={1} />
              <Field label="Gross Margin" value={grossMargin} onChange={setGrossMargin} suffix="%" step={1} />
            </div>
            <p className="text-xs text-slate-400 mt-4">Tip: Ranking #1 typically increases traffic by 35-50% and better UX/reviews boost conversion 15-40%.</p>
          </section>

          {/* Summary Card */}
          <section className="md:col-span-1 bg-slate-900/70 rounded-2xl border border-white/10 p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Impact Analysis</h3>
            <div className="space-y-3">
              <Row label="Current conversions" value={metrics.currentConversions.toLocaleString()} />
              <Row label="Current monthly revenue" value={fmt.format(metrics.currentRevenue)} bold />
              <Divider />
              <Row label="Potential conversions" value={metrics.potentialConversions.toLocaleString()} />
              <Row label="Potential monthly revenue" value={fmt.format(metrics.potentialRevenue)} bold />
            </div>

            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="mt-5 p-4 rounded-xl bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-rose-400/15 border border-rose-300/20">
              <div className="text-sm uppercase tracking-wide text-rose-200/90">You're Losing</div>
              <div className="text-3xl font-extrabold text-rose-200">{fmt.format(metrics.monthlyDelta)}<span className="text-base font-semibold text-rose-100/80"> / mo</span></div>
              <div className="text-sm text-rose-100/80">≈ {fmt.format(metrics.annualDelta)} per year</div>
            </motion.div>

            <div className="mt-4 text-sm text-slate-300">
              <span className="font-semibold">ROI potential:</span> {fmt.format(metrics.maxMonthlySpend)} <span className="text-slate-400">/ mo at {pct(metrics.margin * 100)} margin</span>
            </div>
          </section>

          {/* Chart Card */}
          <section className="md:col-span-1 bg-slate-900/70 rounded-2xl border border-white/10 p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Revenue Comparison</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#cbd5e1" tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#cbd5e1" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <Tooltip formatter={(v: any) => fmt.format(v)} contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: "12px", color: "#e2e8f0" }} />
                  <Bar dataKey="Revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>Traffic ↑ by {pct(trafficUplift)} from better rankings</li>
              <li>Conversion ↑ by {pct(convUplift)} from optimization</li>
              <li>Based on your actual market potential</li>
            </ul>
          </section>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-slate-500 text-center">These calculations are based on industry averages and your specific inputs. Real results achieved for 500+ businesses.</p>
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
}

function Field({ label, value, onChange, prefix, suffix, step = 1 }: FieldProps) {
  return (
    <label className="block">
      <div className="text-sm mb-1 text-slate-300">{label}</div>
      <div className="flex items-center gap-2 bg-slate-800/70 border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-400/40">
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
      <div className="text-slate-300 text-sm">{label}</div>
      <div className={bold ? "font-semibold" : "text-slate-100"}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}