import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Award,
  FileCheck,
  History,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onStartCalculator: () => void;
  onOpenHistory: () => void;
  savedCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCalculator,
  onOpenHistory,
  savedCount,
}) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-20 bg-[#f8fafc]">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1e3a8a] text-xs font-semibold uppercase tracking-wider shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
            Union Budget TY 2026–27 & AY 2027–28 Engine
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight"
          >
            Smart New Tax Regime <br className="hidden sm:block" />
            <span className="text-[#1e3a8a]">
              Income Tax Calculator & Generator
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Compute your exact income tax under the TY 2026–27 Slabs with institutional precision. Generate print-ready official tax statements with instant PDF export & Supabase cloud storage.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <button
              onClick={onStartCalculator}
              className="w-full sm:w-auto px-7 py-3 rounded bg-[#1e3a8a] text-white text-sm font-semibold shadow-sm hover:bg-blue-900 transition-all flex items-center justify-center gap-2 group"
            >
              Start Tax Computation (TY 2026–27)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenHistory}
              className="w-full sm:w-auto px-6 py-3 rounded bg-white border border-slate-300 text-slate-700 text-sm font-semibold shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>View Saved Statements ({savedCount})</span>
            </button>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="stitch-card p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e3a8a] mb-4">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1.5">₹12 Lakh Zero Tax Limit</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Full Rebate u/s 156 up to <span className="text-[#0d9488] font-semibold">₹60,000</span> for taxable income up to ₹12 Lakhs under the TY 2026–27 New Regime.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="stitch-card p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="w-10 h-10 rounded bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d9488] mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1.5">₹75,000 Standard Deduction 19(2)</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Increased default Standard Deduction from ₹50,000 to <span className="text-[#1e3a8a] font-semibold">₹75,000</span> for salaried employees and pensioners.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="stitch-card p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="w-10 h-10 rounded bg-[#f2f4f6] border border-slate-200 flex items-center justify-center text-slate-700 mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1.5">Official Tax Statement PDF</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Generate clean, formatted, government-grade Tax Computation Statements with digital seal & print readiness.
            </p>
          </motion.div>
        </div>

        {/* New Tax Slabs Table Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 stitch-card p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0d9488]" />
                <h2 className="text-lg font-bold text-[#191c1e]">TY 2026–27 New Regime Slabs & Rates</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assessment Year 2026–27 applicable rates for all Individual Taxpayers
              </p>
            </div>
            <div className="px-3 py-1 bg-teal-50 border border-teal-200 rounded text-[#0d9488] text-xs font-semibold self-start md:self-auto">
              Rebate 87A Applicable up to ₹12 Lakhs
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { slab: '₹0 to ₹4,00,000', rate: 'NIL (0%)', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900' },
              { slab: '₹4,00,001 to ₹8,00,000', rate: '5%', color: 'border-blue-200 bg-blue-50/50 text-blue-900' },
              { slab: '₹8,00,001 to ₹12,00,000', rate: '10%', color: 'border-teal-200 bg-teal-50/50 text-teal-900' },
              { slab: '₹12,00,001 to ₹16,00,000', rate: '15%', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900' },
              { slab: '₹16,00,001 to ₹20,00,000', rate: '20%', color: 'border-purple-200 bg-purple-50/50 text-purple-900' },
              { slab: '₹20,00,001 to ₹24,00,000', rate: '25%', color: 'border-violet-200 bg-violet-50/50 text-violet-900' },
              { slab: 'Above ₹24,00,000', rate: '30%', color: 'border-rose-200 bg-rose-50/50 text-rose-900' },
              { slab: 'Health & Edu Cess', rate: '4% on Tax', color: 'border-amber-200 bg-amber-50/50 text-amber-900' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded border ${item.color} flex flex-col justify-between`}
              >
                <span className="text-xs font-semibold text-slate-500">{item.slab}</span>
                <span className="text-lg font-bold mt-2 font-mono">{item.rate}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
