import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, Building, ArrowRight } from 'lucide-react';
import type { EmployeeProfile } from '../../types/tax';

interface Step1Props {
  profile: EmployeeProfile;
  onChange: (profile: EmployeeProfile) => void;
  onNext: () => void;
}

export const Step1Profile: React.FC<Step1Props> = ({ profile, onChange, onNext }) => {
  const handleInputChange = (field: keyof EmployeeProfile, value: string) => {
    onChange({ ...profile, [field]: value });
  };

  const isFormValid =
    profile.name.trim() !== '' &&
    profile.designation.trim() !== '' &&
    profile.office_name.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Step Title Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold text-white">Employee &amp; Office Profile</h2>
        <p className="text-xs text-emerald-200/75">
          Enter official employee identification for Form 16 / Tax Statement generation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl border border-[#2dd4bf]/30 shadow-2xl space-y-5 bg-[#0c2320]/75 backdrop-blur-2xl text-white">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
            Full Employee Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-300/60">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar Sharma"
              value={profile.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/70 text-xs font-medium text-white placeholder:text-teal-200/40 outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
            />
          </div>
        </div>

        {/* Designation */}
        <div>
          <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
            Designation / Role <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-300/60">
              <Briefcase className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Senior Section Officer / Manager"
              value={profile.designation}
              onChange={(e) => handleInputChange('designation', e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/70 text-xs font-medium text-white placeholder:text-teal-200/40 outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
            />
          </div>
        </div>

        {/* Office Name */}
        <div>
          <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
            Office / Department Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-300/60">
              <Building className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. Finance Dept / Directorate"
              value={profile.office_name}
              onChange={(e) => handleInputChange('office_name', e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#2dd4bf]/30 bg-[#071815]/70 text-xs font-medium text-white placeholder:text-teal-200/40 outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-3.5 px-6 rounded-full bg-[#2dd4bf] hover:bg-[#14b8a6] disabled:opacity-50 disabled:cursor-not-allowed text-[#041019] font-bold text-xs shadow-lg shadow-[#2dd4bf]/25 flex items-center justify-center gap-2 transition-all uppercase tracking-wider cursor-pointer"
          >
            <span>Next: Salary Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};
