import type { SalaryComponents, MonthlyDeductions, StatutoryDeductions, TaxResult, SlabDetail } from '../types/tax';

export function calculateGrossSalary(salary: SalaryComponents): number {
  if (salary.isAutoAnnualize) {
    return (
      (salary.basicMonthly +
        salary.daMonthly +
        salary.hraMonthly +
        salary.otherMonthly +
        (salary.arrearsMonthly || 0) +
        (salary.payRevisionArrearsMonthly || 0) +
        (salary.festivalAllowanceMonthly || 0) +
        (salary.bonusMonthly || 0)) *
      12
    );
  }
  return (
    salary.basicAnnual +
    salary.daAnnual +
    salary.hraAnnual +
    salary.otherAnnual +
    (salary.arrearsAnnual || 0) +
    (salary.payRevisionArrearsAnnual || 0) +
    (salary.festivalAllowanceAnnual || 0) +
    (salary.bonusAnnual || 0)
  );
}

export function calculateAnnualTdsPaid(deductions: MonthlyDeductions): number {
  return deductions.tdsMonthly * 12;
}

export function calculateNewRegimeTax(
  salary: SalaryComponents,
  monthlyDeductions: MonthlyDeductions,
  statutoryDeductions: StatutoryDeductions
): TaxResult {
  const grossIncome = calculateGrossSalary(salary);

  const standardDeduction =
    statutoryDeductions.standardDeductionType === 'standard_75' ? 75000 : 50000;
  const professionalTax = 0; // Professional Tax u/s 16(iii) is not deductible under New Tax Regime (Sec 115BAC)
  const otherExemptions =
    (statutoryDeductions.dcrgExempt || 0) +
    (statutoryDeductions.commutationPensionExempt || 0) +
    (statutoryDeductions.otherExemptions || 0);

  const totalDeductions = standardDeduction + otherExemptions;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // TY 2026-27 New Regime Slabs definition
  const slabsConfig = [
    { label: '₹0 to ₹4,00,000', min: 0, max: 400000, rate: 0 },
    { label: '₹4,00,001 to ₹8,00,000', min: 400000, max: 800000, rate: 0.05 },
    { label: '₹8,00,001 to ₹12,00,000', min: 800000, max: 1200000, rate: 0.10 },
    { label: '₹12,00,001 to ₹16,00,000', min: 1200000, max: 1600000, rate: 0.15 },
    { label: '₹16,00,001 to ₹20,00,000', min: 1600000, max: 2000000, rate: 0.20 },
    { label: '₹20,00,001 to ₹24,00,000', min: 2000000, max: 2400000, rate: 0.25 },
    { label: 'Above ₹24,00,000', min: 2400000, max: null, rate: 0.30 },
  ];

  let rawSlabTax = 0;
  const slabsBreakdown: SlabDetail[] = [];

  for (const s of slabsConfig) {
    if (taxableIncome > s.min) {
      const slabRangeMax = s.max !== null ? s.max : taxableIncome;
      const taxableInSlab = Math.min(taxableIncome, slabRangeMax) - s.min;
      const taxAmount = Math.round(taxableInSlab * s.rate);
      rawSlabTax += taxAmount;

      slabsBreakdown.push({
        slabLabel: s.label,
        minIncome: s.min,
        maxIncome: s.max,
        ratePercent: s.rate * 100,
        taxableInSlab,
        taxAmount,
      });
    } else {
      slabsBreakdown.push({
        slabLabel: s.label,
        minIncome: s.min,
        maxIncome: s.max,
        ratePercent: s.rate * 100,
        taxableInSlab: 0,
        taxAmount: 0,
      });
    }
  }

  let rebate87A = 0;
  let marginalRelief = 0;
  let taxAfterRebateAndMarginal = rawSlabTax;

  if (taxableIncome <= 1200000) {
    // Zero tax up to 12 Lakhs taxable income via Rebate u/s 87A (max 60,000)
    rebate87A = Math.min(rawSlabTax, 60000);
    taxAfterRebateAndMarginal = 0;
  } else {
    // Marginal relief check for income slightly above 12,00,000:
    const excessIncome = taxableIncome - 1200000;
    if (rawSlabTax > excessIncome) {
      marginalRelief = rawSlabTax - excessIncome;
      taxAfterRebateAndMarginal = excessIncome;
    }
  }

  const reliefUs157 = statutoryDeductions.reliefUs157 || 0;
  const taxAfterRelief = Math.max(0, taxAfterRebateAndMarginal - reliefUs157);
  const cess = Math.round(taxAfterRelief * 0.04);
  const totalTaxLiability = taxAfterRelief + cess;
  const annualTdsPaid = calculateAnnualTdsPaid(monthlyDeductions);
  const netPayableOrRefund = totalTaxLiability - annualTdsPaid;

  return {
    grossIncome,
    standardDeduction,
    professionalTax,
    otherExemptions,
    totalDeductions,
    taxableIncome,
    slabTax: rawSlabTax,
    rebate87A,
    marginalRelief,
    reliefUs157,
    taxAfterRelief,
    cess,
    totalTaxLiability,
    annualTdsPaid,
    netPayableOrRefund,
    slabsBreakdown,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}
