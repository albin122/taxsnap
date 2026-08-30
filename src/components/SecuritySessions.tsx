import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Check,
} from 'lucide-react';

interface SecuritySessionsProps {
  isLight: boolean;
  userEmail?: string;
  onSignOut: () => void;
}

export function SecuritySessions({ isLight }: SecuritySessionsProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordUpdatedMessage, setPasswordUpdatedMessage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setPasswordUpdatedMessage(true);
    setIsChangingPassword(false);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setTimeout(() => setPasswordUpdatedMessage(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 rounded-2xl border border-emerald-500/40 bg-[#071815] p-4 text-xs font-bold text-[#2dd4bf] shadow-2xl flex items-center gap-2"
          >
            <Check className="size-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Details Card */}
      <div className={`rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-2xl transition-all ${
        isLight ? 'border-teal-200/80 bg-white/90 text-slate-900' : 'border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white'
      }`}>
        <div className="flex items-center justify-between border-b pb-4 mb-6 border-current/10">
          <div>
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <KeyRound className="size-5 text-indigo-400" /> Login details
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-emerald-200/70'}`}>
              Password, security questions, and 2-step verification settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              isLight
                ? 'border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-600 hover:text-white'
                : 'border-indigo-400/40 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            {isChangingPassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {passwordUpdatedMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-300 flex items-center gap-2">
            <Check className="size-4 text-emerald-400" />
            <span>Your account password was updated successfully.</span>
          </div>
        )}

        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Enter current password"
                className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                  isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-indigo-400'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-[0.68rem] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-200/80'}`}>
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Min 6 characters"
                className={`rounded-xl border py-2.5 px-3.5 text-sm outline-none ${
                  isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-500' : 'border-[#2dd4bf]/30 bg-[#071815]/75 text-white focus:border-indigo-400'
                }`}
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 shadow-lg transition-all cursor-pointer"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className={`rounded-full border px-5 py-2.5 text-xs font-bold cursor-pointer ${
                  isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-white/20 text-white hover:bg-white/10'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className={`overflow-hidden rounded-2xl border divide-y transition-all ${
            isLight ? 'border-slate-200/90 bg-slate-50/70 divide-slate-200' : 'border-[#2dd4bf]/20 bg-[#071815]/60 divide-[#2dd4bf]/15'
          }`}>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>Current password</span>
              <span className="font-mono font-bold text-sm tracking-widest text-slate-400">••••••••</span>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>Security questions</span>
              <span className="font-semibold text-sm">Your father's name</span>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-emerald-200/70'}`}>2-Step verification</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    showToast(`2-Step verification ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`font-bold text-xs ${twoFactorEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
