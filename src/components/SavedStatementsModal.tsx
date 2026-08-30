import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Trash2, Calendar, User, ExternalLink, Copy, Check, Database, Users, Mail, Phone, Briefcase, ShieldCheck } from 'lucide-react';
import type { SavedStatement, PersonalProfile } from '../types/tax';
import { formatINR } from '../utils/taxEngine';
import { isSupabaseConfigured, fetchAllUserProfiles } from '../utils/supabaseClient';

interface SavedStatementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  statements: SavedStatement[];
  onSelectStatement: (statement: SavedStatement) => void;
  onDeleteStatement: (id: string) => void;
}

const SUPABASE_SQL_SCRIPT = `-- Supabase Table Setup for TaxSnap Pro

-- 1. Tax Computations Table
CREATE TABLE IF NOT EXISTS public.tax_computations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pan VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    office_name VARCHAR(255),
    place VARCHAR(255),
    gross_income NUMERIC(12, 2) NOT NULL,
    taxable_income NUMERIC(12, 2) NOT NULL,
    total_tax_liability NUMERIC(12, 2) NOT NULL,
    net_payable_or_refund NUMERIC(12, 2) NOT NULL,
    full_data JSONB NOT NULL
);

ALTER TABLE public.tax_computations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read computations" ON public.tax_computations FOR SELECT USING (true);
CREATE POLICY "Allow public insert computations" ON public.tax_computations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete computations" ON public.tax_computations FOR DELETE USING (true);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    dob VARCHAR(50),
    phone VARCHAR(50),
    school_office VARCHAR(255),
    position VARCHAR(255),
    pan VARCHAR(10),
    completed_onboarding BOOLEAN DEFAULT FALSE,
    full_profile JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.user_profiles FOR UPDATE USING (true);

-- 3. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    target_email VARCHAR(255) DEFAULT 'taxcalac@gmail.com'
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select tickets" ON public.support_tickets FOR SELECT USING (true);`;

export const SavedStatementsModal: React.FC<SavedStatementsModalProps> = ({
  isOpen,
  onClose,
  statements,
  onSelectStatement,
  onDeleteStatement,
}) => {
  const [activeTab, setActiveTab] = useState<'computations' | 'profiles'>('computations');
  const [copiedSql, setCopiedSql] = useState(false);
  const [userProfiles, setUserProfiles] = useState<PersonalProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingProfiles(true);
      fetchAllUserProfiles().then((profs) => {
        setUserProfiles(profs);
        setLoadingProfiles(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e3a8a]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#191c1e]">Supabase Database Storage</h3>
                <p className="text-xs text-slate-500">
                  {isSupabaseConfigured ? 'Synced with Supabase Cloud (iiypmipvdxrtxpjyuafa)' : 'Local Storage Mode'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-100/80 px-6 pt-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('computations')}
              className={`py-2 px-4 rounded-t-lg border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'computations'
                  ? 'bg-white border-[#1e3a8a] text-[#1e3a8a] shadow-2xs font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Saved Computations ({statements.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profiles')}
              className={`py-2 px-4 rounded-t-lg border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'profiles'
                  ? 'bg-white border-[#1e3a8a] text-[#1e3a8a] shadow-2xs font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Supabase User Profiles ({userProfiles.length})</span>
            </button>
          </div>

          {/* Supabase Table Missing Setup Banner */}
          {isSupabaseConfigured && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Need to create database tables in Supabase?</span>
                  <span className="text-slate-600 text-[11px]">
                    Copy and run the SQL script in your Supabase Dashboard SQL Editor to set up <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">user_profiles</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">tax_computations</code>.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors self-end sm:self-auto shrink-0 shadow-2xs"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy Tables SQL Script'}</span>
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'computations' ? (
              statements.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-800 font-semibold text-sm">No Saved Computations Yet</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Calculate your tax and click "Save & Generate Statement" to view your records here anytime.
                  </p>
                </div>
              ) : (
                statements.map((stmt) => (
                  <div
                    key={stmt.id}
                    className="stitch-card p-4 rounded border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition-all bg-white"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {stmt.profile.name || 'Unnamed Employee'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono rounded">
                          {stmt.profile.pan || 'NO PAN'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {stmt.profile.designation || 'Staff'} - {stmt.profile.office_name || 'Office'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(stmt.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                        <span className="text-slate-600">
                          Gross: <strong className="text-slate-900">{formatINR(stmt.result.grossIncome)}</strong>
                        </span>
                        <span className="text-slate-600">
                          Tax Liability:{' '}
                          <strong className="text-[#0d9488]">
                            {formatINR(stmt.result.totalTaxLiability)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          onSelectStatement(stmt);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded bg-[#1e3a8a] hover:bg-[#00236f] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Statement</span>
                      </button>

                      <button
                        onClick={() => onDeleteStatement(stmt.id)}
                        className="p-1.5 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors border border-slate-200"
                        title="Delete Statement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* User Profiles Tab */
              loadingProfiles ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  Fetching user profiles from Supabase...
                </div>
              ) : userProfiles.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-800 font-semibold text-sm">No User Profiles Stored Yet</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Sign in with email or Google to automatically store and sync user profiles in Supabase.
                  </p>
                </div>
              ) : (
                userProfiles.map((prof, idx) => (
                  <div
                    key={prof.email || idx}
                    className="stitch-card p-4 rounded border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {prof.name || 'User Profile'}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#1e3a8a] text-[10px] font-mono rounded font-semibold">
                          {prof.pan || 'NO PAN'}
                        </span>
                        <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded ${
                          prof.completedOnboarding
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {prof.completedOnboarding ? 'Onboarded' : 'Pending Onboarding'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-800">{prof.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{prof.position || 'N/A'} — {prof.schoolOffice || 'N/A'}</span>
                        </span>
                        {prof.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{prof.phone}</span>
                          </span>
                        )}
                        {prof.dob && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>DOB: {prof.dob}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[11px] font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Supabase Synced</span>
                      </span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

