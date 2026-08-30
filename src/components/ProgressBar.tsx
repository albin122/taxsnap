import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, DollarSign, ShieldCheck, Calculator } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const STEPS = [
  { id: 1, name: 'Profile & Office', icon: User, desc: 'Personal details & PAN' },
  { id: 2, name: 'Salary Earnings', icon: DollarSign, desc: 'Basic, DA & Allowances' },
  { id: 3, name: 'Deductions', icon: ShieldCheck, desc: 'PF, NPS & Exemptions' },
  { id: 4, name: 'Tax Summary', icon: Calculator, desc: 'Real-time computation' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, onSelectStep }) => {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 no-print">
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 rounded z-0" />

        {/* Animated fill track */}
        <motion.div
          className="absolute top-5 left-0 h-1 bg-[#0d9488] rounded z-0"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />

        {/* Step Nodes */}
        <div className="relative z-10 flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center group">
                <button
                  type="button"
                  disabled={step.id > currentStep}
                  onClick={() => onSelectStep(step.id)}
                  className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? 'bg-[#0d9488] text-white shadow-xs cursor-pointer hover:bg-teal-700'
                      : isCurrent
                      ? 'bg-[#1e3a8a] text-white shadow-md ring-4 ring-blue-100'
                      : 'bg-white border-2 border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </button>

                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold tracking-wide ${
                      isCurrent
                        ? 'text-[#1e3a8a]'
                        : isCompleted
                        ? 'text-[#0d9488]'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5 font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
