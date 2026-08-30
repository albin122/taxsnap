"use client";

import { motion } from "framer-motion";

export interface NavHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  theme?: 'dark' | 'light';
}

export default function NavHeader({ activeTab, onTabChange, theme = 'dark' }: NavHeaderProps) {
  const tabs = [
    { id: 'overview', label: 'Home' },
    { id: 'slabs', label: 'Tax Slabs' },
    { id: 'rules', label: 'Exemptions' },
    { id: 'contact', label: 'Contact' },
    { id: 'profile', label: 'Settings' },
  ];

  const isLight = theme === 'light';

  return (
    <nav className={`relative mx-auto flex items-center justify-between gap-1.5 rounded-full p-1.5 backdrop-blur-xl transition-all duration-300 ${
      isLight
        ? 'border border-teal-200/80 bg-white/85 text-slate-800 shadow-xl shadow-teal-900/5'
        : 'border border-[#2dd4bf]/30 bg-[#0c2320]/80 text-white shadow-2xl shadow-black/40'
    }`}>
      {/* Brand Badge inside Header Pill */}
      <div className={`flex items-center gap-2 pl-3.5 pr-2.5 py-1 rounded-full font-bold text-xs tracking-wider transition-colors ${
        isLight ? 'bg-teal-50 text-teal-800 border border-teal-200/60' : 'bg-[#2dd4bf]/20 text-white'
      }`}>
        <img src="/logo.png" alt="TaxSnap" className="size-4 object-contain rounded-xs" />
        <span className="font-display font-extrabold text-xs">TaxSnap</span>
      </div>

      {/* Vertical Divider */}
      <div className={`h-4 w-px mx-1 ${isLight ? 'bg-slate-300' : 'bg-teal-200/30'}`} />

      {/* Nav Tabs List with Hardware-Accelerated Gliding Pill */}
      <ul className="relative flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'settings');
          return (
            <li
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`relative z-10 block cursor-pointer px-4 py-1.5 text-xs font-semibold rounded-full transition-colors select-none ${
                isActive
                  ? isLight ? 'text-teal-950 font-bold' : 'text-white font-bold'
                  : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className={`absolute inset-0 z-[-1] rounded-full ${
                    isLight
                      ? 'bg-teal-100/90 border border-teal-300/60 shadow-sm'
                      : 'bg-[#2dd4bf]/30 border border-[#2dd4bf]/40 shadow-xs'
                  }`}
                />
              )}
              {tab.label}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
