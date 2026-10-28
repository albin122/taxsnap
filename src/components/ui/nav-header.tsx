"use client";

import {
  Home01Icon,
  InvoiceIcon,
  PhoneCallIcon,
  Settings01Icon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import PillNav from './PillNav';
import type { PillNavItem } from './PillNav';

export interface NavHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  theme?: 'dark' | 'light';
}

const TAB_ITEMS = [
  { label: 'Home', href: '#overview' },
  { label: 'Tax Slabs', href: '#slabs' },
  { label: 'Exemptions', href: '#rules' },
  { label: 'Contact', href: '#contact' },
  { label: 'Settings', href: '#profile' },
];

const glyph = (icon: any) => <HugeiconsIcon icon={icon} size="1em" strokeWidth={1.8} />;

const tabIdToHref = (tabId?: string): string | undefined => {
  if (!tabId) return undefined;
  const id = tabId === 'settings' ? 'profile' : tabId;
  const found = TAB_ITEMS.find(t => t.href === `#${id}`);
  return found?.href;
};

const hrefToTabId = (href: string): string => href.replace('#', '');

export default function NavHeader({ activeTab, onTabChange, theme = 'dark' }: NavHeaderProps) {
  const isLight = theme === 'light';

  const mobileTabs = [
    { id: 'overview', label: 'Home' },
    { id: 'slabs', label: 'Tax Slabs' },
    { id: 'rules', label: 'Exemptions' },
    { id: 'contact', label: 'Contact' },
    { id: 'profile', label: 'Settings' },
  ];

  return (
    <div className="relative flex w-full items-center">
      <div className="hidden md:flex md:w-full md:items-center md:justify-center">
        <div className="relative flex w-full items-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange?.('overview');
            }}
            className={`relative z-10 inline-flex shrink-0 items-center gap-2.5 rounded-full border px-3 py-2 no-underline transition-opacity hover:opacity-90 ${
              isLight
                ? 'border-teal-200/80 bg-white/85 text-slate-900 shadow-sm backdrop-blur-xl'
                : 'border-white/10 bg-white/5 text-white shadow-lg backdrop-blur-xl'
            }`}
            aria-label="TaxSnap home"
          >
            <img
              src="/logo.png"
              alt=""
              draggable={false}
              className="size-[22px] object-contain"
            />
            <span className="font-display text-sm font-extrabold tracking-wide">TaxSnap</span>
          </a>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto">
              <PillNav
                items={TAB_ITEMS}
                activeHref={tabIdToHref(activeTab)}
                onItemClick={(item: PillNavItem) => onTabChange?.(hrefToTabId(item.href ?? ''))}
                theme={theme}
                layout="split"
                itemStyle="pill"
                hoverEffect="fill"
                indicator="dot"
                surface="glass"
                size="md"
                bounce={0.3}
                stretch={0.5}
                intro={true}
                highlightColor={theme === 'dark' ? '#2dd4bf' : undefined}
                highlightTextColor={theme === 'dark' ? '#021a17' : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:hidden">
        <nav className="mx-auto flex w-full items-center gap-2 rounded-full border border-white/10 bg-[#1b2a2d]/80 px-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onTabChange?.('overview')}
            className={`flex shrink-0 items-center justify-center rounded-full border px-2 py-2 ${
              activeTab === 'overview'
                ? 'border-[#2dd4bf]/50 bg-[#2dd4bf]/15 text-white'
                : 'border-transparent bg-transparent text-white/80'
            }`}
            aria-label="Home"
          >
            <img src="/logo.png" alt="" className="size-6 rounded-md object-contain" />
          </button>

          <div className="flex flex-1 items-center justify-center gap-1 overflow-hidden">
            {mobileTabs.map((tab) => {
              const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'settings');

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id === 'profile' ? 'profile' : tab.id)}
                  className={`rounded-full px-2.5 py-2 text-[10px] font-semibold tracking-tight transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-inner shadow-white/10'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onTabChange?.('profile')}
            className="flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white/80"
            aria-label="Settings"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-[2]" aria-hidden="true">
              <path d="M12 6v12M6 12h12" strokeLinecap="round"/>
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
