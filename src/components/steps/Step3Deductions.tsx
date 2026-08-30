import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Info,
  FileCheck,
} from 'lucide-react';
import type { MonthlyDeductions, StatutoryDeductions } from '../../types/tax';
import { formatINR } from '../../utils/taxEngine';

interface Step3Props {
  monthlyDeductions: MonthlyDeductions;
  statutoryDeductions: StatutoryDeductions;
  onChangeMonthly: (deductions: MonthlyDeductions) => void;
  onChangeStatutory: (deductions: StatutoryDeductions) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3Deductions: React.FC<Step3Props> = ({
  monthlyDeductions,
  statutoryDeductions,
  onChangeMonthly,
  onChangeStatutory,
  onNext,
  onPrev,
}) => {
  const handleMonthlyChange = (field: keyof MonthlyDeductions, value: number) => {
    onChangeMonthly({
      ...monthlyDeductions,
      [field]: Math.max(0, isNaN(value) ? 0 : value),
    });
  };

  const handleStatutoryChange = (field: keyof StatutoryDeductions, value: any) => {
    onChangeStatutory({
      ...statutoryDeductions,
      [field]: value,
    });
  };

  const currentStandardDeductionAmount =
    statutoryDeductions.standardDeductionType === 'standard_75' ? 75000 : 50000;

  const totalAllowableDeductions =
    currentStandardDeductionAmount +
    (statutoryDeductions.dcrgExempt || 0) +
    (statutoryDeductions.commutationPensionExempt || 0) +
    (statutoryDeductions.otherExemptions || 0);

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
        <h2 className="text-2xl font-bold text-[#191c1e]">Monthly Deductions & Statutory Exemptions</h2>
        <p className="text-xs text-slate-500">
          Specify monthly deductions and allowable statutory exemptions for TY 2026–27
        </p>
      </div>

      <div className="max-w-2xl mx-auto stitch-card p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <FileCheck className="w-5 h-5 text-[#0d9488]" />
          <h3 className="font-bold text-[#191c1e] text-sm">New Regime Allowable Deductions &amp; Exemptions</h3>
        </div>

        {/* 1. Standard Deduction 19(2) */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Standard Deduction 19(2)
          </label>
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold font-mono text-[#1e3a8a]">₹75,000</span>
              <span className="text-xs text-slate-500">Standard Deduction u/s 19(2) (New Tax Regime)</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
              Applied
            </span>
          </div>
        </div>

        {/* 2 & 3. DCRG u/s 19(3) & Commutation u/s 19(7) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              DCRG u/s 19(3)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={statutoryDeductions.dcrgExempt || ''}
                onChange={(e) => handleStatutoryChange('dcrgExempt', parseFloat(e.target.value))}
                className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Commutation u/s 19(7)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={statutoryDeductions.commutationPensionExempt || ''}
                onChange={(e) =>
                  handleStatutoryChange('commutationPensionExempt', parseFloat(e.target.value))
                }
                className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* 4. Relief u/s 157 */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Relief u/s 157
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={statutoryDeductions.reliefUs157 || ''}
              onChange={(e) => handleStatutoryChange('reliefUs157', parseFloat(e.target.value))}
              className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono"
            />
          </div>
        </div>

        {/* 5. Tax Already Paid / Deducted (TDS) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Tax Already Paid / Deducted (TDS)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-700 text-xs font-bold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={monthlyDeductions.tdsMonthly || ''}
              onChange={(e) => handleMonthlyChange('tdsMonthly', parseFloat(e.target.value))}
              className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-bold text-slate-900 bg-amber-50/50 border-amber-200"
            />
          </div>
        </div>

        <div className="p-3 rounded bg-blue-50 border border-blue-200 text-[11px] text-[#1e3a8a] flex items-start gap-2">
          <Info className="w-4 h-4 text-[#1e3a8a] shrink-0 mt-0.5" />
          <span>
            Total Allowable Statutory Deductions:{' '}
            <strong className="font-mono text-slate-900">{formatINR(totalAllowableDeductions)}</strong> under the New Regime.
          </span>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-2.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded bg-[#1e3a8a] hover:bg-[#00236f] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors uppercase tracking-wider"
        >
          <span>Calculate Tax Summary</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
