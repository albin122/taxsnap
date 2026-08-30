export interface EmployeeProfile {
  name: string;
  designation: string;
  pan: string;
  office_name: string;
  place: string;
}

export interface PersonalProfile {
  name: string;
  email: string;
  dob: string;
  phone: string;
  schoolOffice: string;
  position: string;
  pan: string;
  completedOnboarding: boolean;
}

export interface SalaryComponents {
  basicMonthly: number;
  daMonthly: number;
  hraMonthly: number;
  otherMonthly: number;
  arrearsMonthly?: number;
  payRevisionArrearsMonthly?: number;
  festivalAllowanceMonthly?: number;
  bonusMonthly?: number;
  arrears?: number;
  payRevisionArrears?: number;
  festivalAllowance?: number;
  festivalAllowanceBonus?: number;
  bonus?: number;
  earnedLeaveSurrender?: number;
  bankInterest?: number;
  isAutoAnnualize: boolean; // Monthly x 12 vs manual override
  basicAnnual: number;
  daAnnual: number;
  hraAnnual: number;
  otherAnnual: number;
  arrearsAnnual?: number;
  payRevisionArrearsAnnual?: number;
  festivalAllowanceAnnual?: number;
  bonusAnnual?: number;
}

export interface MonthlyDeductions {
  pfMonthly: number;
  npsMonthly: number;
  gisMonthly: number;
  sliMonthly: number;
  licMonthly: number;
  otherMonthly: number;
  tdsMonthly: number; // Tax already deducted at source
}

export interface StatutoryDeductions {
  standardDeductionType: 'standard_75' | 'standard_50';
  standardDeductionAmount: number;
  professionalTaxAnnual: number;
  dcrgExempt: number; // Death-cum-Retirement Gratuity u/s 10(10)
  commutationPensionExempt: number; // Pension Commutation u/s 10(10A)
  otherExemptions: number; // Other statutory exemptions u/s 10 / 19
  reliefUs157: number; // Relief u/s 89 / 157
}

export interface SlabDetail {
  slabLabel: string;
  minIncome: number;
  maxIncome: number | null;
  ratePercent: number;
  taxableInSlab: number;
  taxAmount: number;
}

export interface TaxResult {
  grossIncome: number;
  standardDeduction: number;
  professionalTax: number;
  otherExemptions: number;
  totalDeductions: number;
  taxableIncome: number;
  slabTax: number;
  rebate87A: number;
  marginalRelief: number;
  reliefUs157: number;
  taxAfterRelief: number;
  cess: number;
  totalTaxLiability: number;
  annualTdsPaid: number;
  netPayableOrRefund: number; // positive = payable, negative = refund
  slabsBreakdown: SlabDetail[];
}

export interface SavedStatement {
  id: string;
  created_at: string;
  profile: EmployeeProfile;
  salary: SalaryComponents;
  monthlyDeductions: MonthlyDeductions;
  statutoryDeductions: StatutoryDeductions;
  result: TaxResult;
}
