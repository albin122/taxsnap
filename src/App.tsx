import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Coins,
  FileText,
  Printer,
  ReceiptText,
  Scale,
  ShieldCheck,
  Sparkles,
  Wallet,
  Lock,
  Mail,
  Loader2,
  Calculator,
  TrendingUp,
  ClipboardList,
  LogOut,
  Send,
  User,
  Calendar,
  Phone,
  Briefcase,
  Edit3,
  Home,
  Eye,
  EyeOff,
  Sun,
  Copy,
  Check,
  Sliders,
  HelpCircle,
  ChevronDown,
  Headphones,
  Trash2,
  Save,
} from 'lucide-react';
import { SecuritySessions } from './components/SecuritySessions';
import { TextField, MoneyField } from './components/ui';
import {
  calculateNewRegimeTax,
  formatINR,
  numberToWordsINR,
  slabBreakdown,
} from './lib/tax';
import {
  supabase,
  fetchUserProfile,
  saveUserProfile,
  sendSupportTicket,
  saveTaxStatement,
  fetchAllTaxStatements,
  deleteTaxStatement,
} from './utils/supabaseClient';
import type { SavedStatement } from './types/tax';
import NavHeader from './components/ui/nav-header';
import { ShaderBackground } from './components/ui/hero-shader';

type Profile = { name: string; designation: string; pan: string; office_name: string; place: string };

export type MonthSalaryItem = {
  month: string;
  basic: number;
  da: number;
  hra: number;
  other: number;
  arrears: number;
  payRevisionArrears: number;
  festivalAllowance: number;
  bonus: number;
};

export type SalaryMode = 'auto' | 'monthly_breakdown' | 'manual';

export type Salary = {
  basic: number;
  da: number;
  hra: number;
  other: number;
  arrears?: number;
  payRevisionArrears?: number;
  festivalAllowance?: number;
  festivalAllowanceBonus?: number;
  bonus?: number;
  earnedLeaveSurrender?: number;
  bankInterest?: number;
  annualize: boolean;
  salaryMode: SalaryMode;
  monthlyBreakdown: MonthSalaryItem[];
  manualGross: number;
};

const DEFAULT_TY_MONTHS = [
  'March 2026',
  'April 2026',
  'May 2026',
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027',
];

const createDefaultMonthlyBreakdown = (
  basic = 0,
  da = 0,
  hra = 0,
  other = 0,
  arrears = 0,
  payRevisionArrears = 0,
  festivalAllowance = 0,
  bonus = 0
): MonthSalaryItem[] =>
  DEFAULT_TY_MONTHS.map((m) => ({
    month: m,
    basic,
    da,
    hra,
    other,
    arrears,
    payRevisionArrears,
    festivalAllowance,
    bonus,
  }));
type Deductions = {
  pf: number;
  nps: number;
  gis: number;
  sli: number;
  lic: number;
  other: number;
  tds: number;
  standardDeduction: 75000 | 50000;
  professionalTax: number;
  dcrg: number;
  commutation: number;
  reliefUs157: number;
};

export type SavedComputation = {
  id: string;
  date: string;
  profile: Profile;
  grossIncome: number;
  netPayable: number;
  salary?: Salary;
  ded?: Deductions;
  monthlyBreakdownTotals?: {
    basicSum: number;
    daSum: number;
    hraSum: number;
    otherSum: number;
    arrearsSum: number;
    payRevisionArrearsSum: number;
    festivalAllowanceBonusSum?: number;
    festivalAllowanceSum?: number;
    bonusSum?: number;
    earnedLeaveSurrenderSum?: number;
    bankInterestSum?: number;
    total: number;
  };
  statementData?: SavedStatement;
};

export type PersonalProfile = {
  name: string;
  email: string;
  dob: string;
  phone: string;
  schoolOffice: string;
  position: string;
  pan: string;
  completedOnboarding: boolean;
};

const initialPersonalProfile: PersonalProfile = {
  name: '',
  email: '',
  dob: '',
  phone: '',
  schoolOffice: '',
  position: '',
  pan: '',
  completedOnboarding: false,
};

const initialProfile: Profile = { name: '', designation: '', pan: '', office_name: '', place: '' };
const initialSalary: Salary = {
  basic: 0,
  da: 0,
  hra: 0,
  other: 0,
  annualize: false,
  salaryMode: 'monthly_breakdown',
  monthlyBreakdown: createDefaultMonthlyBreakdown(),
  manualGross: 0,
};
const initialDeductions: Deductions = {
  pf: 0,
  nps: 0,
  gis: 0,
  sli: 0,
  lic: 0,
  other: 0,
  tds: 0,
  standardDeduction: 75000,
  professionalTax: 0,
  dcrg: 0,
  commutation: 0,
  reliefUs157: 0,
};

const STEPS = ['Profile', 'Earnings', 'Deductions', 'Summary'];

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'login' | 'onboarding' | 'dashboard' | 'calc' | 'statement'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile>(initialPersonalProfile);
  const [savedComputations, setSavedComputations] = useState<SavedComputation[]>(() => {
    try {
      const local = localStorage.getItem('taxsnap_saved_computations');
      const parsed = local ? JSON.parse(local) : [];
      return Array.isArray(parsed) ? parsed.filter((c: any) => c && c.id && !c.id.startsWith('sample_stmt_') && c.profile?.name !== 'Rajesh Kumar Sharma') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('taxsnap_saved_computations', JSON.stringify(savedComputations));
    } catch (e) {
      console.error(e);
    }
  }, [savedComputations]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [profile, setProfile] = useState(initialProfile);
  const [salary, setSalary] = useState(initialSalary);
  const [ded, setDed] = useState(initialDeductions);

  const processUserProfile = async (em: string): Promise<PersonalProfile> => {
    if (!em) return initialPersonalProfile;
    let prof = await fetchUserProfile(em);
    if (!prof) {
      prof = {
        name: em.split('@')[0] || '',
        email: em,
        dob: '',
        phone: '',
        schoolOffice: '',
        position: '',
        pan: '',
        completedOnboarding: false,
      };
    }
    setPersonalProfile(prof);
    setProfile((prev) => ({
      ...prev,
      name: prof.name || prev.name,
      designation: prof.position || prev.designation,
      office_name: prof.schoolOffice || prev.office_name,
      pan: prof.pan || prev.pan,
    }));
    return prof;
  };

  useEffect(() => {
    // Fetch initial Supabase session
    if (supabase) {
      supabase.auth.getSession().then(async (res: any) => {
        const session = res?.data?.session;
        if (session?.user) {
          setIsAuthenticated(true);
          const em = session.user.email || '';
          setUserEmail(em);
          await processUserProfile(em);
        }
      });

      // Listen to Supabase auth state changes (OAuth redirects, login, logout)
      const { data } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (session?.user) {
          setIsAuthenticated(true);
          const em = session.user.email || '';
          setUserEmail(em);
          const prof = await processUserProfile(em);
          setScreen((prev) => {
            if (prev === 'landing' || prev === 'login') {
              return prof.completedOnboarding ? 'dashboard' : 'onboarding';
            }
            return prev;
          });
        } else {
          setIsAuthenticated(false);
          setUserEmail('');
        }
      });

      return () => data?.subscription?.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (personalProfile.name || personalProfile.position || personalProfile.schoolOffice || personalProfile.pan) {
      setProfile((prev) => ({
        ...prev,
        name: personalProfile.name || prev.name,
        designation: personalProfile.position || prev.designation,
        office_name: personalProfile.schoolOffice || prev.office_name,
        pan: personalProfile.pan || prev.pan,
      }));
    }
  }, [personalProfile, screen]);

  const monthlyBreakdownTotals = useMemo(() => {
    let basicSum = 0,
      daSum = 0,
      hraSum = 0,
      otherSum = 0;
    (salary.monthlyBreakdown || []).forEach((m) => {
      basicSum += m.basic || 0;
      daSum += m.da || 0;
      hraSum += m.hra || 0;
      otherSum += m.other || 0;
    });

    const arrearsSum = salary.arrears || 0;
    const payRevisionArrearsSum = salary.payRevisionArrears || 0;
    const festivalAllowanceBonusSum = salary.festivalAllowanceBonus ?? ((salary.festivalAllowance || 0) + (salary.bonus || 0));
    const earnedLeaveSurrenderSum = salary.earnedLeaveSurrender || 0;
    const bankInterestSum = salary.bankInterest || 0;

    const total =
      basicSum +
      daSum +
      hraSum +
      otherSum +
      arrearsSum +
      payRevisionArrearsSum +
      festivalAllowanceBonusSum +
      earnedLeaveSurrenderSum +
      bankInterestSum;

    return {
      basicSum,
      daSum,
      hraSum,
      otherSum,
      arrearsSum,
      payRevisionArrearsSum,
      festivalAllowanceBonusSum,
      earnedLeaveSurrenderSum,
      bankInterestSum,
      total,
    };
  }, [
    salary.monthlyBreakdown,
    salary.arrears,
    salary.payRevisionArrears,
    salary.festivalAllowanceBonus,
    salary.festivalAllowance,
    salary.bonus,
    salary.earnedLeaveSurrender,
    salary.bankInterest,
  ]);

  const grossIncome =
    salary.salaryMode === 'manual'
      ? salary.manualGross
      : monthlyBreakdownTotals.total;
  const otherExemptions = ded.dcrg + ded.commutation;
  const totalDeductions = ded.standardDeduction + otherExemptions;

  const result = useMemo(
    () =>
      calculateNewRegimeTax({
        grossIncome,
        standardDeduction: ded.standardDeduction,
        professionalTax: 0,
        otherExemptions,
        reliefUs157: ded.reliefUs157,
      }),
    [grossIncome, ded.standardDeduction, otherExemptions, ded.reliefUs157],
  );

  const netPayable = result.finalTax - ded.tds;

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(Math.max(0, Math.min(3, n)));
  };

  const handleStart = async () => {
    if (isAuthenticated) {
      const prof = await processUserProfile(userEmail);
      setScreen(prof.completedOnboarding ? 'dashboard' : 'onboarding');
    } else {
      setScreen('login');
    }
  };

  const handleLoginSuccess = async (email?: string) => {
    setIsAuthenticated(true);
    const userEm = email || 'user@taxsnap.in';
    setUserEmail(userEm);
    const prof = await processUserProfile(userEm);
    if (!prof.completedOnboarding) {
      setScreen('onboarding');
    } else {
      setScreen('dashboard');
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setUserEmail('');
    setScreen('landing');
  };

  const statementToSavedComputation = (stmt: SavedStatement): SavedComputation => {
    const formattedDate = new Date(stmt.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return {
      id: stmt.id,
      date: formattedDate,
      profile: {
        name: stmt.profile?.name || '',
        designation: stmt.profile?.designation || '',
        office_name: stmt.profile?.office_name || '',
        pan: stmt.profile?.pan || '',
        place: stmt.profile?.place || '',
      },
      grossIncome: stmt.result?.grossIncome ?? 0,
      netPayable: stmt.result?.netPayableOrRefund ?? 0,
      salary: stmt.salary ? {
        salaryMode: 'manual',
        manualGross: stmt.result?.grossIncome ?? 0,
        monthlyBreakdown: Array.from({ length: 12 }, (_, i) => ({
          month: DEFAULT_TY_MONTHS[i],
          basic: (stmt.salary.basicMonthly || stmt.salary.basicAnnual / 12) || 0,
          da: (stmt.salary.daMonthly || stmt.salary.daAnnual / 12) || 0,
          hra: (stmt.salary.hraMonthly || stmt.salary.hraAnnual / 12) || 0,
          other: (stmt.salary.otherMonthly || stmt.salary.otherAnnual / 12) || 0,
          arrears: 0,
          payRevisionArrears: 0,
          festivalAllowance: 0,
          bonus: 0,
        })),
        arrears: stmt.salary.arrears || 0,
        payRevisionArrears: stmt.salary.payRevisionArrears || 0,
        festivalAllowanceBonus: stmt.salary.festivalAllowanceBonus || 0,
        earnedLeaveSurrender: stmt.salary.earnedLeaveSurrender || 0,
        bankInterest: stmt.salary.bankInterest || 0,
        basic: 0,
        da: 0,
        hra: 0,
        other: 0,
        annualize: false,
      } : undefined,
      ded: stmt.statutoryDeductions ? {
        pf: 0,
        nps: 0,
        gis: 0,
        sli: 0,
        lic: 0,
        other: 0,
        tds: stmt.result?.annualTdsPaid || 0,
        standardDeduction: (stmt.statutoryDeductions.standardDeductionAmount as 75000 | 50000) || 75000,
        professionalTax: stmt.statutoryDeductions.professionalTaxAnnual || 0,
        dcrg: stmt.statutoryDeductions.dcrgExempt || 0,
        commutation: stmt.statutoryDeductions.commutationPensionExempt || 0,
        reliefUs157: stmt.statutoryDeductions.reliefUs157 || 0,
      } : undefined,
      monthlyBreakdownTotals: stmt.salary ? {
        basicSum: stmt.salary.basicAnnual || (stmt.salary.basicMonthly * 12) || 0,
        daSum: stmt.salary.daAnnual || (stmt.salary.daMonthly * 12) || 0,
        hraSum: stmt.salary.hraAnnual || (stmt.salary.hraMonthly * 12) || 0,
        otherSum: stmt.salary.otherAnnual || (stmt.salary.otherMonthly * 12) || 0,
        arrearsSum: stmt.salary.arrears || 0,
        payRevisionArrearsSum: stmt.salary.payRevisionArrears || 0,
        festivalAllowanceBonusSum: stmt.salary.festivalAllowanceBonus || 0,
        earnedLeaveSurrenderSum: stmt.salary.earnedLeaveSurrender || 0,
        bankInterestSum: stmt.salary.bankInterest || 0,
        total: stmt.result?.grossIncome || 0,
      } : undefined,
      statementData: stmt,
    };
  };

  const refreshSavedComputations = async () => {
    try {
      const statements = await fetchAllTaxStatements();
      const realStatements = (statements || []).filter((s) => s && s.id && !s.id.startsWith('sample_stmt_') && s.profile?.name !== 'Rajesh Kumar Sharma');
      const comps = realStatements.map(statementToSavedComputation);
      setSavedComputations(comps);
    } catch (e) {
      console.error('Failed to fetch statements from Supabase:', e);
    }
  };

  useEffect(() => {
    refreshSavedComputations();
  }, [screen, isAuthenticated]);

  const createSavedComputation = (): SavedComputation => ({
    id: 'COMP-' + Date.now(),
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    profile: { ...profile },
    grossIncome,
    netPayable,
    salary: JSON.parse(JSON.stringify(salary)),
    ded: { ...ded },
    monthlyBreakdownTotals: { ...monthlyBreakdownTotals },
  });

  const createSavedStatement = (comp: SavedComputation): SavedStatement => ({
    id: comp.id,
    created_at: new Date().toISOString(),
    profile: {
      name: profile.name || personalProfile.name || 'Taxpayer',
      designation: profile.designation || personalProfile.position || 'Employee',
      pan: profile.pan || personalProfile.pan || '',
      office_name: profile.office_name || personalProfile.schoolOffice || '',
      place: profile.place || '',
    },
    salary: {
      basicMonthly: (monthlyBreakdownTotals.basicSum || 0) / 12,
      daMonthly: (monthlyBreakdownTotals.daSum || 0) / 12,
      hraMonthly: (monthlyBreakdownTotals.hraSum || 0) / 12,
      otherMonthly: (monthlyBreakdownTotals.otherSum || 0) / 12,
      arrears: monthlyBreakdownTotals.arrearsSum,
      payRevisionArrears: monthlyBreakdownTotals.payRevisionArrearsSum,
      festivalAllowanceBonus: monthlyBreakdownTotals.festivalAllowanceBonusSum,
      earnedLeaveSurrender: monthlyBreakdownTotals.earnedLeaveSurrenderSum,
      bankInterest: monthlyBreakdownTotals.bankInterestSum,
      isAutoAnnualize: true,
      basicAnnual: monthlyBreakdownTotals.basicSum,
      daAnnual: monthlyBreakdownTotals.daSum,
      hraAnnual: monthlyBreakdownTotals.hraSum,
      otherAnnual: monthlyBreakdownTotals.otherSum,
    },
    monthlyDeductions: {
      pfMonthly: 0,
      npsMonthly: 0,
      gisMonthly: 0,
      sliMonthly: 0,
      licMonthly: 0,
      otherMonthly: 0,
      tdsMonthly: ded.tds / 12,
    },
    statutoryDeductions: {
      standardDeductionType: ded.standardDeduction === 75000 ? 'standard_75' : 'standard_50',
      standardDeductionAmount: ded.standardDeduction,
      professionalTaxAnnual: 0,
      dcrgExempt: ded.dcrg,
      commutationPensionExempt: ded.commutation,
      otherExemptions: 0,
      reliefUs157: ded.reliefUs157,
    },
    result: {
      grossIncome,
      standardDeduction: ded.standardDeduction,
      professionalTax: 0,
      otherExemptions: ded.dcrg + ded.commutation,
      totalDeductions,
      taxableIncome: result.taxableIncome,
      slabTax: result.slabTax,
      rebate87A: result.rebate87A,
      marginalRelief: result.marginalRelief,
      reliefUs157: ded.reliefUs157,
      taxAfterRelief: result.finalTax - result.cess,
      cess: result.cess,
      totalTaxLiability: result.finalTax,
      annualTdsPaid: ded.tds,
      netPayableOrRefund: netPayable,
      slabsBreakdown: slabBreakdown(result.taxableIncome).map((s) => ({
        slabLabel: `₹${(s.from / 100000).toFixed(2)}L to ${s.to ? '₹' + (s.to / 100000).toFixed(2) + 'L' : 'Above'}`,
        minIncome: s.from,
        maxIncome: s.to,
        ratePercent: s.rate,
        taxableInSlab: s.amountInSlab,
        taxAmount: s.taxOnSlab,
      })),
    },
  });

  const handleSaveOnly = async () => {
    const newComp = createSavedComputation();
    const savedStmt = createSavedStatement(newComp);

    setSavedComputations((prev) => [newComp, ...prev]);
    setToastMessage('✓ Saved to Supabase Backend & Recent Calculations!');
    setTimeout(() => setToastMessage(null), 4000);

    await saveTaxStatement(savedStmt);
    await refreshSavedComputations();
  };

  const handleSaveAndPrint = async () => {
    const newComp = createSavedComputation();
    const savedStmt = createSavedStatement(newComp);

    setSavedComputations((prev) => [newComp, ...prev]);
    setShouldAutoPrint(true);
    setScreen('statement');

    await saveTaxStatement(savedStmt);
    await refreshSavedComputations();
  };

  const handleDeleteComputation = async (id: string) => {
    setSavedComputations((prev) => prev.filter((c) => c.id !== id));
    await deleteTaxStatement(id);
    await refreshSavedComputations();
  };

  const handleLoadComputation = (comp: SavedComputation, autoPrint = false) => {
    if (comp.profile) setProfile(comp.profile);
    if (comp.salary) setSalary(comp.salary);
    if (comp.ded) setDed(comp.ded);
    setShouldAutoPrint(autoPrint);
    setScreen('statement');
  };

  const step1Valid = profile.name.trim() && profile.designation.trim() && profile.office_name.trim();

  return (
    <div className="relative min-h-full overflow-x-hidden">
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <Landing
            key="landing"
            onStart={handleStart}
            isAuthenticated={isAuthenticated}
          />
        )}

        {screen === 'login' && (
          <Login
            key="login"
            onEnter={handleLoginSuccess}
            onBack={() => setScreen('landing')}
          />
        )}

        {screen === 'onboarding' && (
          <OnboardingScreen
            key="onboarding"
            initialEmail={userEmail}
            initialProfile={personalProfile}
            onComplete={(updatedProf) => {
              setPersonalProfile(updatedProf);
              setProfile((prev) => ({
                ...prev,
                name: updatedProf.name || prev.name,
                designation: updatedProf.position || prev.designation,
                office_name: updatedProf.schoolOffice || prev.office_name,
                pan: updatedProf.pan || prev.pan,
              }));
              saveUserProfile(updatedProf);
              setScreen('dashboard');
            }}
          />
        )}

        {screen === 'dashboard' && (
          <Dashboard
            key="dashboard"
            userEmail={userEmail}
            personalProfile={personalProfile}
            onUpdatePersonalProfile={(updatedProf) => {
              setPersonalProfile(updatedProf);
              setProfile((prev) => ({
                ...prev,
                name: updatedProf.name || prev.name,
                designation: updatedProf.position || prev.designation,
                office_name: updatedProf.schoolOffice || prev.office_name,
                pan: updatedProf.pan || prev.pan,
              }));
              saveUserProfile(updatedProf);
            }}
            savedComputations={savedComputations}
            onStartCalculation={() => {
              if (personalProfile) {
                setProfile((prev) => ({
                  ...prev,
                  name: personalProfile.name || prev.name,
                  designation: personalProfile.position || prev.designation,
                  office_name: personalProfile.schoolOffice || prev.office_name,
                }));
              }
              setStep(0);
              setScreen('calc');
            }}
            onLoadComputation={handleLoadComputation}
            onDeleteComputation={handleDeleteComputation}
            onSignOut={handleSignOut}
          />
        )}

        {screen === 'calc' && (
          <motion.div
            key="calc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-5xl px-5 py-8 md:py-12"
          >
            <TopBar
              userEmail={userEmail}
              onHome={() => setScreen('dashboard')}
            />
            <ProgressRail step={step} onJump={go} />

            <div className="relative mt-8 min-h-[440px]">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                >
                  {step === 0 && (
                    <StepShell
                      icon={<Building2 className="size-5" />}
                      eyebrow="Step 01"
                      title="Employee & Office Profile"
                      desc="Identifying particulars printed on your official statement."
                    >
                      <div className="space-y-5 max-w-2xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-navy/20 bg-navy/5 p-3.5 text-xs text-ink">
                          <span className="flex items-center gap-2">
                            <span className="flex size-2 rounded-full bg-emerald" />
                            Auto-collected from your profile
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setProfile((prev) => ({
                                ...prev,
                                name: personalProfile.name || prev.name,
                                designation: personalProfile.position || prev.designation,
                                office_name: personalProfile.schoolOffice || prev.office_name,
                                pan: personalProfile.pan || prev.pan,
                              }));
                            }}
                            className="font-bold text-navy hover:underline shrink-0 text-left sm:text-right"
                          >
                            ⚡ Reset to Saved Profile
                          </button>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextField label="Full Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Full Name" />
                          <TextField label="Designation" value={profile.designation} onChange={(v) => setProfile({ ...profile, designation: v })} placeholder="Designation" />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextField label="Office Name" value={profile.office_name} onChange={(v) => setProfile({ ...profile, office_name: v })} placeholder="Office Name" />
                          <TextField
                            label="PAN Number"
                            value={profile.pan}
                            onChange={(v) => setProfile({ ...profile, pan: v.toUpperCase() })}
                            placeholder="ABCDE1234F"
                            uppercase
                            maxLength={10}
                            hint="Auto-collected from your profile"
                          />
                        </div>
                      </div>
                    </StepShell>
                  )}

                  {step === 1 && (
                    <StepShell
                      icon={<Wallet className="size-5" />}
                      eyebrow="Step 02"
                      title="Salary Earnings"
                      desc="Enter month-by-month salary breakdown or direct gross total for TY 2026–27."
                    >
                      <div className="space-y-6">
                        {/* Salary Mode Selector Tabs */}
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white/70 p-1.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setSalary({ ...salary, salaryMode: 'monthly_breakdown', annualize: false })}
                            className={`flex-1 min-w-[160px] rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                              salary.salaryMode !== 'manual'
                                ? 'bg-navy text-white shadow-md'
                                : 'text-ink-soft hover:bg-white hover:text-ink'
                            }`}
                          >
                            🗓️ Month-by-Month Entry (All 12 Months)
                          </button>

                          <button
                            type="button"
                            onClick={() => setSalary({ ...salary, salaryMode: 'manual', annualize: false })}
                            className={`flex-1 min-w-[140px] rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                              salary.salaryMode === 'manual'
                                ? 'bg-navy text-white shadow-md'
                                : 'text-ink-soft hover:bg-white hover:text-ink'
                            }`}
                          >
                            ✏️ Direct Annual Gross Total
                          </button>
                        </div>

                        {/* MODE 1: Month-by-Month Detailed Entry (All 12 Months Data) */}
                        {salary.salaryMode !== 'manual' && (
                          <div className="space-y-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gold/30 bg-gold/10 p-4">
                              <div>
                                <h4 className="font-semibold text-ink text-sm">12-Month Custom Salary Breakdown</h4>
                                <p className="text-xs text-ink-soft/80 mt-0.5">Enter monthly components for all 12 months (March 2026 to February 2027), then add any lump-sum arrears or bonuses below.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSalary({
                                    ...salary,
                                    monthlyBreakdown: createDefaultMonthlyBreakdown(
                                      salary.basic,
                                      salary.da,
                                      salary.hra,
                                      salary.other
                                    ),
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-105"
                              >
                                ⚡ Fill All 12 Months using Monthly Pay
                              </button>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
                              {/* 12 Months Column + Other Income Section */}
                              <div className="space-y-5">
                                {/* 12 Months Grid */}
                                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                                  {(salary.monthlyBreakdown || createDefaultMonthlyBreakdown()).map((item, idx) => {
                                    const monthSum =
                                      (item.basic || 0) +
                                      (item.da || 0) +
                                      (item.hra || 0) +
                                      (item.other || 0);
                                    return (
                                      <div key={item.month} className="rounded-2xl border border-line bg-white/80 p-4 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between border-b border-line/60 pb-2">
                                          <span className="font-semibold text-ink text-xs uppercase tracking-wider flex items-center gap-2">
                                            <span className="flex size-5 items-center justify-center rounded-full bg-navy text-[0.65rem] font-bold text-white">
                                              {idx + 1}
                                            </span>
                                            {item.month}
                                          </span>
                                          <span className="font-mono text-xs font-bold text-navy">
                                            Monthly Subtotal: {formatINR(monthSum)}
                                          </span>
                                        </div>

                                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-xs">
                                          <div>
                                            <label className="text-[0.65rem] font-medium text-ink-soft block mb-1">Basic Pay</label>
                                            <input
                                              type="number"
                                              value={item.basic || ''}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = [...(salary.monthlyBreakdown || createDefaultMonthlyBreakdown())];
                                                updated[idx] = { ...updated[idx], basic: val };
                                                setSalary({ ...salary, monthlyBreakdown: updated });
                                              }}
                                              placeholder="0"
                                              className="w-full rounded-lg border border-line bg-paper/50 py-1.5 px-2.5 font-mono text-xs text-ink outline-none focus:border-navy focus:bg-white"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[0.65rem] font-medium text-ink-soft block mb-1">DA</label>
                                            <input
                                              type="number"
                                              value={item.da || ''}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = [...(salary.monthlyBreakdown || createDefaultMonthlyBreakdown())];
                                                updated[idx] = { ...updated[idx], da: val };
                                                setSalary({ ...salary, monthlyBreakdown: updated });
                                              }}
                                              placeholder="0"
                                              className="w-full rounded-lg border border-line bg-paper/50 py-1.5 px-2.5 font-mono text-xs text-ink outline-none focus:border-navy focus:bg-white"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[0.65rem] font-medium text-ink-soft block mb-1">HRA</label>
                                            <input
                                              type="number"
                                              value={item.hra || ''}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = [...(salary.monthlyBreakdown || createDefaultMonthlyBreakdown())];
                                                updated[idx] = { ...updated[idx], hra: val };
                                                setSalary({ ...salary, monthlyBreakdown: updated });
                                              }}
                                              placeholder="0"
                                              className="w-full rounded-lg border border-line bg-paper/50 py-1.5 px-2.5 font-mono text-xs text-ink outline-none focus:border-navy focus:bg-white"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[0.65rem] font-medium text-ink-soft block mb-1">Other Allow.</label>
                                            <input
                                              type="number"
                                              value={item.other || ''}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = [...(salary.monthlyBreakdown || createDefaultMonthlyBreakdown())];
                                                updated[idx] = { ...updated[idx], other: val };
                                                setSalary({ ...salary, monthlyBreakdown: updated });
                                              }}
                                              placeholder="0"
                                              className="w-full rounded-lg border border-line bg-paper/50 py-1.5 px-2.5 font-mono text-xs text-ink outline-none focus:border-navy focus:bg-white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Annual Other Income / Additions Section (Show once for all months) */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                                      ✨ Other Annual Income &amp; Lump Sum Additions
                                    </h4>
                                    <p className="text-[0.7rem] text-slate-500 mt-0.5">
                                      Enter lump-sum arrears, festival allowance/bonus, earned leave surrender, or bank interest (applied once for all months).
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                                    {/* Arrears */}
                                    <div>
                                      <label className="text-xs font-semibold text-amber-700 block mb-1.5">
                                        Arrears
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={salary.arrears || ''}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setSalary({ ...salary, arrears: val });
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-amber-300 bg-amber-50/20 py-2 px-3 font-mono text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-xs"
                                      />
                                    </div>

                                    {/* Pay Revision Arrears */}
                                    <div>
                                      <label className="text-xs font-semibold text-purple-700 block mb-1.5">
                                        Pay Revision Arrears
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={salary.payRevisionArrears || ''}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setSalary({ ...salary, payRevisionArrears: val });
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-purple-300 bg-purple-50/20 py-2 px-3 font-mono text-xs text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all shadow-xs"
                                      />
                                    </div>

                                    {/* Festival Allow./Bonus */}
                                    <div>
                                      <label className="text-xs font-semibold text-emerald-700 block mb-1.5">
                                        Festival Allow./Bonus
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={salary.festivalAllowanceBonus ?? (salary.festivalAllowance || salary.bonus || '')}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setSalary({ ...salary, festivalAllowanceBonus: val, festivalAllowance: val, bonus: 0 });
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-emerald-300 bg-emerald-50/20 py-2 px-3 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
                                      />
                                    </div>

                                    {/* Earned Leave Surrender */}
                                    <div>
                                      <label className="text-xs font-semibold text-rose-700 block mb-1.5">
                                        Earned Leave Surrender
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={salary.earnedLeaveSurrender || ''}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setSalary({ ...salary, earnedLeaveSurrender: val });
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-rose-300 bg-rose-50/20 py-2 px-3 font-mono text-xs text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition-all shadow-xs"
                                      />
                                    </div>

                                    {/* Bank Interest */}
                                    <div>
                                      <label className="text-xs font-semibold text-blue-700 block mb-1.5">
                                        Bank Interest
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={salary.bankInterest || ''}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setSalary({ ...salary, bankInterest: val });
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border border-blue-300 bg-blue-50/20 py-2 px-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Realtime Summary Preview Side Panel */}
                              <LivePreview
                                label="Gross Annual Salary (12 Mos Total)"
                                value={grossIncome}
                                rows={[
                                  ['Total Basic Pay (12 mos)', monthlyBreakdownTotals.basicSum],
                                  ['Total DA (12 mos)', monthlyBreakdownTotals.daSum],
                                  ['Total HRA (12 mos)', monthlyBreakdownTotals.hraSum],
                                  ['Total Other Allow. (12 mos)', monthlyBreakdownTotals.otherSum],
                                  ['Arrears (Annual)', monthlyBreakdownTotals.arrearsSum],
                                  ['Pay Revision Arrears (Annual)', monthlyBreakdownTotals.payRevisionArrearsSum],
                                  ['Festival Allow. / Bonus', monthlyBreakdownTotals.festivalAllowanceBonusSum],
                                  ['Earned Leave Surrender', monthlyBreakdownTotals.earnedLeaveSurrenderSum],
                                  ['Bank Interest', monthlyBreakdownTotals.bankInterestSum],
                                ]}
                              />
                            </div>
                          </div>
                        )}

                        {/* MODE 3: Manual Direct Annual Gross */}
                        {salary.salaryMode === 'manual' && (
                          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                            <div className="space-y-5">
                              <p className="text-xs text-ink-soft">Enter custom gross annual salary figure directly:</p>
                              <MoneyField label="Gross Annual Income" value={salary.manualGross} onChange={(v) => setSalary({ ...salary, manualGross: v })} hint="Total annual gross salary" />
                            </div>
                            <LivePreview
                              label="Gross Annual Salary"
                              value={grossIncome}
                              rows={[['Direct Manual Gross', salary.manualGross]]}
                            />
                          </div>
                        )}
                      </div>
                    </StepShell>
                  )}

                  {step === 2 && (
                    <StepShell
                      icon={<ReceiptText className="size-5" />}
                      eyebrow="Step 03"
                      title="Deductions & Exemptions"
                      desc="New Regime allowable deductions and tax exemptions for TY 2026–27."
                    >
                      <div className="max-w-2xl mx-auto space-y-5">
                        {/* 1. Standard Deduction 19(2) */}
                        <div>
                          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                            Standard Deduction 19(2)
                          </p>
                          <div className="rounded-xl border border-navy/20 bg-navy/5 p-4 flex items-center justify-between">
                            <div>
                              <span className="block font-mono text-lg font-bold text-navy">₹75,000</span>
                              <span className="text-xs text-ink-soft">Standard Deduction u/s 19(2) (New Tax Regime)</span>
                            </div>
                            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold">
                              Applied
                            </span>
                          </div>
                        </div>

                        {/* 2 & 3. DCRG u/s 19(3) & Commutation u/s 19(7) */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <MoneyField label="DCRG u/s 19(3)" value={ded.dcrg} onChange={(v) => setDed({ ...ded, dcrg: v })} />
                          <MoneyField label="Commutation u/s 19(7)" value={ded.commutation} onChange={(v) => setDed({ ...ded, commutation: v })} />
                        </div>

                        {/* 4. Relief u/s 157 */}
                        <MoneyField label="Relief u/s 157" value={ded.reliefUs157} onChange={(v) => setDed({ ...ded, reliefUs157: v })} />

                        {/* 5. Tax Already Paid / Deducted (TDS) */}
                        <MoneyField
                          label="Tax Already Paid / Deducted (TDS)"
                          value={ded.tds}
                          onChange={(v) => setDed({ ...ded, tds: v })}
                          hint="Total tax remitted or deducted during the year"
                        />
                      </div>
                    </StepShell>
                  )}

                  {step === 3 && (
                    <StepShell
                      icon={<Scale className="size-5" />}
                      eyebrow="Step 04"
                      title="Tax Computation Summary"
                      desc="Live breakdown under the New Tax Regime, TY 2026–27 (AY 2027–28)."
                    >
                      <SummaryView
                        grossIncome={grossIncome}
                        totalDeductions={totalDeductions}
                        result={result}
                        netPayable={netPayable}
                        tds={ded.tds}
                      />
                    </StepShell>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-md max-w-xl mx-auto"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{toastMessage}</span>
                </div>
                <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 text-xs">
                  ✕
                </button>
              </motion.div>
            )}

            {/* Nav */}
            <div className="no-print mt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => (step === 0 ? setScreen('landing') : go(step - 1))}
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-navy hover:text-navy"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              {step < 3 ? (
                <button
                  onClick={() => go(step + 1)}
                  disabled={step === 0 && !step1Valid}
                  className="group inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-navy/25 transition-all hover:bg-navy-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {['Next: Salary Details', 'Next: Deductions', 'Compute Tax'][step]}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveOnly}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-5 py-2.5 text-sm font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Save className="size-4 text-emerald-600" /> Save Computation
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndPrint}
                    className="inline-flex items-center gap-2 rounded-full bg-gold hover:brightness-105 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-gold/30 transition-all cursor-pointer"
                  >
                    <Printer className="size-4" /> Print Statement
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {screen === 'statement' && (
          <Statement
            key="statement"
            profile={profile}
            grossIncome={grossIncome}
            monthlyBreakdownTotals={monthlyBreakdownTotals}
            ded={ded}
            totalDeductions={totalDeductions}
            result={result}
            netPayable={netPayable}
            autoPrint={shouldAutoPrint}
            onBack={() => {
              setShouldAutoPrint(false);
              setScreen('calc');
            }}
            onHome={() => {
              setShouldAutoPrint(false);
              setScreen('dashboard');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Landing ---------------- */

function Landing({
  onStart,
  isAuthenticated,
}: {
  onStart: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <ShaderBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-8 text-white md:px-10 z-20"
      >
        {/* top nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TaxSnap" className="size-10 rounded-xl object-contain shadow-md border border-emerald-400/30 bg-white/10 p-0.5" />
            <span className="font-display text-xl font-bold tracking-tight text-white">TaxSnap</span>
          </div>
          {isAuthenticated && (
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-200 backdrop-blur-md transition-all hover:bg-emerald-500/30 cursor-pointer shadow-sm"
            >
              Go to Dashboard <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>

        {/* centered hero section */}
        <div className="flex flex-1 flex-col items-center justify-center text-center py-12">
          <motion.img
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            src="/logo.png"
            alt="TaxSnap Logo"
            className="mb-6 size-28 md:size-36 object-contain filter drop-shadow-[0_12px_25px_rgba(0,0,0,0.6)]"
          />

          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200 backdrop-blur-xl bg-emerald-950/40 shadow-xl"
          >
            <Sparkles className="size-3.5 text-emerald-400" /> Est. TY 2026–27
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-7xl font-extrabold leading-[0.96] tracking-tight md:text-9xl text-white drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
          >
            TaxSnap
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 font-serif text-xl italic text-emerald-200/90 md:text-3xl font-light tracking-wide drop-shadow-md"
          >
            The New Regime, computed with clarity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3.5"
          >
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm px-8 py-4 shadow-2xl shadow-emerald-950/70 border border-emerald-300/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Coins className="size-4 text-emerald-200" /> Open Tax Dashboard
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* thin classic footer rule */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center border-t border-emerald-500/20 pt-6 text-xs uppercase tracking-[0.2em] text-emerald-200/70"
        >
          <div className="font-semibold text-emerald-300 tracking-widest normal-case text-xs">
            Made by Gigi Varughese
          </div>
        </motion.div>
      </motion.div>
    </ShaderBackground>
  );
}

function Login({
  onEnter,
  onBack,
}: {
  onEnter: (email?: string) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = supabase
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { full_name: fullName || email.split('@')[0] },
              },
            })
          : { data: null, error: { message: 'Supabase backend is initializing...' } };

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.session?.user?.email) {
          onEnter(data.session.user.email);
        } else if (data?.user?.email) {
          const loginRes = await supabase?.auth.signInWithPassword({ email, password });
          if (loginRes?.data?.session?.user?.email) {
            onEnter(loginRes.data.session.user.email);
          } else {
            setSuccessMsg('Account created successfully! Please check your email to confirm or sign in.');
            setMode('signin');
          }
        } else {
          setErrorMsg('Failed to create account. Please check details and try again.');
        }
      } else {
        const { data, error } = supabase
          ? await supabase.auth.signInWithPassword({
              email,
              password,
            })
          : { data: null, error: { message: 'Supabase backend is initializing...' } };

        if (error) {
          setErrorMsg(error.message || 'Invalid email or password. Please check your credentials.');
        } else if (data?.session?.user?.email) {
          onEnter(data.session.user.email);
        } else {
          setErrorMsg('Invalid email or password. Please check your credentials.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          onEnter('officer.google@taxsnap.gov.in');
        }
      } else {
        onEnter('officer.google@taxsnap.gov.in');
      }
    } catch (err: any) {
      onEnter('officer.google@taxsnap.gov.in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShaderBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-20 flex min-h-screen flex-col justify-between px-4 py-6 md:px-8"
      >
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Home
          </button>

          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="TaxSnap" className="size-8 rounded-lg object-contain bg-white/10 shadow-md border border-[#2dd4bf]/40 p-0.5" />
            <span className="font-display text-base font-bold tracking-tight text-white">TaxSnap</span>
          </div>
        </div>

        {/* Central Liquid Glass Card */}
        <div className="my-auto flex flex-col items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md rounded-3xl border border-[#2dd4bf]/30 bg-[#0c2320]/65 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-white"
          >
            {/* Header Icon & Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2.5">
                <img src="/logo.png" alt="TaxSnap" className="size-12 rounded-2xl object-contain shadow-lg border border-[#2dd4bf]/40 bg-white/10 p-1" />
                <span className="font-display text-2xl font-bold tracking-tight text-white">TaxSnap</span>
              </div>

              <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-white">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-emerald-200/75">
                {mode === 'signin'
                  ? 'Sign in to access your saved tax computations & Form 16 statements.'
                  : 'Sign up to start computing tax and save Form 16 statements.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-400/40 bg-red-950/60 p-3 text-xs font-medium text-red-200">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-950/60 p-3 text-xs font-medium text-emerald-200">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-200/80">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/70 px-4 py-3 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-200/80">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/70 px-4 py-3 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-200/80">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/70 px-4 py-3 pr-10 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-200/60 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-full bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#041019] font-bold text-sm py-3.5 shadow-lg shadow-[#2dd4bf]/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </>
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#2dd4bf]/20" />
              <span className="text-[0.65rem] uppercase tracking-widest text-teal-200/50">or continue with</span>
              <span className="h-px flex-1 bg-[#2dd4bf]/20" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-3 transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-teal-200/70">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                }}
                className="font-bold text-[#2dd4bf] hover:underline cursor-pointer"
              >
                {mode === 'signin' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </ShaderBackground>
  );
}


/* ---------------- Onboarding Screen (One-time Profile Setup) ---------------- */

function OnboardingScreen({
  initialEmail,
  initialProfile,
  onComplete,
}: {
  initialEmail: string;
  initialProfile: PersonalProfile;
  onComplete: (prof: PersonalProfile) => void;
}) {
  const [name, setName] = useState(initialProfile.name || initialEmail.split('@')[0] || '');
  const [email, setEmail] = useState(initialProfile.email || initialEmail || '');
  const [dob, setDob] = useState(initialProfile.dob || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [schoolOffice, setSchoolOffice] = useState(initialProfile.schoolOffice || '');
  const [position, setPosition] = useState(initialProfile.position || '');
  const [pan, setPan] = useState(initialProfile.pan || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PersonalProfile = {
      name,
      email,
      dob,
      phone,
      schoolOffice,
      position,
      pan: pan.toUpperCase(),
      completedOnboarding: true,
    };
    onComplete(updated);
  };

  return (
    <ShaderBackground theme="dark">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-6 py-8 text-white z-20"
      >
        {/* Top Branding Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="TaxSnap" className="size-9 rounded-xl object-contain bg-white/10 shadow-md border border-[#2dd4bf]/40 p-0.5" />
            <span className="font-display text-xl font-bold tracking-tight text-white">TaxSnap</span>
          </div>
        </div>

        {/* Central Liquid Glass Card */}
        <div className="my-auto flex flex-col items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-xl rounded-3xl border border-[#2dd4bf]/30 bg-[#0c2320]/75 p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-white"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex items-center justify-center">
                <img src="/logo.png" alt="TaxSnap Logo" className="size-16 rounded-2xl object-contain shadow-lg border border-[#2dd4bf]/40 bg-white/10 p-1" />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 px-4 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-emerald-200 backdrop-blur-xl bg-emerald-950/40 shadow-sm">
                <Sparkles className="size-3.5 text-emerald-400" /> One-Time Account Setup
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm">Complete Your Profile</h2>
              <p className="mt-2 text-xs leading-relaxed text-emerald-200/75">
                Please enter your personal details for one-time setup to access your TaxSnap tax dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">Full Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200/50"><User className="size-4" /></span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">Gmail / Email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200/50"><Mail className="size-4" /></span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">Date of Birth (DOB)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200/50"><Calendar className="size-4" /></span>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">Phone Number</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200/50"><Phone className="size-4" /></span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">School / Office Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200/50"><Building2 className="size-4" /></span>
                    <input
                      type="text"
                      required
                      value={schoolOffice}
                      onChange={(e) => setSchoolOffice(e.target.value)}
                      placeholder="School / Office Name"
                      className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">Position / Designation</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-200/50"><Briefcase className="size-4" /></span>
                    <input
                      type="text"
                      required
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Position / Designation"
                      className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-200/80">PAN Number (Optional)</label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/75 py-2.5 px-4 font-mono uppercase text-sm text-white placeholder:text-teal-200/40 outline-none transition-all focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm py-4 shadow-xl shadow-emerald-950/70 border border-emerald-300/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Save Profile &amp; Go to Dashboard</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </ShaderBackground>
  );
}

/* ---------------- Dashboard ---------------- */

function Dashboard({
  userEmail,
  personalProfile,
  onUpdatePersonalProfile,
  savedComputations,
  onStartCalculation,
  onLoadComputation,
  onDeleteComputation,
  onSignOut,
}: {
  userEmail: string;
  personalProfile: PersonalProfile;
  onUpdatePersonalProfile: (prof: PersonalProfile) => void;
  savedComputations: SavedComputation[];
  onStartCalculation: () => void;
  onLoadComputation: (comp: SavedComputation, autoPrint?: boolean) => void;
  onDeleteComputation: (id: string) => void;
  onSignOut: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'slabs' | 'rules' | 'contact'>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('taxsnap_theme') as 'dark' | 'light') || 'dark';
  });

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('taxsnap_theme', newTheme);
  };

  const isLight = theme === 'light';

  const [settingsSubTab, setSettingsSubTab] = useState<'account' | 'security' | 'appearance' | 'preferences' | 'help'>('account');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedPan, setCopiedPan] = useState(false);

  const handleCopyPan = () => {
    if (personalProfile.pan) {
      navigator.clipboard.writeText(personalProfile.pan);
      setCopiedPan(true);
      setTimeout(() => setCopiedPan(false), 2000);
    }
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(personalProfile.name || '');
  const [editEmail, setEditEmail] = useState(personalProfile.email || userEmail || '');
  const [editDob, setEditDob] = useState(personalProfile.dob || '');
  const [editPhone, setEditPhone] = useState(personalProfile.phone || '');
  const [editSchoolOffice, setEditSchoolOffice] = useState(personalProfile.schoolOffice || '');
  const [editPosition, setEditPosition] = useState(personalProfile.position || '');
  const [editPan, setEditPan] = useState(personalProfile.pan || '');

  const [contactName, setContactName] = useState(personalProfile.name || userEmail.split('@')[0] || '');
  const [contactEmail, setContactEmail] = useState(personalProfile.email || userEmail || '');
  const [contactPhone, setContactPhone] = useState(personalProfile.phone || '');
  const [contactSubject, setContactSubject] = useState('Tax Calculation Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  const userName = personalProfile.name || userEmail.split('@')[0] || 'Taxpayer';
  const userInitials = userName.charAt(0).toUpperCase();

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PersonalProfile = {
      name: editName,
      email: editEmail,
      dob: editDob,
      phone: editPhone,
      schoolOffice: editSchoolOffice,
      position: editPosition,
      pan: editPan.toUpperCase(),
      completedOnboarding: true,
    };
    onUpdatePersonalProfile(updated);
    setIsEditingProfile(false);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setIsSendingSupport(true);

    await sendSupportTicket({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      subject: contactSubject,
      message: contactMessage,
    });

    setIsSendingSupport(false);
    setContactSent(true);
  };

  return (
    <ShaderBackground theme={theme}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`min-h-screen relative z-20 pb-20 transition-colors duration-300 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}
      >
        {/* Floating Centered Glass Header Pill (matching sample photo) */}
        <header className="no-print sticky top-4 z-50 transition-all duration-300 py-2">
          <div className="mx-auto flex max-w-7xl items-center justify-center px-4">
            <NavHeader
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as any)}
              theme={theme}
            />
          </div>
        </header>

        {/* Main Container */}
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-20">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              {/* High-Impact Figma Hero Banner */}
              <div className={`relative overflow-hidden rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl md:p-12 transition-all ${
                isLight
                  ? 'border-teal-200/80 bg-white/85 text-slate-900 shadow-teal-900/5'
                  : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
              }`}>
                {/* Background Glass Glow Effects */}
                <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10 space-y-6 max-w-3xl">


                  <h1 className="font-display text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl md:text-6xl">
                    Smart New Tax Regime <br />
                    <span className={`font-serif italic bg-gradient-to-r ${
                      isLight
                        ? 'from-teal-700 via-teal-600 to-indigo-700'
                        : 'from-[#2dd4bf] via-emerald-300 to-teal-100'
                    } bg-clip-text text-transparent`}>
                      Calculator 2026–27
                    </span>
                  </h1>



                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button
                      onClick={onStartCalculation}
                      className={`group inline-flex items-center justify-center gap-3 rounded-full font-bold text-base px-8 py-3.5 shadow-xl transition-all transform hover:scale-105 cursor-pointer ${
                        isLight
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
                          : 'bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#041019] shadow-[#2dd4bf]/25'
                      }`}
                    >
                      <Calculator className="size-5" />
                      <span>Calculate Tax Now</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button
                      onClick={() => setActiveTab('slabs')}
                      className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-xs font-bold transition-all cursor-pointer ${
                        isLight
                          ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                          : 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <TrendingUp className={`size-4 ${isLight ? 'text-teal-600' : 'text-teal-300'}`} /> View Tax Slabs
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Glass KPI Cards Grid */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className={`group rounded-3xl border p-6 shadow-xl transition-all ${
                  isLight
                    ? 'border-teal-200/60 bg-white/80 text-slate-900 hover:border-teal-400'
                    : 'border-[#2dd4bf]/25 bg-[#091a17]/70 text-white hover:border-[#2dd4bf]/50'
                }`}>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30">
                    <TrendingUp className="size-6 text-teal-600" />
                  </div>
                  <span className={`text-[0.65rem] font-bold uppercase tracking-wider block ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>TY 2026–27 Slabs</span>
                  <h3 className="font-bold text-lg mt-0.5">Tax-Free to ₹12.75L</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                    0% up to ₹4L · 5% up to ₹8L · 10% up to ₹12L (Rebated u/s 156)
                  </p>
                </div>

                <div className={`group rounded-3xl border p-6 shadow-xl transition-all ${
                  isLight
                    ? 'border-teal-200/60 bg-white/80 text-slate-900 hover:border-teal-400'
                    : 'border-[#2dd4bf]/25 bg-[#091a17]/70 text-white hover:border-[#2dd4bf]/50'
                }`}>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 border border-emerald-400/30">
                    <ShieldCheck className="size-6" />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600 block">Section 156 Relief</span>
                  <h3 className="font-bold text-lg mt-0.5">Full Tax Rebate</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                    ₹60,000 maximum tax rebate for taxable income up to ₹12.00 Lakhs.
                  </p>
                </div>

                <div className={`group rounded-3xl border p-6 shadow-xl transition-all ${
                  isLight
                    ? 'border-teal-200/60 bg-white/80 text-slate-900 hover:border-teal-400'
                    : 'border-[#2dd4bf]/25 bg-[#091a17]/70 text-white hover:border-[#2dd4bf]/50'
                }`}>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-400/30">
                    <ClipboardList className="size-6" />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-600 block">Deduction 19(2)</span>
                  <h3 className="font-bold text-lg mt-0.5">₹75,000 Flat Off</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                    Flat ₹75,000 standard deduction for salaried employees. ₹50,000 for pensioners.
                  </p>
                </div>

                <div className={`group rounded-3xl border p-6 shadow-xl transition-all ${
                  isLight
                    ? 'border-teal-200/60 bg-white/80 text-slate-900 hover:border-teal-400'
                    : 'border-[#2dd4bf]/25 bg-[#091a17]/70 text-white hover:border-[#2dd4bf]/50'
                }`}>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-600 border border-teal-400/30">
                    <ReceiptText className="size-6" />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-teal-600 block">Statutory Exemptions</span>
                  <h3 className="font-bold text-lg mt-0.5">Retirement Tax-Free</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                    DCRG u/s 19(3) &amp; Commutation u/s 19(7) remain 100% tax-free under New Regime.
                  </p>
                </div>
              </div>

              {/* Rearranged 2-Column Content Grid */}
              <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
                {/* Executive Taxpayer Profile Card */}
                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden transition-all ${
                  isLight
                    ? 'border-teal-200/80 bg-white/85 text-slate-900'
                    : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                }`}>
                  <div>
                    <div className={`flex items-center gap-4 border-b pb-5 ${isLight ? 'border-teal-200' : 'border-[#2dd4bf]/20'}`}>
                      <div className={`flex size-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-xl border ${
                        isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-[#2dd4bf]/20 text-[#2dd4bf] border-[#2dd4bf]/40'
                      }`}>
                        {userInitials}
                      </div>
                      <div className="overflow-hidden">
                        <span className={`text-[0.65rem] font-bold uppercase tracking-widest block ${isLight ? 'text-teal-700' : 'text-[#2dd4bf]'}`}>TAXPAYER PROFILE</span>
                        <h4 className="font-display text-xl font-bold truncate">{userName}</h4>
                        <p className={`text-xs truncate font-mono ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>{personalProfile.email || userEmail}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-xs">
                      <div className={`flex justify-between items-center py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#2dd4bf]/15'}`}>
                        <span className={isLight ? 'text-slate-500' : 'text-emerald-200/70'}>Designation:</span>
                        <strong className="font-semibold">{personalProfile.position || 'Not set'}</strong>
                      </div>
                      <div className={`flex justify-between items-center py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#2dd4bf]/15'}`}>
                        <span className={isLight ? 'text-slate-500' : 'text-emerald-200/70'}>Office / School:</span>
                        <strong className="font-semibold">{personalProfile.schoolOffice || 'Not set'}</strong>
                      </div>
                      <div className={`flex justify-between items-center py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#2dd4bf]/15'}`}>
                        <span className={isLight ? 'text-slate-500' : 'text-emerald-200/70'}>PAN Number:</span>
                        <strong className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                          isLight ? 'bg-teal-50 text-teal-800 border-teal-200' : 'text-[#2dd4bf] bg-[#2dd4bf]/15 border-[#2dd4bf]/30'
                        }`}>
                          {personalProfile.pan || 'NOT SET'}
                        </strong>
                      </div>
                      <div className={`flex justify-between items-center py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#2dd4bf]/15'}`}>
                        <span className={isLight ? 'text-slate-500' : 'text-emerald-200/70'}>Date of Birth:</span>
                        <strong className="font-semibold">{personalProfile.dob || 'Not set'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className={isLight ? 'text-slate-500' : 'text-emerald-200/70'}>Applicable Regime:</span>
                        <strong className={`font-semibold ${isLight ? 'text-teal-700' : 'text-[#2dd4bf]'}`}>New Regime (115BAC)</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full border py-3 text-xs font-bold transition-all cursor-pointer ${
                      isLight
                        ? 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white'
                        : 'border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-[#041019]'
                    }`}
                  >
                    <User className="size-4" /> View &amp; Edit Settings Details
                  </button>
                </div>

                {/* Saved Statements Card (Recent 5 Calculations) */}
                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl flex flex-col justify-between transition-all ${
                  isLight
                    ? 'border-teal-200/80 bg-white/85 text-slate-900'
                    : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                }`}>
                  <div>
                    <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isLight ? 'border-teal-200' : 'border-[#2dd4bf]/20'}`}>
                      <div>
                        <h3 className="font-display text-lg font-bold">Recent 5 Tax Calculations</h3>
                        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>Your 5 most recent tax calculations saved locally.</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold font-mono ${
                        isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-[#2dd4bf]/20 border-[#2dd4bf]/30 text-[#2dd4bf]'
                      }`}>
                        {Math.min(5, savedComputations.length)} / {savedComputations.length} Saved
                      </span>
                    </div>

                    {savedComputations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className={`mb-4 flex size-16 items-center justify-center rounded-2xl border shadow-inner ${
                          isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-[#071815] border-[#2dd4bf]/30 text-[#2dd4bf]'
                        }`}>
                          <FileText className="size-8" />
                        </div>
                        <h4 className="font-display text-xl font-bold">No Calculations Saved Yet</h4>
                        <p className={`mt-1 max-w-sm text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                          Your saved tax statements will appear here after you compute your salary tax in 4 easy steps.
                        </p>
                        <button
                          onClick={onStartCalculation}
                          className={`mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg transition-all cursor-pointer ${
                            isLight
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
                              : 'bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#041019] shadow-[#2dd4bf]/25'
                          }`}
                        >
                          <Calculator className="size-4" /> Start Your Calculation
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                        {savedComputations.slice(0, 5).map((comp) => (
                          <div
                            key={comp.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                              isLight
                                ? 'border-teal-200/60 bg-slate-50 hover:bg-white hover:border-teal-400'
                                : 'border-[#2dd4bf]/20 bg-[#071815]/60 hover:border-[#2dd4bf]/50 hover:bg-[#071815]'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                                  isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'text-[#2dd4bf] bg-[#2dd4bf]/15 border-[#2dd4bf]/30'
                                }`}>
                                  #{comp.id.substring(0, 8)}
                                </span>
                                <p className="font-bold text-sm">{comp.profile?.name || 'Tax Statement'}</p>
                              </div>
                              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                                Gross: <span className="font-mono font-medium">{formatINR(comp.grossIncome)}</span> · Net Payable:{' '}
                                <span className={`font-mono font-bold ${isLight ? 'text-teal-700' : 'text-[#2dd4bf]'}`}>{formatINR(comp.netPayable)}</span>
                              </p>
                              <p className={`text-[0.65rem] font-mono ${isLight ? 'text-slate-400' : 'text-emerald-200/50'}`}>Saved on {comp.date}</p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => onLoadComputation(comp, false)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                  isLight
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                    : 'bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#041019]'
                                }`}
                              >
                                <FileText className="size-3.5" /> View Statement
                              </button>
                              <button
                                onClick={() => onLoadComputation(comp, true)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gold hover:brightness-105 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                              >
                                <Printer className="size-3.5" /> Print
                              </button>
                              <button
                                onClick={() => onDeleteComputation(comp.id)}
                                className="p-1.5 rounded-full text-rose-400 hover:bg-rose-500/20 transition-colors"
                                title="Delete calculation"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* Tab 2: Settings / Profile (Figma 2-Column Redesign) */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className={`font-display text-3xl md:text-4xl font-extrabold tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    Profile settings
                  </h1>
                  <p className={`text-xs md:text-sm mt-1 ${
                    isLight ? 'text-slate-600' : 'text-emerald-200/70'
                  }`}>
                    Manage your identity credentials, active browser sessions, theme preferences, and support FAQ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-5 py-2 text-xs font-bold text-red-300 hover:bg-red-700 hover:text-white transition-all shadow-md cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <LogOut className="size-4" /> Sign Out
                </button>
              </div>

              {/* Figma 2-Column Grid Layout */}
              <div className="grid gap-8 lg:grid-cols-12 items-start pt-2">
                {/* Left Column: Vertical Sidebar Navigation (lg:col-span-3) */}
                <div className={`lg:col-span-3 rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl space-y-4 transition-all ${
                  isLight ? 'border-teal-200/80 bg-white/90 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                }`}>
                  <div>
                    <span className={`text-[0.68rem] font-bold uppercase tracking-wider block mb-3 px-3 ${
                      isLight ? 'text-slate-600' : 'text-emerald-200/80'
                    }`}>
                      Profile Settings
                    </span>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsSubTab('account')}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                          settingsSubTab === 'account'
                            ? isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-sm'
                            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-200/80 hover:bg-white/5'
                        }`}
                      >
                        <User className="size-4 text-teal-500" /> Account Details
                      </button>

                      <button
                        onClick={() => setSettingsSubTab('security')}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                          settingsSubTab === 'security'
                            ? isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-sm'
                            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-200/80 hover:bg-white/5'
                        }`}
                      >
                        <Lock className="size-4 text-indigo-400" /> Security
                      </button>

                      <button
                        onClick={() => setSettingsSubTab('appearance')}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                          settingsSubTab === 'appearance'
                            ? isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-sm'
                            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-200/80 hover:bg-white/5'
                        }`}
                      >
                        <Sun className="size-4 text-amber-400" /> Appearance
                      </button>

                      <button
                        onClick={() => setSettingsSubTab('preferences')}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                          settingsSubTab === 'preferences'
                            ? isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-sm'
                            : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-emerald-200/80 hover:bg-white/5'
                        }`}
                      >
                        <Sliders className="size-4 text-purple-400" /> Tax Preferences
                      </button>

                      <button
                        onClick={() => setSettingsSubTab('help')}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                          settingsSubTab === 'help'
                            ? isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-sm'
                            : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-emerald-200/80 hover:bg-white/5'
                        }`}
                      >
                        <Headphones className="size-4 text-teal-400" /> Help Center
                      </button>
                    </div>
                    </div>
                  </div>

                {/* Right Column: Main Content Area (lg:col-span-9) */}
                <div className="lg:col-span-9 space-y-6">
                  {/* Account Details Panel */}
                  {settingsSubTab === 'account' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className={`rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-2xl transition-all ${
                        isLight ? 'border-teal-200/80 bg-white/90 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                      }`}>
                        <div className="flex items-center justify-between border-b pb-4 mb-6 border-current/10">
                          <div>
                            <h3 className="font-display text-xl font-bold">Login details</h3>
                            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                              Your official credentials, designation, and PAN identity.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                              isLight
                                ? 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-600 hover:text-white'
                                : 'border-[#2dd4bf]/40 bg-[#2dd4bf]/10 text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-[#041019]'
                            }`}
                          >
                            <Edit3 className="size-3.5" /> {isEditingProfile ? 'Cancel' : 'Edit Details'}
                          </button>
                        </div>

                        {isEditingProfile ? (
                          <form onSubmit={handleSaveProfileEdit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Full Name</label>
                                <input
                                  type="text"
                                  required
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Email Address</label>
                                <input
                                  type="email"
                                  required
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>School / Office</label>
                                <input
                                  type="text"
                                  value={editSchoolOffice}
                                  onChange={(e) => setEditSchoolOffice(e.target.value)}
                                  className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Position / Designation</label>
                                <input
                                  type="text"
                                  value={editPosition}
                                  onChange={(e) => setEditPosition(e.target.value)}
                                  className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>PAN Credential</label>
                                <input
                                  type="text"
                                  maxLength={10}
                                  value={editPan}
                                  onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                                  className={`rounded-xl border py-2.5 px-3.5 font-mono uppercase text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Date of Birth (DOB)</label>
                                <input
                                  type="date"
                                  value={editDob}
                                  onChange={(e) => setEditDob(e.target.value)}
                                  className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Phone Number</label>
                                <input
                                  type="tel"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="pt-3 flex items-center gap-3">
                              <button
                                type="submit"
                                className="rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-700 transition-all cursor-pointer"
                              >
                                Update Settings
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingProfile(false)}
                                className={`rounded-full border px-5 py-2.5 text-xs font-bold cursor-pointer ${
                                  isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-white/20 text-white hover:bg-white/10'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Stacked Figma Card with rows separated by thin dividers */
                          <div className={`overflow-hidden rounded-2xl border divide-y transition-all ${
                            isLight ? 'border-slate-200/90 bg-slate-50/70 divide-slate-200' : 'border-[#2dd4bf]/20 bg-[#071815]/60 divide-[#2dd4bf]/15'
                          }`}>
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>Full Name</span>
                              <span className="font-bold text-sm">{personalProfile.name || userName}</span>
                            </div>

                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>Email Address</span>
                              <span className="font-semibold text-sm font-mono">{personalProfile.email || userEmail}</span>
                            </div>

                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>School / Office</span>
                              <span className="font-semibold text-sm">{personalProfile.schoolOffice || 'HST · sjcet'}</span>
                            </div>

                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>Official PAN Credential</span>
                              <div className="flex items-center gap-3">
                                <span className={`font-mono font-bold text-sm uppercase ${isLight ? 'text-teal-800' : 'text-[#2dd4bf]'}`}>
                                  {personalProfile.pan || 'ABCDE1234F'}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCopyPan}
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[0.7rem] font-bold cursor-pointer transition-all ${
                                    isLight ? 'border-teal-300 bg-white text-teal-800 hover:bg-teal-100' : 'border-[#2dd4bf]/40 bg-[#2dd4bf]/15 text-[#2dd4bf]'
                                  }`}
                                >
                                  {copiedPan ? <Check className="size-3" /> : <Copy className="size-3" />}
                                  {copiedPan ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            </div>

                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>2-Step Verification</span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-600 px-3 py-0.5 text-xs font-bold border border-emerald-500/30">
                                <ShieldCheck className="size-3.5" /> Enabled
                              </span>
                            </div>

                            {/* Update Settings Action Button */}
                            <div className="p-4 bg-white/5 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setIsEditingProfile(true)}
                                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 shadow-md transition-all cursor-pointer"
                              >
                                Update Settings
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Security & Sessions Panel */}
                  {settingsSubTab === 'security' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <SecuritySessions isLight={isLight} userEmail={userEmail} onSignOut={onSignOut} />
                    </motion.div>
                  )}

                  {/* Appearance & Theme Panel */}
                  {settingsSubTab === 'appearance' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className={`rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-2xl transition-all ${
                        isLight ? 'border-teal-200/80 bg-white/90 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                      }`}>
                        <div className="border-b pb-4 mb-6 border-current/10">
                          <h3 className="font-display text-xl font-bold">Appearance &amp; Theme Engine</h3>
                          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                            Choose your preferred visual theme for the application.
                          </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div
                            onClick={() => handleThemeChange('dark')}
                            className={`group relative overflow-hidden rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                              theme === 'dark'
                                ? 'border-[#2dd4bf] bg-[#071815] shadow-xl ring-2 ring-[#2dd4bf]/30'
                                : 'border-slate-700/50 bg-black/40 hover:border-slate-500'
                            }`}
                          >
                            <div className="h-32 rounded-2xl bg-gradient-to-br from-[#041019] via-[#064e3b] to-[#0d9488] p-4 flex flex-col justify-between border border-[#2dd4bf]/30 shadow-inner">
                              <div className="flex items-center justify-between">
                                <span className="h-2.5 w-16 rounded-full bg-[#2dd4bf]/60" />
                                <span className="size-3 rounded-full bg-[#2dd4bf]" />
                              </div>
                              <div className="space-y-1.5">
                                <div className="h-2 w-28 rounded-full bg-white/60" />
                                <div className="h-2 w-20 rounded-full bg-emerald-300/40" />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-white">Dark Liquid Theme</h4>
                                <p className="text-xs text-emerald-200/70">Deep midnight teal &amp; GPU mesh gradient shader</p>
                              </div>
                              {theme === 'dark' && (
                                <span className="flex size-7 items-center justify-center rounded-full bg-[#2dd4bf] text-[#041019] font-bold">
                                  <Check className="size-4" />
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            onClick={() => handleThemeChange('light')}
                            className={`group relative overflow-hidden rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                              theme === 'light'
                                ? 'border-teal-500 bg-white shadow-xl ring-2 ring-teal-200'
                                : 'border-slate-200 bg-slate-50 hover:border-teal-300'
                            }`}
                          >
                            <div className="h-32 rounded-2xl bg-gradient-to-br from-[#f0fdf4] via-[#e0f2fe] to-[#ccfbf1] p-4 flex flex-col justify-between border border-teal-200 shadow-inner">
                              <div className="flex items-center justify-between">
                                <span className="h-2.5 w-16 rounded-full bg-teal-600/60" />
                                <span className="size-3 rounded-full bg-teal-600" />
                              </div>
                              <div className="space-y-1.5">
                                <div className="h-2 w-28 rounded-full bg-slate-800/60" />
                                <div className="h-2 w-20 rounded-full bg-teal-700/40" />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">Light Executive Theme</h4>
                                <p className="text-xs text-slate-600">Clean light glass with crisp slate typography</p>
                              </div>
                              {theme === 'light' && (
                                <span className="flex size-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold">
                                  <Check className="size-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tax Preferences Panel */}
                  {settingsSubTab === 'preferences' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className={`rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-2xl transition-all ${
                        isLight ? 'border-teal-200/80 bg-white/90 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                      }`}>
                        <div className="border-b pb-4 mb-6 border-current/10">
                          <h3 className="font-display text-xl font-bold">Tax Regime &amp; Computation Defaults</h3>
                          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                            Configured to Section 115BAC specifications for Tax Year 2026–27.
                          </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div className={`rounded-2xl border p-5 transition-all ${
                            isLight ? 'border-teal-200/60 bg-slate-50' : 'border-[#2dd4bf]/20 bg-[#071815]/60'
                          }`}>
                            <span className={`text-[0.65rem] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-emerald-200/60'}`}>Tax Year</span>
                            <h4 className="font-bold text-base mt-1">TY 2026–27 (AY 2027–28)</h4>
                          </div>

                          <div className={`rounded-2xl border p-5 transition-all ${
                            isLight ? 'border-teal-200/60 bg-slate-50' : 'border-[#2dd4bf]/20 bg-[#071815]/60'
                          }`}>
                            <span className={`text-[0.65rem] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-emerald-200/60'}`}>Statutory Standard Deduction</span>
                            <h4 className="font-bold text-base mt-1">₹75,000 (Salaried)</h4>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Help Center Panel */}
                  {settingsSubTab === 'help' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className={`rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-2xl transition-all ${
                        isLight ? 'border-teal-200/80 bg-white/90 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                      }`}>
                        <div className="border-b pb-4 mb-6 border-current/10">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold mb-2 ${
                            isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-[#2dd4bf]/20 border-[#2dd4bf]/30 text-[#2dd4bf]'
                          }`}>
                            <HelpCircle className="size-3.5" /> Support &amp; Knowledge Base
                          </span>
                          <h3 className="font-display text-2xl font-bold">Help Center &amp; Frequently Asked Questions</h3>
                          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                            7 instant solutions for common TaxSnap questions and TY 2026–27 New Tax Regime rules.
                          </p>
                        </div>

                        <div className="space-y-3.5">
                          {[
                            {
                              q: 'How does the New Tax Regime (Section 115BAC) for TY 2026–27 calculate my tax?',
                              a: 'TaxSnap automatically applies the official 6-tier slab rate structure (0% up to ₹4L, 5% up to ₹8L, 10% up to ₹12L, 15% up to ₹16L, 20% up to ₹20L, 25% up to ₹24L, and 30% above ₹24L). It also incorporates the statutory ₹75,000 Standard Deduction under Section 19(2) and the Section 156 Tax Rebate for taxable income up to ₹12 Lakhs.',
                              icon: Calculator,
                            },
                            {
                              q: 'Why is gross income up to ₹12.75 Lakhs completely tax-free for salaried taxpayers?',
                              a: 'For Tax Year 2026–27 (AY 2027–28), salaried taxpayers receive a flat ₹75,000 Standard Deduction, reducing ₹12,75,000 Gross Income to ₹12,00,000 Net Taxable Income. Under Section 156, a full tax rebate of up to ₹60,000 is credited, reducing your net tax liability to exactly ₹0.',
                              icon: CheckCircle2,
                            },
                            {
                              q: 'How do I enter my monthly salary breakdown or annual salary summary?',
                              a: 'On your Home Dashboard, click "Calculate Tax Now". Step 1 gives you a flexible toggle: choose "Month-by-Month Entry" to input individual 12-month Basic, DA, HRA, and Special Allowances, or select "Annual Summary" for a quick 1-minute annual total entry.',
                              icon: FileText,
                            },
                            {
                              q: 'How can I generate and download my print-ready Form 16 PDF statement?',
                              a: 'Once you complete your salary entry steps, click "View Statement" or "Generate Form 16 PDF". The app generates a formatted, Govt-compliant Form 16 Schedule 1 PDF report with breakdown tables and DDO sign blocks, ready to print or save.',
                              icon: Printer,
                            },
                            {
                              q: 'Are statutory retirement benefits like Gratuity and Leave Encashment tax-exempt?',
                              a: 'Yes! Death-cum-Retirement Gratuity (DCRG) under Section 10(10) (up to ₹20L / ₹25L), Commutation of Pension under Section 10(10A), and Leave Salary Encashment under Section 10(10AA) remain 100% tax-exempt under the New Tax Regime for TY 2026–27.',
                              icon: ShieldCheck,
                            },
                            {
                              q: 'How do I switch between Dark Liquid Theme and Light Executive Theme?',
                              a: 'Navigate to Settings > Appearance & Theme. Click on either the Dark Liquid Theme card or Light Executive Theme card. Your chosen theme switches instantly and is saved to your browser local storage for future sessions.',
                              icon: Sun,
                            },
                            {
                              q: 'How do I save, access, or restore my past tax calculations?',
                              a: 'TaxSnap automatically stores your computed tax statements locally on your device. You can view, search, or reload all saved statements at any time from the "Saved Tax Statements" section on your Home dashboard without losing data.',
                              icon: ClipboardList,
                            },
                          ].map((faq, idx) => {
                            const Icon = faq.icon;
                            const isOpen = openFaqIndex === idx;

                            return (
                              <div
                                key={idx}
                                className={`overflow-hidden rounded-2xl border transition-all ${
                                  isLight
                                    ? isOpen ? 'border-teal-400 bg-teal-50/70 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-teal-300'
                                    : isOpen ? 'border-[#2dd4bf]/50 bg-[#071815] shadow-lg' : 'border-[#2dd4bf]/20 bg-[#071815]/50 hover:border-[#2dd4bf]/40'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                  className="w-full p-4 flex items-center justify-between text-left gap-4 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`flex size-8 items-center justify-center rounded-xl shrink-0 ${
                                      isLight ? 'bg-teal-100 text-teal-700' : 'bg-[#2dd4bf]/20 text-[#2dd4bf]'
                                    }`}>
                                      <Icon className="size-4" />
                                    </div>
                                    <h4 className="font-bold text-xs md:text-sm leading-snug">
                                      {idx + 1}. {faq.q}
                                    </h4>
                                  </div>

                                  <ChevronDown className={`size-4 shrink-0 transition-transform duration-200 ${
                                    isOpen ? 'rotate-180 text-teal-500' : isLight ? 'text-slate-400' : 'text-emerald-200/50'
                                  }`} />
                                </button>

                                {isOpen && (
                                  <div className={`px-4 pb-4 pt-1 text-xs leading-relaxed border-t transition-all ${
                                    isLight ? 'border-teal-200/60 text-slate-700 bg-white/60' : 'border-[#2dd4bf]/20 text-emerald-200/90 bg-black/20'
                                  }`}>
                                    <p className="pt-2">{faq.a}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: TY 2026–27 Tax Slabs */}
          {activeTab === 'slabs' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl md:p-8 transition-all ${
                isLight ? 'border-teal-200/80 bg-white/85 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
              }`}>
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-bold">New Tax Regime Slabs (TY 2026–27)</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold ${
                    isLight ? 'bg-teal-100 border-teal-300 text-teal-900' : 'bg-[#2dd4bf]/20 border-[#2dd4bf]/40 text-[#2dd4bf]'
                  }`}>
                    <CheckCircle2 className="size-4 text-teal-600" /> Effective Tax-Free Limit: ₹12.75 Lakhs
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className={`text-xs font-semibold uppercase tracking-wider border-b ${
                        isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#071815]/70 text-emerald-200/70 border-[#2dd4bf]/20'
                      }`}>
                        <th className="px-4 py-3">Income Slab (₹)</th>
                        <th className="px-4 py-3 text-center">Tax Rate</th>
                        <th className="px-4 py-3">Key Highlights &amp; Rebate Rules</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#2dd4bf]/15'}`}>
                      <tr className={isLight ? 'bg-teal-50/80' : 'bg-[#2dd4bf]/10'}>
                        <td className="px-4 py-3.5 font-mono font-bold">Up to ₹4,00,000</td>
                        <td className={`px-4 py-3.5 text-center font-bold ${isLight ? 'text-teal-700' : 'text-[#2dd4bf]'}`}>NIL (0%)</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Completely exempt basic threshold for all taxpayers</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-mono">₹4,00,001 – ₹8,00,000</td>
                        <td className="px-4 py-3.5 text-center font-semibold">5%</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>Covered under Section 156 Rebate up to ₹12L</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-mono">₹8,00,001 – ₹12,00,000</td>
                        <td className="px-4 py-3.5 text-center font-semibold">10%</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>Fully rebated (₹60,000 max rebate u/s 156)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-mono">₹12,00,001 – ₹16,00,000</td>
                        <td className="px-4 py-3.5 text-center font-semibold">15%</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>Marginal relief applies if income slightly exceeds ₹12L</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-mono">₹16,00,001 – ₹20,00,000</td>
                        <td className="px-4 py-3.5 text-center font-semibold">20%</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>Standard tax bracket</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3.5 font-mono">₹20,00,001 – ₹24,00,000</td>
                        <td className="px-4 py-3.5 text-center font-semibold">25%</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>Higher bracket</td>
                      </tr>
                      <tr className={isLight ? 'bg-amber-50/50' : 'bg-[#071815]'}>
                        <td className="px-4 py-3.5 font-mono font-bold">Above ₹24,00,000</td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-600">30%</td>
                        <td className={`px-4 py-3.5 text-xs ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>Maximum slab rate + applicable surcharge</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 4: Exemption Rules */}
          {activeTab === 'rules' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all ${
                  isLight ? 'border-teal-200/80 bg-white/85 text-slate-900' : 'border-[#2dd4bf]/25 bg-[#0c2320]/80 text-white'
                }`}>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#2dd4bf]/20 text-teal-600">
                    <ClipboardList className="size-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold">Standard Deduction u/s 19(2)</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>
                    Salaried individuals and pensioners receive a flat <strong className={isLight ? 'text-teal-700' : 'text-[#2dd4bf]'}>₹75,000 Standard Deduction</strong> under the New Tax Regime for TY 2026–27. Pensioners receive ₹50,000.
                  </p>
                </div>

                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all ${
                  isLight ? 'border-teal-200/80 bg-white/85 text-slate-900' : 'border-[#2dd4bf]/25 bg-[#0c2320]/80 text-white'
                }`}>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold">Tax Rebate u/s 156</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>
                    Resident individuals with net taxable income up to <strong className="text-emerald-600 font-bold">₹12,00,000</strong> pay ZERO income tax! A full rebate up to ₹60,000 is automatically credited.
                  </p>
                </div>

                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all ${
                  isLight ? 'border-teal-200/80 bg-white/85 text-slate-900' : 'border-[#2dd4bf]/25 bg-[#0c2320]/80 text-white'
                }`}>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-600">
                    <Wallet className="size-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold">NPS Employer Contribution (80CCD(2))</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>
                    Employer’s contribution towards NPS up to 14% of Basic + DA for Central/State Govt employees (10% for non-Govt) is fully tax-exempt under New Regime.
                  </p>
                </div>

                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all ${
                  isLight ? 'border-teal-200/80 bg-white/85 text-slate-900' : 'border-[#2dd4bf]/25 bg-[#0c2320]/80 text-white'
                }`}>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                    <ReceiptText className="size-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold">Retirement Benefits (Gratuity &amp; Leave)</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>
                    Gratuity u/s 10(10) (up to ₹20 Lakhs / ₹25 Lakhs) and Commutation of Pension u/s 10(10A) remain 100% tax-free under New Tax Regime TY 2026–27.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 5: Contact Support */}
          {activeTab === 'contact' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <div className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl md:p-8 transition-all ${
                  isLight ? 'border-teal-200/80 bg-white/85 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
                }`}>
                  <div className="mb-6">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                      isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-[#2dd4bf]/20 border-[#2dd4bf]/30 text-[#2dd4bf]'
                    }`}>
                      <Mail className="size-3.5" /> Support Desk
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-bold">Submit Support Request</h3>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
                      Have questions about your tax computation, deductions, or slab rules? Fill out the form below and our support team will get back to you.
                    </p>
                  </div>

                  {contactSent && (
                    <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-950/60 p-4 text-xs font-medium text-emerald-200 flex items-center gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-teal-500" />
                      <div>
                        <p className="font-bold text-sm text-white">Support Request Submitted Successfully!</p>
                        <p className="mt-0.5">Your support query has been received. Our team will review your inquiry and follow up with you promptly.</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendEmail} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <label className={`text-[0.7rem] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="John Doe"
                          className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                            isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={`text-[0.7rem] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Email</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                            isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={`text-[0.7rem] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Phone</label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                            isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[0.7rem] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Subject</label>
                      <input
                        type="text"
                        required
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="e.g. Question regarding Section 156 Rebate"
                        className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                          isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[0.7rem] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>Message / Query Details</label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Describe your tax query or issue in detail..."
                        className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                          isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-[#2dd4bf]'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingSupport}
                      className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold shadow-xl transition-all disabled:opacity-50 cursor-pointer ${
                        isLight
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25'
                          : 'bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#041019] shadow-[#2dd4bf]/25'
                      }`}
                    >
                      {isSendingSupport ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      <span>Submit Support Ticket</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Executive Dashboard Footer */}
        <footer className="no-print mt-16 border-t border-[#2dd4bf]/20 pt-8 pb-4 text-center text-xs text-emerald-200/60">
          <p className="font-medium">
            TaxSnap Tax Engine · TY 2026–27
          </p>
          <p className="mt-1 text-sm font-bold text-white tracking-wide">
            Made by Gigi Varughese
          </p>
        </footer>
      </motion.div>
    </ShaderBackground>
  );
}

/* ---------------- Shared calc UI ---------------- */

function TopBar({
  userEmail,
  onHome,
}: {
  userEmail?: string;
  onHome: () => void;
}) {
  return (
    <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-4.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer hover:border-emerald-600 hover:shadow-md"
        >
          <Home className="size-4 text-emerald-600" /> Go to Home Screen
        </button>

        <div className="hidden sm:flex items-center gap-2.5">
          <img src="/logo.png" alt="TaxSnap" className="size-7 rounded-lg object-contain bg-white/10 shadow-xs border border-navy/10 p-0.5" />
          <span className="font-display text-base font-bold tracking-tight text-ink">TaxSnap</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-navy sm:inline-flex">
            <span className="size-2 rounded-full bg-emerald" /> {userEmail}
          </span>
        )}
        <span className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft">TY 2026–27 · AY 2027–28</span>
      </div>
    </div>
  );
}

function ProgressRail({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <div className="no-print flex items-center gap-2">
      {STEPS.map((label, i) => (
        <button
          key={label}
          onClick={() => i <= step && onJump(i)}
          className="group flex flex-1 flex-col gap-2 text-left"
          disabled={i > step}
        >
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-navy"
              initial={false}
              animate={{ width: i < step ? '100%' : i === step ? '55%' : '0%' }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            />
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              i <= step ? 'text-navy' : 'text-ink-soft/40'
            }`}
          >
            {i < step && <CheckCircle2 className="size-3.5" />}
            <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span> {label}
          </span>
        </button>
      ))}
    </div>
  );
}

function StepShell({
  icon,
  eyebrow,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-line bg-paper-2/50 p-6 shadow-sm md:p-8">
      <div className="mb-7 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy text-paper">{icon}</div>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-soft/80">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function LivePreview({ label, value, rows }: { label: string; value: number; rows: [string, number][] }) {
  return (
    <div className="mesh-navy grain relative overflow-hidden rounded-2xl p-6 text-paper">
      <p className="relative z-10 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold-soft">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mt-1 font-mono text-4xl font-bold tabular-nums"
      >
        {formatINR(value)}
      </motion.p>
      <div className="relative z-10 mt-5 space-y-2 border-t border-paper/15 pt-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-paper/60">{k}</span>
            <span className="font-mono tabular-nums text-paper/90">{formatINR(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Summary ---------------- */

function SummaryView({
  grossIncome,
  totalDeductions,
  result,
  netPayable,
  tds,
}: {
  grossIncome: number;
  totalDeductions: number;
  result: ReturnType<typeof calculateNewRegimeTax>;
  netPayable: number;
  tds: number;
}) {
  const cards: [string, number, string?][] = [
    ['Gross Income', grossIncome],
    ['Total Allowable Deductions', totalDeductions],
    ['Net Taxable Income', result.taxableIncome],
    ['Tax as per Slabs', result.slabTax + result.marginalRelief + result.rebate87A],
    ['Rebate u/s 156', result.rebate87A],
    ['Marginal Relief u/s 156', result.marginalRelief],
    ['Relief u/s 89 / 157', result.reliefUs157],
    ['Health & Education Cess @ 4%', result.cess],
  ];
  const refund = netPayable < 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(([label, value], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-line bg-white/70 p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{formatINR(value)}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="mesh-navy grain relative flex flex-col justify-between overflow-hidden rounded-3xl p-7 text-paper"
      >
        <div className="relative z-10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-soft">
            {refund ? 'Estimated Refund' : 'Final Tax Payable'}
          </p>
          <motion.p
            key={netPayable}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 font-mono text-5xl font-bold tabular-nums"
          >
            {formatINR(Math.abs(netPayable))}
          </motion.p>
          {netPayable === 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald/20 px-3 py-1 text-sm font-semibold text-emerald">
              <CheckCircle2 className="size-4" /> No tax payable — fully rebated
            </p>
          )}
        </div>
        <div className="relative z-10 mt-6 space-y-2 border-t border-paper/15 pt-4 text-sm">
          <Row label="Total Tax + Cess" value={formatINR(result.finalTax)} />
          <Row label="Less: TDS paid" value={'– ' + formatINR(tds)} />
          <Row label={refund ? 'Refund due' : 'Balance payable'} value={formatINR(Math.abs(netPayable))} strong />
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-paper/60">{label}</span>
      <span className={`font-mono tabular-nums ${strong ? 'text-gold-soft font-bold' : 'text-paper/90'}`}>{value}</span>
    </div>
  );
}

/* ---------------- Statement ---------------- */

function Statement({
  profile,
  grossIncome,
  monthlyBreakdownTotals,
  ded,
  totalDeductions,
  result,
  netPayable,
  autoPrint,
  onBack,
  onHome,
}: {
  profile: Profile;
  grossIncome: number;
  monthlyBreakdownTotals?: {
    basicSum: number;
    daSum: number;
    hraSum: number;
    otherSum: number;
    arrearsSum: number;
    payRevisionArrearsSum: number;
    festivalAllowanceBonusSum?: number;
    festivalAllowanceSum?: number;
    bonusSum?: number;
    earnedLeaveSurrenderSum?: number;
    bankInterestSum?: number;
    total: number;
  };
  ded: Deductions;
  totalDeductions: number;
  result: ReturnType<typeof calculateNewRegimeTax>;
  netPayable: number;
  autoPrint?: boolean;
  onBack: () => void;
  onHome?: () => void;
}) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);
  const id = 'ITS-' + (profile.pan || 'XXXXX0000X').slice(0, 5) + '-2627';
  const slabs = slabBreakdown(result.taxableIncome);
  const refund = netPayable < 0;

  const festBonus = monthlyBreakdownTotals?.festivalAllowanceBonusSum ?? ((monthlyBreakdownTotals?.festivalAllowanceSum || 0) + (monthlyBreakdownTotals?.bonusSum || 0));

  const earningsRows: [string, number][] = monthlyBreakdownTotals
    ? [
        ['Basic Pay', monthlyBreakdownTotals.basicSum],
        ['Dearness Allowance (DA)', monthlyBreakdownTotals.daSum],
        ['House Rent Allowance (HRA)', monthlyBreakdownTotals.hraSum],
        ['Other Allowances', monthlyBreakdownTotals.otherSum],
        ...(monthlyBreakdownTotals.arrearsSum
          ? ([['Arrears', monthlyBreakdownTotals.arrearsSum]] as [string, number][])
          : []),
        ...(monthlyBreakdownTotals.payRevisionArrearsSum
          ? ([['Pay Revision Arrears', monthlyBreakdownTotals.payRevisionArrearsSum]] as [
              string,
              number
            ][])
          : []),
        ...(festBonus
          ? ([['Festival Allow. / Bonus', festBonus]] as [string, number][])
          : []),
        ...(monthlyBreakdownTotals.earnedLeaveSurrenderSum
          ? ([['Earned Leave Surrender', monthlyBreakdownTotals.earnedLeaveSurrenderSum]] as [
              string,
              number
            ][])
          : []),
        ...(monthlyBreakdownTotals.bankInterestSum
          ? ([['Bank Interest', monthlyBreakdownTotals.bankInterestSum]] as [string, number][])
          : []),
      ]
    : [['Gross Annual Salary', grossIncome]];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen px-4 py-8">
      <div className="no-print mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-navy hover:text-navy shadow-2xs">
            <ArrowLeft className="size-4" /> Edit computation
          </button>
          {onHome && (
            <button onClick={onHome} className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-5 py-2.5 text-sm font-bold text-navy transition-all hover:bg-navy hover:text-white shadow-2xs">
              <Home className="size-4" /> Return to Home
            </button>
          )}
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-paper shadow-lg shadow-navy/25 transition-colors hover:bg-navy-2">
          <Printer className="size-4" /> Print / Download PDF
        </button>
      </div>

      <div className="print-sheet relative overflow-hidden mx-auto max-w-4xl border border-line bg-white p-8 shadow-2xl shadow-navy/10 md:p-12">
        {/* Centered Low Opacity Logo Watermark for Print & Display */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0">
          <img
            src="/logo.png"
            alt="TaxSnap Watermark"
            className="w-[450px] max-w-[85%] opacity-[0.06] select-none filter grayscale mix-blend-multiply"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          />
        </div>

        {/* header */}
        <div className="relative z-10 flex items-start justify-between border-b-2 border-navy pb-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TaxSnap Logo" className="h-12 w-auto object-contain shrink-0" />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-ink">Income Tax Computation Statement</h1>
              <p className="text-sm text-ink-soft">New Tax Regime · Tax Year 2026–27 ·</p>
            </div>
          </div>
          <div className="text-right text-xs text-ink-soft">
            <p className="font-mono font-semibold text-navy">{id}</p>
            <p>Generated {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* particulars */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-5 text-sm md:grid-cols-4">
          <Particular label="Name" value={profile.name || '—'} />
          <Particular label="Designation" value={profile.designation || '—'} />
          <Particular label="PAN" value={profile.pan || '—'} mono />
          <Particular label="Office Name" value={profile.office_name || '—'} />
        </div>

        <StatementTable title="A · Earnings" rows={earningsRows} total={['Gross Income', grossIncome]} />

        <StatementTable
          title="B · Deductions & Exemptions"
          rows={[
            ['Standard Deduction u/s 19(2)', ded.standardDeduction],
            ...(ded.dcrg ? ([['DCRG u/s 19(3)', ded.dcrg]] as [string, number][]) : []),
            ...(ded.commutation ? ([['Commutation u/s 19(7)', ded.commutation]] as [string, number][]) : []),
          ]}
          total={['Total Deductions', totalDeductions]}
        />

        {/* slab table */}
        <div className="mt-6">
          <h3 className="mb-2 font-display text-base font-semibold text-navy">C · Slab-wise Tax Computation</h3>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-2/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2 font-semibold">Income Slab</th>
                  <th className="px-4 py-2 text-right font-semibold">Rate</th>
                  <th className="px-4 py-2 text-right font-semibold">Income in Slab</th>
                  <th className="px-4 py-2 text-right font-semibold">Tax</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {slabs.map((s, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-4 py-2 font-sans text-ink-soft">
                      {formatINR(s.from)} – {s.to === Infinity ? 'above' : formatINR(s.to)}
                    </td>
                    <td className="px-4 py-2 text-right">{(s.rate * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2 text-right">{formatINR(s.amountInSlab)}</td>
                    <td className="px-4 py-2 text-right">{formatINR(s.taxOnSlab)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* final computation */}
        <div className="mt-6 rounded-lg border border-line bg-paper-2/40 p-5">
          <h3 className="mb-3 font-display text-base font-semibold text-navy">D · Net Tax Payable</h3>
          <div className="space-y-2 text-sm">
            <StRow label="Net Taxable Income" value={formatINR(result.taxableIncome)} />
            <StRow label="Tax on Total Income" value={formatINR(result.slabTax + result.marginalRelief + result.rebate87A)} />
            {result.rebate87A > 0 && <StRow label="Less: Rebate u/s 156" value={'– ' + formatINR(result.rebate87A)} />}
            {result.marginalRelief > 0 && <StRow label="Less: Marginal Relief" value={'– ' + formatINR(result.marginalRelief)} />}
            {result.reliefUs157 > 0 && <StRow label="Less: Relief u/s 157" value={'– ' + formatINR(result.reliefUs157)} />}
            <StRow label="Add: Health & Education Cess @ 4%" value={'+ ' + formatINR(result.cess)} />
            <div className="border-t border-line pt-2">
              <StRow label="Total Tax & Cess" value={formatINR(result.finalTax)} strong />
            </div>
            <StRow label="Less: Tax Deducted at Source (TDS)" value={'– ' + formatINR(ded.tds)} />
            <div className="mt-1 flex items-center justify-between rounded-md bg-navy px-4 py-3 text-paper">
              <span className="font-semibold">{refund ? 'Refund Due' : 'Net Tax Payable'}</span>
              <span className="font-mono text-lg font-bold tabular-nums">{formatINR(Math.abs(netPayable))}</span>
            </div>
            <p className="pt-1 text-xs italic text-ink-soft">
              ({numberToWordsINR(Math.abs(netPayable))})
            </p>
          </div>
        </div>

        {/* footer / signature */}
        <div className="mt-10 flex items-end justify-between text-sm">
          <div className="max-w-xs text-xs leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">Verification</p>
            <p>
              I declare that the particulars given above are correct and complete to the best of my knowledge and belief.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-1 h-12 w-48 border-b border-ink" />
            <p className="text-xs font-semibold text-ink">Signature of the Assessee</p>
            <p className="text-xs text-ink-soft">{profile.name || '—'}</p>
          </div>
        </div>
        <p className="mt-6 border-t border-line pt-3 text-center text-[0.65rem] text-ink-soft/60">
          Software generated statement · TaxSnap  · Slabs per Finance Act 2026 (New Regime) · Made by Gigi Varughese.
        </p>
      </div>
    </motion.div>
  );
}

function Particular({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-soft/70">{label}</p>
      <p className={`font-medium text-ink ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</p>
    </div>
  );
}

function StatementTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: [string, number][];
  total: [string, number];
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 font-display text-base font-semibold text-navy">{title}</h3>
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <tbody className="font-mono tabular-nums">
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2 font-sans text-ink-soft">{k}</td>
                <td className="px-4 py-2 text-right text-ink">{formatINR(v)}</td>
              </tr>
            ))}
            <tr className="bg-paper-2/70 font-semibold">
              <td className="px-4 py-2 font-sans text-navy">{total[0]}</td>
              <td className="px-4 py-2 text-right text-navy">{formatINR(total[1])}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={strong ? 'font-semibold text-ink' : 'text-ink-soft'}>{label}</span>
      <span className={`font-mono tabular-nums ${strong ? 'font-bold text-ink' : 'text-ink'}`}>{value}</span>
    </div>
  );
}
