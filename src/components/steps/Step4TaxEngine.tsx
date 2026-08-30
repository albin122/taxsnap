import React from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  ArrowLeft,
  Sparkles,
  TrendingDown,
  Award,
  FileText,
} from 'lucide-react';
import type { EmployeeProfile, SalaryComponents, MonthlyDeductions, StatutoryDeductions } from '../../types/tax';
import { calculateNewRegimeTax, formatINR } from '../../utils/taxEngine';

interface Step4Props {
  profile: EmployeeProfile;
  salary: SalaryComponents;
  monthlyDeductions: MonthlyDeductions;
  statutoryDeductions: StatutoryDeductions;
  onSaveAndGenerate: () => void;
  onPrev: () => void;
  isSaving: boolean;
}

export const Step4TaxEngine: React.FC<Step4Props> = ({
  profile,
  salary,
  monthlyDeductions,
  statutoryDeductions,
  onSaveAndGenerate,
  onPrev,
  isSaving,
}) => {
  const taxResult = calculateNewRegimeTax(salary, monthlyDeductions, statutoryDeductions);

  const isRefundable = taxResult.netPayableOrRefund < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Step Title Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-teal-50 border border-teal-200 text-[#0d9488] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Live TY 2026–27 Tax Computation Engine
        </div>
        <h2 className="text-2xl font-bold text-[#191c1e]">Tax Summary & Slabs Breakdown</h2>
        <p className="text-xs text-slate-500">
          Official calculation output for employee {profile.name || 'Profile'} ({profile.pan || 'PAN'})
        </p>
      </div>

      {/* Top Highlight Banners */}
      {taxResult.taxableIncome <= 1200000 && taxResult.rebate87A > 0 && (
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 rounded-lg bg-teal-50 border border-teal-200 flex items-center gap-4 shadow-xs"
        >
          <div className="w-10 h-10 rounded bg-[#0d9488] text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0d9488]">
              ₹12 Lakh Zero Tax Benefit Applied! (Rebate u/s 156)
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">
              Net Taxable Income is <span className="font-mono font-semibold">{formatINR(taxResult.taxableIncome)}</span> (≤ ₹12,00,000). Tax of{' '}
              <span className="font-mono font-semibold text-[#0d9488]">{formatINR(taxResult.rebate87A)}</span> is completely offset by 156 rebate!
            </p>
          </div>
        </motion.div>
      )}

      {taxResult.marginalRelief > 0 && (
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-4 shadow-xs"
        >
          <div className="w-10 h-10 rounded bg-[#1e3a8a] text-white flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1e3a8a]">
              Marginal Relief u/s 156 Active!
            </h4>
            <p className="text-xs text-slate-700 mt-0.5">
              Your taxable income (<span className="font-mono">{formatINR(taxResult.taxableIncome)}</span>) is slightly above ₹12 Lakhs. Marginal relief of{' '}
              <span className="font-mono font-semibold text-[#1e3a8a]">{formatINR(taxResult.marginalRelief)}</span> is provided so tax doesn't exceed excess income.
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid of Computation KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Income */}
        <div className="stitch-card p-5 rounded-lg border border-slate-200 shadow-xs space-y-1 bg-white">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Gross Income
          </span>
          <span className="text-2xl font-bold text-[#191c1e] font-mono block">
            {formatINR(taxResult.grossIncome)}
          </span>
          <span className="text-[11px] text-slate-400 block">Total Annual Salary</span>
        </div>

        {/* Total Deductions */}
        <div className="stitch-card p-5 rounded-lg border border-slate-200 shadow-xs space-y-1 bg-white">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Allowable Deductions
          </span>
          <span className="text-2xl font-bold text-[#1e3a8a] font-mono block">
            - {formatINR(taxResult.totalDeductions)}
          </span>
          <span className="text-[11px] text-slate-400 block">
            Std. Ded ({formatINR(taxResult.standardDeduction)}) + Exemptions
          </span>
        </div>

        {/* Net Taxable Income */}
        <div className="stitch-card p-5 rounded-lg border border-slate-200 shadow-xs space-y-1 bg-white">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Net Taxable Income
          </span>
          <span className="text-2xl font-bold text-[#0d9488] font-mono block">
            {formatINR(taxResult.taxableIncome)}
          </span>
          <span className="text-[11px] text-slate-400 block">Basis for Slab Computation</span>
        </div>
      </div>

      {/* Main Tax Calculation Table & Slabs Visualizer */}
      <div className="stitch-card p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#1e3a8a]" />
            <h3 className="text-base font-bold text-[#191c1e]">Slab-wise Tax Computation Breakdown</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-[#1e3a8a]">
            TY 2026–27 Rates
          </span>
        </div>

        {/* Slab Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Income Slab Range</th>
                <th className="py-2.5 px-3 text-center">Tax Rate</th>
                <th className="py-2.5 px-3 text-right">Taxable in Slab</th>
                <th className="py-2.5 px-3 text-right">Tax Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {taxResult.slabsBreakdown.map((s, idx) => (
                <tr
                  key={idx}
                  className={s.taxableInSlab > 0 ? 'bg-blue-50/40 text-slate-900 font-semibold' : 'text-slate-400'}
                >
                  <td className="py-2.5 px-3">{s.slabLabel}</td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {s.ratePercent}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatINR(s.taxableInSlab)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatINR(s.taxAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Computation Summary List */}
        <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between py-1 text-slate-700">
            <span>Tax calculated as per Slabs:</span>
            <span className="font-mono font-semibold text-slate-900">{formatINR(taxResult.slabTax)}</span>
          </div>

          {taxResult.rebate87A > 0 && (
            <div className="flex justify-[#0d9488] justify-between py-1">
              <span>Less: Rebate u/s 156 (Max ₹60,000 for income ≤ ₹12L):</span>
              <span className="font-mono font-semibold">- {formatINR(taxResult.rebate87A)}</span>
            </div>
          )}

          {taxResult.marginalRelief > 0 && (
            <div className="flex justify-between py-1 text-[#1e3a8a]">
              <span>Less: Marginal Relief u/s 156:</span>
              <span className="font-mono font-semibold">- {formatINR(taxResult.marginalRelief)}</span>
            </div>
          )}

          {taxResult.reliefUs157 > 0 && (
            <div className="flex justify-between py-1 text-indigo-700">
              <span>Less: Relief u/s 89 / 157:</span>
              <span className="font-mono font-semibold">- {formatINR(taxResult.reliefUs157)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 text-slate-700 font-semibold border-t border-slate-200/60 pt-2">
            <span>Net Tax after Rebate / Marginal Relief u/s 156:</span>
            <span className="font-mono text-slate-900">{formatINR(taxResult.taxAfterRelief)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-700">
            <span>Add: Health & Education Cess @ 4% (on Net Tax after Relief):</span>
            <span className="font-mono font-semibold text-slate-900">{formatINR(taxResult.cess)}</span>
          </div>

          <div className="flex justify-between py-2 border-t border-b border-slate-200 text-sm font-bold text-slate-900">
            <span>Total Tax Liability for TY 2026–27:</span>
            <span className="font-mono text-[#0d9488] text-base">{formatINR(taxResult.totalTaxLiability)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Less: Annual TDS Already Deducted:</span>
            <span className="font-mono text-amber-700 font-semibold">
              - {formatINR(taxResult.annualTdsPaid)}
            </span>
          </div>

          <div
            className={`p-4 rounded flex items-center justify-between font-extrabold text-base mt-2 border ${
              isRefundable
                ? 'bg-teal-50 border-teal-200 text-[#0d9488]'
                : 'bg-blue-50 border-blue-200 text-[#1e3a8a]'
            }`}
          >
            <span>{isRefundable ? 'Net Refundable Amount:' : 'Net Tax Payable:'}</span>
            <span className="font-mono text-xl">
              {formatINR(Math.abs(taxResult.netPayableOrRefund))}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto px-6 py-2.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deductions</span>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={onSaveAndGenerate}
          className="w-full sm:w-auto px-8 py-3.5 rounded bg-[#1e3a8a] hover:bg-[#00236f] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
        >
          <FileText className="w-4 h-4" />
          <span>{isSaving ? 'Saving Statement...' : 'Save & Generate Statement'}</span>
        </button>
      </div>
    </motion.div>
  );
};
