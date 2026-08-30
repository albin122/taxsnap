import React from 'react';
import { Shield, Database, History, Sparkles, PlusCircle, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabaseClient';

interface NavbarProps {
  currentStep: number;
  onNavigateHome: () => void;
  onOpenHistory: () => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
  userEmail: string | null;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onNavigateHome,
  onOpenHistory,
  onOpenLogin,
  onSignOut,
  userEmail,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded bg-[#1e3a8a] text-white flex items-center justify-center shadow-sm group-hover:bg-[#00236f] transition-colors">
            <Shield className="w-5 h-5 fill-current text-teal-400 stroke-1" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-[#1e3a8a]">
                TaxSnap <span className="text-[#0d9488]">Pro</span>
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                TY 2026–27
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Precise Fiscal Identity & Tax Engine
            </p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase Status Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              isSupabaseConfigured
                ? 'Supabase Cloud Synced (iiypmipvdxrtxpjyuafa)'
                : 'Local Storage Fallback Mode'
            }
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
          </div>

          {/* User Auth Badge */}
          {userEmail ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-[#1e3a8a] text-xs font-semibold">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{userEmail.split('@')[0]}</span>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>Sign In</span>
            </button>
          )}

          {/* View Saved Computations */}
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4 text-[#1e3a8a]" />
            <span className="hidden sm:inline">Saved Computations</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#1e3a8a] text-white rounded text-[10px] font-bold font-mono">
                {savedCount}
              </span>
            )}
          </button>

          {/* New Tax Calculation CTA */}
          {currentStep > 0 && currentStep !== 6 && (
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded bg-[#1e3a8a] hover:bg-[#00236f] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Start New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
