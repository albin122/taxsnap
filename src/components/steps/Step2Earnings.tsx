import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { SalaryComponents } from '../../types/tax';
import { calculateGrossSalary, formatINR } from '../../utils/taxEngine';

interface Step2Props {
  salary: SalaryComponents;
  onChange: (salary: SalaryComponents) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2Earnings: React.FC<Step2Props> = ({ salary, onChange, onNext, onPrev }) => {
  const grossSalary = calculateGrossSalary(salary);

  const handleToggleAutoAnnualize = () => {
    const nextAuto = !salary.isAutoAnnualize;
    if (nextAuto) {
      onChange({
        ...salary,
        isAutoAnnualize: true,
        basicAnnual: salary.basicMonthly * 12,
        daAnnual: salary.daMonthly * 12,
        hraAnnual: salary.hraMonthly * 12,
        otherAnnual: salary.otherMonthly * 12,
        arrearsAnnual: (salary.arrearsMonthly || 0) * 12,
        payRevisionArrearsAnnual: (salary.payRevisionArrearsMonthly || 0) * 12,
        festivalAllowanceAnnual: (salary.festivalAllowanceMonthly || 0) * 12,
        bonusAnnual: (salary.bonusMonthly || 0) * 12,
      });
    } else {
      onChange({
        ...salary,
        isAutoAnnualize: false,
      });
    }
  };

  const handleFieldChange = (field: keyof SalaryComponents, value: number) => {
    const numVal = Math.max(0, isNaN(value) ? 0 : value);
    const updated = { ...salary, [field]: numVal };

    if (updated.isAutoAnnualize) {
      if (field === 'basicMonthly') updated.basicAnnual = numVal * 12;
      if (field === 'daMonthly') updated.daAnnual = numVal * 12;
      if (field === 'hraMonthly') updated.hraAnnual = numVal * 12;
      if (field === 'otherMonthly') updated.otherAnnual = numVal * 12;
      if (field === 'arrearsMonthly') updated.arrearsAnnual = numVal * 12;
      if (field === 'payRevisionArrearsMonthly') updated.payRevisionArrearsAnnual = numVal * 12;
      if (field === 'festivalAllowanceMonthly') updated.festivalAllowanceAnnual = numVal * 12;
      if (field === 'bonusMonthly') updated.bonusAnnual = numVal * 12;
    }

    onChange(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Title Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold text-[#191c1e]">Monthly & Annual Salary Earnings</h2>
        <p className="text-xs text-slate-500">
          Specify March 2026 salary components to compute annual gross salary
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inputs Form */}
        <div className="lg:col-span-2 stitch-card p-6 rounded-lg border border-slate-200 shadow-sm space-y-6 bg-white">
          {/* Annualization Toggle Header */}
          <div className="flex items-center justify-between p-4 rounded bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-[#191c1e] uppercase tracking-wider block">
                Calculation Mode
              </span>
              <span className="text-xs text-slate-500">
                {salary.isAutoAnnualize
                  ? 'Auto-Annualize (Monthly Pay × 12 Months)'
                  : 'Manual Custom Annual Override'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoAnnualize}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                salary.isAutoAnnualize
                  ? 'bg-teal-50 text-[#0d9488] border border-teal-200'
                  : 'bg-blue-50 text-[#1e3a8a] border border-blue-200'
              }`}
            >
              {salary.isAutoAnnualize ? (
                <>
                  <ToggleRight className="w-4 h-4 text-[#0d9488]" />
                  <span>Auto (×12)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-[#1e3a8a]" />
                  <span>Manual</span>
                </>
              )}
            </button>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            {/* Basic Pay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  March 2026 Basic Pay (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.basicMonthly || ''}
                    onChange={(e) => handleFieldChange('basicMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual Basic Pay
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.basicAnnual || ''}
                    onChange={(e) => handleFieldChange('basicAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Dearness Allowance (DA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dearness Allowance (DA Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.daMonthly || ''}
                    onChange={(e) => handleFieldChange('daMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual DA Total
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.daAnnual || ''}
                    onChange={(e) => handleFieldChange('daAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* House Rent Allowance (HRA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  House Rent Allowance (HRA Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.hraMonthly || ''}
                    onChange={(e) => handleFieldChange('hraMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual HRA Total
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.hraAnnual || ''}
                    onChange={(e) => handleFieldChange('hraAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Other Allowances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Other Allowances (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.otherMonthly || ''}
                    onChange={(e) => handleFieldChange('otherMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Annual Other Allowances
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.otherAnnual || ''}
                    onChange={(e) => handleFieldChange('otherAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Arrears */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1.5">
                  Arrears (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.arrearsMonthly || ''}
                    onChange={(e) => handleFieldChange('arrearsMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium border-amber-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1.5">
                  Annual Arrears Total
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.arrearsAnnual || ''}
                    onChange={(e) => handleFieldChange('arrearsAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Pay Revision Arrears */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-purple-800 uppercase tracking-wider mb-1.5">
                  Pay Revision Arrears (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.payRevisionArrearsMonthly || ''}
                    onChange={(e) => handleFieldChange('payRevisionArrearsMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium border-purple-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-purple-800 uppercase tracking-wider mb-1.5">
                  Annual Pay Revision Arrears
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.payRevisionArrearsAnnual || ''}
                    onChange={(e) => handleFieldChange('payRevisionArrearsAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Festival Allowance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
                  Festival Allowance (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.festivalAllowanceMonthly || ''}
                    onChange={(e) => handleFieldChange('festivalAllowanceMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium border-emerald-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
                  Annual Festival Allowance
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.festivalAllowanceAnnual || ''}
                    onChange={(e) => handleFieldChange('festivalAllowanceAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Bonus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">
                  Bonus (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={salary.bonusMonthly || ''}
                    onChange={(e) => handleFieldChange('bonusMonthly', parseFloat(e.target.value))}
                    className="stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium border-blue-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">
                  Annual Bonus Total
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    disabled={salary.isAutoAnnualize}
                    min="0"
                    value={salary.bonusAnnual || ''}
                    onChange={(e) => handleFieldChange('bonusAnnual', parseFloat(e.target.value))}
                    className={`stitch-input w-full pl-7 pr-3 py-2 rounded text-xs font-mono font-medium ${
                      salary.isAutoAnnualize ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Summary Card */}
        <div className="space-y-4">
          <div className="stitch-card p-6 rounded-lg border border-slate-200 bg-[#f8fafc] space-y-5">
            <div className="flex items-center gap-2 text-[#1e3a8a]">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold text-[#191c1e] text-sm">Gross Salary Real-time Preview</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded bg-blue-50 border border-blue-100 text-center">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider block">
                  Gross Annual Salary
                </span>
                <span className="text-2xl font-extrabold text-[#1e3a8a] mt-1 block font-mono">
                  {formatINR(grossSalary)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Basic Pay (Annual):</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? salary.basicMonthly * 12 : salary.basicAnnual)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>DA (Annual):</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? salary.daMonthly * 12 : salary.daAnnual)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>HRA (Annual):</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? salary.hraMonthly * 12 : salary.hraAnnual)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Other Allowances:</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? salary.otherMonthly * 12 : salary.otherAnnual)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Arrears:</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? (salary.arrearsMonthly || 0) * 12 : salary.arrearsAnnual || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Pay Revision Arrears:</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? (salary.payRevisionArrearsMonthly || 0) * 12 : salary.payRevisionArrearsAnnual || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Festival Allowance:</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? (salary.festivalAllowanceMonthly || 0) * 12 : salary.festivalAllowanceAnnual || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Bonus:</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {formatINR(salary.isAutoAnnualize ? (salary.bonusMonthly || 0) * 12 : salary.bonusAnnual || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-teal-50 border border-teal-200 text-[11px] text-teal-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
              <span>
                Under the New Regime (TY 2026–27), HRA is part of taxable income. Standard Deduction of ₹75,000 will be applied in the next step.
              </span>
            </div>
          </div>
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
          <span>Next: Deductions</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
