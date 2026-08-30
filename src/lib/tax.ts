export type TaxInput = {
  grossIncome: number;
  standardDeduction: number;
  professionalTax: number;
  otherExemptions: number;
  reliefUs157?: number;
};

export type TaxResult = {
  taxableIncome: number;
  slabTax: number;
  rebate87A: number;
  marginalRelief: number;
  reliefUs157: number;
  cess: number;
  finalTax: number;
};

export const SLABS = [
  { from: 0, to: 400000, rate: 0 },
  { from: 400000, to: 800000, rate: 0.05 },
  { from: 800000, to: 1200000, rate: 0.1 },
  { from: 1200000, to: 1600000, rate: 0.15 },
  { from: 1600000, to: 2000000, rate: 0.2 },
  { from: 2000000, to: 2400000, rate: 0.25 },
  { from: 2400000, to: Infinity, rate: 0.3 },
];

export function slabBreakdown(taxableIncome: number) {
  return SLABS.map((s) => {
    const upper = Math.min(taxableIncome, s.to === Infinity ? taxableIncome : s.to);
    const amountInSlab = Math.max(0, upper - s.from);
    return {
      ...s,
      amountInSlab,
      taxOnSlab: amountInSlab * s.rate,
    };
  }).filter((s) => s.from < taxableIncome || s.amountInSlab > 0);
}

export function calculateNewRegimeTax(input: TaxInput): TaxResult {
  const { grossIncome, standardDeduction, otherExemptions, reliefUs157 = 0 } = input;
  const taxableIncome = Math.max(0, grossIncome - standardDeduction - otherExemptions);

  let tax = 0;
  if (taxableIncome > 2400000)
    tax += (taxableIncome - 2400000) * 0.3 + 400000 * 0.25 + 400000 * 0.2 + 400000 * 0.15 + 400000 * 0.1 + 400000 * 0.05;
  else if (taxableIncome > 2000000)
    tax += (taxableIncome - 2000000) * 0.25 + 400000 * 0.2 + 400000 * 0.15 + 400000 * 0.1 + 400000 * 0.05;
  else if (taxableIncome > 1600000)
    tax += (taxableIncome - 1600000) * 0.2 + 400000 * 0.15 + 400000 * 0.1 + 400000 * 0.05;
  else if (taxableIncome > 1200000) tax += (taxableIncome - 1200000) * 0.15 + 400000 * 0.1 + 400000 * 0.05;
  else if (taxableIncome > 800000) tax += (taxableIncome - 800000) * 0.1 + 400000 * 0.05;
  else if (taxableIncome > 400000) tax += (taxableIncome - 400000) * 0.05;

  let rebate87A = 0;
  let marginalRelief = 0;

  if (taxableIncome <= 1200000) {
    rebate87A = Math.min(tax, 60000);
    tax = 0;
  } else {
    const excessIncome = taxableIncome - 1200000;
    if (tax > excessIncome) {
      marginalRelief = tax - excessIncome;
      tax = excessIncome;
    }
  }

  const taxAfterRelief = Math.max(0, tax - reliefUs157);
  const cess = Math.round(taxAfterRelief * 0.04);
  const finalTax = taxAfterRelief + cess;

  return { taxableIncome, slabTax: tax, rebate87A, marginalRelief, reliefUs157, cess, finalTax };
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatINR(n: number, paise = false): string {
  if (!isFinite(n)) return '0';
  return '₹' + (paise ? inrPaise : inr).format(Math.round(n * (paise ? 100 : 1)) / (paise ? 100 : 1));
}

export function numberToWordsINR(num: number): string {
  num = Math.round(num);
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n: number): string =>
    n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  const three = (n: number): string =>
    n >= 100 ? a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '') : two(n);

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore) words += three(crore) + ' Crore ';
  if (lakh) words += two(lakh) + ' Lakh ';
  if (thousand) words += two(thousand) + ' Thousand ';
  if (hundred) words += three(hundred) + ' ';
  return words.trim() + ' Rupees Only';
}
