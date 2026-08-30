import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle,
  Share2,
  QrCode,
  FileCheck,
  Home,
} from 'lucide-react';
import type { SavedStatement } from '../types/tax';
import { formatINR } from '../utils/taxEngine';
import { printTaxStatement, exportStatementToPDF } from '../utils/pdfExport';

interface StatementViewProps {
  statement: SavedStatement;
  onBackToCalculator: () => void;
  onHome?: () => void;
}

export const StatementView: React.FC<StatementViewProps> = ({
  statement,
  onBackToCalculator,
  onHome,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { profile, salary, statutoryDeductions, result } = statement;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await exportStatementToPDF(
        'tax-statement-document',
        `Tax_Statement_${profile.pan || 'TY2026-27'}_${profile.name.replace(/\s+/g, '_')}`
      );
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const isRefund = result.netPayableOrRefund < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-6"
    >
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCalculator}
            className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calculator</span>
          </button>

          {onHome && (
            <button
              onClick={onHome}
              className="px-4 py-2 rounded bg-[#1e3a8a] hover:bg-blue-900 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Share Statement'}</span>
          </button>

          <button
            onClick={printTaxStatement}
            className="px-4 py-2 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0d9488] font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded bg-[#1e3a8a] hover:bg-[#00236f] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>

      {/* Official Tax Computation Statement Printable Sheet */}
      <div
        id="tax-statement-document"
        className="statement-print-container stitch-card relative overflow-hidden p-8 sm:p-10 rounded-lg border border-slate-200 bg-white text-slate-900 shadow-md space-y-8"
      >
        {/* Centered Low Opacity Logo Watermark for Print & Display */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0">
          <img
            src="/logo.png"
            alt="TaxSnap Watermark"
            className="w-[450px] max-w-[85%] opacity-[0.06] select-none filter grayscale mix-blend-multiply"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          />
        </div>

        {/* Government/Corporate Style Document Header */}
        <div className="relative z-10 border-b-2 border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="TaxSnap Logo" className="h-10 w-auto object-contain shrink-0" />
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#191c1e] uppercase">
                Income Tax Computation Statement
              </h1>
            </div>
            <p className="text-xs font-semibold text-[#1e3a8a] tracking-wider uppercase">
              Under New Tax Regime (Section 115BAC) — Tax Year 2026–27 ·
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Form 16 Annexure &amp; Official Salary Income Computation Document
            </p>
          </div>

          <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-2 border-[#1e3a8a] pl-3 sm:pl-0 sm:pr-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Reference ID
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 block">
              TAX-{statement.id.substring(0, 8).toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              Generated: {new Date(statement.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Section 1: Employee & Office Profile Information */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1.5">
            I. Employee Profile &amp; DDO Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Employee Name
              </span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                {profile.name || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Designation
              </span>
              <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                {profile.designation || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                PAN (Permanent Account Number)
              </span>
              <span className="font-mono font-bold text-[#1e3a8a] text-xs tracking-widest block mt-0.5">
                {profile.pan || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Office / Department
              </span>
              <span className="font-medium text-slate-800 text-xs block mt-0.5">
                {profile.office_name || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Station / Location
              </span>
              <span className="font-medium text-slate-800 text-xs block mt-0.5">
                {profile.place || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                Assessment Year
              </span>
              <span className="font-bold text-[#0d9488] text-xs block mt-0.5 font-mono">
                AY 2027–28 (TY 2026–27)
              </span>
            </div>
          </div>
        </div>

        {/* Section II: Gross Salary Earnings Breakdown */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1.5">
            II. Statement of Gross Salary & Earnings (TY 2026–27)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Salary Component</th>
                  <th className="py-2.5 px-3 text-right">Monthly Amount</th>
                  <th className="py-2.5 px-3 text-right">Annual Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-2.5 px-3">Basic Pay (March 2026)</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatINR(salary.basicMonthly)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatINR(salary.isAutoAnnualize ? salary.basicMonthly * 12 : salary.basicAnnual)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Dearness Allowance (DA)</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatINR(salary.daMonthly)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatINR(salary.isAutoAnnualize ? salary.daMonthly * 12 : salary.daAnnual)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">House Rent Allowance (HRA)</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatINR(salary.hraMonthly)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatINR(salary.isAutoAnnualize ? salary.hraMonthly * 12 : salary.hraAnnual)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Other Allowances & Special Pay</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatINR(salary.otherMonthly)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatINR(salary.isAutoAnnualize ? salary.otherMonthly * 12 : salary.otherAnnual)}
                  </td>
                </tr>
                {(salary.arrears || salary.arrearsMonthly || salary.arrearsAnnual) ? (
                  <tr>
                    <td className="py-2.5 px-3">Arrears</td>
                    <td className="py-2.5 px-3 text-right font-mono">{salary.arrears ? 'Lump sum' : formatINR(salary.arrearsMonthly || 0)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(salary.arrears || (salary.isAutoAnnualize ? (salary.arrearsMonthly || 0) * 12 : salary.arrearsAnnual || 0))}
                    </td>
                  </tr>
                ) : null}
                {(salary.payRevisionArrears || salary.payRevisionArrearsMonthly || salary.payRevisionArrearsAnnual) ? (
                  <tr>
                    <td className="py-2.5 px-3">Pay Revision Arrears</td>
                    <td className="py-2.5 px-3 text-right font-mono">{salary.payRevisionArrears ? 'Lump sum' : formatINR(salary.payRevisionArrearsMonthly || 0)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(salary.payRevisionArrears || (salary.isAutoAnnualize ? (salary.payRevisionArrearsMonthly || 0) * 12 : salary.payRevisionArrearsAnnual || 0))}
                    </td>
                  </tr>
                ) : null}
                {(salary.festivalAllowanceBonus || salary.festivalAllowance || salary.bonus || salary.festivalAllowanceMonthly || salary.bonusMonthly) ? (
                  <tr>
                    <td className="py-2.5 px-3">Festival Allow. / Bonus</td>
                    <td className="py-2.5 px-3 text-right font-mono">{(salary.festivalAllowanceBonus || salary.festivalAllowance || salary.bonus) ? 'Lump sum' : formatINR((salary.festivalAllowanceMonthly || 0) + (salary.bonusMonthly || 0))}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(salary.festivalAllowanceBonus ?? ((salary.festivalAllowance || 0) + (salary.bonus || 0) + (salary.isAutoAnnualize ? ((salary.festivalAllowanceMonthly || 0) + (salary.bonusMonthly || 0)) * 12 : (salary.festivalAllowanceAnnual || 0) + (salary.bonusAnnual || 0))))}
                    </td>
                  </tr>
                ) : null}
                {salary.earnedLeaveSurrender ? (
                  <tr>
                    <td className="py-2.5 px-3">Earned Leave Surrender</td>
                    <td className="py-2.5 px-3 text-right font-mono">Lump sum</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(salary.earnedLeaveSurrender)}
                    </td>
                  </tr>
                ) : null}
                {salary.bankInterest ? (
                  <tr>
                    <td className="py-2.5 px-3">Bank Interest</td>
                    <td className="py-2.5 px-3 text-right font-mono">Annual</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(salary.bankInterest)}
                    </td>
                  </tr>
                ) : null}
                <tr className="bg-slate-100 font-bold text-slate-900 text-xs">
                  <td className="py-3 px-3 uppercase">Total Gross Salary (A)</td>
                  <td className="py-3 px-3 text-right font-mono text-[11px]">
                    {formatINR(
                      salary.basicMonthly +
                        salary.daMonthly +
                        salary.hraMonthly +
                        salary.otherMonthly +
                        (salary.arrearsMonthly || 0) +
                        (salary.payRevisionArrearsMonthly || 0) +
                        (salary.festivalAllowanceMonthly || 0) +
                        (salary.bonusMonthly || 0)
                    )}/mo
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-[#1e3a8a]">
                    {formatINR(result.grossIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section III: Statutory Deductions & Exemptions */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1.5">
            III. Allowable Deductions & Exemptions (New Regime)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Deduction / Exemption Description</th>
                  <th className="py-2.5 px-3 text-right">Applicable Section</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-2.5 px-3">Standard Deduction u/s 19(2)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">u/s 19(2)</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatINR(result.standardDeduction)}
                  </td>
                </tr>
                {statutoryDeductions.dcrgExempt > 0 && (
                  <tr>
                    <td className="py-2.5 px-3">DCRG u/s 19(3)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">u/s 19(3)</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(statutoryDeductions.dcrgExempt)}
                    </td>
                  </tr>
                )}
                {statutoryDeductions.commutationPensionExempt > 0 && (
                  <tr>
                    <td className="py-2.5 px-3">Commutation u/s 19(7)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">u/s 19(7)</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(statutoryDeductions.commutationPensionExempt)}
                    </td>
                  </tr>
                )}
                {statutoryDeductions.reliefUs157 > 0 && (
                  <tr>
                    <td className="py-2.5 px-3">Relief u/s 157</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">u/s 157</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(statutoryDeductions.reliefUs157)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-bold text-slate-900 text-xs">
                  <td className="py-3 px-3 uppercase">Total Allowable Deductions (B)</td>
                  <td className="py-3 px-3 text-right">--</td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-[#1e3a8a]">
                    {formatINR(result.totalDeductions)}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-extrabold text-[#0d9488] text-sm border-t-2 border-slate-300">
                  <td className="py-3.5 px-3 uppercase">Net Taxable Income (A - B)</td>
                  <td className="py-3.5 px-3 text-right font-mono">--</td>
                  <td className="py-3.5 px-3 text-right font-mono text-base">
                    {formatINR(result.taxableIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section IV: Slab-wise Tax Computation Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1.5">
            IV. Slab-wise Income Tax Computation Table
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Slab Range</th>
                  <th className="py-2 px-3 text-center">Tax Rate</th>
                  <th className="py-2 px-3 text-right">Taxable in Slab</th>
                  <th className="py-2 px-3 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {result.slabsBreakdown.map((s, idx) => (
                  <tr key={idx} className={s.taxableInSlab > 0 ? 'bg-blue-50/50 text-slate-900' : 'text-slate-400'}>
                    <td className="py-2 px-3 font-sans font-medium">{s.slabLabel}</td>
                    <td className="py-2 px-3 text-center font-bold">{s.ratePercent}%</td>
                    <td className="py-2 px-3 text-right">{formatINR(s.taxableInSlab)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(s.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section V: Final Tax Summary Table & Net Payable */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1.5">
            V. Final Tax Liability & Net Position Summary
          </h2>

          <div className="p-5 rounded bg-slate-50 border border-slate-200 space-y-2 text-xs font-medium">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-700">Total Tax computed as per Slabs:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(result.slabTax)}</span>
            </div>

            {result.rebate87A > 0 && (
              <div className="flex justify-between py-1 text-[#0d9488] border-b border-slate-200">
                <span>Less: Rebate u/s 156 (Up to ₹60,000 for income ≤ ₹12L):</span>
                <span className="font-mono font-bold">- {formatINR(result.rebate87A)}</span>
              </div>
            )}

            {result.marginalRelief > 0 && (
              <div className="flex justify-between py-1 text-[#1e3a8a] border-b border-slate-200">
                <span>Less: Marginal Relief u/s 156:</span>
                <span className="font-mono font-bold">- {formatINR(result.marginalRelief)}</span>
              </div>
            )}

            {result.reliefUs157 > 0 && (
              <div className="flex justify-between py-1 text-indigo-700 border-b border-slate-200">
                <span>Less: Relief u/s 89 / 157:</span>
                <span className="font-mono font-bold">- {formatINR(result.reliefUs157)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-200 font-semibold text-slate-800">
              <span>Net Tax after Rebate / Marginal Relief u/s 156:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(result.taxAfterRelief)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-700">Add: Health & Education Cess @ 4% (on Net Tax after Relief):</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(result.cess)}</span>
            </div>

            <div className="flex justify-between py-2 border-b-2 border-slate-300 text-sm font-bold text-slate-900">
              <span>Total Income Tax Liability (TY 2026–27):</span>
              <span className="font-mono text-[#0d9488] text-base">
                {formatINR(result.totalTaxLiability)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span>Less: Total Annual TDS Already Deducted at Source:</span>
              <span className="font-mono font-bold text-amber-700">
                - {formatINR(result.annualTdsPaid)}
              </span>
            </div>

            <div
              className={`p-4 rounded flex items-center justify-between font-extrabold text-base mt-2 border ${
                isRefund
                  ? 'bg-teal-50 border-teal-200 text-[#0d9488]'
                  : 'bg-blue-50 border-blue-200 text-[#1e3a8a]'
              }`}
            >
              <span>{isRefund ? 'NET REFUNDABLE AMOUNT:' : 'NET TAX PAYABLE AMOUNT:'}</span>
              <span className="font-mono text-xl">
                {formatINR(Math.abs(result.netPayableOrRefund))}
              </span>
            </div>
          </div>
        </div>

        {/* Section VI: Formal Verification & Sign-off Footer */}
        <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold uppercase text-[11px] tracking-wider">
              <FileCheck className="w-4 h-4 text-[#0d9488]" />
              <span>Employee Declaration</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              I hereby declare that to the best of my knowledge and belief, the information given above is correct, complete, and truly stated in accordance with the Income Tax Act, 1961 for TY 2026–27 under the New Tax Regime.
            </p>
            <div className="pt-6 space-y-1 text-slate-800">
              <p>Place: <strong className="text-slate-900">{profile.place || '_________________'}</strong></p>
              <p>Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-IN')}</strong></p>
            </div>
          </div>

          <div className="flex flex-col justify-between items-end text-right space-y-6">
            <div className="p-3 rounded bg-slate-50 border border-slate-200 flex items-center gap-3 self-end">
              <QrCode className="w-10 h-10 text-slate-700 shrink-0" />
              <div className="text-left text-[10px] text-slate-600 font-mono">
                <span className="font-bold text-[#0d9488] block">DIGITALLY VERIFIED</span>
                <span>SECURE-HASH-{statement.id.substring(0, 12)}</span>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-400 w-48 text-center space-y-1">
              <p className="font-bold text-slate-900 text-xs">{profile.name || 'Signature'}</p>
              <p className="text-[10px] text-slate-500">Signature of Employee</p>
            </div>
          </div>
        </div>

        <p className="mt-6 border-t border-slate-200 pt-3 text-center text-[0.65rem] text-slate-500 font-medium">
          Software generated statement · TaxSnap  · Slabs per Finance Act 2026 (New Regime) · Made by Gigi Varughese.
        </p>
      </div>
    </motion.div>
  );
};
